import type { FixPlan } from "@/types/domain"

const fixPlans: FixPlan[] = [
  {
    id: "fixplan_shipping_step_dropoff",
    issueId: "issue_1001",
    title: "Reduce drop-off at shipping method step",
    issueType: "checkout_friction",
    severity: "critical",
    confidence: "strong_signal",
    estimatedMonthlyImpact: 28700,
    summary:
      "Mobile shoppers exit heavily when shipping options load slowly and default selection is not aligned with buyer preference.",
    whyItMatters:
      "This step is currently the largest conversion break in checkout flow and is suppressing paid traffic return.",
    recommendedFix:
      "Prioritize fastest shipping option visibility and reduce first-render latency for shipping rates.",
    steps: [
      {
        id: "shipping_step_01",
        title: "Set preferred shipping method as default",
        detail:
          "Configure the most selected low-friction method as default for US mobile sessions.",
      },
      {
        id: "shipping_step_02",
        title: "Preload rates for top ZIP clusters",
        detail:
          "Use precomputed rate bundles for high-volume ZIP ranges to reduce delay at method render.",
      },
      {
        id: "shipping_step_03",
        title: "Validate checkout step timing after deploy",
        detail:
          "Confirm shipping method render time and completion rate improve for mobile within the next two scans.",
      },
    ],
    platformContext: [
      "Shopify admin: Checkout and Accounts",
      "Shipping and delivery profile configuration",
      "Checkout extensibility logic for shipping method ordering",
    ],
    source: "Shopify checkout events",
    detectedAt: "2026-04-17T07:30:00.000Z",
    successSignal:
      "Shipping step completion rate improves by at least 3 points and checkout completion lift is sustained over 7 days.",
    expectedOutcome:
      "Higher mobile checkout completion and immediate reduction in paid session revenue leakage.",
    status: "open",
    relatedIssues: [
      {
        issueId: "issue_1002",
        title: "Missing Apple Pay on high intent iOS traffic",
        estimatedMonthlyRevenueImpact: 12400,
      },
    ],
  },
  {
    id: "fixplan_wallet_coverage_ios",
    issueId: "issue_1002",
    title: "Close iOS wallet coverage gap",
    issueType: "payment_method_coverage",
    severity: "high",
    confidence: "high",
    estimatedMonthlyImpact: 12400,
    summary:
      "High-intent iOS sessions are forced into manual card input because Apple Pay is not available at checkout.",
    whyItMatters:
      "Wallet mismatch increases checkout friction for a large mobile segment with strong purchase intent.",
    recommendedFix:
      "Enable Apple Pay for primary storefront domain and validate gateway token routing for wallet payments.",
    steps: [
      {
        id: "wallet_step_01",
        title: "Confirm Apple Pay domain registration",
        detail:
          "Verify storefront domain and checkout domain are both registered for wallet support.",
      },
      {
        id: "wallet_step_02",
        title: "Validate payment gateway wallet settings",
        detail:
          "Ensure Apple Pay capability is enabled and tokenized transactions are accepted end to end.",
      },
      {
        id: "wallet_step_03",
        title: "Run iOS checkout verification",
        detail:
          "Test one-tap checkout path on Safari and monitor method share for iOS sessions in next scan window.",
      },
    ],
    platformContext: [
      "Shopify payments and checkout settings",
      "Payment gateway wallet capability configuration",
      "Domain verification for Apple Pay support",
    ],
    source: "Payment method diagnostics",
    detectedAt: "2026-04-17T07:25:00.000Z",
    successSignal:
      "Apple Pay appears for iOS checkout sessions and wallet method share increases with stable authorization rates.",
    expectedOutcome:
      "Faster mobile checkout path with improved conversion for high-intent iOS traffic.",
    status: "open",
    relatedIssues: [
      {
        issueId: "issue_1001",
        title: "High drop-off at shipping method step",
        estimatedMonthlyRevenueImpact: 28700,
      },
    ],
  },
  {
    id: "fixplan_billing_retry_recovery",
    issueId: "issue_1003",
    title: "Recover failed renewals with smart retry and dunning updates",
    issueType: "failed_payment_recovery",
    severity: "high",
    confidence: "high",
    estimatedMonthlyImpact: 17800,
    summary:
      "Renewal failures are not receiving structured retries and lifecycle reminders are ending too early.",
    whyItMatters:
      "Avoidable failed invoices are converting into churn due to missing retry and reminder coverage.",
    recommendedFix:
      "Activate smart retries and extend reminder lifecycle to cover the highest recovery window.",
    steps: [
      {
        id: "billing_step_01",
        title: "Enable smart retry schedule",
        detail:
          "Configure retries for soft declines across a seven-day window with issuer-aware intervals.",
      },
      {
        id: "billing_step_02",
        title: "Extend dunning sequence",
        detail:
          "Add reminders through day 7 with a clear payment method update call to action.",
      },
      {
        id: "billing_step_03",
        title: "Track renewal recovery by retry stage",
        detail:
          "Review recovered invoices by retry attempt and compare against previous baseline for two billing cycles.",
      },
    ],
    platformContext: [
      "Stripe Billing subscription retry settings",
      "Dunning email sequence and reminder cadence configuration",
      "Customer payment method update flow",
    ],
    source: "Stripe invoice and payment_intent analysis",
    detectedAt: "2026-04-17T04:30:00.000Z",
    successSignal:
      "Recovered renewal rate rises and past_due transitions decline without increasing involuntary churn.",
    expectedOutcome:
      "Higher retained MRR through improved recovery before cancellation.",
    status: "open",
    relatedIssues: [
      {
        issueId: "issue_1004",
        title: "Billing reminder sequence misses final urgency window",
        estimatedMonthlyRevenueImpact: 6300,
      },
    ],
  },
]

const fixPlanById = new Map(fixPlans.map((plan) => [plan.id, plan]))
const fixPlanIdByIssueId = new Map(fixPlans.map((plan) => [plan.issueId, plan.id]))

export async function getMockFixPlanById(id: string) {
  return fixPlanById.get(id) ?? null
}

export async function getMockFixPlanByIssueId(issueId: string) {
  const planId = fixPlanIdByIssueId.get(issueId)
  if (!planId) {
    return null
  }

  return getMockFixPlanById(planId)
}

export function getFixPlanIdForIssue(issueId: string) {
  return fixPlanIdByIssueId.get(issueId) ?? null
}

export function getAllMockFixPlans() {
  return fixPlans
}
