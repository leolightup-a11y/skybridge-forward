const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/** Extract text between two markers in HTML */
function extractBetween(html: string, before: string, after: string): string | null {
  const i = html.indexOf(before);
  if (i === -1) return null;
  const start = i + before.length;
  const j = html.indexOf(after, start);
  if (j === -1) return null;
  return html.substring(start, j).trim();
}

/** Strip all HTML tags */
function stripTags(s: string): string {
  return s.replace(/<[^>]*>/g, "").replace(/&[a-z]+;/gi, " ").replace(/\s+/g, " ").trim();
}

interface ScrapedData {
  carrier: string | null;
  status: string | null;
  location: string | null;
  checkpoints: { status: string; location: string; time: string }[];
  coordinates: [number, number] | null;
}

function parseTrackingHtml(html: string): Omit<ScrapedData, "coordinates"> {
  let carrier: string | null = null;
  let status: string | null = null;
  let location: string | null = null;
  const checkpoints: { status: string; location: string; time: string }[] = [];

  // Try to extract carrier from title or og:title
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch) {
    const title = stripTags(titleMatch[1]);
    // AfterShip titles are like "Track DHL Express Shipments" or "Package Tracking - AfterShip"
    const carrierMatch = title.match(/Track\s+(.+?)\s+(?:Shipment|Package|Parcel)/i);
    if (carrierMatch) carrier = carrierMatch[1].trim();
  }

  // Try og:description for status
  const ogDescMatch = html.match(/<meta[^>]*property="og:description"[^>]*content="([^"]+)"/i)
    || html.match(/<meta[^>]*content="([^"]+)"[^>]*property="og:description"/i);
  if (ogDescMatch) {
    const desc = ogDescMatch[1];
    // Usually contains status info
    if (!status) status = desc;
  }

  // Look for JSON-LD structured data
  const jsonLdMatches = html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi);
  for (const match of jsonLdMatches) {
    try {
      const jsonData = JSON.parse(match[1]);
      if (jsonData["@type"] === "ParcelDelivery" || jsonData.trackingNumber) {
        if (jsonData.deliveryStatus) status = jsonData.deliveryStatus;
        if (jsonData.carrier?.name) carrier = jsonData.carrier.name;
        if (jsonData.deliveryAddress?.addressLocality) {
          location = jsonData.deliveryAddress.addressLocality;
          if (jsonData.deliveryAddress.addressCountry) {
            location += `, ${jsonData.deliveryAddress.addressCountry}`;
          }
        }
      }
    } catch { /* ignore invalid JSON-LD */ }
  }

  // Try to find status from common patterns in the HTML
  const statusPatterns = [
    /class="[^"]*tracking-status[^"]*"[^>]*>([^<]+)/i,
    /class="[^"]*shipment-status[^"]*"[^>]*>([^<]+)/i,
    /class="[^"]*status-text[^"]*"[^>]*>([^<]+)/i,
    /data-status="([^"]+)"/i,
    /"status"\s*:\s*"([^"]+)"/i,
    /"tag"\s*:\s*"([^"]+)"/i,
    /"subtag_message"\s*:\s*"([^"]+)"/i,
  ];

  for (const pattern of statusPatterns) {
    if (status && status.length < 100) break; // Already have a good status
    const match = html.match(pattern);
    if (match) {
      const candidate = stripTags(match[1]);
      if (candidate.length > 2 && candidate.length < 100) {
        status = candidate;
      }
    }
  }

  // Try to find location
  const locationPatterns = [
    /"location"\s*:\s*"([^"]+)"/i,
    /"city"\s*:\s*"([^"]+)"/i,
    /class="[^"]*location[^"]*"[^>]*>([^<]+)/i,
  ];

  if (!location) {
    for (const pattern of locationPatterns) {
      const match = html.match(pattern);
      if (match) {
        const candidate = stripTags(match[1]);
        if (candidate.length > 1 && candidate.length < 80) {
          location = candidate;
          break;
        }
      }
    }
  }

  // Try to extract checkpoint data from embedded JSON
  const checkpointPattern = /"checkpoints"\s*:\s*(\[[\s\S]*?\])/;
  const cpMatch = html.match(checkpointPattern);
  if (cpMatch) {
    try {
      const cpData = JSON.parse(cpMatch[1]);
      for (const cp of cpData.slice(0, 10)) {
        checkpoints.push({
          status: cp.subtag_message || cp.tag || cp.message || "Unknown",
          location: cp.location || cp.city || "",
          time: cp.checkpoint_time || cp.created_at || "",
        });
      }
      // Use latest checkpoint for status/location if not found
      if (cpData.length > 0) {
        const latest = cpData[cpData.length - 1];
        if (!status || status.length > 100) status = latest.subtag_message || latest.tag || status;
        if (!location) location = latest.location || latest.city || location;
      }
    } catch { /* ignore */ }
  }

  // Also try carrier from JSON in page
  if (!carrier) {
    const carrierJsonMatch = html.match(/"slug"\s*:\s*"([^"]+)"/i)
      || html.match(/"courier_name"\s*:\s*"([^"]+)"/i)
      || html.match(/"carrier"\s*:\s*"([^"]+)"/i);
    if (carrierJsonMatch) {
      carrier = carrierJsonMatch[1].replace(/-/g, " ");
    }
  }

  // Clean up status - if it's a meta description or too long, discard
  if (status && (status.length > 60 || status.includes("tracking numbers"))) {
    // Only keep if it looks like an actual status
    const shortStatus = status.split(".")[0].split(",")[0];
    if (shortStatus.length > 5 && shortStatus.length < 50 && !shortStatus.includes("tracking")) {
      status = shortStatus;
    } else {
      status = null;
    }
  }

  return { carrier, status, location, checkpoints };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tracking_id } = await req.json();

    if (!tracking_id) {
      return new Response(
        JSON.stringify({ success: false, error: "tracking_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const cleanId = tracking_id.trim();
    const aftershipUrl = `https://www.aftership.com/track/${encodeURIComponent(cleanId)}`;

    console.log("Fetching:", aftershipUrl);

    // Fetch directly from edge function (no CORS issue server-side)
    const response = await fetch(aftershipUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    if (!response.ok) {
      console.error("Fetch failed:", response.status);
      return new Response(
        JSON.stringify({ success: false, error: `AfterShip returned ${response.status}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const html = await response.text();
    console.log("HTML length:", html.length);

    const parsed = parseTrackingHtml(html);

    // Geocode the location if found
    let coordinates: [number, number] | null = null;
    if (parsed.location) {
      try {
        const geoRes = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(parsed.location)}&format=json&limit=1`,
          { headers: { "User-Agent": "GoGlobalExpress/1.0" } }
        );
        const geoData = await geoRes.json();
        if (geoData.length > 0) {
          coordinates = [parseFloat(geoData[0].lat), parseFloat(geoData[0].lon)];
        }
      } catch (e) {
        console.error("Geocoding error:", e);
      }
    }

    const result: ScrapedData = { ...parsed, coordinates };
    const hasData = !!(result.carrier || result.status || result.location || result.checkpoints.length > 0);

    console.log("Parsed:", JSON.stringify({ carrier: result.carrier, status: result.status, location: result.location, checkpoints: result.checkpoints.length }));

    return new Response(
      JSON.stringify({
        success: true,
        verified: hasData,
        tracking_id: cleanId,
        ...result,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error:", err);
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
