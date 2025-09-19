import React from "react";
import { X } from "lucide-react";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
};

const tiers = [
  {
    name: "Starter",
    price: "$0",
    period: "/month",
    features: [
      "Facebook only",
      "10 ads per search",
      "10 ads / month",
      "Standard task speed",
    ],
    cta: { label: "Start Free", href: "/api/dodo/checkout/free" },
    badge: null,
  },
  {
    name: "Professional",
    price: "$99",
    period: "/month",
    features: [
      "500 ads / month",
      "Priority analysis",
      "Advanced insights",
      "Multi‑result export",
    ],
    cta: { label: "Upgrade to Pro", href: "/api/dodo/checkout/pro" },
    badge: "Most Popular",
  },
  {
    name: "Enterprise",
    price: "$199",
    period: "/month",
    features: [
      "2000 ads / month",
      "Team seats",
      "SLA support",
      "Custom reports",
    ],
    cta: { label: "Contact Sales", href: "/pricing#enterprise" },
    badge: null,
  },
];

const PricingModal: React.FC<Props> = ({ open, onOpenChange }) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Pricing Plans"
    >
      <div className="absolute inset-0 bg-black/70" onClick={() => onOpenChange(false)} />
      <div className="relative w-full max-w-5xl rounded-2xl border border-white/10 bg-[#0F172A] text-neutral-200 shadow-lg">
        {/* Gradient Header */}
        <div className="h-2 w-full gradient-underline rounded-t-2xl" />
        <div className="p-6 md:p-8 flex items-center justify-between">
          <div>
            <h2 className="text-xl md:text-2xl font-semibold">Simple, Transparent Pricing</h2>
            <p className="text-neutral-400 mt-1">Scale from Starter to Enterprise as your needs grow.</p>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="p-2 rounded-md hover:bg-white/10 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tiers */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 p-6 md:p-8 pt-0">
          {tiers.map((t) => (
            <div key={t.name} className="rounded-2xl border border-white/10 bg-white/5 p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{t.name}</h3>
                {t.badge && (
                  <span className="text-xs px-2 py-1 rounded-full bg-white/10 border border-white/20">{t.badge}</span>
                )}
              </div>
              <div className="text-3xl font-bold">
                {t.price}
                <span className="text-base text-neutral-400">{t.period}</span>
              </div>
              <ul className="space-y-2 text-sm text-neutral-300">
                {t.features.map((f) => <li key={f}>• {f}</li>)}
              </ul>
              <a href={t.cta.href} className="mt-auto gradient-btn text-center py-2.5 rounded-md font-medium">
                {t.cta.label}
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PricingModal; 