import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Shield,
  Plane,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  FileText,
  Radio,
  Loader2,
} from "lucide-react";
import { TrackingMap } from "@/components/TrackingMap";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";

/* ── Types ── */
interface Milestone {
  id: string;
  label: string;
  status: "completed" | "active" | "pending";
  time?: string;
  location?: string;
  icon: typeof Shield;
  phaseColor: string;
}

interface ShipmentData {
  tracking_number: string;
  status: string | null;
  location: string | null;
  carrier: string | null;
  coordinates: [number, number] | null;
  updated_at: string;
  created_at: string;
}

/* ── Demo milestones (fallback) ── */
const demoMilestones: Milestone[] = [
  { id: "1", label: "Escrow Funds Locked", status: "completed", time: "Feb 10, 2026 — 09:15 AM", location: "Payment Gateway", icon: Shield, phaseColor: "bg-phase-escrow" },
  { id: "2", label: "Picked Up & Processing", status: "completed", time: "Feb 10, 2026 — 02:30 PM", location: "Colombo Warehouse", icon: Package, phaseColor: "bg-phase-escrow" },
  { id: "3", label: "Handed to Airline", status: "completed", time: "Feb 11, 2026 — 06:00 AM", location: "BIA, Katunayake", icon: Plane, phaseColor: "bg-phase-airline" },
  { id: "4", label: "International Transit", status: "active", time: "In transit — Est. arrival Feb 13", location: "DOH → LHR via Qatar Cargo", icon: Plane, phaseColor: "bg-phase-transit" },
  { id: "5", label: "Customs Clearance", status: "pending", icon: FileText, phaseColor: "bg-phase-transit" },
  { id: "6", label: "Out for Delivery", status: "pending", icon: Truck, phaseColor: "bg-phase-delivered" },
  { id: "7", label: "Delivered", status: "pending", icon: CheckCircle2, phaseColor: "bg-phase-delivered" },
];

function mapStatusToPhase(status: string | null): "escrow" | "airline" | "transit" | "delivered" {
  if (!status) return "escrow";
  const s = status.toLowerCase();
  if (s === "delivered") return "delivered";
  if (s === "intransit" || s === "in_transit" || s === "in transit" || s === "departed") return "transit";
  if (s === "pickup" || s === "picked_up") return "airline";
  return "escrow";
}

function mapPhaseToMapStatus(phase: string): "Processing" | "Departed" | "Delivered" {
  if (phase === "delivered") return "Delivered";
  if (phase === "transit" || phase === "airline") return "Departed";
  return "Processing";
}

function getShipmentPhase(milestones: Milestone[]) {
  const activeIdx = milestones.findIndex((m) => m.status === "active");
  if (activeIdx <= 1) return "escrow";
  if (activeIdx === 2) return "airline";
  if (activeIdx <= 4) return "transit";
  return "delivered";
}

/* ── Carrier redirect helpers ── */
function tryCarrierRedirect(id: string): boolean {
  if (id.startsWith("160")) {
    window.open(`https://www.srilankancargo.com/tracking?awb=${encodeURIComponent(id)}`, "_blank", "noopener,noreferrer");
    return true;
  }
  if (/^1Z/i.test(id)) {
    window.open(`https://www.ups.com/track?tracknum=${encodeURIComponent(id)}`, "_blank", "noopener,noreferrer");
    return true;
  }
  return false;
}

