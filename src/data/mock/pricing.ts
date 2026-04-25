import type { PricingPlan } from "@/types/domain"

export const pricingPlans: PricingPlan[] = [
  {
    id: "starter",
    name: "Starter",
    monthlyPrice: 149,
    summary: "Weekly monitoring for one revenue surface.",
    highlight: "1 monitored source included",
    features: [
      "Website, signup, checkout, and billing leak monitoring",
      "Weekly automated scan cadence",
      "Ranked findings with monthly impact estimates",
      "Operator-ready weekly digest",
    ],
    callToAction: "Choose Starter",
  },
  {
    id: "growth",
    name: "Growth",
    monthlyPrice: 399,
    summary: "Daily monitoring for growing revenue operations.",
    highlight: "Up to 3 monitored sources",
    features: [
      "Daily automated scans across websites and funnels",
      "Lead, signup, pricing, and checkout diagnostics",
      "Billing recovery weakness signals",
      "Ranked recovery actions with stronger prioritization",
    ],
    callToAction: "Choose Growth",
    recommended: true,
  },
  {
    id: "pro",
    name: "Pro",
    monthlyPrice: 899,
    summary: "High-frequency monitoring for large-scale operators.",
    highlight: "Unlimited monitored sources",
    features: [
      "High-frequency monitoring cadence",
      "Highest coverage across websites, activation, checkout, and billing",
      "Webhook and Slack alert routing",
      "Advanced operator workflow support",
    ],
    callToAction: "Choose Pro",
  },
]
