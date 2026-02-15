import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tracking_number } = await req.json();

    if (!tracking_number) {
      return new Response(
        JSON.stringify({ success: false, error: "tracking_number is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data, error } = await supabase
      .from("shipments")
      .select("*")
      .eq("tracking_number", tracking_number)
      .maybeSingle();

    if (error) {
      console.error("Query error:", error);
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!data) {
      return new Response(
        JSON.stringify({ success: false, error: "Shipment not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Try to geocode the location if it exists
    let coordinates: [number, number] | null = null;
    if (data.location) {
      try {
        const geoRes = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(data.location)}&format=json&limit=1`,
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

    return new Response(
      JSON.stringify({
        success: true,
        shipment: {
          tracking_number: data.tracking_number,
          status: data.status,
          location: data.location,
          carrier: data.carrier,
          coordinates,
          updated_at: data.updated_at,
          created_at: data.created_at,
        },
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
