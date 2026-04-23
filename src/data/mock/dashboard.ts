import { subHours } from "date-fns"

import {
  formatLeakFamilyLabel,
  summarizeIssueImpactByLeakFamily,
} from "@/lib/revenue-flow-taxonomy"
import type {
  DashboardSnapshot,
  Issue,
  Organization,
  RevenueOpportunity,
  Scan,
  Store,
  SuggestedAction,
} from "@/types/domain"

const now = new Date("2026-04-17T09:30:00.000Z")

const organization: Organization = {
  id: "org_luma-health",
  name: "Luma Health Co.",
  slug: "luma-health-co",
  createdAt: "2025-11-09T13:00:00.000Z",
}

const stores: Store[] = [
  {
    id: "store_shopify_us",
    organizationId: organization.id,
    name: "Luma Shopify US",
    platform: "shopify",
    domain: "shop.lumahealth.com",
    timezone: "America/New_York",
    currency: "USD",
    active: true,
    createdAt: "2025-11-10T08:00:00.000Z",
  },
  {
    id: "store_stripe_subscriptions",
    organizationId: organization.id,
    name: "Luma Subscription Billing",
    platform: "stripe",
    domain: null,
    timezone: "America/New_York",
    currency: "USD",
    active: true,
    createdAt: "2025-12-02T08:00:00.000Z",
  },
]

const scans: Scan[] = [
  {
    id: "scan_7082",
    organizationId: organization.id,
    storeId: stores[0].id,
    status: "completed",
    scannedAt: subHours(now, 2).toISOString(),
    completedAt: subHours(now, 2).toISOString(),
    detectedIssuesCount: 4,
    estimatedMonthlyLeakage: 38200,
  },
  {
    id: "scan_7083",
    organizationId: organization.id,
    storeId: stores[1].id,
    status: "completed",
    scannedAt: subHours(now, 5).toISOString(),
    completedAt: subHours(now, 5).toISOString(),
    detectedIssuesCount: 3,
    estimatedMonthlyLeakage: 24100,
  },
  {
    id: "scan_7084",
    organizationId: organization.id,
    storeId: stores[0].id,
    status: "running",
    scannedAt: subHours(now, 0.5).toISOString(),
    completedAt: null,
    detectedIssuesCount: 0,
    estimatedMonthlyLeakage: 0,
  },
]

const issues: Issue[] = [
  {
    id: "issue_1001",
    organizationId: organization.id,
    storeId: stores[0].id,
    scanId: scans[0].id,
    title: "High drop-off at shipping method step",
    summary:
      "Mobile buyers exit at 2.4x normal rate after shipping options render.",
    type: "checkout_friction",
    severity: "critical",
    status: "open",
    estimatedMonthlyRevenueImpact: 28700,
    recommendedAction:
      "Move fastest shipping option to default and preload rates for known ZIP clusters.",
    source: "Shopify checkout events",
    detectedAt: subHours(now, 2).toISOString(),
    whyItMatters:
      "A 6.2 point conversion gap in this step is suppressing paid traffic profitability.",
  },
  {
    id: "issue_1002",
    organizationId: organization.id,
    storeId: stores[0].id,
    scanId: scans[0].id,
    title: "Missing Apple Pay on high intent iOS traffic",
    summary:
      "22% of sessions are iOS Safari but one-touch wallet is unavailable at checkout.",
    type: "payment_method_coverage",
    severity: "high",
    status: "open",
    estimatedMonthlyRevenueImpact: 12400,
    recommendedAction:
      "Enable wallet capability on primary domain and validate gateway token mapping.",
    source: "Payment method diagnostics",
    detectedAt: subHours(now, 2).toISOString(),
    whyItMatters:
      "Shoppers with stored wallet credentials convert significantly faster on mobile.",
  },
  {
    id: "issue_1003",
    organizationId: organization.id,
    storeId: stores[1].id,
    scanId: scans[1].id,
    title: "Card updater retries not configured for subscription renewals",
    summary:
      "Failed renewals are not retried after soft declines, causing preventable churn.",
    type: "failed_payment_recovery",
    severity: "high",
    status: "open",
    estimatedMonthlyRevenueImpact: 17800,
    recommendedAction:
      "Configure smart retry schedule and card updater fallback flow in Stripe settings.",
    source: "Stripe invoice and payment_intent analysis",
    detectedAt: subHours(now, 5).toISOString(),
    whyItMatters:
      "Recovered invoices represent retained MRR without additional acquisition spend.",
  },
  {
    id: "issue_1004",
    organizationId: organization.id,
    storeId: stores[1].id,
    scanId: scans[1].id,
    title: "Billing reminder sequence misses final urgency window",
    summary:
      "Dunning sequence stops at day 5 while payment failures trend toward day 7 recovery.",
    type: "setup_gap",
    severity: "medium",
    status: "monitoring",
    estimatedMonthlyRevenueImpact: 6300,
    recommendedAction:
      "Extend reminder cadence to day 7 and add final payment method update CTA.",
    source: "Recovery lifecycle review",
    detectedAt: subHours(now, 5).toISOString(),
    whyItMatters:
      "Lifecycle timing is leaving recoverable invoices untouched before cancellation.",
  },
  {
    id: "issue_1005",
    organizationId: organization.id,
    storeId: stores[0].id,
    scanId: scans[0].id,
    title: "Trial signups fail to reach first purchase milestone",
    summary:
      "A high share of new trial operators complete account creation but do not reach first checkout completion within the expected window.",
    type: "activation_funnel_dropout",
    severity: "medium",
    status: "open",
    estimatedMonthlyRevenueImpact: 9400,
    recommendedAction:
      "Tighten first-session onboarding handoff to checkout with a guided path and activation reminder sequence.",
    source: "Activation flow diagnostics",
    detectedAt: subHours(now, 1.5).toISOString(),
    whyItMatters:
      "Activation leakage suppresses downstream checkout volume and delays time-to-value for newly acquired operators.",
  },
]

