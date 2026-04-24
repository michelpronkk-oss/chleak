import {
  getAllMockFixPlans,
  getFixPlanIdForIssue,
  getMockFixPlanById,
} from "@/data/mock/fix-plans"
import {
  formatIssueTypeLabel,
  formatLeakFamilyLabel,
  getLeakFamilyForIssueType,
} from "@/lib/revenue-flow-taxonomy"
import { getServerSession } from "@/lib/auth/session"
import { createSupabaseAdminClient } from "@/lib/supabase/shared"
import type { Database } from "@/types/database"
import type {
  FixPlan,
  FixPlanEvidence,
  FixPlanEvidenceScreenshot,
  FixPlanSignalStrength,
  FixPlanStep,
  IssueSeverity,
  IssueType,
} from "@/types/domain"

type IssueRow = Database["public"]["Tables"]["issues"]["Row"]
type StoreIntegrationRow = Pick<
  Database["public"]["Tables"]["store_integrations"]["Row"],
  "metadata" | "status" | "sync_status" | "connection_health" | "scopes" | "installed_at"
>

const GENERATED_FIX_PLAN_PREFIX = "generated-issue-"

interface FixPlanTemplate {
  recommendedFix: string
  steps: FixPlanStep[]
  platformContext: string[]
  successSignal: string
  expectedOutcome: string
}

function toGeneratedFixPlanId(issueId: string) {
  return `${GENERATED_FIX_PLAN_PREFIX}${issueId}`
}

function parseGeneratedFixPlanId(id: string) {
  if (!id.startsWith(GENERATED_FIX_PLAN_PREFIX)) {
    return null
  }

  const issueId = id.slice(GENERATED_FIX_PLAN_PREFIX.length).trim()
  return issueId.length > 0 ? issueId : null
}

function toIssueType(value: string): IssueType {
  const known: IssueType[] = [
    "checkout_friction",
    "payment_method_coverage",
    "failed_payment_recovery",
    "signup_form_abandonment",
    "signup_identity_verification_dropoff",
    "activation_funnel_dropout",
    "upgrade_handoff_friction",
    "pricing_page_to_checkout_dropoff",
    "setup_gap",
    "fraud_false_decline",
  ]
  return known.includes(value as IssueType) ? (value as IssueType) : "setup_gap"
}

function toSeverity(value: string): IssueSeverity {
  if (value === "critical" || value === "high" || value === "medium" || value === "low") {
    return value
  }

  return "medium"
}

function toFixPlanConfidence(severity: IssueSeverity): FixPlan["confidence"] {
  if (severity === "critical") {
    return "strong_signal"
  }

  if (severity === "high") {
    return "high"
  }

  if (severity === "medium") {
    return "medium"
  }

  return "emerging"
}

function asRecord(input: unknown): Record<string, unknown> | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return null
  }

  return input as Record<string, unknown>
}

function asString(input: unknown) {
  return typeof input === "string" ? input : null
}

function asNumber(input: unknown) {
  return typeof input === "number" && Number.isFinite(input) ? input : null
}

function asBoolean(input: unknown) {
  return typeof input === "boolean" ? input : null
}

