import { useState } from "react";
import { motion } from "framer-motion";
import { Plane, Building2, User, ArrowRight, Shield, Clock, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-aviation.jpg";

type UserType = "individual" | "business";

export function HeroSection() {
  const [userType, setUserType] = useState<UserType>("individual");

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="Cargo aircraft"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 gradient-hero opacity-85" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(hsl(var(--teal)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--teal)) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <div className="container relative z-10 mx-auto px-4 pt-24 pb-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-accent/30 bg-accent/10 mb-6">
              <Globe className="h-3.5 w-3.5 text-accent" />
              <span className="text-xs font-medium text-accent">
                Your Global Express Partner
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold leading-tight text-primary-foreground mb-6">
              Ship Globally,{" "}
              <span className="text-gradient-teal">Express Delivery</span>
            </h1>

            <p className="text-lg text-primary-foreground/70 max-w-lg mb-8 font-light">
              Premium air freight forwarding to 195+ countries. Real-time
              tracking, milestone-based escrow, and aviation-grade security for every
              shipment.
            </p>

            {/* Toggle */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-primary-foreground/10 backdrop-blur-sm w-fit mb-8">
              <button
                onClick={() => setUserType("individual")}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  userType === "individual"
                    ? "gradient-teal text-accent-foreground shadow-lg"
                    : "text-primary-foreground/60 hover:text-primary-foreground"
                }`}
              >
                <User className="h-4 w-4" />
                Individual
              </button>
              <button
                onClick={() => setUserType("business")}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  userType === "business"
                    ? "gradient-teal text-accent-foreground shadow-lg"
                    : "text-primary-foreground/60 hover:text-primary-foreground"
                }`}
              >
                <Building2 className="h-4 w-4" />
                Business (SME)
              </button>
            </div>

            <motion.div
              key={userType}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-wrap gap-4"
            >
              <Button
                size="lg"
                className="gradient-teal border-0 text-accent-foreground shadow-teal-glow font-semibold"
                asChild
              >
                <Link to="/calculator">
                  {userType === "individual" ? "Get Shipping Quote" : "Enterprise Quote"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10"
                asChild
              >
                <Link to="/track">Track Shipment</Link>
              </Button>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="hidden lg:grid grid-cols-2 gap-4"
          >
            {[
              { icon: Shield, label: "Escrow Protected", value: "100%", sub: "Milestone-based" },
              { icon: Clock, label: "Avg Transit", value: "3-5", sub: "Business days" },
              { icon: Globe, label: "Destinations", value: "195+", sub: "Countries" },
              { icon: Plane, label: "Airline Partners", value: "12+", sub: "Premium carriers" },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                className="glass-dark rounded-2xl p-6 group hover:shadow-teal-glow transition-shadow"
              >
                <stat.icon className="h-5 w-5 text-accent mb-3" />
                <p className="text-3xl font-display font-bold text-primary-foreground">
                  {stat.value}
                </p>
                <p className="text-sm font-medium text-primary-foreground/80">{stat.label}</p>
                <p className="text-xs text-primary-foreground/50 mt-1">{stat.sub}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
