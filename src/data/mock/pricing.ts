import type { PricingPlan } from "@/types/domain"

export const pricingPlans: PricingPlan[] = [
  {
    id: "starter",
    name: "Starter",
    monthlyPrice: 149,
    summary: "Checkout leak detection for growing Shopify stores.",
    highlight: "1 monitored store",
    features: [
      "Checkout funnel leak detection",
      "Weekly automated scans",
      "Issue feed with revenue impact estimates",
      "Weekly email digest",
    ],
    callToAction: "Choose Starter",
  },
  {
    id: "growth",
    name: "Growth",
    monthlyPrice: 399,
    summary: "Full leak coverage for operators running multiple stores.",
    highlight: "Up to 3 monitored stores",
    features: [
      "Daily automated scans",
      "Payment method coverage analysis",
      "Failed billing recovery signals",
      "Ranked recovery actions by impact",
    ],
    callToAction: "Choose Growth",
    recommended: true,
  },
  {
    id: "pro",
    name: "Pro",
    monthlyPrice: 899,
    summary: "Complete coverage and dedicated support for high-GMV operations.",
    highlight: "Unlimited monitored stores",
    features: [
      "Near real-time scanning",
      "Consolidated multi-store reporting",
      "Webhook and Slack alert routing",
      "Dedicated success architect",
    ],
    callToAction: "Choose Pro",
  },
]