function formatInteger(value: number) {
  return new Intl.NumberFormat("en-US").format(value)
}

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`
}

function formatTimestamp(value: string) {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(parsed)
}

function formatAmountFromCents(input: {
  amountCents: number
  primaryCurrency: string | null
  multipleCurrencies: boolean
}) {
  if (input.multipleCurrencies) {
    return `${formatInteger(input.amountCents)} cents (multi-currency)`
  }

  const currency = input.primaryCurrency ?? "USD"
  const amount = input.amountCents / 100
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

function toSignalStrength(confidence: FixPlan["confidence"]): FixPlanSignalStrength {
  if (confidence === "strong_signal" || confidence === "high") {
    return "strong"
  }

  if (confidence === "medium") {
    return "moderate"
  }

  return "early"
}

function readFindingEvidenceForIssueType(input: {
  issueType: IssueType
  metadata: Record<string, unknown> | null
}) {
  const findingEvidence = asRecord(input.metadata?.finding_evidence)
  if (!findingEvidence) {
    return null
  }

  const keysByIssueType: Record<IssueType, string[]> = {
    activation_funnel_dropout: [
      "shopify_activation_flow_dead_end_v1",
      "shopify_activation_funnel_dropout_v1",
      "url_source_saas_no_growth_funnel_v1",
      "url_source_saas_activation_optimization_v1",
    ],
    failed_payment_recovery: ["stripe_failed_payment_recovery_gap_v1"],
    setup_gap: [
      "shopify_webhook_registration_incomplete",
      "shopify_monitoring_coverage_incomplete",
      "simulated_webhook_coverage_gap",
      "simulated_signal_confidence_limited",
      "url_source_no_clear_revenue_path_v1",
      "url_source_service_no_contact_path_v1",
      "url_source_service_no_inquiry_path_v1",
      "url_source_service_weak_lead_capture_v1",
      "url_source_service_inquiry_path_optimization_v1",
      "url_source_no_mobile_viewport_v1",
      "url_source_mobile_layout_overflow_v1",
      "url_source_no_atf_cta_mobile_v1",
      "url_source_slow_page_load_v1",
    ],
    checkout_friction: [
      "url_source_ecommerce_no_checkout_v1",
      "url_source_ecommerce_checkout_optimization_v1",
    ],
    payment_method_coverage: [],
    signup_form_abandonment: [
      "url_source_saas_signup_path_missing_v1",
    ],
    signup_identity_verification_dropoff: [],
    upgrade_handoff_friction: [],
    pricing_page_to_checkout_dropoff: [
      "url_source_saas_pricing_no_conversion_v1",
    ],
    fraud_false_decline: [],
  }

  const preferredKeys = keysByIssueType[input.issueType]
  for (const key of preferredKeys) {
    const row = asRecord(findingEvidence[key])
    if (row) {
      return row
    }
  }

  const firstStructured = Object.values(findingEvidence).find((value) => asRecord(value))
  return firstStructured ? asRecord(firstStructured) : null
}

function buildUrlSourceScreenshots(input: {
  evidence: Record<string, unknown>
  issueDetectedAt: string
}): FixPlanEvidenceScreenshot[] {
  const capturedUrl =
    asString(input.evidence.browser_final_url) ??
    asString(input.evidence.final_url)
  const mobileRef = asString(input.evidence.browser_mobile_screenshot_ref)
  const desktopRef = asString(input.evidence.browser_desktop_screenshot_ref)
  const screenshots: FixPlanEvidenceScreenshot[] = []

  if (mobileRef) {
    screenshots.push({
      label: "Mobile evidence",
      src: mobileRef,
      viewport: "375px mobile",
      capturedUrl,
      capturedAt: input.issueDetectedAt,
      sha256: asString(input.evidence.browser_mobile_screenshot_sha256),
      bytes: asNumber(input.evidence.browser_mobile_screenshot_bytes),
    })
  }

  if (desktopRef) {
    screenshots.push({
      label: "Desktop evidence",
      src: desktopRef,
      viewport: "1280px desktop",
      capturedUrl,
      capturedAt: input.issueDetectedAt,
      sha256: asString(input.evidence.browser_desktop_screenshot_sha256),
      bytes: asNumber(input.evidence.browser_desktop_screenshot_bytes),
    })
  }

  return screenshots
}

function buildUrlSourceEvidenceRows(input: {
  evidence: Record<string, unknown>
  issue: IssueRow
}) {
  const rows: FixPlanEvidence["rows"] = []
  const businessType = asString(input.evidence.business_type)
  const revenueModel = asString(input.evidence.revenue_model)
  const pathEvaluated = asString(input.evidence.path_evaluated)
  const finalUrl = asString(input.evidence.final_url)
  const browserLoadTimeMs = asNumber(input.evidence.browser_load_time_ms)
  const browserTitle = asString(input.evidence.browser_page_title)
  const mobileAtfCta = asBoolean(input.evidence.browser_mobile_atf_cta)
  const mobileCtaLabels = asString(input.evidence.browser_mobile_atf_cta_labels)
  const mobileOverflow = asBoolean(input.evidence.browser_mobile_overflow)
  const primaryCta = asString(input.evidence.primary_cta_label)
  const hasContactOrBookingPath = asBoolean(input.evidence.has_contact_or_booking_path)
  const hasSignupPath = asBoolean(input.evidence.has_signup_path)
  const hasCheckoutSignal = asBoolean(input.evidence.has_checkout_signal)

  if (businessType) rows.push({ label: "Detected model", value: businessType.replaceAll("_", " ") })
  if (revenueModel) rows.push({ label: "Revenue model", value: revenueModel.replaceAll("_", " ") })
  if (pathEvaluated) rows.push({ label: "Path evaluated", value: pathEvaluated.replaceAll("_", " ") })
  if (finalUrl) rows.push({ label: "Captured URL", value: finalUrl })
  if (browserTitle) rows.push({ label: "Page title", value: browserTitle })
  if (primaryCta) rows.push({ label: "Primary action", value: primaryCta })
  if (hasContactOrBookingPath !== null) {
    rows.push({ label: "Contact or booking path", value: hasContactOrBookingPath ? "Detected" : "Not detected" })
  }
  if (hasSignupPath !== null) {
    rows.push({ label: "Signup path", value: hasSignupPath ? "Detected" : "Not detected" })
  }
  if (hasCheckoutSignal !== null) {
    rows.push({ label: "Checkout signal", value: hasCheckoutSignal ? "Detected" : "Not detected" })
  }
  if (mobileAtfCta !== null) {
    rows.push({ label: "Mobile above-fold CTA", value: mobileAtfCta ? "Detected" : "Not detected" })
  }
  if (mobileCtaLabels) rows.push({ label: "Mobile CTA labels", value: mobileCtaLabels })
  if (mobileOverflow !== null) {
    rows.push({ label: "Mobile layout overflow", value: mobileOverflow ? "Detected" : "Not detected" })
  }
  if (browserLoadTimeMs !== null) {
    rows.push({ label: "Browser load time", value: `${formatInteger(browserLoadTimeMs)}ms` })
  }
  rows.push({ label: "Scan timestamp", value: formatTimestamp(input.issue.detected_at) })

  const triggerLine =
    mobileAtfCta === false
      ? "Triggered because browser inspection found no primary action above the fold on mobile."
      : mobileOverflow === true
        ? "Triggered because browser inspection found mobile layout overflow that can hide or crowd conversion actions."
        : browserLoadTimeMs !== null
          ? `Triggered because browser inspection measured ${formatInteger(browserLoadTimeMs)}ms load time on the primary surface.`
          : `Triggered because URL-source analysis found a ${pathEvaluated?.replaceAll("_", " ") ?? "conversion"} path issue on the primary source.`
  const summaryLine =
    businessType === "agency" || businessType === "service_business"
      ? `Lead-generation surface issue detected: ${input.issue.title}.`
      : businessType === "saas"
        ? `SaaS conversion surface issue detected: ${input.issue.title}.`
        : businessType === "ecommerce"
          ? `Ecommerce conversion surface issue detected: ${input.issue.title}.`
          : `URL-source surface issue detected: ${input.issue.title}.`

  return {
    rows,
    screenshots: buildUrlSourceScreenshots({
      evidence: input.evidence,
      issueDetectedAt: input.issue.detected_at,
    }),
    triggerLine,
    summaryLine,
  }
}

function formatActivationDeadEndReason(reason: string) {
  if (reason === "entry_unreachable") {
    return "Entry surface was unreachable"
  }
  if (reason === "entry_blocked_gate") {
    return "Entry surface was blocked by an auth gate"
  }
  if (reason === "empty_state_without_next_action") {
    return "Entry surface was empty and had no next action"
  }
  if (reason === "missing_next_action") {
    return "Entry surface lacked a meaningful next action"
  }
  if (reason === "primary_action_not_executable") {
    return "Primary action could not be executed"
  }
  if (reason === "stalled_after_entry_action") {
    return "Flow stalled after executing the primary action"
  }

  return reason
}

function buildActivationEvidenceRows(input: {
  evidence: Record<string, unknown>
  issueDetectedAt: string
}) {
  const rows: FixPlanEvidence["rows"] = []
  const customers = asNumber(input.evidence.customers)
  const products = asNumber(input.evidence.products)
  const orders30d = asNumber(input.evidence.orders_30d)
  const totalOrders = asNumber(input.evidence.total_orders)
  const daysSinceInstall = asNumber(input.evidence.days_since_install)
  const detectorVersion = asString(input.evidence.detector_version)
  const flowEntryUrl = asString(input.evidence.flow_entry_url)
  const flowFinalUrl = asString(input.evidence.flow_final_url)
  const flowProgressionOutcome = asString(input.evidence.flow_progression_outcome)
  const flowDeadEndReason = asString(input.evidence.flow_dead_end_reason)
  const flowEntryClassification = asString(input.evidence.flow_entry_page_classification)
  const flowFinalClassification = asString(input.evidence.flow_final_page_classification)
  const flowEntryMeaningfulCtaCount = asNumber(
    input.evidence.flow_entry_meaningful_cta_count
  )
  const flowFinalMeaningfulCtaCount = asNumber(
    input.evidence.flow_final_meaningful_cta_count
  )
  const flowEntryNextActionCount = asNumber(
    input.evidence.flow_entry_next_action_count
  )
  const flowFinalNextActionCount = asNumber(
    input.evidence.flow_final_next_action_count
  )
  const flowPrimaryActionLabel = asString(input.evidence.flow_primary_action_label)
  const flowPrimaryActionKind = asString(input.evidence.flow_primary_action_kind)
  const flowPrimaryActionTarget = asString(input.evidence.flow_primary_action_target)
  const flowEntryEmptySignals = asString(input.evidence.flow_entry_empty_state_signals)
  const flowEntryBlockedSignals = asString(input.evidence.flow_entry_blocked_signals)
  const flowRunStartedAt = asString(input.evidence.flow_run_started_at)
  const flowRunCompletedAt = asString(input.evidence.flow_run_completed_at)
  const flowEntryScreenshotRef = asString(input.evidence.flow_entry_screenshot_ref)
  const flowProgressionScreenshotRef = asString(
    input.evidence.flow_progression_screenshot_ref
  )
  const flowEntryScreenshotSha = asString(input.evidence.flow_entry_screenshot_sha256)
  const flowProgressionScreenshotSha = asString(
    input.evidence.flow_progression_screenshot_sha256
  )
  const flowEntryScreenshotBytes = asNumber(input.evidence.flow_entry_screenshot_bytes)
  const flowProgressionScreenshotBytes = asNumber(
    input.evidence.flow_progression_screenshot_bytes
  )
  const flowHintsSource = asString(input.evidence.flow_hints_source)
  const flowHintPrimarySelector = asString(input.evidence.flow_hint_primary_selector)
  const flowHintPrimarySelectorMatched = asBoolean(
    input.evidence.flow_hint_primary_selector_matched
  )
  const flowHintNextActionSelector = asString(
    input.evidence.flow_hint_next_action_selector
  )
  const flowHintNextActionSelectorMatched = asBoolean(
    input.evidence.flow_hint_next_action_selector_matched
  )
  const flowHintFirstValueSelector = asString(
    input.evidence.flow_hint_first_value_selector
  )
  const flowHintFirstValueSelectorMatched = asBoolean(
    input.evidence.flow_hint_first_value_selector_matched
  )
  const flowHintAuthExpected = asBoolean(input.evidence.flow_hint_auth_expected)
  const flowHintPageIntent = asString(input.evidence.flow_hint_page_intent)
  const hasFlowEvidence =
    flowEntryUrl !== null ||
    flowProgressionOutcome !== null ||
    flowEntryClassification !== null ||
    flowDeadEndReason !== null

  if (hasFlowEvidence) {
    if (flowEntryUrl) {
      rows.push({ label: "Entry URL", value: flowEntryUrl })
    }
    if (flowFinalUrl) {
      rows.push({ label: "Final URL", value: flowFinalUrl })
    }
    if (flowEntryClassification) {
      rows.push({ label: "Entry page state", value: flowEntryClassification })
    }
    if (flowFinalClassification) {
      rows.push({ label: "Final page state", value: flowFinalClassification })
    }
    if (flowProgressionOutcome) {
      rows.push({ label: "Progression outcome", value: flowProgressionOutcome })
    }
    if (flowDeadEndReason) {
      rows.push({
        label: "Dead-end reason",
        value: formatActivationDeadEndReason(flowDeadEndReason),
      })
    }
    if (flowEntryMeaningfulCtaCount !== null) {
      rows.push({
        label: "Entry meaningful CTAs",
        value: formatInteger(flowEntryMeaningfulCtaCount),
      })
    }
    if (flowFinalMeaningfulCtaCount !== null) {
      rows.push({
        label: "Final meaningful CTAs",
        value: formatInteger(flowFinalMeaningfulCtaCount),
      })
    }
    if (flowEntryNextActionCount !== null) {
      rows.push({
        label: "Entry next-action count",
        value: formatInteger(flowEntryNextActionCount),
      })
    }
    if (flowFinalNextActionCount !== null) {
      rows.push({
        label: "Final next-action count",
        value: formatInteger(flowFinalNextActionCount),
      })
    }
    if (flowPrimaryActionLabel) {
      rows.push({ label: "Primary action", value: flowPrimaryActionLabel })
    }
    if (flowPrimaryActionKind) {
      rows.push({ label: "Primary action type", value: flowPrimaryActionKind })
    }
    if (flowPrimaryActionTarget) {
      rows.push({ label: "Primary action target", value: flowPrimaryActionTarget })
    }
    if (flowEntryEmptySignals) {
      rows.push({ label: "Entry empty-state signals", value: flowEntryEmptySignals })
    }
    if (flowEntryBlockedSignals) {
      rows.push({ label: "Entry blocked signals", value: flowEntryBlockedSignals })
    }
    if (flowRunStartedAt) {
      rows.push({
        label: "Flow run started",
        value: formatTimestamp(flowRunStartedAt),
      })
    }
    if (flowRunCompletedAt) {
      rows.push({
        label: "Flow run completed",
        value: formatTimestamp(flowRunCompletedAt),
      })
    }
    if (flowEntryScreenshotRef) {
      rows.push({
        label: "Entry screenshot ref",
        value: flowEntryScreenshotRef,
      })
    }
    if (flowEntryScreenshotSha) {
      rows.push({
        label: "Entry screenshot SHA-256",
        value: flowEntryScreenshotSha,
      })
    }
    if (flowEntryScreenshotBytes !== null) {
      rows.push({
        label: "Entry screenshot bytes",
        value: formatInteger(flowEntryScreenshotBytes),
      })
    }
    if (flowProgressionScreenshotRef) {
      rows.push({
        label: "Progression screenshot ref",
        value: flowProgressionScreenshotRef,
      })
    }
    if (flowProgressionScreenshotSha) {
      rows.push({
        label: "Progression screenshot SHA-256",
        value: flowProgressionScreenshotSha,
      })
    }
    if (flowProgressionScreenshotBytes !== null) {
      rows.push({
        label: "Progression screenshot bytes",
        value: formatInteger(flowProgressionScreenshotBytes),
      })
    }
    if (flowHintsSource) {
      rows.push({
        label: "Hint source",
        value: flowHintsSource,
      })
    }
    if (flowHintPrimarySelector) {
      rows.push({
        label: "Hint primary selector",
        value: flowHintPrimarySelector,
      })
      rows.push({
        label: "Hint primary selector matched",
        value:
          flowHintPrimarySelectorMatched === null
            ? "Unknown"
            : flowHintPrimarySelectorMatched
              ? "Yes"
              : "No",
      })
    }
    if (flowHintNextActionSelector) {
      rows.push({
        label: "Hint next-action selector",
        value: flowHintNextActionSelector,
      })
      rows.push({
        label: "Hint next-action selector matched",
        value:
          flowHintNextActionSelectorMatched === null
            ? "Unknown"
            : flowHintNextActionSelectorMatched
              ? "Yes"
              : "No",
      })
    }
    if (flowHintFirstValueSelector) {
      rows.push({
        label: "Hint first-value selector",
        value: flowHintFirstValueSelector,
      })
      rows.push({
        label: "Hint first-value selector matched",
        value:
          flowHintFirstValueSelectorMatched === null
            ? "Unknown"
            : flowHintFirstValueSelectorMatched
              ? "Yes"
              : "No",
      })
    }
    if (flowHintAuthExpected !== null) {
      rows.push({
        label: "Hint auth expected",
        value: flowHintAuthExpected ? "Yes" : "No",
      })
    }
    if (flowHintPageIntent) {
      rows.push({
        label: "Hint page intent",
        value: flowHintPageIntent,
      })
    }
    if (daysSinceInstall !== null) {
      rows.push({ label: "Days since install", value: formatInteger(daysSinceInstall) })
    }
    if (customers !== null) {
      rows.push({ label: "Customers", value: formatInteger(customers) })
    }
    if (products !== null) {
      rows.push({ label: "Products", value: formatInteger(products) })
    }
    if (orders30d !== null) {
      rows.push({ label: "Orders (last 30 days)", value: formatInteger(orders30d) })
    }
    if (totalOrders !== null) {
      rows.push({ label: "Lifetime orders", value: formatInteger(totalOrders) })
    }
    if (detectorVersion) {
      rows.push({ label: "Detector version", value: detectorVersion })
    }

    rows.push({
      label: "Scan timestamp",
      value: formatTimestamp(input.issueDetectedAt),
    })

    const triggerLine =
      flowDeadEndReason !== null
        ? `Triggered because the activation flow runner observed a dead-end after entry: ${formatActivationDeadEndReason(flowDeadEndReason)}.`
        : "Triggered because the activation flow runner detected stalled forward progression after entry."
    const summaryLine =
      flowProgressionOutcome !== null
        ? `Activation flow signal detected from real journey inspection with progression outcome "${flowProgressionOutcome}".`
        : "Activation flow signal detected from real journey inspection."

    return {
      rows,
      triggerLine,
      summaryLine,
    }
  }

  const activationRatePct = asNumber(input.evidence.activation_rate_pct_30d)
  const thresholdOrders30dMax = asNumber(input.evidence.threshold_orders_30d_max)
  const thresholdRateMax = asNumber(
    input.evidence.threshold_order_to_customer_rate_max
  )
  const thresholdCustomersMin = asNumber(input.evidence.threshold_customers_min)
  const thresholdProductsMin = asNumber(input.evidence.threshold_products_min)
  const thresholdTotalOrdersMin = asNumber(
    input.evidence.threshold_total_orders_min
  )

  if (daysSinceInstall !== null) {
    rows.push({ label: "Days since install", value: formatInteger(daysSinceInstall) })
  }
  if (customers !== null) {
    rows.push({ label: "Customers", value: formatInteger(customers) })
  }
  if (products !== null) {
    rows.push({ label: "Products", value: formatInteger(products) })
  }
  if (orders30d !== null) {
    rows.push({ label: "Orders (last 30 days)", value: formatInteger(orders30d) })
  }
  if (totalOrders !== null) {
    rows.push({ label: "Lifetime orders", value: formatInteger(totalOrders) })
  }
  if (activationRatePct !== null) {
    rows.push({
      label: "30-day customer-to-order rate",
      value: formatPercent(activationRatePct),
    })
  }

  if (
    thresholdOrders30dMax !== null &&
    thresholdRateMax !== null &&
    thresholdCustomersMin !== null &&
    thresholdProductsMin !== null &&
    thresholdTotalOrdersMin !== null
  ) {
    rows.push({
      label: "Threshold snapshot",
      value:
        `orders <= ${formatInteger(thresholdOrders30dMax)} | ` +
        `rate <= ${formatPercent(thresholdRateMax * 100)} | ` +
        `customers >= ${formatInteger(thresholdCustomersMin)} | ` +
        `products >= ${formatInteger(thresholdProductsMin)} | ` +
        `lifetime orders >= ${formatInteger(thresholdTotalOrdersMin)}`,
    })
  }

  if (detectorVersion) {
    rows.push({ label: "Detector version", value: detectorVersion })
  }

  rows.push({
    label: "Scan timestamp",
    value: formatTimestamp(input.issueDetectedAt),
  })

  const triggerLine =
    customers !== null &&
    products !== null &&
    orders30d !== null &&
    activationRatePct !== null &&
    daysSinceInstall !== null
      ? `Triggered because the source is ${formatInteger(daysSinceInstall)} days past install with ${formatInteger(customers)} customers and ${formatInteger(products)} products, but only ${formatInteger(orders30d)} recent orders (${formatPercent(activationRatePct)} customer-to-order rate).`
      : "Triggered because activation progression signals remained below first-value thresholds despite established source activity."

  const summaryLine =
    orders30d !== null && customers !== null
      ? `Activation dropout signal detected with ${formatInteger(orders30d)} recent orders across ${formatInteger(customers)} customers.`
      : "Activation dropout signal detected from onboarding-to-first-value progression mismatch."

  return {
    rows,
    triggerLine,
    summaryLine,
  }
}

function buildBillingRecoveryEvidenceRows(input: {
  evidence: Record<string, unknown>
  issueDetectedAt: string
}) {
  const rows: FixPlanEvidence["rows"] = []
  const failedInvoices = asNumber(input.evidence.failed_invoice_count)
  const paidInvoices = asNumber(input.evidence.paid_invoice_count)
  const failureRatePct = asNumber(input.evidence.invoice_failure_rate_pct)
  const paidToFailedRatio = asNumber(input.evidence.invoice_paid_to_failed_ratio)
  const pastDueCount = asNumber(input.evidence.past_due_subscription_count)
  const deletedCount = asNumber(input.evidence.deleted_subscription_count)
  const failedAmountCents = asNumber(input.evidence.failed_amount_cents)
  const recoveredAmountCents = asNumber(input.evidence.recovered_amount_cents)
  const detectorVersion = asString(input.evidence.detector_version)
  const lookbackDays = asNumber(input.evidence.lookback_days)
  const latestEventAt = asString(input.evidence.latest_event_at)
  const primaryCurrency = asString(input.evidence.primary_currency)
  const multipleCurrencies = asBoolean(input.evidence.multiple_currencies) ?? false

  if (failedInvoices !== null) {
    rows.push({ label: "Failed invoices", value: formatInteger(failedInvoices) })
  }
  if (paidInvoices !== null) {
    rows.push({ label: "Paid invoices", value: formatInteger(paidInvoices) })
  }
  if (failureRatePct !== null) {
    rows.push({ label: "Invoice failure rate", value: formatPercent(failureRatePct) })
  }
  if (paidToFailedRatio !== null) {
    rows.push({
      label: "Paid-to-failed ratio",
      value: paidToFailedRatio.toFixed(2),
    })
  }
  if (pastDueCount !== null) {
    rows.push({
      label: "Past-due subscriptions",
      value: formatInteger(pastDueCount),
    })
  }
  if (deletedCount !== null) {
    rows.push({
      label: "Deleted subscriptions",
      value: formatInteger(deletedCount),
    })
  }
  if (failedAmountCents !== null) {
    rows.push({
      label: "Failed amount",
      value: formatAmountFromCents({
        amountCents: failedAmountCents,
        primaryCurrency,
        multipleCurrencies,
      }),
    })
  }
  if (recoveredAmountCents !== null) {
    rows.push({
      label: "Recovered amount",
      value: formatAmountFromCents({
        amountCents: recoveredAmountCents,
        primaryCurrency,
        multipleCurrencies,
      }),
    })
  }
  if (latestEventAt) {
    rows.push({ label: "Latest event time", value: formatTimestamp(latestEventAt) })
  }
  if (lookbackDays !== null) {
    rows.push({
      label: "Lookback window",
      value: `${formatInteger(lookbackDays)} days`,
    })
  }
  if (detectorVersion) {
    rows.push({ label: "Detector version", value: detectorVersion })
  }

  rows.push({
    label: "Scan timestamp",
    value: formatTimestamp(input.issueDetectedAt),
  })

  const triggerLine =
    failedInvoices !== null && lookbackDays !== null
      ? `Triggered because billing recovery showed ${formatInteger(failedInvoices)} failed invoices within ${formatInteger(lookbackDays)} days, with recovery efficiency below target thresholds.`
      : "Triggered because billing failures and recovery signals crossed dunning and retry risk thresholds."

  const summaryLine =
    failedInvoices !== null && paidInvoices !== null
      ? `Billing recovery leakage detected from ${formatInteger(failedInvoices)} failed invoices versus ${formatInteger(paidInvoices)} paid invoices in the observed window.`
      : "Billing recovery leakage detected from failed payment and subscription recovery signals."

  return {
    rows,
    triggerLine,
    summaryLine,
  }
}

function buildGenericEvidenceRows(input: {
  issue: IssueRow
  integration: StoreIntegrationRow | null
  metadata: Record<string, unknown> | null
}) {
  const rows: FixPlanEvidence["rows"] = []
  const scanOutcome = asString(input.metadata?.scan_outcome)
  const scanOutcomeUpdatedAt = asString(input.metadata?.scan_outcome_updated_at)
  const meaningfulSignal = asBoolean(input.metadata?.meaningful_signal_detected)
  const scopes = input.integration?.scopes ?? null

  rows.push({ label: "Detection source", value: input.issue.source })

  if (input.integration?.status) {
    rows.push({ label: "Integration status", value: input.integration.status })
  }
  if (input.integration?.sync_status) {
    rows.push({ label: "Sync status", value: input.integration.sync_status })
  }
  if (input.integration?.connection_health) {
    rows.push({
      label: "Connection health",
      value: input.integration.connection_health,
    })
  }
  if (scanOutcome) {
    rows.push({ label: "Scan outcome", value: scanOutcome })
  }
  if (meaningfulSignal !== null) {
    rows.push({
      label: "Meaningful signal detected",
      value: meaningfulSignal ? "Yes" : "No",
    })
  }
  if (Array.isArray(scopes)) {
    rows.push({
      label: "Granted scopes",
      value: `${formatInteger(scopes.length)} scopes`,
    })
  }
  if (scanOutcomeUpdatedAt) {
    rows.push({
      label: "Outcome updated at",
      value: formatTimestamp(scanOutcomeUpdatedAt),
    })
  }

  rows.push({
    label: "Scan timestamp",
    value: formatTimestamp(input.issue.detected_at),
  })

  return {
    rows,
    triggerLine: "Triggered because the latest scan and integration health signals indicate a material leakage or coverage condition that requires operator action.",
    summaryLine: `${formatIssueTypeLabel(toIssueType(input.issue.type))} detected from the latest monitoring cycle.`,
  }
}

function buildFixPlanEvidence(input: {
  issue: IssueRow
  issueType: IssueType
  confidence: FixPlan["confidence"]
  successSignal: string
  integration: StoreIntegrationRow | null
}) {
  const metadata = asRecord(input.integration?.metadata)
  const findingEvidence = readFindingEvidenceForIssueType({
    issueType: input.issueType,
    metadata,
  })

  const leakFamilyLabel = formatLeakFamilyLabel(
    getLeakFamilyForIssueType(input.issueType)
  )
  const signalStrength = toSignalStrength(input.confidence)

  let evidenceRows: FixPlanEvidence["rows"] = []
  let screenshots: FixPlanEvidenceScreenshot[] = []
  let triggerLine = "Triggered because monitored leakage indicators crossed configured thresholds."
  let summaryLine = `${formatIssueTypeLabel(input.issueType)} detected in the ${leakFamilyLabel.toLowerCase()} family.`

  if (findingEvidence && input.issue.source === "url_source_analysis_v1") {
    const shaped = buildUrlSourceEvidenceRows({
      evidence: findingEvidence,
      issue: input.issue,
    })
    evidenceRows = shaped.rows
    screenshots = shaped.screenshots
    triggerLine = shaped.triggerLine
    summaryLine = shaped.summaryLine
  } else if (findingEvidence && input.issueType === "activation_funnel_dropout") {
    const shaped = buildActivationEvidenceRows({
      evidence: findingEvidence,
      issueDetectedAt: input.issue.detected_at,
    })
    evidenceRows = shaped.rows
    triggerLine = shaped.triggerLine
    summaryLine = shaped.summaryLine
  } else if (findingEvidence && input.issueType === "failed_payment_recovery") {
    const shaped = buildBillingRecoveryEvidenceRows({
      evidence: findingEvidence,
      issueDetectedAt: input.issue.detected_at,
    })
    evidenceRows = shaped.rows
    triggerLine = shaped.triggerLine
    summaryLine = shaped.summaryLine
  } else {
    const shaped = buildGenericEvidenceRows({
      issue: input.issue,
      integration: input.integration,
      metadata,
    })
    evidenceRows = shaped.rows
    triggerLine = shaped.triggerLine
    summaryLine = shaped.summaryLine
  }

  return {
    detectionSummary: summaryLine,
    whyTriggered: triggerLine,
    leakFamilyLabel,
    scanTimestamp: input.issue.detected_at,
    signalStrength,
    rows: evidenceRows,
    screenshots,
    recommendedNextAction: input.issue.recommended_action,
    successSignal: input.successSignal,
  } satisfies FixPlanEvidence
}

function toFixPlanStatus(status: string): FixPlan["status"] {
  if (status === "resolved" || status === "ignored") {
    return "resolved"
  }

  if (status === "monitoring") {
    return "in_progress"
  }

  return "open"
}

function formatSourceLabel(source: string) {
  if (source.startsWith("shopify_monitoring")) {
    return "Shopify monitoring pipeline"
  }

  if (source.startsWith("shopify_simulation")) {
    return "Shopify simulation pipeline"
  }

  if (source.startsWith("stripe_monitoring")) {
    return "Stripe billing monitoring pipeline"
  }

  if (source.startsWith("stripe_simulation")) {
    return "Stripe billing simulation pipeline"
  }

  return source
}

function getTemplateForIssue(issueType: IssueType): FixPlanTemplate {
  if (issueType === "activation_funnel_dropout") {
    return {
      recommendedFix:
        "Tighten the onboarding handoff to first value with explicit checkpoints and a guided first-purchase path.",
      steps: [
        {
          id: "activation_step_01",
          title: "Audit first-session dropoff checkpoints",
          detail:
            "Measure where new operators stall between entry, setup milestones, and first checkout completion.",
        },
        {
          id: "activation_step_02",
          title: "Ship guided first-value path",
          detail:
            "Add a clear next-action sequence that walks operators to first checkout completion in the same session.",
        },
        {
          id: "activation_step_03",
          title: "Launch activation rescue sequence",
          detail:
            "Trigger timed reminders for operators who stop before first value and route them back to the next unfinished step.",
        },
      ],
      platformContext: [
        "Onboarding journey checkpoints and entry-to-value milestones",
        "First-session UI action hierarchy and guided sequencing",
        "Lifecycle messaging for activation rescue",
      ],
      successSignal:
        "Share of newly activated operators reaching first checkout completion increases over the next two scan cycles.",
      expectedOutcome:
        "More operators progress from onboarding into revenue-generating checkout activity without stalling.",
    }
  }

  if (issueType === "failed_payment_recovery") {
    return {
      recommendedFix:
        "Strengthen failed-payment recovery with tighter retries, longer dunning coverage, and faster payment-method recovery prompts.",
      steps: [
        {
          id: "billing_recovery_step_01",
          title: "Audit failed invoice and retry outcomes",
          detail:
            "Break down failures by decline reason, retry attempt, and recovery stage to identify where recoverable invoices are dropping.",
        },
        {
          id: "billing_recovery_step_02",
          title: "Tune retry and dunning sequence",
          detail:
            "Adjust smart retry timing and extend reminder coverage through the highest historical recovery window.",
        },
        {
          id: "billing_recovery_step_03",
          title: "Improve payment method rescue path",
          detail:
            "Route past-due accounts to a direct payment method update flow and verify completion-to-payment conversion.",
        },
      ],
      platformContext: [
        "Stripe invoice and payment failure lifecycle",
        "Retry timing and dunning cadence configuration",
        "Customer payment method update recovery path",
      ],
      successSignal:
        "Failed invoice recovery rate improves and past-due to cancellation transitions decline over the next two scan cycles.",
      expectedOutcome:
        "More failed billing events are recovered before churn, reducing recurring revenue leakage.",
    }
  }

  return {
    recommendedFix:
      "Treat this issue as a prioritized leakage control, implement the recommended action, and validate movement on the next scan cycle.",
    steps: [
      {
        id: "generic_step_01",
        title: "Confirm issue scope and ownership",
        detail:
          "Identify the affected flow segment and assign a clear owner for implementation and validation.",
      },
      {
        id: "generic_step_02",
        title: "Implement corrective action",
        detail:
          "Ship the recommended fix with instrumentation to verify impact in production.",
      },
      {
        id: "generic_step_03",
        title: "Validate post-release movement",
        detail:
          "Compare leakage indicators before and after release to confirm sustained improvement.",
      },
    ],
    platformContext: [
      "Issue-level flow diagnostics and source telemetry",
      "Implementation ownership and release controls",
      "Post-release validation metrics",
    ],
    successSignal:
      "Issue severity or impact reduces across the next two completed scans.",
    expectedOutcome:
      "Leakage exposure declines for this flow stage with stable operational coverage.",
  }
}

function buildFixPlanFromIssue(input: {
  issue: IssueRow
  relatedIssues: Array<Pick<IssueRow, "id" | "title" | "estimated_monthly_revenue_impact">>
  integration: StoreIntegrationRow | null
}): FixPlan {
  const issueType = toIssueType(input.issue.type)
  const severity = toSeverity(input.issue.severity)
  const template = getTemplateForIssue(issueType)
  const confidence = toFixPlanConfidence(severity)
  const evidenceLine = `Detection evidence: ${input.issue.summary}`
  const evidence = buildFixPlanEvidence({
    issue: input.issue,
    issueType,
    confidence,
    successSignal: template.successSignal,
    integration: input.integration,
  })
  const isUrlSourceIssue = input.issue.source === "url_source_analysis_v1"
  const fixSteps = isUrlSourceIssue
    ? [
        {
          id: "url_source_step_01",
          title: "Confirm the affected conversion path",
          detail:
            evidence.whyTriggered,
        },
        {
          id: "url_source_step_02",
          title: "Ship the specific surface correction",
          detail:
            input.issue.recommended_action,
        },
        {
          id: "url_source_step_03",
          title: "Validate with a fresh surface scan",
          detail:
            "Re-run surface analysis and confirm the evidence rows and screenshots show the expected conversion action, layout, or performance improvement.",
        },
      ]
    : template.steps
  const successSignal = isUrlSourceIssue
    ? "Next URL-source scan shows the affected path resolved, with the primary conversion action visible and no repeat finding for this issue."
    : template.successSignal
  const finalEvidence = isUrlSourceIssue ? { ...evidence, successSignal } : evidence

  return {
    id: toGeneratedFixPlanId(input.issue.id),
    issueId: input.issue.id,
    title: input.issue.title,
    issueType,
    severity,
    confidence,
    estimatedMonthlyImpact: input.issue.estimated_monthly_revenue_impact,
    summary: input.issue.summary,
    whyItMatters: input.issue.why_it_matters,
    recommendedFix: isUrlSourceIssue ? input.issue.recommended_action : template.recommendedFix,
    steps: fixSteps,
    platformContext: [evidenceLine, ...template.platformContext],
    source: formatSourceLabel(input.issue.source),
    detectedAt: input.issue.detected_at,
    successSignal,
    expectedOutcome: isUrlSourceIssue
      ? "The primary source presents a clearer revenue path with stronger evidence for the next operator action."
      : template.expectedOutcome,
    status: toFixPlanStatus(input.issue.status),
    relatedIssues: input.relatedIssues.map((issue) => ({
      issueId: issue.id,
      title: issue.title,
      estimatedMonthlyRevenueImpact: issue.estimated_monthly_revenue_impact,
    })),
    evidence: finalEvidence,
  }
}

async function getGeneratedFixPlanByIssueId(input: {
  issueId: string
  organizationId: string
}) {
  const admin = createSupabaseAdminClient()
  const issueResult = await admin
    .from("issues")
    .select("*")
    .eq("id", input.issueId)
    .eq("organization_id", input.organizationId)
    .maybeSingle()

  if (issueResult.error || !issueResult.data) {
    return null
  }

  const integrationResult = await admin
    .from("store_integrations")
    .select("metadata, status, sync_status, connection_health, scopes, installed_at")
    .eq("organization_id", issueResult.data.organization_id)
    .eq("store_id", issueResult.data.store_id)
    .neq("status", "disconnected")
    .order("installed_at", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  const relatedIssuesResult = await admin
    .from("issues")
    .select("id, title, estimated_monthly_revenue_impact")
    .eq("organization_id", issueResult.data.organization_id)
    .eq("store_id", issueResult.data.store_id)
    .neq("id", issueResult.data.id)
    .neq("status", "resolved")
    .order("estimated_monthly_revenue_impact", { ascending: false })
    .limit(2)

  const relatedIssues =
    relatedIssuesResult.error || !relatedIssuesResult.data
      ? []
      : relatedIssuesResult.data
  const integration =
    integrationResult.error || !integrationResult.data
      ? null
      : integrationResult.data

  return buildFixPlanFromIssue({
    issue: issueResult.data,
    relatedIssues,
    integration,
  })
}

export async function getFixPlanById(id: string) {
  const directPlan = await getMockFixPlanById(id)
  if (directPlan) {
    return directPlan
  }

  const dataSource = process.env.CHECKOUTLEAK_DATA_SOURCE ?? "mock"
  const generatedIssueId = parseGeneratedFixPlanId(id)
  if (!generatedIssueId || dataSource !== "supabase") {
    return null
  }

  const session = await getServerSession()
  const organizationId = session?.membership?.organizationId
  if (!organizationId) {
    return null
  }

  return getGeneratedFixPlanByIssueId({
    issueId: generatedIssueId,
    organizationId,
  })
}

export function resolveFixPlanIdForIssue(issueId: string) {
  return getFixPlanIdForIssue(issueId)
}

export function getFixPlanHrefForIssue(issueId: string) {
  const fixPlanId = resolveFixPlanIdForIssue(issueId)
  if (!fixPlanId) {
    const dataSource = process.env.CHECKOUTLEAK_DATA_SOURCE ?? "mock"
    if (dataSource !== "supabase") {
      return null
    }

    return `/app/fix-plans/${toGeneratedFixPlanId(issueId)}`
  }

  return `/app/fix-plans/${fixPlanId}`
}

export function getFallbackFixPlanHref() {
  const firstPlan = getAllMockFixPlans()[0]
  return `/app/fix-plans/${firstPlan.id}`
}
