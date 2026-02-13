import { motion } from "framer-motion";
import { Package, Shield, Globe, FileText, Plane, CreditCard } from "lucide-react";

const features = [
  {
    icon: Package,
    title: "Smart Freight Calculator",
    desc: "Instant quotes with volumetric weight comparison and duty estimates for any destination.",
  },
  {
    icon: Shield,
    title: "Milestone Escrow",
    desc: "Funds locked until carrier scan confirms international transit. Zero risk shipping.",
  },
  {
    icon: Globe,
    title: "195+ Destinations",
    desc: "Ship from Colombo, Katunayake & Hambantota to anywhere in the world via premium carriers.",
  },
  {
    icon: Plane,
    title: "Aviation Mode Tracking",
    desc: "Real-time AWB status, airline partner info, and live flight tracking for every shipment.",
  },
  {
    icon: FileText,
    title: "B2B Document Vault",
    desc: "Securely manage EDB permits, commercial invoices, and packing lists in one place.",
  },
  {
    icon: CreditCard,
    title: "Local Payment Methods",
    desc: "Pay with FriMi, Genie, LankaPay or international cards. All methods fully supported.",
  },
];

export function FeaturesSection() {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
            Built for <span className="text-gradient-teal">Sri Lankan</span> Exporters
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Every feature designed with the unique needs of Sri Lankan businesses and
            individuals shipping internationally.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="group rounded-2xl border border-border bg-card p-6 hover:shadow-aviation transition-all hover:-translate-y-1"
            >
              <div className="h-11 w-11 rounded-xl gradient-teal flex items-center justify-center mb-4 group-hover:shadow-teal-glow transition-shadow">
                <f.icon className="h-5 w-5 text-accent-foreground" />
              </div>
              <h3 className="font-display font-semibold text-lg text-card-foreground mb-2">
                {f.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
