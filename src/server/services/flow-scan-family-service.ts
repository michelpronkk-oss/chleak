import type { MerchantPlatform } from "@/types/domain"

export type ScanFamily =
  | "signup"
  | "onboarding_activation"
  | "pricing_handoff"
  | "checkout"
  | "billing_recovery"

interface ScanFamilyDefinition {
  key: ScanFamily
  label: string
  primaryPlatforms: MerchantPlatform[]
  notes: string
}

export const scanFamilyCatalog: Record<ScanFamily, ScanFamilyDefinition> = {
  signup: {
    key: "signup",
    label: "Signup",
    primaryPlatforms: ["shopify"],
    notes: "Evaluates pre-checkout signup and identity friction.",
  },
  onboarding_activation: {
    key: "onboarding_activation",
    label: "Onboarding and activation",
    primaryPlatforms: ["shopify", "stripe"],
    notes: "Evaluates first-value activation gaps after signup or trial start.",
  },
  pricing_handoff: {
    key: "pricing_handoff",
    label: "Pricing and upgrade handoff",
    primaryPlatforms: ["shopify", "stripe"],
    notes: "Evaluates leakage between pricing intent and checkout start.",
  },
  checkout: {
    key: "checkout",
    label: "Checkout",
    primaryPlatforms: ["shopify"],
    notes: "Evaluates checkout conversion and payment method execution.",
  },
  billing_recovery: {
    key: "billing_recovery",
    label: "Billing recovery",
    primaryPlatforms: ["stripe"],
    notes: "Evaluates retries, dunning lifecycle, and failed payment recovery.",
  },
}

export function getPrimaryScanFamilyForPlatform(platform: MerchantPlatform): ScanFamily {
  if (platform === "stripe") {
    return "billing_recovery"
  }

  return "checkout"
}

export function getRecommendedScanFamiliesForPlatform(platform: MerchantPlatform) {
  return Object.values(scanFamilyCatalog)
    .filter((family) => family.primaryPlatforms.includes(platform))
    .map((family) => family.key)
}
