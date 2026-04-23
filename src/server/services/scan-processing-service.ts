import { createSupabaseAdminClient } from "@/lib/supabase/shared"
import type { IssueType, MerchantPlatform } from "@/types/domain"
import type { Database, Json } from "@/types/database"
import {
  getPrimaryScanFamilyForPlatform,
  getRecommendedScanFamiliesForPlatform,
} from "@/server/services/flow-scan-family-service"

type IssueInsert = Database["public"]["Tables"]["issues"]["Insert"]

export type ScanProcessResult = {
  processed: boolean
  reason: string
  scanId: string | null
  outcome?: "no_signal" | "clean" | "issues_found" | null
  organizationId?: string | null
  storeId?: string | null
  storePlatform?: string | null
  integrationProvider?: string | null
  status?: string | null
  completedAt?: string | null
  detectedIssuesCount?: number | null
  estimatedMonthlyLeakage?: number | null
  scanFamily?: string | null
}

export type ScanSimulationOutcome = "no_signal" | "clean" | "findings_present"

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

interface ShopifySignalSnapshot {
  orders30d: number | null
  totalOrders: number | null
  products: number | null
  customers: number | null
}

interface StripeBillingSignalSnapshot {
  lookbackDays: number
  totalEvents: number
  observedInvoiceEvents: number
  failedInvoiceCount: number
  failedPaymentIntentCount: number
  paidInvoiceCount: number
  pastDueSubscriptionCount: number
  deletedSubscriptionCount: number
  failedAmountCents: number
  recoveredAmountCents: number
  invoiceFailureRate: number | null
  invoicePaidToFailedRatio: number | null
  primaryCurrency: string | null
  multipleCurrencies: boolean
  latestReceivedAt: string | null
}

const SHOPIFY_REQUIRED_SCOPES = ["read_orders", "read_checkouts"] as const
const ACTIVATION_MIN_INSTALL_AGE_DAYS = 10
const ACTIVATION_HIGH_SEVERITY_INSTALL_AGE_DAYS = 14
const ACTIVATION_MIN_CUSTOMERS = 80
const ACTIVATION_MIN_PRODUCTS = 5
const ACTIVATION_MIN_TOTAL_ORDERS = 20
const ACTIVATION_MAX_ORDERS_30D = 3
const ACTIVATION_MAX_ORDER_TO_CUSTOMER_RATE = 0.03
const ACTIVATION_HIGH_SEVERITY_CUSTOMERS = 220
const STRIPE_BILLING_LOOKBACK_DAYS = 30
const STRIPE_MIN_FAILED_SIGNAL_EVENTS = 6
const STRIPE_MIN_FAILED_AMOUNT_CENTS = 150_000
const STRIPE_MIN_OBSERVED_INVOICE_EVENTS = 18
const STRIPE_MIN_FAILURE_RATE = 0.2
const STRIPE_HIGH_FAILURE_RATE = 0.3
const STRIPE_MIN_WEAK_RECOVERY_RATIO = 1.4
const STRIPE_CHURN_ALERT_DELETED_MIN = 2
const STRIPE_CHURN_ALERT_PAST_DUE_MIN = 6
const STRIPE_HIGH_SEVERITY_FAILED_INVOICES = 12

interface FindingDraft {
  key: string
  type: IssueType
  severity: "critical" | "high" | "medium" | "low"
  title: string
  summary: string
  whyItMatters: string
  recommendedAction: string
  estimatedMonthlyRevenueImpact: number
  evidence?: Record<string, string | number | boolean | null>
}

function parseMerchantPlatform(input: string): MerchantPlatform {
  return input === "stripe" ? "stripe" : "shopify"
}

function readShopifySignalSnapshot(metadata: Record<string, unknown>): ShopifySignalSnapshot {
  const raw = asRecord(metadata.signal_snapshot)
  return {
    orders30d: asNumber(raw?.orders_30d),
    totalOrders: asNumber(raw?.total_orders),
    products: asNumber(raw?.products),
    customers: asNumber(raw?.customers),
  }
}

function hasMeaningfulCommercialSignal(snapshot: ShopifySignalSnapshot) {
  return (snapshot.orders30d ?? 0) >= 5 || (snapshot.totalOrders ?? 0) >= 25
}

function hasWebhookFailure(metadata: Record<string, unknown>, integrationStatus: string, syncStatus: string | null) {
  const lastError = asString(metadata.last_error)?.toLowerCase() ?? ""
  return (
    integrationStatus === "degraded" ||
    syncStatus === "errored" ||
    asBoolean(metadata.webhook_registration_failed) === true ||
    lastError.includes("webhook registration failed")
  )
}