export default function TrackPage() {
  const [trackingId, setTrackingId] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shipment, setShipment] = useState<ShipmentData | null>(null);
  const [trustVerified, setTrustVerified] = useState(false);

  const phase = shipment ? mapStatusToPhase(shipment.status) : getShipmentPhase(demoMilestones);
  const mapStatus = mapPhaseToMapStatus(phase);

  const handleTrack = async () => {
    const id = trackingId.trim();
    if (!id) return;
    if (tryCarrierRedirect(id)) return;

    setLoading(true);
    setShipment(null);
    setTrustVerified(false);

    try {
      const { data, error } = await supabase.functions.invoke("track-shipment", {
        body: { tracking_number: id },
      });

      if (data?.success && data.shipment) {
        setShipment(data.shipment);
        setTrustVerified(true);
      }
    } catch (err) {
      console.error("Track error:", err);
    } finally {
      setLoading(false);
      setShowResults(true);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(180deg, #001020 0%, #001f3f 30%, #00152e 100%)" }}>
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-16">
        {/* Search Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 text-xs font-display font-semibold tracking-widest uppercase"
            style={{ background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.3)", color: "#d4af37" }}>
            <Plane className="h-3.5 w-3.5" /> International Air Cargo Tracking
          </div>
          <h1 className="text-3xl md:text-5xl font-display font-bold mb-3" style={{ color: "#f0ead6" }}>
            Track Your <span style={{ color: "#d4af37" }}>Shipment</span>
          </h1>
          <p className="mb-8 text-sm" style={{ color: "rgba(240,234,214,0.5)" }}>
            Enter your AWB number or tracking ID for real-time flight updates
          </p>
          <div className="flex gap-3 max-w-lg mx-auto">
            <Input
              placeholder="e.g. ALK-2026-00482"
              value={trackingId}
              onChange={(e) => setTrackingId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleTrack()}
              className="h-12 border-0 font-mono"
              style={{ background: "rgba(0,31,63,0.8)", color: "#f0ead6", borderBottom: "2px solid rgba(212,175,55,0.4)" }}
            />
            <Button onClick={handleTrack} disabled={loading} className="h-12 px-6 border-0 font-display font-semibold"
              style={{ background: "linear-gradient(135deg, #d4af37, #b8962e)", color: "#001f3f" }}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Search className="h-4 w-4 mr-2" /> Track</>}
            </Button>
          </div>
        </motion.div>

        <AnimatePresence>
          {showResults && (
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="max-w-5xl mx-auto space-y-6">
              {/* Top row: Trust Shield + Status Card */}
              <div className="grid md:grid-cols-3 gap-6">
                {/* Trust Shield */}
                <div className="rounded-xl p-6 text-center flex flex-col items-center justify-center"
                  style={{ background: "rgba(0,31,63,0.6)", border: "1px solid rgba(212,175,55,0.2)" }}>
                  <p className="text-xs uppercase tracking-widest mb-4 font-display" style={{ color: "rgba(212,175,55,0.6)" }}>Trust Shield</p>
                  <div className={`h-24 w-24 rounded-full flex items-center justify-center ${trustVerified ? "animate-pulse-teal" : ""}`}
                    style={{
                      background: trustVerified
                        ? "radial-gradient(circle, rgba(0,204,102,0.3), rgba(0,204,102,0.05))"
                        : "radial-gradient(circle, rgba(85,119,153,0.3), rgba(85,119,153,0.05))",
                      border: `2px solid ${trustVerified ? "#00cc66" : "#557799"}`,
                      boxShadow: trustVerified ? "0 0 40px rgba(0,204,102,0.3)" : "none",
                    }}>
                    <Shield className="h-10 w-10" style={{ color: trustVerified ? "#00cc66" : "#557799" }} />
                  </div>
                  <p className="mt-4 font-display font-semibold text-sm" style={{ color: trustVerified ? "#00cc66" : "#557799" }}>
                    {trustVerified ? "Verified Scan" : "Unverified"}
                  </p>
                  <p className="text-xs mt-1" style={{ color: "rgba(240,234,214,0.4)" }}>
                    {trustVerified ? "Real carrier data confirmed" : "No carrier scan found"}
                  </p>
                </div>

                {/* Status Card */}
                <div className="md:col-span-2 rounded-xl p-6"
                  style={{ background: "rgba(0,31,63,0.6)", border: "1px solid rgba(212,175,55,0.2)" }}>
                  <p className="text-xs uppercase tracking-widest mb-4 font-display" style={{ color: "rgba(212,175,55,0.6)" }}>
                    Shipment Status
                  </p>
                  <div className="flex items-center gap-4 mb-5">
                    <div className="h-14 w-14 rounded-xl flex items-center justify-center"
                      style={{ background: "linear-gradient(135deg, #001f3f, #002b5c)", border: "1px solid rgba(212,175,55,0.3)" }}>
                      <Plane className="h-7 w-7" style={{ color: "#d4af37" }} />
                    </div>
                    <div>
                      <p className="font-display font-bold text-lg" style={{ color: "#f0ead6" }}>
                        {shipment?.carrier?.toUpperCase() || "Qatar Cargo"}
                      </p>
                      <p className="text-xs font-mono" style={{ color: "rgba(212,175,55,0.6)" }}>
                        {shipment?.tracking_number || trackingId}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="block text-xs" style={{ color: "rgba(240,234,214,0.4)" }}>Status</span>
                      <span className="font-semibold capitalize" style={{ color: phase === "delivered" ? "#00cc66" : "#d4af37" }}>
                        {shipment?.status || phase}
                      </span>
                    </div>
                    <div>
                      <span className="block text-xs" style={{ color: "rgba(240,234,214,0.4)" }}>Location</span>
                      <span className="font-semibold flex items-center gap-1" style={{ color: "#f0ead6" }}>
                        <MapPin className="h-3 w-3" style={{ color: "#d4af37" }} />
                        {shipment?.location || "DOH → LHR"}
                      </span>
                    </div>
                    <div>
                      <span className="block text-xs" style={{ color: "rgba(240,234,214,0.4)" }}>Last Updated</span>
                      <span className="font-mono text-xs" style={{ color: "rgba(240,234,214,0.6)" }}>
                        {shipment?.updated_at ? new Date(shipment.updated_at).toLocaleString() : "—"}
                      </span>
                    </div>
                    <div>
                      <span className="block text-xs" style={{ color: "rgba(240,234,214,0.4)" }}>Phase</span>
                      <span className="uppercase tracking-wider text-xs font-display font-semibold" style={{ color: "#d4af37" }}>
                        {phase}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Map */}
              <TrackingMap
                status={mapStatus}
                destinationCity={shipment?.location || "London (LHR)"}
                destinationCoords={shipment?.coordinates || [51.47, -0.4543]}
              />

              {/* Live Feed */}
              <div className="rounded-xl p-6"
                style={{ background: "rgba(0,31,63,0.6)", border: "1px solid rgba(212,175,55,0.2)" }}>
                <div className="flex items-center gap-2 mb-4">
                  <Radio className="h-4 w-4" style={{ color: "#d4af37" }} />
                  <h3 className="font-display font-semibold text-sm" style={{ color: "#d4af37" }}>Live Carrier Feed</h3>
                </div>
                {shipment ? (
                  <div className="space-y-3 font-mono text-xs" style={{ color: "rgba(240,234,214,0.7)" }}>
                    <div className="flex gap-3 items-start p-3 rounded-lg" style={{ background: "rgba(0,0,0,0.2)" }}>
                      <span style={{ color: "#d4af37" }}>[{new Date(shipment.updated_at).toLocaleTimeString()}]</span>
                      <span>
                        Status: <strong style={{ color: "#f0ead6" }}>{shipment.status}</strong>
                        {shipment.location && <> — Location: <strong style={{ color: "#f0ead6" }}>{shipment.location}</strong></>}
                        {shipment.carrier && <> — Carrier: <strong style={{ color: "#f0ead6" }}>{shipment.carrier}</strong></>}
                      </span>
                    </div>
                    <div className="flex gap-3 items-start p-3 rounded-lg" style={{ background: "rgba(0,0,0,0.2)" }}>
                      <span style={{ color: "#557799" }}>[{new Date(shipment.created_at).toLocaleTimeString()}]</span>
                      <span>Shipment registered in system — Tracking #{shipment.tracking_number}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs font-mono" style={{ color: "rgba(240,234,214,0.4)" }}>
                    No real-time carrier data found. Showing demo milestones below.
                  </p>
                )}
              </div>

              {/* Milestone Timeline */}
              <div className="rounded-xl p-6"
                style={{ background: "rgba(0,31,63,0.6)", border: "1px solid rgba(212,175,55,0.2)" }}>
                <h3 className="font-display font-semibold mb-6 text-sm" style={{ color: "#d4af37" }}>
                  Shipment Milestones
                </h3>
                <div className="space-y-0">
                  {demoMilestones.map((m, i) => (
                    <div key={m.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                          m.status === "completed" ? m.phaseColor
                            : m.status === "active" ? `${m.phaseColor} animate-pulse-teal`
                            : ""
                        }`} style={m.status === "pending" ? { background: "rgba(85,119,153,0.2)" } : {}}>
                          <m.icon className="h-4 w-4" style={{ color: m.status === "pending" ? "#557799" : "#001f3f" }} />
                        </div>
                        {i < demoMilestones.length - 1 && (
                          <div className="w-0.5 h-12" style={{
                            background: m.status === "pending" ? "rgba(85,119,153,0.2)" : undefined,
                          }}>
                            {m.status !== "pending" && <div className={`w-full h-full ${m.phaseColor}`} />}
                          </div>
                        )}
                      </div>
                      <div className="pb-8">
                        <p className="font-medium text-sm" style={{ color: m.status === "pending" ? "#557799" : "#f0ead6" }}>
                          {m.label}
                        </p>
                        {m.time && (
                          <p className="text-xs mt-0.5 flex items-center gap-1" style={{ color: "rgba(240,234,214,0.4)" }}>
                            <Clock className="h-3 w-3" /> {m.time}
                          </p>
                        )}
                        {m.location && (
                          <p className="text-xs flex items-center gap-1" style={{ color: "rgba(240,234,214,0.4)" }}>
                            <MapPin className="h-3 w-3" /> {m.location}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <Footer />
    </div>
  );
}
