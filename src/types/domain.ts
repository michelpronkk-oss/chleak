export type MerchantPlatform = "shopify" | "stripe"
export type ConnectedSystemProvider =
  | MerchantPlatform
  | "checkoutleak_connector"
  | "unknown"

export type IssueType =
  | "checkout_friction"
  | "payment_method_coverage"
  | "failed_payment_recovery"
  | "signup_form_abandonment"
  | "signup_identity_verification_dropoff"
  | "activation_funnel_dropout"
  | "upgrade_handoff_friction"
  | "pricing_page_to_checkout_dropoff"
  | "setup_gap"
  | "fraud_false_decline"

export type IssueSeverity = "critical" | "high" | "medium" | "low"

export type IssueStatus = "open" | "monitoring" | "resolved" | "ignored"

export type ScanStatus = "queued" | "running" | "completed" | "failed"

export type BillingPlan = "starter" | "growth" | "pro"

export type SubscriptionStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "incomplete"

export interface Organization {
  id: string
  name: string
  slug: string
  createdAt: string
}

export interface OrgMember {
  id: string
  organizationId: string
  userId: string
  role: "owner" | "admin" | "analyst" | "viewer"
  createdAt: string
}

export interface Store {
  id: string
  organizationId: string
  name: string
  platform: MerchantPlatform
  domain: string | null
  timezone: string
  currency: string
  active: boolean
  createdAt: string
}

// URL-first foundation: source entity identity is the live revenue surface.
export interface LiveSourceSurface {
  primaryUrl: string | null
  domain: string | null
  sourceEntityType:
    | "website_domain"
    | "billing_account"
    | "marketplace_storefront"
    | "unknown"
  identifier: string | null
}

export interface ConnectedSystem {
  provider: ConnectedSystemProvider
  status: "connected" | "degraded" | "disconnected" | "unknown"
}

export interface StoreIntegration {
  id: string
  organizationId: string
  storeId: string
  provider: ConnectedSystemProvider
  status: "connected" | "degraded" | "disconnected"
  accountIdentifier: string | null
  shopDomain: string | null
  installedAt: string | null
  syncStatus: "pending" | "syncing" | "synced" | "errored" | null
  connectionHealth: "healthy" | "degraded" | "unknown" | null
  lastSyncedAt: string | null
  metadata: Record<string, unknown>
  createdAt: string
}

export interface Scan {
  id: string
  organizationId: string
  storeId: string
  status: ScanStatus
  scannedAt: string
  completedAt: string | null
  detectedIssuesCount: number
  estimatedMonthlyLeakage: number
}

export interface Issue {
  id: string
  organizationId: string
  storeId: string
  scanId: string
  title: string
  summary: string
  type: IssueType
  severity: IssueSeverity
  status: IssueStatus
  estimatedMonthlyRevenueImpact: number
  recommendedAction: string
  source: string
  detectedAt: string
  whyItMatters: string
}

export interface IssueEvent {
  id: string
  issueId: string
  eventType: "detected" | "status_changed" | "impact_updated" | "resolved"
  eventSummary: string
  createdAt: string
}

export interface Report {
  id: string
  organizationId: string
  storeId: string
  periodStart: string
  periodEnd: string
  estimatedRecoveredRevenue: number
  estimatedLeakage: number
  issueCount: number
  generatedAt: string
}

export interface Subscription {
  id: string
  organizationId: string
  plan: BillingPlan
  status: SubscriptionStatus
  seats: number
  currentPeriodStart: string
  currentPeriodEnd: string
  dodoCustomerId: string | null
  dodoSubscriptionId: string | null
  createdAt: string
}

export interface RevenueOpportunity {
  label: string
  estimatedMonthlyRevenueImpact: number
  confidence: "high" | "medium" | "low"
}

export interface SuggestedAction {
  id: string
  title: string
  description: string
  issueIds: string[]
  fixPlanId?: string
  estimatedMonthlyRevenueImpact: number
  urgency: "do_now" | "this_week" | "watch"
}

export type FixPlanConfidence = "strong_signal" | "high" | "medium" | "emerging"

export type FixPlanStatus = "open" | "in_progress" | "resolved"

export type FixPlanSignalStrength = "strong" | "moderate" | "early"

export interface FixPlanStep {
  id: string
  title: string
  detail: string
}

export interface FixPlanRelatedIssue {
  issueId: string
  title: string
  estimatedMonthlyRevenueImpact: number
}

export interface FixPlanEvidenceRow {
  label: string
  value: string
}

export interface FixPlanEvidence {
  detectionSummary: string
  whyTriggered: string
  leakFamilyLabel: string
  scanTimestamp: string | null
  signalStrength: FixPlanSignalStrength | null
  rows: FixPlanEvidenceRow[]
  recommendedNextAction: string
  successSignal: string | null
}

export interface FixPlan {
  id: string
  issueId: string
  title: string
  issueType: IssueType
  severity: IssueSeverity
  confidence: FixPlanConfidence
  estimatedMonthlyImpact: number
  summary: string
  whyItMatters: string
  recommendedFix: string
  steps: FixPlanStep[]
  platformContext: string[]
  source: string
  detectedAt: string
  successSignal: string
  expectedOutcome: string
  status: FixPlanStatus
  relatedIssues: FixPlanRelatedIssue[]
  evidence?: FixPlanEvidence | null
}

export interface DashboardSummary {
  estimatedMonthlyLeakage: number
  activeIssues: number
  highestImpactIssue: Issue
  monitoredStores: number
}

export interface DashboardSnapshot {
  organization: Organization
  stores: Store[]
  scans: Scan[]
  issues: Issue[]
  summary: DashboardSummary
  revenueOpportunities: RevenueOpportunity[]
  suggestedActions: SuggestedAction[]
}

export interface PricingPlan {
  id: BillingPlan
  name: string
  monthlyPrice: number
  summary: string
  highlight: string
  features: string[]
  callToAction: string
  recommended?: boolean
}
