import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Shield, Plane, Package, CheckCircle2,
  Radio, Loader2, RefreshCw, ExternalLink, MapPin,
} from "lucide-react";
import { TrackingMap } from "@/components/TrackingMap";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";

interface ScrapedResult {
  success: boolean;
  verified: boolean;
  tracking_id: string;
  carrier: string | null;
  status: string | null;
  location: string | null;
  coordinates: [number, number] | null;
  checkpoints: { status: string; location: string; time: string }[];
}

function inferMapStatus(status: string | null): "Processing" | "Departed" | "Delivered" {
  if (!status) return "Processing";
  const s = status.toLowerCase();
  if (s.includes("deliver") || s.includes("completed") || s.includes("picked up by")) return "Delivered";
  if (s.includes("transit") || s.includes("depart") || s.includes("arrived") || s.includes("customs") || s.includes("flight") || s.includes("in transit")) return "Departed";
  return "Processing";
}

/** Returns the best iframe URL for a given carrier + tracking ID */
function getCarrierIframeUrl(carrier: string | null, trackingId: string): string {
  const c = (carrier || "").toLowerCase();
  const id = encodeURIComponent(trackingId);

  if (c.includes("dhl")) return `https://www.dhl.com/en/express/tracking.html?AWB=${id}&brand=DHL`;
  if (c.includes("fedex")) return `https://www.fedex.com/fedextrack/?trknbr=${id}`;
  if (c.includes("ups")) return `https://www.ups.com/track?tracknum=${id}`;
  if (c.includes("usps")) return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${id}`;
  if (c.includes("royal mail") || c.includes("royalmail")) return `https://www.royalmail.com/track-your-item#/tracking-results/${id}`;
  if (c.includes("tnt")) return `https://www.tnt.com/express/en_gb/site/shipping-tools/track.html?searchType=con&cons=${id}`;
  if (c.includes("aramex")) return `https://www.aramex.com/us/en/track/results?ShipmentNumber=${id}`;
  if (c.includes("qatar") || c.includes("qr")) return `https://www.qrcargo.com/s/track-shipment?awb=${id}`;
  if (c.includes("emirates") || c.includes("ek")) return `https://cargo.emirates.com/en/tracking/?awb=${id}`;
  if (c.includes("sri lankan") || c.includes("ul")) return `https://www.srilankancargo.com/tracking?awb=${id}`;
  if (c.includes("aftership")) return `https://track.aftership.com/${id}`;

  // Universal fallback
  return `https://www.17track.net/en/track?nums=${id}`;
}