function getMissingScopes(scopes: string[] | null, requiredScopes: readonly string[]) {
  const granted = new Set((scopes ?? []).map((scope) => scope.trim().toLowerCase()))
  return requiredScopes.filter((scope) => !granted.has(scope))
}

function getDaysSinceTimestamp(isoTimestamp: string | null) {
  if (!isoTimestamp) {
    return null
  }

  const parsed = new Date(isoTimestamp)
  if (Number.isNaN(parsed.getTime())) {
    return null
  }

  return Math.floor((Date.now() - parsed.getTime()) / (24 * 60 * 60 * 1000))
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function estimateActivationImpact(input: { customers: number; orders30d: number }) {
  const expectedActivatedOrders = Math.max(4, Math.floor(input.customers * 0.05))
  const missingOrders = Math.max(expectedActivatedOrders - input.orders30d, 0)
  const rawImpact = missingOrders * 42
  const bounded = clamp(rawImpact, 1500, 18000)
  return Math.round(bounded / 100) * 100
}

function toRoundedRate(value: number) {
  return Number(value.toFixed(4))
}

function toRoundedPercent(value: number) {
  return Number((value * 100).toFixed(1))
}

function readStripeEventObject(payload: unknown) {
  const payloadRecord = asRecord(payload)
  const dataRecord = asRecord(payloadRecord?.data)
  return asRecord(dataRecord?.object)
}

function isStripePastDueStatus(status: string | null) {
  return (
    status === "past_due" ||
    status === "unpaid" ||
    status === "incomplete_expired"
  )
}

async function loadStripeBillingSignalSnapshot(input: {
  admin: ReturnType<typeof createSupabaseAdminClient>
  accountIdentifier: string
  lookbackDays: number
}) {
  const since = new Date(Date.now() - input.lookbackDays * 24 * 60 * 60 * 1000).toISOString()
  const eventsResult = await input.admin
    .from("integration_webhook_events")
    .select("id, topic, payload, received_at")
    .eq("provider", "stripe")
    .eq("source_domain", input.accountIdentifier)
    .gte("received_at", since)
    .order("received_at", { ascending: false })
    .limit(500)

  if (eventsResult.error) {
    throw new Error(eventsResult.error.message)
  }

  let failedInvoiceCount = 0
  let failedPaymentIntentCount = 0
  let paidInvoiceCount = 0
  let pastDueSubscriptionCount = 0
  let deletedSubscriptionCount = 0
  let failedAmountCents = 0
  let recoveredAmountCents = 0
  const seenEventIds = new Set<string>()
  const currencies = new Set<string>()

  for (const row of eventsResult.data ?? []) {
    const payloadRecord = asRecord(row.payload)
    const eventId = asString(payloadRecord?.id) ?? row.id
    if (seenEventIds.has(eventId)) {
      continue
    }
    seenEventIds.add(eventId)

    const eventObject = readStripeEventObject(row.payload)
    const currency = asString(eventObject?.currency)?.toUpperCase() ?? null
    if (currency) {
      currencies.add(currency)
    }

    if (row.topic === "invoice.payment_failed") {
      failedInvoiceCount += 1
      const amountDue =
        asNumber(eventObject?.amount_due) ??
        asNumber(eventObject?.amount_remaining) ??
        0
      failedAmountCents += Math.max(amountDue, 0)
      continue
    }

    if (row.topic === "payment_intent.payment_failed") {
      failedPaymentIntentCount += 1
      continue
    }

    if (row.topic === "invoice.paid") {
      paidInvoiceCount += 1
      const amountPaid = asNumber(eventObject?.amount_paid) ?? 0
      recoveredAmountCents += Math.max(amountPaid, 0)
      continue
    }

    if (row.topic === "customer.subscription.updated") {
      const status = asString(eventObject?.status)
      if (isStripePastDueStatus(status)) {
        pastDueSubscriptionCount += 1
      }
      continue
    }

    if (row.topic === "customer.subscription.deleted") {
      deletedSubscriptionCount += 1
    }
  }

  const observedInvoiceEvents = failedInvoiceCount + paidInvoiceCount
  const invoiceFailureRate =
    observedInvoiceEvents > 0 ? failedInvoiceCount / observedInvoiceEvents : null
  const invoicePaidToFailedRatio =
    failedInvoiceCount > 0 ? paidInvoiceCount / failedInvoiceCount : null
  const multipleCurrencies = currencies.size > 1
  const primaryCurrency = multipleCurrencies
    ? null
    : (Array.from(currencies)[0] ?? null)

  return {
    lookbackDays: input.lookbackDays,
    totalEvents: seenEventIds.size,
    observedInvoiceEvents,
    failedInvoiceCount,
    failedPaymentIntentCount,
    paidInvoiceCount,
    pastDueSubscriptionCount,
    deletedSubscriptionCount,
    failedAmountCents,
    recoveredAmountCents,
    invoiceFailureRate,
    invoicePaidToFailedRatio,
    primaryCurrency,
    multipleCurrencies,
    latestReceivedAt: eventsResult.data?.[0]?.received_at ?? null,
  } satisfies StripeBillingSignalSnapshot
}

function hasMeaningfulStripeBillingSignal(snapshot: StripeBillingSignalSnapshot | null) {
  if (!snapshot) {
    return false
  }

  return (
    snapshot.totalEvents >= 12 ||
    snapshot.observedInvoiceEvents >= 8 ||
    snapshot.failedPaymentIntentCount >= 5
  )
}

function estimateStripeBillingRecoveryImpact(snapshot: StripeBillingSignalSnapshot) {
  const failedSignals = snapshot.failedInvoiceCount + snapshot.failedPaymentIntentCount
  const failedAmountBased =
    !snapshot.multipleCurrencies && snapshot.failedAmountCents > 0
      ? snapshot.failedAmountCents / 100
      : null
  const baseImpact =
    failedAmountBased !== null ? failedAmountBased * 0.28 : failedSignals * 120
  const churnMultiplier = snapshot.deletedSubscriptionCount >= 2 ? 1.2 : 1
  const recoveryMultiplier =
    snapshot.invoicePaidToFailedRatio !== null &&
    snapshot.invoicePaidToFailedRatio < 1
      ? 1.15
      : 1
  const adjusted = baseImpact * churnMultiplier * recoveryMultiplier
  return Math.round(clamp(adjusted, 1800, 65000) / 100) * 100
}

function buildStripeBillingRecoveryFindings(input: {
  snapshot: StripeBillingSignalSnapshot | null
  integrationStatus: string
  syncStatus: string | null
}) {
  if (!input.snapshot) {
    return []
  }

  if (input.integrationStatus === "degraded" || input.syncStatus === "errored") {
    return []
  }

  const failedSignals =
    input.snapshot.failedInvoiceCount + input.snapshot.failedPaymentIntentCount
  const hasFailureVolume =
    failedSignals >= STRIPE_MIN_FAILED_SIGNAL_EVENTS ||
    input.snapshot.failedAmountCents >= STRIPE_MIN_FAILED_AMOUNT_CENTS
  const hasElevatedFailureRate =
    input.snapshot.invoiceFailureRate !== null &&
    input.snapshot.observedInvoiceEvents >= STRIPE_MIN_OBSERVED_INVOICE_EVENTS &&
    input.snapshot.invoiceFailureRate >= STRIPE_MIN_FAILURE_RATE
  const hasWeakRecoveryCoverage =
    input.snapshot.failedInvoiceCount >= 5 &&
    input.snapshot.invoicePaidToFailedRatio !== null &&
    input.snapshot.invoicePaidToFailedRatio < STRIPE_MIN_WEAK_RECOVERY_RATIO
  const hasChurnPressure =
    input.snapshot.deletedSubscriptionCount >= STRIPE_CHURN_ALERT_DELETED_MIN ||
    input.snapshot.pastDueSubscriptionCount >= STRIPE_CHURN_ALERT_PAST_DUE_MIN

  if (!hasFailureVolume || !(hasElevatedFailureRate || hasWeakRecoveryCoverage || hasChurnPressure)) {
    return []
  }

  const failureRatePct =
    input.snapshot.invoiceFailureRate !== null
      ? toRoundedPercent(input.snapshot.invoiceFailureRate)
      : null
  const severity: FindingDraft["severity"] =
    (input.snapshot.failedInvoiceCount >= STRIPE_HIGH_SEVERITY_FAILED_INVOICES &&
      (input.snapshot.invoiceFailureRate ?? 0) >= STRIPE_HIGH_FAILURE_RATE) ||
    input.snapshot.deletedSubscriptionCount >= 3
      ? "high"
      : "medium"
  const estimatedMonthlyRevenueImpact = estimateStripeBillingRecoveryImpact(input.snapshot)

  return [
    {
      key: "stripe_failed_payment_recovery_gap_v1",
      type: "failed_payment_recovery",
      severity,
      title: "Billing recovery flow leaves failed revenue unrecovered",
      summary:
        `Detected ${input.snapshot.failedInvoiceCount} failed invoices and ${input.snapshot.paidInvoiceCount} paid invoices in the last ${input.snapshot.lookbackDays} days` +
        (failureRatePct !== null ? ` (${failureRatePct}% invoice failure rate).` : "."),
      whyItMatters:
        "Repeated failed billing events with weak recovery coverage indicate preventable recurring revenue loss before recovery actions convert.",
      recommendedAction:
        "Tighten smart retry cadence, extend dunning coverage through the highest recovery window, and prioritize payment method update prompts for past-due accounts.",
      estimatedMonthlyRevenueImpact,
      evidence: {
        detector_version: "stripe_billing_recovery_v1",
        lookback_days: input.snapshot.lookbackDays,
        failed_invoice_count: input.snapshot.failedInvoiceCount,
        failed_payment_intent_count: input.snapshot.failedPaymentIntentCount,
        paid_invoice_count: input.snapshot.paidInvoiceCount,
        invoice_failure_rate:
          input.snapshot.invoiceFailureRate !== null
            ? toRoundedRate(input.snapshot.invoiceFailureRate)
            : null,
        invoice_failure_rate_pct: failureRatePct,
        invoice_paid_to_failed_ratio:
          input.snapshot.invoicePaidToFailedRatio !== null
            ? toRoundedRate(input.snapshot.invoicePaidToFailedRatio)
            : null,
        past_due_subscription_count: input.snapshot.pastDueSubscriptionCount,
        deleted_subscription_count: input.snapshot.deletedSubscriptionCount,
        failed_amount_cents: input.snapshot.failedAmountCents,
        recovered_amount_cents: input.snapshot.recoveredAmountCents,
        primary_currency: input.snapshot.primaryCurrency,
        multiple_currencies: input.snapshot.multipleCurrencies,
        latest_event_at: input.snapshot.latestReceivedAt,
      },
    },
  ]
}

function buildShopifyActivationFindings(input: {
  signalSnapshot: ShopifySignalSnapshot
  installedAt: string | null
  setupCoverageComplete: boolean
  integrationHealthy: boolean
}) {
  if (!input.setupCoverageComplete || !input.integrationHealthy) {
    return []
  }

  const orders30d = input.signalSnapshot.orders30d
  const products = input.signalSnapshot.products
  const customers = input.signalSnapshot.customers

  if (
    orders30d === null ||
    input.signalSnapshot.totalOrders === null ||
    products === null ||
    customers === null ||
    orders30d < 0 ||
    input.signalSnapshot.totalOrders < 0 ||
    products < 0 ||
    customers < 0
  ) {
    return []
  }

  const daysSinceInstall = getDaysSinceTimestamp(input.installedAt)
  if (daysSinceInstall === null || daysSinceInstall < ACTIVATION_MIN_INSTALL_AGE_DAYS) {
    return []
  }

  const orderToCustomerRate = customers > 0 ? orders30d / customers : 0
  const hasCatalog = products >= ACTIVATION_MIN_PRODUCTS
  const hasAudience = customers >= ACTIVATION_MIN_CUSTOMERS
  const stalledAtFirstValue =
    orders30d <= ACTIVATION_MAX_ORDERS_30D &&
    orderToCustomerRate <= ACTIVATION_MAX_ORDER_TO_CUSTOMER_RATE
  const hasObservedActivationWindow = input.signalSnapshot.totalOrders >= ACTIVATION_MIN_TOTAL_ORDERS

  if (!hasCatalog || !hasAudience || !stalledAtFirstValue || !hasObservedActivationWindow) {
    return []
  }

  const activationRatePct = Number((orderToCustomerRate * 100).toFixed(1))
  const severity: FindingDraft["severity"] =
    orders30d <= 1 &&
    customers >= ACTIVATION_HIGH_SEVERITY_CUSTOMERS &&
    daysSinceInstall >= ACTIVATION_HIGH_SEVERITY_INSTALL_AGE_DAYS
      ? "high"
      : "medium"
  const estimatedMonthlyRevenueImpact = estimateActivationImpact({
    customers,
    orders30d,
  })
  const summary = `Activation signal mismatch: ${customers} customers and ${products} products, but only ${orders30d} orders in the last 30 days (${activationRatePct}% customer-to-order rate).`

  return [
    {
      key: "shopify_activation_funnel_dropout_v1",
      type: "activation_funnel_dropout",
      severity,
      title: "Activation funnel stalls after first entry",
      summary,
      whyItMatters:
        `Store is beyond initial setup (${daysSinceInstall} days live, ${input.signalSnapshot.totalOrders} lifetime orders) but first-value progression remains stalled.`,
      recommendedAction:
        "Instrument onboarding checkpoints, launch a guided path to first purchase, and trigger rescue nudges for operators who stall before first checkout completion.",
      estimatedMonthlyRevenueImpact,
      evidence: {
        detector_version: "shopify_activation_v1",
        orders_30d: orders30d,
        total_orders: input.signalSnapshot.totalOrders,
        products,
        customers,
        order_to_customer_rate_30d: Number(orderToCustomerRate.toFixed(4)),
        activation_rate_pct_30d: activationRatePct,
        days_since_install: daysSinceInstall,
        threshold_orders_30d_max: ACTIVATION_MAX_ORDERS_30D,
        threshold_order_to_customer_rate_max: ACTIVATION_MAX_ORDER_TO_CUSTOMER_RATE,
        threshold_customers_min: ACTIVATION_MIN_CUSTOMERS,
        threshold_products_min: ACTIVATION_MIN_PRODUCTS,
        threshold_total_orders_min: ACTIVATION_MIN_TOTAL_ORDERS,
      },
    },
  ]
}

function buildShopifyFindings(input: {
  metadata: Record<string, unknown>
  integrationStatus: string
  syncStatus: string | null
  scopes: string[] | null
  meaningfulCommercialSignal: boolean
}) {
  const findings: FindingDraft[] = []
  const webhookFailure = hasWebhookFailure(
    input.metadata,
    input.integrationStatus,
    input.syncStatus
  )

  if (webhookFailure) {
    findings.push({
      key: "shopify_webhook_registration_incomplete",
      type: "setup_gap",
      severity: "high",
      title: "Webhook registration incomplete",
      summary:
        "Shopify event delivery is not fully confirmed, so CheckoutLeak cannot guarantee reliable leakage signal intake.",
      whyItMatters:
        "Missing webhook continuity lowers confidence in leakage detection and can delay issue surfacing.",
      recommendedAction:
        "Open the Shopify connection settings and retry webhook setup to restore full event coverage.",
      estimatedMonthlyRevenueImpact: 0,
    })
  }

  const missingScopes = getMissingScopes(input.scopes, SHOPIFY_REQUIRED_SCOPES)

  if (missingScopes.length > 0 && input.meaningfulCommercialSignal) {
    findings.push({
      key: "shopify_monitoring_coverage_incomplete",
      type: "setup_gap",
      severity: "high",
      title: "Monitoring coverage incomplete",
      summary:
        "Commercial activity is present, but required Shopify data scopes are missing for full leakage analysis.",
      whyItMatters:
        "When key read scopes are missing, high-value checkout leakage can remain undetected.",
      recommendedAction:
        `Reconnect Shopify and approve full monitoring scopes: ${missingScopes.join(", ")}.`,
      estimatedMonthlyRevenueImpact: 0,
    })
  }

  return findings
}

function buildSimulatedFindings(): FindingDraft[] {
  return [
    {
      key: "simulated_webhook_coverage_gap",
      type: "setup_gap",
      severity: "high",
      title: "Monitoring coverage incomplete",
      summary:
        "Simulation: event coverage is incomplete for a commercially active store profile.",
      whyItMatters:
        "Limited coverage reduces confidence in leakage detection for active checkout flows.",
      recommendedAction:
        "Reconnect Shopify and confirm full event coverage for checkout monitoring.",
      estimatedMonthlyRevenueImpact: 0,
    },
    {
      key: "simulated_signal_confidence_limited",
      type: "setup_gap",
      severity: "medium",
      title: "Signal confidence limited",
      summary:
        "Simulation: structured event depth is below recommended confidence for ranked leakage findings.",
      whyItMatters:
        "Lower confidence can delay prioritization of highest-impact leakage opportunities.",
      recommendedAction:
        "Verify webhook continuity and run another scan after additional checkout activity.",
      estimatedMonthlyRevenueImpact: 0,
    },
  ]
}

export async function processQueuedScanV1(input?: {
  scanId?: string | null
  simulationOutcome?: ScanSimulationOutcome | null
}): Promise<ScanProcessResult> {
  const admin = createSupabaseAdminClient()
  const queuedScanResult = input?.scanId
    ? await admin
        .from("scans")
        .select("id, organization_id, store_id, status, created_at")
        .eq("id", input.scanId)
        .eq("status", "queued")
        .maybeSingle()
    : await admin
        .from("scans")
        .select("id, organization_id, store_id, status, created_at")
        .eq("status", "queued")
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle()

  if (queuedScanResult.error) {
    console.error(
      `[scan-runner] queued scan lookup failed: ${queuedScanResult.error.message}`
    )
    return {
      processed: false,
      reason: "lookup_failed",
      scanId: input?.scanId ?? null,
    }
  }

  const queuedScan = queuedScanResult.data
  if (!queuedScan) {
    return {
      processed: false,
      reason: input?.scanId ? "scan_not_queued_or_missing" : "no_queued_scan",
      scanId: input?.scanId ?? null,
    }
  }

  console.info(
    `[scan-runner] queued scan picked: scan_id=${queuedScan.id}; organization=${queuedScan.organization_id}; store_id=${queuedScan.store_id}`
  )

  const [storeResult, integrationResult] = await Promise.all([
    admin
      .from("stores")
      .select("id, organization_id, platform, domain, name, active")
      .eq("id", queuedScan.store_id)
      .eq("organization_id", queuedScan.organization_id)
      .maybeSingle(),
    admin
      .from("store_integrations")
      .select("id, provider, status, sync_status, connection_health, scopes, shop_domain, metadata, installed_at, account_identifier")
      .eq("organization_id", queuedScan.organization_id)
      .eq("store_id", queuedScan.store_id)
      .neq("status", "disconnected")
      .order("installed_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  if (storeResult.error || !storeResult.data) {
    const reason = storeResult.error?.message ?? "store_not_found"
    console.error(
      `[scan-runner] store load failed: scan_id=${queuedScan.id}; reason=${reason}`
    )
    return {
      processed: false,
      reason: "store_missing",
      scanId: queuedScan.id,
      outcome: null,
      organizationId: queuedScan.organization_id,
      storeId: queuedScan.store_id,
    }
  }

  if (integrationResult.error || !integrationResult.data) {
    const reason = integrationResult.error?.message ?? "integration_not_found"
    console.error(
      `[scan-runner] integration load failed: scan_id=${queuedScan.id}; reason=${reason}`
    )
    return {
      processed: false,
      reason: "integration_missing",
      scanId: queuedScan.id,
      outcome: null,
      organizationId: queuedScan.organization_id,
      storeId: queuedScan.store_id,
    }
  }

  const runningAt = new Date().toISOString()
  const runningResult = await admin
    .from("scans")
    .update({
      status: "running",
      scanned_at: runningAt,
    })
    .eq("id", queuedScan.id)
    .eq("status", "queued")
    .select("id")
    .maybeSingle()

  if (runningResult.error) {
    console.error(
      `[scan-runner] running update failed: scan_id=${queuedScan.id}; reason=${runningResult.error.message}`
    )
    return {
      processed: false,
      reason: "running_update_failed",
      scanId: queuedScan.id,
      outcome: null,
      organizationId: queuedScan.organization_id,
      storeId: queuedScan.store_id,
    }
  }

  if (!runningResult.data) {
    return {
      processed: false,
      reason: "scan_not_queued_anymore",
      scanId: queuedScan.id,
      outcome: null,
      organizationId: queuedScan.organization_id,
      storeId: queuedScan.store_id,
    }
  }

  console.info(
    `[scan-runner] running state set: scan_id=${queuedScan.id}; at=${runningAt}`
  )

  const detectedAt = new Date().toISOString()
  const storePlatform = parseMerchantPlatform(storeResult.data.platform)
  const scanFamily = getPrimaryScanFamilyForPlatform(storePlatform)
  const integrationProvider = integrationResult.data.provider
  const integrationMetadata = asRecord(integrationResult.data.metadata) ?? {}
  const signalSnapshot = readShopifySignalSnapshot(integrationMetadata)
  const simulationOutcome = input?.simulationOutcome ?? null
  let stripeBillingSnapshot: StripeBillingSignalSnapshot | null = null
  if (
    !simulationOutcome &&
    integrationProvider === "stripe" &&
    integrationResult.data.account_identifier
  ) {
    try {
      stripeBillingSnapshot = await loadStripeBillingSignalSnapshot({
        admin,
        accountIdentifier: integrationResult.data.account_identifier,
        lookbackDays: STRIPE_BILLING_LOOKBACK_DAYS,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      console.error(
        `[scan-runner] stripe billing signal load failed: scan_id=${queuedScan.id}; account=${integrationResult.data.account_identifier}; reason=${message}`
      )
    }
  }
  const meaningfulCommercialSignal = simulationOutcome
    ? simulationOutcome !== "no_signal"
    : integrationProvider === "shopify"
      ? hasMeaningfulCommercialSignal(signalSnapshot)
      : integrationProvider === "stripe"
        ? hasMeaningfulStripeBillingSignal(stripeBillingSnapshot)
        : false
  const setupCoverageMissingScopes = getMissingScopes(
    integrationResult.data.scopes,
    SHOPIFY_REQUIRED_SCOPES
  )
  const integrationHasWebhookFailure = hasWebhookFailure(
    integrationMetadata,
    integrationResult.data.status,
    integrationResult.data.sync_status
  )
  const setupCoverageComplete =
    !integrationHasWebhookFailure && setupCoverageMissingScopes.length === 0
  const findings = simulationOutcome
    ? simulationOutcome === "findings_present"
      ? buildSimulatedFindings()
      : []
    : integrationProvider === "shopify"
      ? [
          ...buildShopifyFindings({
            metadata: integrationMetadata,
            integrationStatus: integrationResult.data.status,
            syncStatus: integrationResult.data.sync_status,
            scopes: integrationResult.data.scopes,
            meaningfulCommercialSignal,
          }),
          ...buildShopifyActivationFindings({
            signalSnapshot,
            installedAt: integrationResult.data.installed_at,
            setupCoverageComplete,
            integrationHealthy: integrationResult.data.status !== "degraded",
          }),
        ]
      : integrationProvider === "stripe"
        ? buildStripeBillingRecoveryFindings({
            snapshot: stripeBillingSnapshot,
            integrationStatus: integrationResult.data.status,
            syncStatus: integrationResult.data.sync_status,
          })
      : []

  const managedIssueSource = simulationOutcome
    ? integrationProvider === "stripe"
      ? "stripe_simulation_v1"
      : "shopify_simulation_v1"
    : integrationProvider === "stripe"
      ? "stripe_monitoring_v1"
      : "shopify_monitoring_v1"
  if (integrationProvider === "shopify" || integrationProvider === "stripe") {
    const sourcesToResolve = simulationOutcome
      ? integrationProvider === "stripe"
        ? ["stripe_simulation_v1", "stripe_monitoring_v1"]
        : ["shopify_simulation_v1", "shopify_monitoring_v1"]
      : [managedIssueSource]
    const resolveOldIssues = await admin
      .from("issues")
      .update({ status: "resolved" })
      .eq("organization_id", queuedScan.organization_id)
      .eq("store_id", queuedScan.store_id)
      .in("source", sourcesToResolve)
      .neq("status", "resolved")

    if (resolveOldIssues.error) {
      console.error(
        `[scan-runner] issue resolution cleanup failed: scan_id=${queuedScan.id}; reason=${resolveOldIssues.error.message}`
      )
    }
  }

  let insertedFindings = 0
  if (findings.length > 0) {
    const issueRows: IssueInsert[] = findings.map((finding) => ({
      organization_id: queuedScan.organization_id,
      store_id: queuedScan.store_id,
      scan_id: queuedScan.id,
      title: finding.title,
      summary: finding.summary,
      type: finding.type,
      severity: finding.severity,
      status: "open",
      estimated_monthly_revenue_impact: finding.estimatedMonthlyRevenueImpact,
      recommended_action: finding.recommendedAction,
      source: managedIssueSource,
      detected_at: detectedAt,
      why_it_matters: finding.whyItMatters,
    }))

    const issuesInsert = await admin.from("issues").insert(issueRows).select("id")
    if (issuesInsert.error) {
      console.error(
        `[scan-runner] findings insert failed: scan_id=${queuedScan.id}; reason=${issuesInsert.error.message}`
      )
    } else {
      insertedFindings = issuesInsert.data?.length ?? 0
    }
  }

  const completedAt = new Date().toISOString()
  const completionPayload = {
    status: "completed",
    completed_at: completedAt,
    detected_issues_count: insertedFindings,
    estimated_monthly_leakage: findings.reduce(
      (total, finding) => total + finding.estimatedMonthlyRevenueImpact,
      0
    ),
  } as const

  const completionResult = await admin
    .from("scans")
    .update(completionPayload)
    .eq("id", queuedScan.id)
    .select("id, status, completed_at, detected_issues_count, estimated_monthly_leakage")
    .maybeSingle()

  if (completionResult.error || !completionResult.data) {
    const reason = completionResult.error?.message ?? "scan_not_found_on_complete"
    console.error(
      `[scan-runner] completion failed: scan_id=${queuedScan.id}; reason=${reason}`
    )
    await admin.from("scans").update({ status: "failed" }).eq("id", queuedScan.id)
    return {
      processed: false,
      reason: "completion_failed",
      scanId: queuedScan.id,
      outcome: null,
      organizationId: queuedScan.organization_id,
      storeId: queuedScan.store_id,
    }
  }

  const completedCountResult = await admin
    .from("scans")
    .select("id", { head: true, count: "exact" })
    .eq("organization_id", queuedScan.organization_id)
    .eq("store_id", queuedScan.store_id)
    .eq("status", "completed")

  const completedCount = completedCountResult.count ?? 0
  const outcome =
    completionResult.data.detected_issues_count > 0 ||
    completionResult.data.estimated_monthly_leakage > 0
      ? "issues_found"
      : meaningfulCommercialSignal
        ? "clean"
        : "no_signal"

  const metadata = asRecord(integrationResult.data.metadata) ?? {}
  const findingEvidence = Object.fromEntries(
    findings.map((finding) => [finding.key, finding.evidence ?? null])
  )
  const metadataUpdate = {
    ...metadata,
    scan_family: scanFamily,
    recommended_scan_families: getRecommendedScanFamiliesForPlatform(storePlatform),
    scan_outcome:
      simulationOutcome === "findings_present"
        ? "issues_found"
        : simulationOutcome ?? outcome,
    scan_outcome_updated_at: new Date().toISOString(),
    meaningful_signal_detected: meaningfulCommercialSignal,
    finding_keys: findings.map((finding) => finding.key),
    finding_evidence: findingEvidence,
    activation_dropout_detected: findings.some(
      (finding) => finding.type === "activation_funnel_dropout"
    ),
    billing_recovery_gap_detected: findings.some(
      (finding) => finding.type === "failed_payment_recovery"
    ),
    stripe_billing_signal_snapshot: stripeBillingSnapshot
      ? {
          lookback_days: stripeBillingSnapshot.lookbackDays,
          total_events: stripeBillingSnapshot.totalEvents,
          observed_invoice_events: stripeBillingSnapshot.observedInvoiceEvents,
          failed_invoice_count: stripeBillingSnapshot.failedInvoiceCount,
          failed_payment_intent_count: stripeBillingSnapshot.failedPaymentIntentCount,
          paid_invoice_count: stripeBillingSnapshot.paidInvoiceCount,
          past_due_subscription_count: stripeBillingSnapshot.pastDueSubscriptionCount,
          deleted_subscription_count: stripeBillingSnapshot.deletedSubscriptionCount,
          failed_amount_cents: stripeBillingSnapshot.failedAmountCents,
          recovered_amount_cents: stripeBillingSnapshot.recoveredAmountCents,
          invoice_failure_rate: stripeBillingSnapshot.invoiceFailureRate,
          invoice_paid_to_failed_ratio: stripeBillingSnapshot.invoicePaidToFailedRatio,
          primary_currency: stripeBillingSnapshot.primaryCurrency,
          multiple_currencies: stripeBillingSnapshot.multipleCurrencies,
          latest_event_at: stripeBillingSnapshot.latestReceivedAt,
        }
      : null,
    simulation_outcome: simulationOutcome,
  }

  const integrationUpdate = await admin
    .from("store_integrations")
    .update({
      metadata: metadataUpdate as Json,
      sync_status: integrationResult.data.status === "degraded" ? "errored" : "synced",
      last_synced_at: new Date().toISOString(),
    })
    .eq("id", integrationResult.data.id)

  if (integrationUpdate.error) {
    console.error(
      `[scan-runner] outcome metadata update failed: scan_id=${queuedScan.id}; integration_id=${integrationResult.data.id}; reason=${integrationUpdate.error.message}`
    )
  }

  console.info(
    `[scan-runner] outcome classified: scan_id=${queuedScan.id}; outcome=${outcome}; completed_count=${completedCount}; meaningful_signal=${meaningfulCommercialSignal}; findings=${insertedFindings}; simulation_outcome=${simulationOutcome ?? "none"}`
  )

  console.info(
    `[scan-runner] completion state set: scan_id=${queuedScan.id}; payload=${JSON.stringify(completionPayload)}`
  )

  return {
    processed: true,
    reason: "processed",
    scanId: queuedScan.id,
    outcome,
    organizationId: queuedScan.organization_id,
    storeId: queuedScan.store_id,
    storePlatform: storeResult.data.platform,
    integrationProvider: integrationResult.data.provider,
    status: completionResult.data.status,
    completedAt: completionResult.data.completed_at,
    detectedIssuesCount: completionResult.data.detected_issues_count,
    estimatedMonthlyLeakage: completionResult.data.estimated_monthly_leakage,
    scanFamily,
  }
}