const suggestedActions: SuggestedAction[] = [
  {
    id: "action_01",
    title: "Reorder shipping options for mobile checkout",
    description:
      "Treat this as the fastest high-impact fix for conversion throughput this week.",
    issueIds: ["issue_1001"],
    fixPlanId: "fixplan_shipping_step_dropoff",
    estimatedMonthlyRevenueImpact: 28700,
    urgency: "do_now",
  },
  {
    id: "action_02",
    title: "Enable Apple Pay and verify wallet token domain",
    description:
      "Close the one-tap gap on iOS sessions currently forced into manual card entry.",
    issueIds: ["issue_1002"],
    fixPlanId: "fixplan_wallet_coverage_ios",
    estimatedMonthlyRevenueImpact: 12400,
    urgency: "this_week",
  },
  {
    id: "action_03",
    title: "Deploy retry and reminder recovery sequence",
    description:
      "Recover failed renewals with extended retries and final reminder messaging.",
    issueIds: ["issue_1003", "issue_1004"],
    fixPlanId: "fixplan_billing_retry_recovery",
    estimatedMonthlyRevenueImpact: 24100,
    urgency: "this_week",
  },
  {
    id: "action_04",
    title: "Tighten first-session activation handoff",
    description:
      "Guide newly signed-up operators to first checkout completion with a shorter activation sequence.",
    issueIds: ["issue_1005"],
    fixPlanId: "fixplan_activation_first_value_gap",
    estimatedMonthlyRevenueImpact: 9400,
    urgency: "watch",
  },
]

export async function getMockDashboardSnapshot(): Promise<DashboardSnapshot> {
  const activeIssues = issues.filter((issue) => issue.status !== "resolved")
  const highestImpactIssue = [...activeIssues].sort(
    (a, b) => b.estimatedMonthlyRevenueImpact - a.estimatedMonthlyRevenueImpact
  )[0] ?? issues[0]

  const estimatedMonthlyLeakage = activeIssues.reduce(
    (total, issue) => total + issue.estimatedMonthlyRevenueImpact,
    0
  )

  const revenueOpportunities: RevenueOpportunity[] = summarizeIssueImpactByLeakFamily(
    activeIssues
  )
    .map(([family, impact]) => {
      const confidence: RevenueOpportunity["confidence"] =
        impact > 20000 ? "high" : "medium"
      return {
        label: formatLeakFamilyLabel(family),
        estimatedMonthlyRevenueImpact: impact,
        confidence,
      }
    })
    .sort((a, b) => b.estimatedMonthlyRevenueImpact - a.estimatedMonthlyRevenueImpact)

  return {
    organization,
    stores,
    scans,
    issues,
    summary: {
      estimatedMonthlyLeakage,
      activeIssues: activeIssues.length,
      highestImpactIssue,
      monitoredStores: stores.length,
    },
    revenueOpportunities,
    suggestedActions,
  }
}