export default function UniversalTrackPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [inputId, setInputId] = useState(id || "");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScrapedResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [iframeLoading, setIframeLoading] = useState(false);
  const [iframeSrc, setIframeSrc] = useState("");

  const fetchTracking = useCallback(async (trackingId: string) => {
    if (!trackingId.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setIframeLoading(true);
    setIframeSrc("");

    try {
      const { data, error: fnError } = await supabase.functions.invoke("scrape-tracking", {
        body: { tracking_id: trackingId.trim() },
      });

      if (fnError) throw fnError;
      if (data?.success) {
        setResult(data as ScrapedResult);
        const url = getCarrierIframeUrl(data.carrier, trackingId.trim());
        setIframeSrc(url);
      } else {
        setError(data?.error || "Could not retrieve tracking info");
        // Still show iframe with 17track fallback
        setIframeSrc(`https://www.17track.net/en/track?nums=${encodeURIComponent(trackingId.trim())}`);
        setIframeLoading(true);
      }
    } catch (err: any) {
      console.error("Scrape error:", err);
      setError("Failed to fetch tracking data. Please try again.");
      setIframeSrc(`https://www.17track.net/en/track?nums=${encodeURIComponent(trackingId.trim())}`);
      setIframeLoading(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (id) {
      setInputId(id);
      fetchTracking(id);
    }
  }, [id, fetchTracking]);

  const handleTrack = () => {
    const cleanId = inputId.trim();
    if (!cleanId) return;
    if (cleanId !== id) {
      navigate(`/track/${encodeURIComponent(cleanId)}`, { replace: true });
    } else {
      fetchTracking(cleanId);
    }
  };

  const mapStatus = result ? inferMapStatus(result.status) : "Processing";
  const showSplitScreen = !!iframeSrc || loading;

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(180deg, #001020 0%, #001f3f 30%, #00152e 100%)" }}>
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-16">

        {/* ── Search Header ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 text-xs font-display font-semibold tracking-widest uppercase"
            style={{ background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.3)", color: "#d4af37" }}
          >
            <Plane className="h-3.5 w-3.5" /> Universal Shipment Tracker
          </div>
          <h1 className="text-3xl md:text-5xl font-display font-bold mb-3" style={{ color: "#f0ead6" }}>
            Track <span style={{ color: "#d4af37" }}>Any Courier</span>
          </h1>
          <p className="mb-8 text-sm" style={{ color: "rgba(240,234,214,0.5)" }}>
            Works with DHL, FedEx, UPS, USPS, Royal Mail, Sri Lanka Post, and 1000+ carriers
          </p>
          <div className="flex gap-3 max-w-lg mx-auto">
            <Input
              placeholder="Enter any tracking number…"
              value={inputId}
              onChange={(e) => setInputId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleTrack()}
              className="h-12 border-0 font-mono"
              style={{ background: "rgba(0,31,63,0.8)", color: "#f0ead6", borderBottom: "2px solid rgba(212,175,55,0.4)" }}
            />
            <Button
              onClick={handleTrack}
              disabled={loading}
              className="h-12 px-6 border-0 font-display font-semibold"
              style={{ background: "linear-gradient(135deg, #d4af37, #b8962e)", color: "#001f3f" }}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Search className="h-4 w-4 mr-2" />Track</>}
            </Button>
          </div>
        </motion.div>

        {/* ── Trust Shield + Status (compact row) ── */}
        <AnimatePresence>
          {result && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="max-w-5xl mx-auto mb-6"
            >
              <div className="grid md:grid-cols-3 gap-4">
                {/* Trust Shield */}
                <div
                  className="rounded-xl p-4 flex items-center gap-4"
                  style={{ background: "rgba(0,31,63,0.6)", border: "1px solid rgba(212,175,55,0.2)" }}
                >
                  <div
                    className={`h-14 w-14 rounded-full flex-shrink-0 flex items-center justify-center ${result.verified ? "animate-pulse" : ""}`}
                    style={{
                      background: result.verified
                        ? "radial-gradient(circle, rgba(0,204,102,0.3), rgba(0,204,102,0.05))"
                        : "radial-gradient(circle, rgba(85,119,153,0.3), rgba(85,119,153,0.05))",
                      border: `2px solid ${result.verified ? "#00cc66" : "#557799"}`,
                      boxShadow: result.verified ? "0 0 30px rgba(0,204,102,0.25)" : "none",
                    }}
                  >
                    <Shield className="h-7 w-7" style={{ color: result.verified ? "#00cc66" : "#557799" }} />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-widest font-display mb-0.5" style={{ color: "rgba(212,175,55,0.6)" }}>Trust Shield</p>
                    <p className="font-display font-semibold text-sm" style={{ color: result.verified ? "#00cc66" : "#557799" }}>
                      {result.verified ? "Carrier Verified" : "Unverified"}
                    </p>
                    <p className="text-xs" style={{ color: "rgba(240,234,214,0.4)" }}>
                      {result.verified ? "Real carrier scan detected" : "No carrier data found"}
                    </p>
                  </div>
                </div>

                {/* Status Card */}
                <div
                  className="md:col-span-2 rounded-xl p-4"
                  style={{ background: "rgba(0,31,63,0.6)", border: "1px solid rgba(212,175,55,0.2)" }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs uppercase tracking-widest font-display" style={{ color: "rgba(212,175,55,0.6)" }}>Shipment Status</p>
                    <button onClick={() => fetchTracking(result.tracking_id)} className="flex items-center gap-1 text-xs" style={{ color: "#d4af37" }}>
                      <RefreshCw className="h-3 w-3" /> Refresh
                    </button>
                  </div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: "linear-gradient(135deg, #001f3f, #002b5c)", border: "1px solid rgba(212,175,55,0.3)" }}>
                      {mapStatus === "Delivered"
                        ? <CheckCircle2 className="h-5 w-5" style={{ color: "#00cc66" }} />
                        : mapStatus === "Departed"
                        ? <Plane className="h-5 w-5" style={{ color: "#d4af37" }} />
                        : <Package className="h-5 w-5" style={{ color: "#d4af37" }} />}
                    </div>
                    <div>
                      <p className="font-display font-bold capitalize" style={{ color: "#f0ead6" }}>{result.carrier || "Unknown Carrier"}</p>
                      <p className="text-xs font-mono" style={{ color: "rgba(212,175,55,0.6)" }}>{result.tracking_id}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div>
                      <span className="block text-xs" style={{ color: "rgba(240,234,214,0.4)" }}>Status</span>
                      <span className="font-semibold capitalize text-xs" style={{ color: mapStatus === "Delivered" ? "#00cc66" : "#d4af37" }}>
                        {result.status || "Pending"}
                      </span>
                    </div>
                    <div>
                      <span className="block text-xs" style={{ color: "rgba(240,234,214,0.4)" }}>Location</span>
                      <span className="font-semibold flex items-center gap-1 text-xs" style={{ color: "#f0ead6" }}>
                        <MapPin className="h-3 w-3 flex-shrink-0" style={{ color: "#d4af37" }} />
                        {result.location || "Unknown"}
                      </span>
                    </div>
                    <div>
                      <span className="block text-xs" style={{ color: "rgba(240,234,214,0.4)" }}>Flight Phase</span>
                      <span className="uppercase tracking-wider text-xs font-display font-semibold" style={{ color: "#d4af37" }}>
                        {mapStatus}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── SPLIT SCREEN ── */}
        <AnimatePresence>
          {showSplitScreen && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="max-w-7xl mx-auto"
            >
              <div className="grid lg:grid-cols-2 gap-6">

                {/* ── LEFT: Visual Map ── */}
                <div className="flex flex-col gap-2">
                  {/* Label */}
                  <div className="flex items-center gap-2 px-1">
                    <div className="h-2 w-2 rounded-full" style={{ background: "#d4af37" }} />
                    <span className="text-xs font-display font-semibold uppercase tracking-widest" style={{ color: "#d4af37" }}>
                      Our Visual Route Map
                    </span>
                    <div className="flex-1 h-px" style={{ background: "rgba(212,175,55,0.2)" }} />
                  </div>

                  {/* Map Panel */}
                  <div
                    className="rounded-2xl overflow-hidden"
                    style={{
                      border: "1px solid rgba(212,175,55,0.25)",
                      boxShadow: "0 8px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(212,175,55,0.1)",
                      minHeight: "520px",
                    }}
                  >
                    {loading ? (
                      <div className="flex flex-col items-center justify-center h-full min-h-[520px]"
                        style={{ background: "rgba(0,15,30,0.9)" }}>
                        <Loader2 className="h-8 w-8 animate-spin mb-3" style={{ color: "#d4af37" }} />
                        <p className="text-xs font-display" style={{ color: "rgba(212,175,55,0.6)" }}>Plotting route…</p>
                      </div>
                    ) : (
                      <TrackingMap
                        status={mapStatus}
                        destinationCity={result?.location || undefined}
                        destinationCoords={result?.coordinates || undefined}
                      />
                    )}
                  </div>

                  {/* Live Feed (compact, below map) */}
                  {result && result.checkpoints.length > 0 && (
                    <div className="rounded-xl p-4 mt-1"
                      style={{ background: "rgba(0,31,63,0.6)", border: "1px solid rgba(212,175,55,0.15)" }}>
                      <div className="flex items-center gap-2 mb-3">
                        <Radio className="h-3.5 w-3.5" style={{ color: "#d4af37" }} />
                        <h3 className="font-display font-semibold text-xs uppercase tracking-widest" style={{ color: "#d4af37" }}>Live Carrier Feed</h3>
                      </div>
                      <div className="space-y-1.5 font-mono text-xs max-h-40 overflow-y-auto" style={{ color: "rgba(240,234,214,0.7)" }}>
                        {result.checkpoints.map((cp, i) => (
                          <div key={i} className="flex gap-2 items-start p-2 rounded" style={{ background: "rgba(0,0,0,0.2)" }}>
                            <span className="flex-shrink-0" style={{ color: i === 0 ? "#d4af37" : "#557799" }}>
                              [{cp.time ? new Date(cp.time).toLocaleString() : "—"}]
                            </span>
                            <span>
                              <strong style={{ color: "#f0ead6" }}>{cp.status}</strong>
                              {cp.location && <> — <span>{cp.location}</span></>}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* ── RIGHT: Official Carrier iframe ── */}
                <div className="flex flex-col gap-2">
                  {/* Label */}
                  <div className="flex items-center gap-2 px-1">
                    <div className="h-2 w-2 rounded-full" style={{ background: "#00cc66" }} />
                    <span className="text-xs font-display font-semibold uppercase tracking-widest" style={{ color: "#00cc66" }}>
                      Official Carrier Data (Live Feed)
                    </span>
                    <div className="flex-1 h-px" style={{ background: "rgba(0,204,102,0.2)" }} />
                    {iframeSrc && (
                      <a
                        href={iframeSrc}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs flex-shrink-0"
                        style={{ color: "rgba(0,204,102,0.6)" }}
                      >
                        Open <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>

                  {/* iframe Panel */}
                  <div
                    className="rounded-2xl overflow-hidden relative"
                    style={{
                      border: "1px solid rgba(0,204,102,0.2)",
                      boxShadow: "0 8px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(0,204,102,0.08)",
                      minHeight: "520px",
                      background: "rgba(0,10,20,0.95)",
                    }}
                  >
                    {/* Loading overlay */}
                    {iframeLoading && (
                      <div
                        className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none"
                        style={{ background: "rgba(0,10,20,0.92)" }}
                      >
                        <div
                          className="h-16 w-16 rounded-full flex items-center justify-center mb-4 animate-pulse"
                          style={{
                            background: "radial-gradient(circle, rgba(0,204,102,0.2), rgba(0,204,102,0.02))",
                            border: "2px solid rgba(0,204,102,0.4)",
                          }}
                        >
                          <Loader2 className="h-7 w-7 animate-spin" style={{ color: "#00cc66" }} />
                        </div>
                        <p className="font-display font-semibold text-sm mb-1" style={{ color: "#00cc66" }}>
                          Connecting to Carrier…
                        </p>
                        <p className="text-xs" style={{ color: "rgba(240,234,214,0.4)" }}>
                          Loading official tracking portal
                        </p>
                      </div>
                    )}

                    {iframeSrc ? (
                      <iframe
                        key={iframeSrc}
                        src={iframeSrc}
                        title="Official Carrier Tracking"
                        className="w-full"
                        style={{ height: "520px", border: "none", display: "block" }}
                        onLoad={() => setIframeLoading(false)}
                        onError={() => setIframeLoading(false)}
                        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center min-h-[520px]">
                        <Package className="h-10 w-10 mb-3" style={{ color: "#557799" }} />
                        <p className="text-xs font-display" style={{ color: "rgba(240,234,214,0.4)" }}>
                          Enter a tracking number to load official carrier data
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Carrier note */}
                  {result?.carrier && (
                    <p className="text-xs px-1" style={{ color: "rgba(240,234,214,0.35)" }}>
                      Detected carrier: <span style={{ color: "rgba(212,175,55,0.7)" }} className="capitalize">{result.carrier}</span>
                      {" "}— showing official {result.carrier} tracking portal
                    </p>
                  )}
                  {!result?.carrier && iframeSrc && (
                    <p className="text-xs px-1" style={{ color: "rgba(240,234,214,0.35)" }}>
                      Carrier not detected — showing universal tracker via 17track.net
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error State (no results) */}
        <AnimatePresence>
          {error && !loading && !iframeSrc && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-lg mx-auto text-center mt-6">
              <div className="rounded-xl p-6" style={{ background: "rgba(0,31,63,0.6)", border: "1px solid rgba(212,175,55,0.2)" }}>
                <Package className="h-10 w-10 mx-auto mb-3" style={{ color: "#557799" }} />
                <p className="font-display font-semibold mb-1" style={{ color: "#f0ead6" }}>No Data Found</p>
                <p className="text-xs" style={{ color: "rgba(240,234,214,0.5)" }}>{error}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
      <Footer />
    </div>
  );
}
