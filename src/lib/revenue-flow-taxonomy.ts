import type { Issue, IssueType } from "@/types/domain"

export type RevenueLeakFamily =
  | "signup"
  | "onboarding_activation"
  | "pricing_handoff"
  | "checkout"
  | "billing_recovery"
  | "platform_setup"
  | "risk_controls"

interface IssueTypeDefinition {
  type: IssueType
  label: string
  family: RevenueLeakFamily
}

const ISSUE_TYPE_DEFINITIONS: Record<IssueType, IssueTypeDefinition> = {
  checkout_friction: {
    type: "checkout_friction",
    label: "Checkout friction",
    family: "checkout",
  },
  payment_method_coverage: {
    type: "payment_method_coverage",
    label: "Payment method coverage",
    family: "checkout",
  },
  failed_payment_recovery: {
    type: "failed_payment_recovery",
    label: "Failed payment recovery",
    family: "billing_recovery",
  },
  signup_form_abandonment: {
    type: "signup_form_abandonment",
    label: "Signup form abandonment",
    family: "signup",
  },
  signup_identity_verification_dropoff: {
    type: "signup_identity_verification_dropoff",
    label: "Identity verification dropoff",
    family: "signup",
  },
  activation_funnel_dropout: {
    type: "activation_funnel_dropout",
    label: "Activation funnel dropout",
    family: "onboarding_activation",
  },
  upgrade_handoff_friction: {
    type: "upgrade_handoff_friction",
    label: "Upgrade handoff friction",
    family: "pricing_handoff",
  },
  pricing_page_to_checkout_dropoff: {
    type: "pricing_page_to_checkout_dropoff",
    label: "Pricing to checkout dropoff",
    family: "pricing_handoff",
  },
  setup_gap: {
    type: "setup_gap",
    label: "Setup gap",
    family: "platform_setup",
  },
  fraud_false_decline: {
    type: "fraud_false_decline",
    label: "Fraud false decline",
    family: "risk_controls",
  },
}

const LEAK_FAMILY_LABELS: Record<RevenueLeakFamily, string> = {
  signup: "Signup",
  onboarding_activation: "Onboarding and activation",
  pricing_handoff: "Pricing and upgrade handoff",
  checkout: "Checkout",
  billing_recovery: "Billing recovery",
  platform_setup: "Setup and instrumentation",
  risk_controls: "Risk controls",
}

export function getIssueTypeDefinition(type: IssueType) {
  return ISSUE_TYPE_DEFINITIONS[type]
}

export function formatIssueTypeLabel(type: IssueType) {
  return getIssueTypeDefinition(type).label
}

export function getLeakFamilyForIssueType(type: IssueType): RevenueLeakFamily {
  return getIssueTypeDefinition(type).family
}

export function formatLeakFamilyLabel(family: RevenueLeakFamily) {
  return LEAK_FAMILY_LABELS[family]
}

export function summarizeIssueImpactByLeakFamily(issues: Issue[]) {
  const impactByFamily = new Map<RevenueLeakFamily, number>()

  issues.forEach((issue) => {
    const family = getLeakFamilyForIssueType(issue.type)
    const existing = impactByFamily.get(family) ?? 0
    impactByFamily.set(family, existing + issue.estimatedMonthlyRevenueImpact)
  })

  return Array.from(impactByFamily.entries())
}
