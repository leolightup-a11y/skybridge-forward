import { useState } from "react";
import { motion } from "framer-motion";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

interface Milestone {
  id: string;
  label: string;
  status: "completed" | "active" | "pending";
  time?: string;
  location?: string;
  icon: typeof Shield;
  phaseColor: string;
}

const demoMilestones: Milestone[] = [
  {
    id: "1",
    label: "Escrow Funds Locked",
    status: "completed",
    time: "Feb 10, 2026 — 09:15 AM",
    location: "Payment Gateway",
    icon: Shield,
    phaseColor: "bg-phase-escrow",
  },
  {
    id: "2",
    label: "Picked Up & Processing",
    status: "completed",
    time: "Feb 10, 2026 — 02:30 PM",
    location: "Colombo Warehouse",
    icon: Package,
    phaseColor: "bg-phase-escrow",
  },
  {
    id: "3",
    label: "Handed to Airline",
    status: "completed",
    time: "Feb 11, 2026 — 06:00 AM",
    location: "BIA, Katunayake",
    icon: Plane,
    phaseColor: "bg-phase-airline",
  },
  {
    id: "4",
    label: "International Transit",
    status: "active",
    time: "In transit — Est. arrival Feb 13",
    location: "DOH → LHR via Qatar Cargo",
    icon: Plane,
    phaseColor: "bg-phase-transit",
  },
  {
    id: "5",
    label: "Customs Clearance",
    status: "pending",
    icon: FileText,
    phaseColor: "bg-phase-transit",
  },
  {
    id: "6",
    label: "Out for Delivery",
    status: "pending",
    icon: Truck,
    phaseColor: "bg-phase-delivered",
  },
  {
    id: "7",
    label: "Delivered",
    status: "pending",
    icon: CheckCircle2,
    phaseColor: "bg-phase-delivered",
  },
];

const trustShieldColor: Record<string, string> = {
  escrow: "from-phase-escrow to-gold",
  airline: "from-phase-airline to-teal-light",
  transit: "from-phase-transit to-accent",
  delivered: "from-phase-delivered to-success",
};

function getShipmentPhase(milestones: Milestone[]) {
  const activeIdx = milestones.findIndex((m) => m.status === "active");
  if (activeIdx <= 1) return "escrow";
  if (activeIdx === 2) return "airline";
  if (activeIdx <= 4) return "transit";
  return "delivered";
}

export default function TrackPage() {
  const [trackingId, setTrackingId] = useState("");
  const [showResults, setShowResults] = useState(false);

  const phase = getShipmentPhase(demoMilestones);

  const handleTrack = () => {
    const id = trackingId.trim();
    if (!id) return;

    // SriLankan Airlines Cargo — AWB prefix 160
    if (id.startsWith("160")) {
      window.open(
        `https://www.srilankancargo.com/tracking?awb=${encodeURIComponent(id)}`,
        "_blank",
        "noopener,noreferrer"
      );
      return;
    }

    // DHL — typically 10-digit numeric or starts with common DHL patterns
    if (/^\d{10,11}$/.test(id) || /^[JJ|GM|JVGL]/i.test(id)) {
      window.open(
        `https://www.dhl.com/global-en/home/tracking/tracking-express.html?submit=1&tracking-id=${encodeURIComponent(id)}`,
        "_blank",
        "noopener,noreferrer"
      );
      return;
    }

    // FedEx — typically 12-15 digits
    if (/^\d{12,15}$/.test(id)) {
      window.open(
        `https://www.fedex.com/fedextrack/?trknbr=${encodeURIComponent(id)}`,
        "_blank",
        "noopener,noreferrer"
      );
      return;
    }

    // UPS — starts with 1Z
    if (/^1Z/i.test(id)) {
      window.open(
        `https://www.ups.com/track?tracknum=${encodeURIComponent(id)}`,
        "_blank",
        "noopener,noreferrer"
      );
      return;
    }

    // Fallback — show demo milestones
    setShowResults(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-16">
        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-3">
            Track Your <span className="text-gradient-teal">Shipment</span>
          </h1>
          <p className="text-muted-foreground mb-8">
            Enter your AWB number or tracking ID
          </p>
          <div className="flex gap-3 max-w-lg mx-auto">
            <Input
              placeholder="e.g. ALK-2026-00482"
              value={trackingId}
              onChange={(e) => setTrackingId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleTrack()}
              className="h-12"
            />
            <Button
              onClick={handleTrack}
              className="h-12 px-6 gradient-teal border-0 text-accent-foreground"
            >
              <Search className="h-4 w-4 mr-2" /> Track
            </Button>
          </div>
        </motion.div>

        {showResults && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto"
          >
            {/* Trust Shield + Aviation Mode */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {/* Trust Shield */}
              <div className="rounded-2xl border border-border bg-card p-6 text-center">
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Trust Shield Status</p>
                <div className={`mx-auto h-24 w-24 rounded-full bg-gradient-to-br ${trustShieldColor[phase]} flex items-center justify-center shadow-teal-glow animate-pulse-teal`}>
                  <Shield className="h-10 w-10 text-card" />
                </div>
                <p className="mt-4 font-display font-semibold text-card-foreground capitalize">{phase}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {phase === "escrow" && "Funds securely held until carrier scan"}
                  {phase === "airline" && "Escrow released — handed to airline"}
                  {phase === "transit" && "Package in international transit"}
                  {phase === "delivered" && "Successfully delivered"}
                </p>
              </div>

              {/* Aviation Mode */}
              <div className="rounded-2xl border border-border bg-card p-6">
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Aviation Mode</p>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-xl gradient-hero flex items-center justify-center">
                    <Plane className="h-6 w-6 text-teal" />
                  </div>
                  <div>
                    <p className="font-display font-semibold text-card-foreground">Qatar Cargo</p>
                    <p className="text-xs text-muted-foreground">QR 8472 • Boeing 777F</p>
                  </div>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">AWB Number</span>
                    <span className="font-mono text-card-foreground">157-4829 1047</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Route</span>
                    <span className="text-card-foreground">CMB → DOH → LHR</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ETA</span>
                    <span className="text-card-foreground">Feb 13, 2026</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <span className="inline-flex items-center gap-1 text-accent font-medium">
                      <Clock className="h-3 w-3" /> In Transit
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Milestone Timeline */}
            <div className="rounded-2xl border border-border bg-card p-6">
              <h3 className="font-display font-semibold text-card-foreground mb-6">Shipment Milestones</h3>
              <div className="space-y-0">
                {demoMilestones.map((m, i) => (
                  <div key={m.id} className="flex gap-4">
                    {/* Timeline line + dot */}
                    <div className="flex flex-col items-center">
                      <div
                        className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                          m.status === "completed"
                            ? m.phaseColor
                            : m.status === "active"
                            ? `${m.phaseColor} animate-pulse-teal`
                            : "bg-muted"
                        }`}
                      >
                        <m.icon className={`h-4 w-4 ${m.status === "pending" ? "text-muted-foreground" : "text-card"}`} />
                      </div>
                      {i < demoMilestones.length - 1 && (
                        <div className={`w-0.5 h-12 ${m.status === "pending" ? "bg-muted" : m.phaseColor}`} />
                      )}
                    </div>
                    {/* Content */}
                    <div className="pb-8">
                      <p className={`font-medium text-sm ${m.status === "pending" ? "text-muted-foreground" : "text-card-foreground"}`}>
                        {m.label}
                      </p>
                      {m.time && (
                        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {m.time}
                        </p>
                      )}
                      {m.location && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
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
      </div>
      <Footer />
    </div>
  );
}
