import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Shield, Plane, Truck, CheckCircle2, Clock, MapPin,
  Radio, Loader2, Package, RefreshCw,
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

export default function UniversalTrackPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [inputId, setInputId] = useState(id || "");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScrapedResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchTracking = useCallback(async (trackingId: string) => {
    if (!trackingId.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("scrape-tracking", {
        body: { tracking_id: trackingId.trim() },
      });

      if (fnError) throw fnError;
      if (data?.success) {
        setResult(data as ScrapedResult);
      } else {
        setError(data?.error || "Could not retrieve tracking info");
      }
    } catch (err: any) {
      console.error("Scrape error:", err);
      setError("Failed to fetch tracking data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-fetch when URL has an ID
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

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(180deg, #001020 0%, #001f3f 30%, #00152e 100%)" }}>
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-16">
        {/* Search Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
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
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Search className="h-4 w-4 mr-2" /> Track</>}
            </Button>
          </div>
        </motion.div>

        {/* Error State */}
        <AnimatePresence>
          {error && !loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-lg mx-auto text-center">
              <div className="rounded-xl p-6" style={{ background: "rgba(0,31,63,0.6)", border: "1px solid rgba(212,175,55,0.2)" }}>
                <Package className="h-10 w-10 mx-auto mb-3" style={{ color: "#557799" }} />
                <p className="font-display font-semibold mb-1" style={{ color: "#f0ead6" }}>No Data Found</p>
                <p className="text-xs" style={{ color: "rgba(240,234,214,0.5)" }}>{error}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results */}
        <AnimatePresence>
          {result && !loading && (
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="max-w-5xl mx-auto space-y-6">
              {/* Top row: Trust Shield + Status Card */}
              <div className="grid md:grid-cols-3 gap-6">
                {/* Trust Shield */}
                <div className="rounded-xl p-6 text-center flex flex-col items-center justify-center"
                  style={{ background: "rgba(0,31,63,0.6)", border: "1px solid rgba(212,175,55,0.2)" }}>
                  <p className="text-xs uppercase tracking-widest mb-4 font-display" style={{ color: "rgba(212,175,55,0.6)" }}>Trust Shield</p>
                  <div
                    className={`h-24 w-24 rounded-full flex items-center justify-center ${result.verified ? "animate-pulse" : ""}`}
                    style={{
                      background: result.verified
                        ? "radial-gradient(circle, rgba(0,204,102,0.3), rgba(0,204,102,0.05))"
                        : "radial-gradient(circle, rgba(85,119,153,0.3), rgba(85,119,153,0.05))",
                      border: `2px solid ${result.verified ? "#00cc66" : "#557799"}`,
                      boxShadow: result.verified ? "0 0 40px rgba(0,204,102,0.3)" : "none",
                    }}
                  >
                    <Shield className="h-10 w-10" style={{ color: result.verified ? "#00cc66" : "#557799" }} />
                  </div>
                  <p className="mt-4 font-display font-semibold text-sm" style={{ color: result.verified ? "#00cc66" : "#557799" }}>
                    {result.verified ? "Carrier Verified" : "Unverified"}
                  </p>
                  <p className="text-xs mt-1" style={{ color: "rgba(240,234,214,0.4)" }}>
                    {result.verified ? "Real carrier scan detected" : "No carrier data found"}
                  </p>
                </div>

                {/* Status Card */}
                <div className="md:col-span-2 rounded-xl p-6"
                  style={{ background: "rgba(0,31,63,0.6)", border: "1px solid rgba(212,175,55,0.2)" }}>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-xs uppercase tracking-widest font-display" style={{ color: "rgba(212,175,55,0.6)" }}>
                      Shipment Status
                    </p>
                    <button onClick={() => fetchTracking(result.tracking_id)} className="flex items-center gap-1 text-xs" style={{ color: "#d4af37" }}>
                      <RefreshCw className="h-3 w-3" /> Refresh
                    </button>
                  </div>
                  <div className="flex items-center gap-4 mb-5">
                    <div className="h-14 w-14 rounded-xl flex items-center justify-center"
                      style={{ background: "linear-gradient(135deg, #001f3f, #002b5c)", border: "1px solid rgba(212,175,55,0.3)" }}>
                      {mapStatus === "Delivered" ? <CheckCircle2 className="h-7 w-7" style={{ color: "#00cc66" }} />
                        : mapStatus === "Departed" ? <Plane className="h-7 w-7" style={{ color: "#d4af37" }} />
                        : <Package className="h-7 w-7" style={{ color: "#d4af37" }} />}
                    </div>
                    <div>
                      <p className="font-display font-bold text-lg capitalize" style={{ color: "#f0ead6" }}>
                        {result.carrier || "Unknown Carrier"}
                      </p>
                      <p className="text-xs font-mono" style={{ color: "rgba(212,175,55,0.6)" }}>
                        {result.tracking_id}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="block text-xs" style={{ color: "rgba(240,234,214,0.4)" }}>Status</span>
                      <span className="font-semibold capitalize" style={{ color: mapStatus === "Delivered" ? "#00cc66" : "#d4af37" }}>
                        {result.status || "Pending"}
                      </span>
                    </div>
                    <div>
                      <span className="block text-xs" style={{ color: "rgba(240,234,214,0.4)" }}>Location</span>
                      <span className="font-semibold flex items-center gap-1" style={{ color: "#f0ead6" }}>
                        <MapPin className="h-3 w-3" style={{ color: "#d4af37" }} />
                        {result.location || "Unknown"}
                      </span>
                    </div>
                    <div>
                      <span className="block text-xs" style={{ color: "rgba(240,234,214,0.4)" }}>Carrier</span>
                      <span className="capitalize" style={{ color: "rgba(240,234,214,0.6)" }}>
                        {result.carrier || "Auto-detecting…"}
                      </span>
                    </div>
                    <div>
                      <span className="block text-xs" style={{ color: "rgba(240,234,214,0.4)" }}>Flight Status</span>
                      <span className="uppercase tracking-wider text-xs font-display font-semibold" style={{ color: "#d4af37" }}>
                        {mapStatus}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Map */}
              <TrackingMap
                status={mapStatus}
                destinationCity={result.location || undefined}
                destinationCoords={result.coordinates || undefined}
              />

              {/* Live Carrier Feed */}
              {result.checkpoints.length > 0 && (
                <div className="rounded-xl p-6"
                  style={{ background: "rgba(0,31,63,0.6)", border: "1px solid rgba(212,175,55,0.2)" }}>
                  <div className="flex items-center gap-2 mb-4">
                    <Radio className="h-4 w-4" style={{ color: "#d4af37" }} />
                    <h3 className="font-display font-semibold text-sm" style={{ color: "#d4af37" }}>Live Carrier Feed</h3>
                  </div>
                  <div className="space-y-2 font-mono text-xs max-h-80 overflow-y-auto" style={{ color: "rgba(240,234,214,0.7)" }}>
                    {result.checkpoints.map((cp, i) => (
                      <div key={i} className="flex gap-3 items-start p-3 rounded-lg" style={{ background: "rgba(0,0,0,0.2)" }}>
                        <span style={{ color: i === 0 ? "#d4af37" : "#557799" }}>
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

              {/* No checkpoints fallback */}
              {result.checkpoints.length === 0 && (
                <div className="rounded-xl p-6"
                  style={{ background: "rgba(0,31,63,0.6)", border: "1px solid rgba(212,175,55,0.2)" }}>
                  <div className="flex items-center gap-2 mb-3">
                    <Radio className="h-4 w-4" style={{ color: "#557799" }} />
                    <h3 className="font-display font-semibold text-sm" style={{ color: "#557799" }}>Carrier Feed</h3>
                  </div>
                  <p className="text-xs font-mono" style={{ color: "rgba(240,234,214,0.4)" }}>
                    Detailed checkpoint data is not available for this shipment. The status above reflects the latest scan from the carrier.
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <Footer />
    </div>
  );
}
