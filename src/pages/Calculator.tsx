import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Package,
  Ruler,
  Scale,
  AlertTriangle,
  ArrowRight,
  MapPin,
  Globe,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const origins = [
  "Colombo (CMB)",
  "Katunayake (BIA)",
  "Hambantota (HRI)",
  "Mattala (HRI)",
];

const destinations: Record<string, { duties: string; prohibited: string[] }> = {
  "United States": {
    duties: "0-6% for most goods. Textiles 12-32%.",
    prohibited: ["Ivory", "Cuban cigars", "Kinder Surprise eggs", "Absinthe (>10mg)"],
  },
  "United Kingdom": {
    duties: "0-12% standard. Clothing 6.5-12%.",
    prohibited: ["Certain plant seeds", "Raw meat", "Fireworks", "Offensive weapons"],
  },
  "United Arab Emirates": {
    duties: "5% standard customs duty.",
    prohibited: ["Pork products", "Gambling devices", "Israeli goods", "Narcotic drugs"],
  },
  Australia: {
    duties: "0-5% for most items. Clothing 5-10%.",
    prohibited: ["Fresh food", "Wooden items (untreated)", "Soil", "Live animals"],
  },
  Germany: {
    duties: "EU tariff: 0-14%. Electronics 0-3.7%.",
    prohibited: ["Counterfeit goods", "Certain knives", "Radar detectors"],
  },
  Singapore: {
    duties: "Most goods duty-free. Alcohol 0-$88/l.",
    prohibited: ["Chewing gum", "Firecrackers", "Certain publications"],
  },
  Japan: {
    duties: "0-15% standard. Tea 17%, Leather 30%.",
    prohibited: ["Firearms", "Narcotics", "Counterfeit currency", "Certain chemicals"],
  },
  India: {
    duties: "10-30% average. Electronics 10-20%.",
    prohibited: ["Maps not showing correct Indian boundaries", "Satellite phones (without license)"],
  },
};

