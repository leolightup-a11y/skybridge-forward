import { Link } from "react-router-dom";
import logo from "@/assets/logo.webp";

export function Footer() {
  return (
    <footer className="gradient-hero text-primary-foreground/70 py-16">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-10">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <img src={logo} alt="GoGlobal Express" className="h-8 w-auto brightness-0 invert" />
            </div>
            <p className="text-sm leading-relaxed">
              Premium air freight forwarding to the world. Trusted by 500+ businesses globally.
            </p>
          </div>
          {[
            {
              title: "Services",
              links: ["Air Freight", "Express Shipping", "B2B Solutions", "Customs Clearance"],
            },
            {
              title: "Resources",
              links: ["Freight Calculator", "Track Shipment", "Prohibited Items", "Duty Estimator"],
            },
            {
              title: "Company",
              links: ["About Us", "Contact", "Careers", "Terms of Service"],
            },
          ].map((col) => (
            <div key={col.title}>
              <h4 className="font-display font-semibold text-primary-foreground mb-4 text-sm uppercase tracking-wider">
                {col.title}
              </h4>
              <ul className="space-y-2">
                {col.links.map((l) => (
                  <li key={l}>
                    <Link
                      to="/"
                      className="text-sm hover:text-accent transition-colors"
                    >
                      {l}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 pt-8 border-t border-primary-foreground/10 text-center text-xs">
          © {new Date().getFullYear()} GoGlobal Express. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
