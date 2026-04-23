import type { PricingPlan } from "@/types/domain"

export const pricingPlans: PricingPlan[] = [
  {
    id: "starter",
    name: "Starter",
    monthlyPrice: 149,
    summary: "Entry coverage for activation, checkout, and billing leakage.",
    highlight: "1 monitored source included",
    features: [
      "Activation, checkout, and billing leak detection",
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
    summary: "Broader leak coverage for growing revenue operations.",
    highlight: "Up to 3 monitored sources",
    features: [
      "Daily automated scans across leak families",
      "Activation and checkout progression diagnostics",
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
    summary: "Highest coverage with fastest monitoring for large-scale operators.",
    highlight: "Unlimited monitored sources",
    features: [
      "Near real-time monitoring cadence",
      "Highest coverage across activation, checkout, and billing",
      "Webhook and Slack alert routing",
      "Advanced operator workflow support",
    ],
    callToAction: "Choose Pro",
  },
]