export default function CalculatorPage() {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [actualWeight, setActualWeight] = useState("");

  const volumetricWeight = useMemo(() => {
    const l = parseFloat(length) || 0;
    const w = parseFloat(width) || 0;
    const h = parseFloat(height) || 0;
    return (l * w * h) / 6000;
  }, [length, width, height]);

  const actual = parseFloat(actualWeight) || 0;
  const chargeableWeight = Math.max(volumetricWeight, actual);
  const isVolumetric = volumetricWeight > actual && actual > 0;
  const destData = destinations[destination];

  const estimatedCost = chargeableWeight > 0 ? (chargeableWeight * 8.5 + 25).toFixed(2) : null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-3">
            Freight <span className="text-gradient-teal">Calculator</span>
          </h1>
          <p className="text-muted-foreground">
            Get an instant quote for your air freight shipment
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Main form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2 space-y-6"
          >
            {/* Route */}
            <div className="rounded-2xl border border-border bg-card p-6">
              <h3 className="font-display font-semibold text-card-foreground mb-4 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-accent" /> Shipping Route
              </h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Origin</Label>
                  <Select value={origin} onValueChange={setOrigin}>
                    <SelectTrigger><SelectValue placeholder="Select hub" /></SelectTrigger>
                    <SelectContent>
                      {origins.map((o) => (
                        <SelectItem key={o} value={o}>{o}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Destination</Label>
                  <Select value={destination} onValueChange={setDestination}>
                    <SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger>
                    <SelectContent>
                      {Object.keys(destinations).map((d) => (
                        <SelectItem key={d} value={d}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Dimensions */}
            <div className="rounded-2xl border border-border bg-card p-6">
              <h3 className="font-display font-semibold text-card-foreground mb-4 flex items-center gap-2">
                <Ruler className="h-4 w-4 text-accent" /> Package Dimensions (cm)
              </h3>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Length</Label>
                  <Input type="number" placeholder="0" value={length} onChange={(e) => setLength(e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Width</Label>
                  <Input type="number" placeholder="0" value={width} onChange={(e) => setWidth(e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Height</Label>
                  <Input type="number" placeholder="0" value={height} onChange={(e) => setHeight(e.target.value)} />
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Actual Weight (kg)</Label>
                <Input type="number" placeholder="0" value={actualWeight} onChange={(e) => setActualWeight(e.target.value)} className="max-w-[200px]" />
              </div>
            </div>

            {/* Volumetric Visualizer */}
            <div className="rounded-2xl border border-border bg-card p-6">
              <h3 className="font-display font-semibold text-card-foreground mb-4 flex items-center gap-2">
                <Scale className="h-4 w-4 text-accent" /> Weight Comparison
              </h3>
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted rounded-lg p-3 mb-5">
                <Info className="h-4 w-4 shrink-0" />
                <span>Volumetric weight = (L × W × H) ÷ 6000. Airlines charge whichever is higher.</span>
              </div>

              <div className="grid grid-cols-2 gap-6">
                {/* Actual weight bar */}
                <div className="text-center">
                  <div className="relative h-40 bg-muted rounded-xl overflow-hidden mb-3 flex items-end justify-center">
                    <motion.div
                      className="absolute bottom-0 w-full rounded-t-lg gradient-hero"
                      initial={{ height: 0 }}
                      animate={{
                        height: chargeableWeight > 0 ? `${Math.min((actual / chargeableWeight) * 100, 100)}%` : "0%",
                      }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                    />
                    <div className="relative z-10 pb-3">
                      <Scale className="h-6 w-6 text-primary-foreground mx-auto mb-1" />
                      <span className="text-xl font-display font-bold text-primary-foreground">
                        {actual.toFixed(1)} kg
                      </span>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-foreground">Actual Weight</p>
                  {!isVolumetric && actual > 0 && (
                    <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent font-medium">
                      Chargeable ✓
                    </span>
                  )}
                </div>

                {/* Volumetric weight bar */}
                <div className="text-center">
                  <div className="relative h-40 bg-muted rounded-xl overflow-hidden mb-3 flex items-end justify-center">
                    <motion.div
                      className="absolute bottom-0 w-full rounded-t-lg gradient-teal"
                      initial={{ height: 0 }}
                      animate={{
                        height: chargeableWeight > 0 ? `${Math.min((volumetricWeight / chargeableWeight) * 100, 100)}%` : "0%",
                      }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                    />
                    <div className="relative z-10 pb-3">
                      <Package className="h-6 w-6 text-accent-foreground mx-auto mb-1" />
                      <span className="text-xl font-display font-bold text-accent-foreground">
                        {volumetricWeight.toFixed(1)} kg
                      </span>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-foreground">Volumetric Weight</p>
                  {isVolumetric && (
                    <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent font-medium">
                      Chargeable ✓
                    </span>
                  )}
                </div>
              </div>

              {estimatedCost && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mt-6 p-4 rounded-xl gradient-teal text-center"
                >
                  <p className="text-sm text-accent-foreground/80">Estimated Cost</p>
                  <p className="text-3xl font-display font-bold text-accent-foreground">
                    ${estimatedCost} <span className="text-base font-normal">USD</span>
                  </p>
                  <p className="text-xs text-accent-foreground/60 mt-1">
                    Based on {chargeableWeight.toFixed(1)} kg chargeable weight
                  </p>
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            {/* Prohibited Items */}
            <div className="rounded-2xl border border-border bg-card p-6">
              <h3 className="font-display font-semibold text-card-foreground mb-4 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" /> Prohibited Items
              </h3>
              {destData ? (
                <ul className="space-y-2">
                  {destData.prohibited.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-destructive shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">Select a destination to view prohibited items.</p>
              )}
            </div>

            {/* Estimated Duties */}
            <div className="rounded-2xl border border-border bg-card p-6">
              <h3 className="font-display font-semibold text-card-foreground mb-4 flex items-center gap-2">
                <Globe className="h-4 w-4 text-accent" /> Estimated Duties
              </h3>
              {destData ? (
                <p className="text-sm text-muted-foreground leading-relaxed">{destData.duties}</p>
              ) : (
                <p className="text-sm text-muted-foreground">Select a destination to view duty estimates.</p>
              )}
            </div>

            {/* CTA */}
            <div className="rounded-2xl gradient-hero p-6 text-center">
              <h3 className="font-display font-semibold text-primary-foreground mb-2">
                Need a custom quote?
              </h3>
              <p className="text-sm text-primary-foreground/60 mb-4">
                Contact our team for bulk or special cargo rates.
              </p>
              <Button className="w-full gradient-teal border-0 text-accent-foreground">
                Contact Sales <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
