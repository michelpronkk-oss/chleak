import { formatDistanceToNowStrict } from "date-fns"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import {
  mockNotificationPreferences,
  mockPlanCatalog,
  mockStoreContexts,
  mockSubscriptionState,
} from "@/data/mock/app-state"
import { getMockDashboardSnapshot } from "@/data/mock/dashboard"
import {
  formatLeakFamilyLabel,
  summarizeIssueImpactByLeakFamily,
} from "@/lib/revenue-flow-taxonomy"
import { getServerSession } from "@/lib/auth/session"
import { createSupabaseAdminClient } from "@/lib/supabase/shared"
import { ensureWorkspaceForUser } from "@/server/services/account-bootstrap-service"
import { getFixPlanHrefForIssue } from "@/server/services/fix-plan-service"
import type { DashboardSnapshot, Issue, Scan, Store } from "@/types/domain"

import { getDashboardSnapshotForOrganization } from "./dashboard-service"
import {
  getConnectedSourceFromState,
  getOnboardingState,
  isConnectingState,
  isPendingScanState,
  isReadyState,
  type OnboardingState,
} from "./onboarding-state-service"
import {
  getPlanEntitlement,
  getPlanStateForOrganization,
} from "./plan-state-service"
import {
  getShopifySourceState,
  getStripeSourceState,
  LIVE_SOURCE_CONTEXT_COOKIE,
  parseLiveSourceContext,
} from "./source-connection-state-service"
import {
  deriveSourceVerification,
  loadConnectedSystemDomains,
  resolveStoreSourceVerification,
} from "./source-verification-service"
import { getShopifySetupState } from "./shopify-service"
import { getStripeSetupState } from "./stripe-service"

export type CommercialAccessState =
  | "public_visitor"
  | "authenticated_no_plan"
  | "paid_not_onboarded"
  | "paid_no_connected_source"
  | "paid_connected"

type ConnectedProvider = "shopify" | "stripe"

interface BackendSourceSignals {
  providers: ConnectedProvider[]
  primaryProvider: ConnectedProvider | null
  storeIdsByProvider: {
    shopify: string[]
    stripe: string[]
  }
  scanCountByProvider: {
    shopify: number
    stripe: number
  }
  issueCountByProvider: {
    shopify: number
    stripe: number
  }
  meaningfulSignalByProvider: {
    shopify: boolean
    stripe: boolean
  }
  declaredOutcomeByProvider: {
    shopify: "no_signal" | "clean" | "issues_found" | null
    stripe: "no_signal" | "clean" | "issues_found" | null
  }
}

interface ShopifyDomainView {
  displayDomain: string | null
  canonicalDomain: string | null
  status: string | null
  connectionHealth: string | null
  syncStatus: string | null
  lastError: string | null
}

type ActivationPageIntentHint =
  | "onboarding"
  | "activation"
  | "first_value"
  | "checkout_handoff"

interface ActivationFlowHintsView {
  preferredEntryUrl: string | null
  onboardingPathUrl: string | null
  preferredPrimaryCtaSelector: string | null
  preferredNextActionSelector: string | null
  firstValueAreaSelector: string | null
  authExpected: boolean | null
  pageIntentHint: ActivationPageIntentHint | null
}

interface ActivationFlowLastRunView {
  lastRunAt: string | null
  detectorVersion: string | null
  runStatus: string | null
  progressionOutcome: string | null
  deadEndReason: string | null
  entryUrl: string | null
  finalUrl: string | null
  entryPageClassification: string | null
  finalPageClassification: string | null
  primaryActionLabel: string | null
  primaryActionKind: string | null
  primaryActionTarget: string | null
  hintSource: string | null
  hintPrimarySelector: string | null
  hintPrimarySelectorMatched: boolean | null
  hintNextActionSelector: string | null
  hintNextActionSelectorMatched: boolean | null
  hintFirstValueSelector: string | null
  hintFirstValueSelectorMatched: boolean | null
  hintAuthExpected: boolean | null
  hintPageIntent: string | null
  entryScreenshotRef: string | null
  progressionScreenshotRef: string | null
  entryScreenshotSha256: string | null
  progressionScreenshotSha256: string | null
  entryScreenshotBytes: number | null
  progressionScreenshotBytes: number | null
}

interface UrlSourceAnalysisLastRunView {
  detectorVersion: string | null
  status: string | null
  runId: string | null
  entryUrl: string | null
  finalUrl: string | null
  completedAt: string | null
  businessType: string | null
  revenueModel: string | null
  surfaceClassification: string | null
  revenuePathClarity: string | null
  noClearRevenuePath: boolean | null
  hasPricingPath: boolean | null
  hasSignupPath: boolean | null
  hasLoginPath: boolean | null
  hasPrimaryCta: boolean | null
  primaryCtaLabel: string | null
  hasCheckoutSignal: boolean | null
  hasContactOrBookingPath: boolean | null
  hasSubscriptionLanguage: boolean | null
  responseTimeMs: number | null
  browserFinalUrl: string | null
  browserPageTitle: string | null
  browserLoadTimeMs: number | null
  mobileHasAboveFoldCta: boolean | null
  mobileAboveFoldCtaLabels: string[]
  mobileViewportOverflow: boolean | null
  mobileScreenshotRef: string | null
  mobileScreenshotSha256: string | null
  mobileScreenshotBytes: number | null
  desktopHasAboveFoldCta: boolean | null
  desktopAboveFoldCtaLabels: string[]
  desktopScreenshotRef: string | null
  desktopScreenshotSha256: string | null
  desktopScreenshotBytes: number | null
  funnelSummary: string | null
  funnelRecommendedNextAction: string | null
  funnelPagesInspected: number | null
  funnelPageRoles: string[]
  funnelPages: Array<{
    url: string | null
    label: string | null
    role: string | null
    status: string | null
    capturedUrl: string | null
    mobileScreenshotRef: string | null
    mobileScreenshotSha256: string | null
    mobileScreenshotBytes: number | null
    desktopScreenshotRef: string | null
    desktopScreenshotSha256: string | null
    desktopScreenshotBytes: number | null
  }>
  httpStatus: number | null
  evidenceRows: Array<{ label: string; value: string }>
  errorMessage: string | null
  storeId: string | null
}

interface UrlSourceTopIssueView {
  id: string
  title: string
  summary: string
  severity: string
  estimatedMonthlyRevenueImpact: number
  recommendedAction: string
  whyItMatters: string
  href: string | null
}

interface LiveSourceSurfaceView {
  primaryUrl: string | null
  domain: string | null
  identifier: string | null
  sourceEntityType: string | null
  connectedSystems: string[]
}

function isShopifySetupAttention(view: ShopifyDomainView | undefined) {
  if (!view) {
    return false
  }

  return (
    view.status === "degraded" ||
    view.connectionHealth === "degraded" ||
    view.syncStatus === "errored"
  )
}

function deriveCommercialAccessState(input: {
  hasIdentity: boolean
  hasPlan: boolean
  onboardingState: OnboardingState
}) {
  if (!input.hasIdentity) {
    return "public_visitor" as const
  }

  if (!input.hasPlan) {
    return "authenticated_no_plan" as const
  }

  if (input.onboardingState === "empty") {
    return "paid_no_connected_source" as const
  }

  if (
    isConnectingState(input.onboardingState) ||
    isPendingScanState(input.onboardingState)
  ) {
    return "paid_not_onboarded" as const
  }

  return "paid_connected" as const
}

function deriveScanOutcomeForPrimarySource(input: {
  signals: BackendSourceSignals | null
}): "no_signal" | "clean" | "issues_found" | null {
  if (!input.signals || input.signals.providers.length === 0) {
    return null
  }

  const provider = input.signals.primaryProvider ?? input.signals.providers[0]
  if (!provider) {
    return null
  }

  const scans = input.signals.scanCountByProvider[provider]
  const issues = input.signals.issueCountByProvider[provider]
  const meaningfulSignal = input.signals.meaningfulSignalByProvider[provider]
  const declaredOutcome = input.signals.declaredOutcomeByProvider[provider]

  if (scans === 0) {
    return null
  }

  if (issues > 0) {
    return "issues_found"
  }

  if (declaredOutcome === "clean" || declaredOutcome === "no_signal") {
    return declaredOutcome
  }

  return scans > 0 ? (meaningfulSignal ? "clean" : "no_signal") : null
}

function pickHighestImpactVisibleIssue(issues: Issue[]) {
  return [...issues].sort(
    (a, b) => b.estimatedMonthlyRevenueImpact - a.estimatedMonthlyRevenueImpact
  )[0]
}

function buildVisibleRevenueOpportunities(issues: Issue[]): DashboardSnapshot["revenueOpportunities"] {
  return summarizeIssueImpactByLeakFamily(issues)
    .map(([family, estimatedMonthlyRevenueImpact]) => ({
      label: formatLeakFamilyLabel(family),
      estimatedMonthlyRevenueImpact,
      confidence:
        estimatedMonthlyRevenueImpact > 20000
          ? ("high" as const)
          : ("medium" as const),
    }))
    .sort(
      (a, b) => b.estimatedMonthlyRevenueImpact - a.estimatedMonthlyRevenueImpact
    )
}

function buildVisibleSuggestedActions(issues: Issue[]): DashboardSnapshot["suggestedActions"] {
  return issues.slice(0, 3).map((issue, index) => ({
    id: `action_${index + 1}`,
    title: issue.recommendedAction,
    description: issue.summary,
    issueIds: [issue.id],
    estimatedMonthlyRevenueImpact: issue.estimatedMonthlyRevenueImpact,
    urgency:
      issue.severity === "critical"
        ? "do_now"
        : issue.severity === "high"
          ? "this_week"
          : "watch",
  }))
}

async function loadBackendSourceSignals(
  organizationId: string
): Promise<BackendSourceSignals | null> {
  try {
    const admin = createSupabaseAdminClient()
    const integrationsResult = await admin
      .from("store_integrations")
      .select("provider, status, store_id, metadata, installed_at, created_at")
      .eq("organization_id", organizationId)
      .in("provider", ["shopify", "stripe"])
      .neq("status", "disconnected")

    if (integrationsResult.error) {
      return null
    }

    const rows =
      integrationsResult.data?.filter(
        (row): row is typeof row & { provider: ConnectedProvider } =>
          row.provider === "shopify" || row.provider === "stripe"
      ) ?? []
    const rowsByRecency = [...rows].sort((a, b) => {
      const left = a.installed_at ?? a.created_at ?? ""
      const right = b.installed_at ?? b.created_at ?? ""
      return right.localeCompare(left)
    })

    if (!rows.length) {
      return {
        providers: [],
        primaryProvider: null,
        storeIdsByProvider: { shopify: [], stripe: [] },
        scanCountByProvider: { shopify: 0, stripe: 0 },
        issueCountByProvider: { shopify: 0, stripe: 0 },
        meaningfulSignalByProvider: { shopify: false, stripe: false },
        declaredOutcomeByProvider: { shopify: null, stripe: null },
      }
    }

    const storeIdsByProvider: BackendSourceSignals["storeIdsByProvider"] = {
      shopify: [],
      stripe: [],
    }

    rows.forEach((row) => {
      const target = storeIdsByProvider[row.provider]
      if (!target.includes(row.store_id)) {
        target.push(row.store_id)
      }
    })

    const providers = (["shopify", "stripe"] as const).filter(
      (provider) => storeIdsByProvider[provider].length > 0
    )

    const primaryRow = rowsByRecency[0]

    const primaryProvider = primaryRow?.provider ?? providers[0] ?? null
    const allStoreIds = Array.from(
      new Set([...storeIdsByProvider.shopify, ...storeIdsByProvider.stripe])
    )

    if (!allStoreIds.length) {
      return {
        providers: [],
        primaryProvider: null,
        storeIdsByProvider: { shopify: [], stripe: [] },
        scanCountByProvider: { shopify: 0, stripe: 0 },
        issueCountByProvider: { shopify: 0, stripe: 0 },
        meaningfulSignalByProvider: { shopify: false, stripe: false },
        declaredOutcomeByProvider: { shopify: null, stripe: null },
      }
    }

    const [scansResult, issuesResult] = await Promise.all([
      admin
        .from("scans")
        .select("store_id")
        .eq("organization_id", organizationId)
        .eq("status", "completed")
        .in("store_id", allStoreIds),
      admin
        .from("issues")
        .select("store_id")
        .eq("organization_id", organizationId)
        .in("store_id", allStoreIds)
        .neq("status", "resolved"),
    ])

    if (scansResult.error || issuesResult.error) {
      return null
    }

    const scanCountByProvider: BackendSourceSignals["scanCountByProvider"] = {
      shopify: 0,
      stripe: 0,
    }
    const issueCountByProvider: BackendSourceSignals["issueCountByProvider"] = {
      shopify: 0,
      stripe: 0,
    }
    const meaningfulSignalByProvider: BackendSourceSignals["meaningfulSignalByProvider"] = {
      shopify: false,
      stripe: false,
    }
    const declaredOutcomeByProvider: BackendSourceSignals["declaredOutcomeByProvider"] = {
      shopify: null,
      stripe: null,
    }

    const storeIdToProvider = new Map<string, ConnectedProvider>()
    storeIdsByProvider.shopify.forEach((storeId) =>
      storeIdToProvider.set(storeId, "shopify")
    )
    storeIdsByProvider.stripe.forEach((storeId) =>
      storeIdToProvider.set(storeId, "stripe")
    )

    ;(scansResult.data ?? []).forEach((scan) => {
      const provider = storeIdToProvider.get(scan.store_id)
      if (provider) {
        scanCountByProvider[provider] += 1
      }
    })

    ;(issuesResult.data ?? []).forEach((issue) => {
      const provider = storeIdToProvider.get(issue.store_id)
      if (provider) {
        issueCountByProvider[provider] += 1
      }
    })

    const evaluatedProviders = new Set<ConnectedProvider>()
    for (const row of rowsByRecency) {
      if (evaluatedProviders.has(row.provider)) {
        continue
      }
      evaluatedProviders.add(row.provider)

      const metadata =
        row.metadata && typeof row.metadata === "object" && !Array.isArray(row.metadata)
          ? (row.metadata as Record<string, unknown>)
          : null
      const declaredOutcome =
        metadata?.scan_outcome === "no_signal" ||
        metadata?.scan_outcome === "clean" ||
        metadata?.scan_outcome === "issues_found"
          ? metadata.scan_outcome
          : null
      if (declaredOutcome) {
        declaredOutcomeByProvider[row.provider] = declaredOutcome
      }

      if (row.provider !== "shopify") {
        continue
      }
      const signalSnapshot =
        metadata &&
        metadata.signal_snapshot &&
        typeof metadata.signal_snapshot === "object" &&
        !Array.isArray(metadata.signal_snapshot)
          ? (metadata.signal_snapshot as Record<string, unknown>)
          : null
      const explicitMeaningfulSignal =
        typeof metadata?.meaningful_signal_detected === "boolean"
          ? metadata.meaningful_signal_detected
          : null
      const explicitOutcome =
        typeof metadata?.scan_outcome === "string"
          ? metadata.scan_outcome
          : null
      const orders30d =
        typeof signalSnapshot?.orders_30d === "number" ? signalSnapshot.orders_30d : 0
      const totalOrders =
        typeof signalSnapshot?.total_orders === "number"
          ? signalSnapshot.total_orders
          : 0

      if (
        explicitMeaningfulSignal === true ||
        explicitOutcome === "clean" ||
        explicitOutcome === "issues_found" ||
        orders30d >= 5 ||
        totalOrders >= 25
      ) {
        meaningfulSignalByProvider.shopify = true
      }
    }

    return {
      providers,
      primaryProvider,
      storeIdsByProvider,
      scanCountByProvider,
      issueCountByProvider,
      meaningfulSignalByProvider,
      declaredOutcomeByProvider,
    }
  } catch {
    return null
  }
}

function readStringFromRecord(source: unknown, key: string): string | null {
  if (!source || typeof source !== "object" || Array.isArray(source)) {
    return null
  }
  const value = (source as Record<string, unknown>)[key]
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null
}

function readLiveSourceContextFromMetadata(source: unknown) {
  const primaryUrl = readStringFromRecord(source, "primary_live_source_url")
  const primaryDomain = readStringFromRecord(source, "primary_live_source_domain")
  if (primaryUrl && primaryDomain) {
    return {
      url: primaryUrl,
      domain: primaryDomain,
      source: "integration_metadata.primary" as const,
    }
  }

  const legacyUrl = readStringFromRecord(source, "live_source_url")
  const legacyDomain = readStringFromRecord(source, "live_source_domain")
  if (legacyUrl && legacyDomain) {
    return {
      url: legacyUrl,
      domain: legacyDomain,
      source: "integration_metadata.legacy" as const,
    }
  }

  return null
}

function isPrimaryUrlSourceMetadata(source: unknown) {
  if (!source || typeof source !== "object" || Array.isArray(source)) {
    return false
  }

  const record = source as Record<string, unknown>
  return record.is_primary_source === true || record.source_role === "primary_url"
}

function readBooleanFromRecord(source: unknown, key: string): boolean | null {
  if (!source || typeof source !== "object" || Array.isArray(source)) {
    return null
  }
  const value = (source as Record<string, unknown>)[key]
  return typeof value === "boolean" ? value : null
}

function readNumberFromRecord(source: unknown, key: string): number | null {
  if (!source || typeof source !== "object" || Array.isArray(source)) {
    return null
  }
  const value = (source as Record<string, unknown>)[key]
  return typeof value === "number" && Number.isFinite(value) ? value : null
}

function readStringArrayFromRecord(source: unknown, key: string): string[] {
  if (!source || typeof source !== "object" || Array.isArray(source)) {
    return []
  }
  const value = (source as Record<string, unknown>)[key]
  if (!Array.isArray(value)) {
    return []
  }
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
}

function readUrlSourceFunnelPages(source: unknown) {
  if (!source || typeof source !== "object" || Array.isArray(source)) {
    return []
  }
  const value = (source as Record<string, unknown>).pages
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((item) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) {
        return null
      }
      const record = item as Record<string, unknown>
      return {
        url: readStringFromRecord(record, "url"),
        label: readStringFromRecord(record, "label"),
        role: readStringFromRecord(record, "role"),
        status: readStringFromRecord(record, "status"),
        capturedUrl: readStringFromRecord(record, "final_url") ?? readStringFromRecord(record, "url"),
        mobileScreenshotRef: readStringFromRecord(record, "mobile_screenshot_ref"),
        mobileScreenshotSha256: readStringFromRecord(record, "mobile_screenshot_sha256"),
        mobileScreenshotBytes: readNumberFromRecord(record, "mobile_screenshot_bytes"),
        desktopScreenshotRef: readStringFromRecord(record, "desktop_screenshot_ref"),
        desktopScreenshotSha256: readStringFromRecord(record, "desktop_screenshot_sha256"),
        desktopScreenshotBytes: readNumberFromRecord(record, "desktop_screenshot_bytes"),
      }
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
}

function readActivationFlowHintsView(source: unknown): ActivationFlowHintsView {
  const hintsSource =
    source && typeof source === "object" && !Array.isArray(source)
      ? (source as Record<string, unknown>).activation_flow_hints_v1
      : null
  const record =
    hintsSource && typeof hintsSource === "object" && !Array.isArray(hintsSource)
      ? (hintsSource as Record<string, unknown>)
      : null

  const rawIntent = readStringFromRecord(record, "page_intent_hint")
  const pageIntentHint =
    rawIntent === "onboarding" ||
    rawIntent === "activation" ||
    rawIntent === "first_value" ||
    rawIntent === "checkout_handoff"
      ? rawIntent
      : null

  return {
    preferredEntryUrl: readStringFromRecord(record, "preferred_entry_url"),
    onboardingPathUrl: readStringFromRecord(record, "onboarding_path_url"),
    preferredPrimaryCtaSelector: readStringFromRecord(
      record,
      "preferred_primary_cta_selector"
    ),
    preferredNextActionSelector: readStringFromRecord(
      record,
      "preferred_next_action_selector"
    ),
    firstValueAreaSelector: readStringFromRecord(record, "first_value_area_selector"),
    authExpected: readBooleanFromRecord(record, "auth_expected"),
    pageIntentHint,
  }
}

function readLiveSourceSurfaceView(input: {
  metadata: unknown
  storeDomain: string | null
  platform: string
  shopDomain: string | null
  accountIdentifier: string | null
}): LiveSourceSurfaceView {
  const metadata =
    input.metadata && typeof input.metadata === "object" && !Array.isArray(input.metadata)
      ? (input.metadata as Record<string, unknown>)
      : null
  const liveSourceUrl =
    readStringFromRecord(metadata, "primary_live_source_url") ??
    readStringFromRecord(metadata, "live_source_url")
  const liveSourceDomain =
    readStringFromRecord(metadata, "primary_live_source_domain") ??
    readStringFromRecord(metadata, "live_source_domain")
  const sourceEntityType = readStringFromRecord(metadata, "source_entity_type")
  const hasPrimaryLiveSource =
    Boolean(readStringFromRecord(metadata, "primary_live_source_url")) &&
    Boolean(readStringFromRecord(metadata, "primary_live_source_domain"))
  const connectedSystems = readStringArrayFromRecord(metadata, "connected_systems")
  const fallbackShopifyUrl =
    input.platform === "shopify" && (input.shopDomain ?? input.storeDomain)
      ? `https://${input.shopDomain ?? input.storeDomain}`
      : null

  return {
    primaryUrl: liveSourceUrl ?? fallbackShopifyUrl,
    domain: liveSourceDomain ?? input.shopDomain ?? input.storeDomain,
    identifier: input.accountIdentifier,
    sourceEntityType: hasPrimaryLiveSource ? "website_domain" : sourceEntityType,
    connectedSystems,
  }
}

function readActivationFlowLastRunView(source: unknown): ActivationFlowLastRunView | null {
  const metadata =
    source && typeof source === "object" && !Array.isArray(source)
      ? (source as Record<string, unknown>)
      : null
  if (!metadata) {
    return null
  }

  const runRecord =
    metadata.activation_flow_last_run &&
    typeof metadata.activation_flow_last_run === "object" &&
    !Array.isArray(metadata.activation_flow_last_run)
      ? (metadata.activation_flow_last_run as Record<string, unknown>)
      : null
  const runSummary =
    runRecord?.summary && typeof runRecord.summary === "object" && !Array.isArray(runRecord.summary)
      ? (runRecord.summary as Record<string, unknown>)
      : null
  const runPath =
    runRecord?.path && typeof runRecord.path === "object" && !Array.isArray(runRecord.path)
      ? (runRecord.path as Record<string, unknown>)
      : null

  const view: ActivationFlowLastRunView = {
    lastRunAt:
      readStringFromRecord(metadata, "activation_flow_last_run_at") ??
      readStringFromRecord(runSummary, "completed_at"),
    detectorVersion:
      readStringFromRecord(runRecord, "detector_version") ??
      readStringFromRecord(metadata, "activation_flow_runner_version"),
    runStatus: readStringFromRecord(runRecord, "status"),
    progressionOutcome:
      readStringFromRecord(metadata, "activation_flow_progression_outcome") ??
      readStringFromRecord(runSummary, "progression_outcome"),
    deadEndReason:
      readStringFromRecord(metadata, "activation_flow_dead_end_reason") ??
      readStringFromRecord(runSummary, "dead_end_reason"),
    entryUrl:
      readStringFromRecord(runPath, "entry_url") ??
      readStringFromRecord(metadata, "activation_flow_entry_url"),
    finalUrl: readStringFromRecord(runSummary, "final_url"),
    entryPageClassification: readStringFromRecord(runSummary, "entry_page_classification"),
    finalPageClassification: readStringFromRecord(runSummary, "final_page_classification"),
    primaryActionLabel: readStringFromRecord(runSummary, "primary_action_label"),
    primaryActionKind: readStringFromRecord(runSummary, "primary_action_kind"),
    primaryActionTarget: readStringFromRecord(runSummary, "primary_action_target"),
    hintSource: readStringFromRecord(metadata, "activation_flow_hints_source"),
    hintPrimarySelector: readStringFromRecord(runSummary, "hint_primary_selector"),
    hintPrimarySelectorMatched: readBooleanFromRecord(
      runSummary,
      "hint_primary_selector_matched"
    ),
    hintNextActionSelector: readStringFromRecord(runSummary, "hint_next_action_selector"),
    hintNextActionSelectorMatched: readBooleanFromRecord(
      runSummary,
      "hint_next_action_selector_matched"
    ),
    hintFirstValueSelector: readStringFromRecord(runSummary, "hint_first_value_selector"),
    hintFirstValueSelectorMatched: readBooleanFromRecord(
      runSummary,
      "hint_first_value_selector_matched"
    ),
    hintAuthExpected: readBooleanFromRecord(runSummary, "hint_auth_expected"),
    hintPageIntent: readStringFromRecord(runSummary, "hint_page_intent"),
    entryScreenshotRef: readStringFromRecord(runSummary, "entry_screenshot_ref"),
    progressionScreenshotRef: readStringFromRecord(
      runSummary,
      "progression_screenshot_ref"
    ),
    entryScreenshotSha256: readStringFromRecord(runSummary, "entry_screenshot_sha256"),
    progressionScreenshotSha256: readStringFromRecord(
      runSummary,
      "progression_screenshot_sha256"
    ),
    entryScreenshotBytes: readNumberFromRecord(runSummary, "entry_screenshot_bytes"),
    progressionScreenshotBytes: readNumberFromRecord(
      runSummary,
      "progression_screenshot_bytes"
    ),
  }

  const hasAnyRunField = Object.values(view).some(
    (value) => value !== null && value !== undefined
  )

  return hasAnyRunField ? view : null
}

function readUrlSourceAnalysisLastRunView(input: {
  metadata: unknown
  storeId: string
}): UrlSourceAnalysisLastRunView | null {
  const metadata =
    input.metadata && typeof input.metadata === "object" && !Array.isArray(input.metadata)
      ? (input.metadata as Record<string, unknown>)
      : null
  if (!metadata) {
    return null
  }

  const runRecord =
    metadata.url_source_analysis_last_run &&
    typeof metadata.url_source_analysis_last_run === "object" &&
    !Array.isArray(metadata.url_source_analysis_last_run)
      ? (metadata.url_source_analysis_last_run as Record<string, unknown>)
      : null
  const summary =
    runRecord?.summary && typeof runRecord.summary === "object" && !Array.isArray(runRecord.summary)
      ? (runRecord.summary as Record<string, unknown>)
      : null
  const evidenceRowsRaw =
    runRecord?.evidence_rows && Array.isArray(runRecord.evidence_rows)
      ? runRecord.evidence_rows
      : []
  const evidenceRows = evidenceRowsRaw
    .map((row) => {
      if (!row || typeof row !== "object" || Array.isArray(row)) {
        return null
      }
      const record = row as Record<string, unknown>
      const label = typeof record.label === "string" ? record.label.trim() : ""
      const value = typeof record.value === "string" ? record.value.trim() : ""
      if (!label || !value) {
        return null
      }
      return { label, value }
    })
    .filter((row): row is { label: string; value: string } => Boolean(row))

  if (!runRecord && !summary) {
    return null
  }
  const browserRecord =
    metadata.url_source_browser_inspection_last_run &&
    typeof metadata.url_source_browser_inspection_last_run === "object" &&
    !Array.isArray(metadata.url_source_browser_inspection_last_run)
      ? (metadata.url_source_browser_inspection_last_run as Record<string, unknown>)
      : null
  const funnelRecord =
    metadata.url_source_funnel_analysis_last_run &&
    typeof metadata.url_source_funnel_analysis_last_run === "object" &&
    !Array.isArray(metadata.url_source_funnel_analysis_last_run)
      ? (metadata.url_source_funnel_analysis_last_run as Record<string, unknown>)
      : null

  return {
    detectorVersion:
      readStringFromRecord(runRecord, "detector_version") ??
      readStringFromRecord(metadata, "url_source_analysis_runner_version"),
    status: readStringFromRecord(runRecord, "status"),
    runId: readStringFromRecord(summary, "runId"),
    entryUrl: readStringFromRecord(summary, "entryUrl"),
    finalUrl: readStringFromRecord(summary, "finalUrl"),
    completedAt:
      readStringFromRecord(summary, "completedAt") ??
      readStringFromRecord(metadata, "url_source_analysis_last_run_at"),
    businessType:
      readStringFromRecord(summary, "businessType") ??
      readStringFromRecord(metadata, "url_source_business_type"),
    revenueModel:
      readStringFromRecord(summary, "revenueModel") ??
      readStringFromRecord(metadata, "url_source_revenue_model"),
    surfaceClassification:
      readStringFromRecord(summary, "surfaceClassification") ??
      readStringFromRecord(metadata, "url_source_surface_classification"),
    revenuePathClarity:
      readStringFromRecord(summary, "revenuePathClarity") ??
      readStringFromRecord(metadata, "url_source_revenue_path_clarity"),
    noClearRevenuePath:
      readBooleanFromRecord(summary, "noClearRevenuePath") ??
      readBooleanFromRecord(metadata, "url_source_no_clear_revenue_path"),
    hasPricingPath: readBooleanFromRecord(summary, "hasPricingPath"),
    hasSignupPath: readBooleanFromRecord(summary, "hasSignupPath"),
    hasLoginPath: readBooleanFromRecord(summary, "hasLoginPath"),
    hasPrimaryCta: readBooleanFromRecord(summary, "hasPrimaryCta"),
    primaryCtaLabel: readStringFromRecord(summary, "primaryCtaLabel"),
    hasCheckoutSignal: readBooleanFromRecord(summary, "hasCheckoutSignal"),
    hasContactOrBookingPath: readBooleanFromRecord(summary, "hasContactOrBookingPath"),
    hasSubscriptionLanguage: readBooleanFromRecord(summary, "hasSubscriptionLanguage"),
    responseTimeMs: readNumberFromRecord(summary, "responseTimeMs"),
    browserFinalUrl: readStringFromRecord(browserRecord, "final_url"),
    browserPageTitle: readStringFromRecord(browserRecord, "page_title"),
    browserLoadTimeMs: readNumberFromRecord(browserRecord, "load_time_ms"),
    mobileHasAboveFoldCta: readBooleanFromRecord(browserRecord, "mobile_has_atf_cta"),
    mobileAboveFoldCtaLabels: readStringArrayFromRecord(browserRecord, "mobile_atf_cta_labels"),
    mobileViewportOverflow: readBooleanFromRecord(browserRecord, "mobile_viewport_overflow"),
    mobileScreenshotRef: readStringFromRecord(browserRecord, "mobile_screenshot_ref"),
    mobileScreenshotSha256: readStringFromRecord(browserRecord, "mobile_screenshot_sha256"),
    mobileScreenshotBytes: readNumberFromRecord(browserRecord, "mobile_screenshot_bytes"),
    desktopHasAboveFoldCta: readBooleanFromRecord(browserRecord, "desktop_has_atf_cta"),
    desktopAboveFoldCtaLabels: readStringArrayFromRecord(browserRecord, "desktop_atf_cta_labels"),
    desktopScreenshotRef: readStringFromRecord(browserRecord, "desktop_screenshot_ref"),
    desktopScreenshotSha256: readStringFromRecord(browserRecord, "desktop_screenshot_sha256"),
    desktopScreenshotBytes: readNumberFromRecord(browserRecord, "desktop_screenshot_bytes"),
    funnelSummary: readStringFromRecord(funnelRecord, "summary"),
    funnelRecommendedNextAction: readStringFromRecord(funnelRecord, "recommended_next_action"),
    funnelPagesInspected: readNumberFromRecord(funnelRecord, "pages_inspected"),
    funnelPageRoles: readStringArrayFromRecord(funnelRecord, "page_roles"),
    funnelPages: readUrlSourceFunnelPages(funnelRecord),
    httpStatus: readNumberFromRecord(summary, "httpStatus"),
    evidenceRows,
    errorMessage: readStringFromRecord(runRecord, "error_message"),
    storeId: input.storeId,
  }
}

function mapScanView(row: {
  id: string
  organization_id: string
  store_id: string
  status: string
  scanned_at: string
  completed_at: string | null
  detected_issues_count: number
  estimated_monthly_leakage: number
  error_message?: string | null
}): Scan {
  return {
    id: row.id,
    organizationId: row.organization_id,
    storeId: row.store_id,
    status: row.status as Scan["status"],
    scannedAt: row.scanned_at,
    completedAt: row.completed_at,
    detectedIssuesCount: row.detected_issues_count,
    estimatedMonthlyLeakage: row.estimated_monthly_leakage,
    errorMessage: row.error_message ?? null,
  }
}

async function loadShopifyDomainViews(organizationId: string) {
  const admin = createSupabaseAdminClient()
  const result = await admin
    .from("store_integrations")
    .select(
      "store_id, shop_domain, metadata, status, connection_health, sync_status, installed_at, created_at"
    )
    .eq("organization_id", organizationId)
    .eq("provider", "shopify")
    .neq("status", "disconnected")
    .order("installed_at", { ascending: false })
    .order("created_at", { ascending: false })

  if (result.error) {
    return new Map<string, ShopifyDomainView>()
  }

  const viewByStoreId = new Map<string, ShopifyDomainView>()
  for (const row of result.data ?? []) {
    if (viewByStoreId.has(row.store_id)) {
      continue
    }

    const canonical =
      readStringFromRecord(row.metadata, "canonical_shop_domain") ??
      readStringFromRecord(row.metadata, "shopify_canonical_domain")
    const lastError = readStringFromRecord(row.metadata, "last_error")

    viewByStoreId.set(row.store_id, {
      displayDomain: row.shop_domain ?? null,
      canonicalDomain: canonical,
      status: row.status ?? null,
      connectionHealth: row.connection_health ?? null,
      syncStatus: row.sync_status ?? null,
      lastError,
    })
  }

  return viewByStoreId
}

async function loadLiveSourceContextFromIntegrations(organizationId: string) {
  const admin = createSupabaseAdminClient()
  const connectorResult = await admin
    .from("store_integrations")
    .select("metadata, store_id, installed_at, created_at")
    .eq("organization_id", organizationId)
    .eq("provider", "checkoutleak_connector")
    .neq("status", "disconnected")
    .order("installed_at", { ascending: false })
    .order("created_at", { ascending: false })

  if (connectorResult.error) {
    return null
  }

  const connectorRows = connectorResult.data ?? []
  const primaryConnector =
    connectorRows.find((row) => isPrimaryUrlSourceMetadata(row.metadata)) ??
    connectorRows[0] ??
    null
  const primaryContext = primaryConnector
    ? readLiveSourceContextFromMetadata(primaryConnector.metadata)
    : null

  if (primaryContext) {
    return primaryContext
  }

  const result = await admin
    .from("store_integrations")
    .select("metadata, installed_at, created_at")
    .eq("organization_id", organizationId)
    .in("provider", ["shopify", "stripe"])
    .neq("status", "disconnected")
    .order("installed_at", { ascending: false })
    .order("created_at", { ascending: false })

  if (result.error) {
    return null
  }

  for (const row of result.data ?? []) {
    const found = readLiveSourceContextFromMetadata(row.metadata)
    if (found) {
      return found
    }
  }

  return null
}

async function loadPrimaryUrlSourceIntegration(organizationId: string) {
  const admin = createSupabaseAdminClient()
  const result = await admin
    .from("store_integrations")
    .select("metadata, store_id, installed_at, created_at")
    .eq("organization_id", organizationId)
    .eq("provider", "checkoutleak_connector")
    .neq("status", "disconnected")
    .order("installed_at", { ascending: false })
    .order("created_at", { ascending: false })

  if (result.error) {
    return { error: result.error, data: null }
  }

  const rows = result.data ?? []
  return {
    error: null,
    data:
      rows.find((row) => isPrimaryUrlSourceMetadata(row.metadata)) ??
      rows[0] ??
      null,
  }
}

function toStateForProvider(input: {
  provider: ConnectedProvider
  phase: "pending" | "first_results" | "completed"
}): OnboardingState {
  if (input.provider === "shopify") {
    if (input.phase === "pending") {
      return "pending_shopify"
    }
    if (input.phase === "first_results") {
      return "first_results_shopify"
    }
    return "completed_shopify"
  }

  if (input.phase === "pending") {
    return "pending_stripe"
  }
  if (input.phase === "first_results") {
    return "first_results_stripe"
  }
  return "completed_stripe"
}

function deriveOnboardingStateFromSignals(input: {
  cookieState: OnboardingState
  hasPlan: boolean
  signals: BackendSourceSignals | null
}): OnboardingState {
  if (input.cookieState === "demo") {
    return "demo"
  }

  if (!input.hasPlan) {
    return "empty"
  }

  if (isConnectingState(input.cookieState)) {
    return input.cookieState
  }

  if (
    (isPendingScanState(input.cookieState) ||
      input.cookieState === "first_results_shopify" ||
      input.cookieState === "first_results_stripe" ||
      input.cookieState === "completed_shopify" ||
      input.cookieState === "completed_stripe") &&
    (!input.signals || input.signals.providers.length === 0)
  ) {
    return input.cookieState
  }

  if (!input.signals || input.signals.providers.length === 0) {
    return "empty"
  }

  const provider = input.signals.primaryProvider ?? input.signals.providers[0]
  if (!provider) {
    return "empty"
  }

  const scans = input.signals.scanCountByProvider[provider]
  const issues = input.signals.issueCountByProvider[provider]

  if (scans === 0) {
    return toStateForProvider({ provider, phase: "pending" })
  }

  if (scans === 1 && issues > 0) {
    return toStateForProvider({ provider, phase: "first_results" })
  }

  if (
    input.cookieState === toStateForProvider({ provider, phase: "first_results" }) &&
    scans < 2 &&
    issues > 0
  ) {
    return input.cookieState
  }

  return toStateForProvider({ provider, phase: "completed" })
}

function getStoreStatus({
  issueCount,
  highestSeverity,
}: {
  issueCount: number
  highestSeverity: "critical" | "high" | "medium" | "low" | null
}) {
  if (issueCount === 0) {
    return { label: "Healthy", tone: "text-emerald-300" }
  }

  if (highestSeverity === "critical" || highestSeverity === "high") {
    return { label: "Action needed", tone: "text-amber-300" }
  }

  return { label: "Watch", tone: "text-sky-300" }
}

function getHighestSeverity(
  severities: Array<"critical" | "high" | "medium" | "low">
) {
  const priority = ["critical", "high", "medium", "low"] as const
  return priority.find((severity) => severities.includes(severity)) ?? null
}

function getSourceLabel(state: OnboardingState) {
  if (state.endsWith("shopify")) {
    return "Shopify"
  }

  if (state.endsWith("stripe")) {
    return "Stripe"
  }

  return "Revenue source"
}

function toRoleLabel(role: "owner" | "admin" | "analyst" | "viewer") {
  if (role === "owner") {
    return "Workspace owner"
  }

  if (role === "admin") {
    return "Workspace admin"
  }

  if (role === "analyst") {
    return "Analyst"
  }

  return "Viewer"
}

function buildDisplayName(input: { email: string | null; fullName: string | null }) {
  if (input.fullName && input.fullName.trim().length > 0) {
    return input.fullName.trim()
  }

  if (!input.email) {
    return "SilentLeak Operator"
  }

  const [localPart] = input.email.split("@")
  if (!localPart) {
    return "SilentLeak Operator"
  }

  const cleaned = localPart.replaceAll(/[._-]+/g, " ").trim()
  if (!cleaned) {
    return "SilentLeak Operator"
  }

  return cleaned
    .split(" ")
    .map((part) => `${part[0]?.toUpperCase() ?? ""}${part.slice(1)}`)
    .join(" ")
}

function toInitials(name: string) {
  const segments = name
    .split(" ")
    .map((segment) => segment.trim())
    .filter(Boolean)

  if (!segments.length) {
    return "CL"
  }

  if (segments.length === 1) {
    return segments[0].slice(0, 2).toUpperCase()
  }

  return `${segments[0][0] ?? ""}${segments[1][0] ?? ""}`.toUpperCase()
}

function normalizeSubscriptionStatusForUi(
  status: "none" | "trialing" | "active" | "past_due" | "canceled" | "incomplete"
) {
  if (
    status === "trialing" ||
    status === "active" ||
    status === "past_due" ||
    status === "canceled" ||
    status === "incomplete"
  ) {
    return status
  }

  return "incomplete" as const
}

function isFirstResultState(state: OnboardingState) {
  return state === "first_results_shopify" || state === "first_results_stripe"
}

function pickStoreByPlatform(snapshot: DashboardSnapshot, platform: "shopify" | "stripe") {
  return snapshot.stores.find((store) => store.platform === platform) ?? null
}

function buildFirstResultSnapshot(
  snapshot: DashboardSnapshot,
  state: OnboardingState
): DashboardSnapshot {
  const source = getConnectedSourceFromState(state)
  if (source !== "shopify" && source !== "stripe") {
    return snapshot
  }

  const targetStore = pickStoreByPlatform(snapshot, source)
  if (!targetStore) {
    return snapshot
  }

  const scans = snapshot.scans
    .filter((scan) => scan.storeId === targetStore.id)
    .sort((a, b) => +new Date(b.scannedAt) - +new Date(a.scannedAt))
    .slice(0, 1)
  const issues = snapshot.issues
    .filter((issue) => issue.storeId === targetStore.id)
    .sort((a, b) => b.estimatedMonthlyRevenueImpact - a.estimatedMonthlyRevenueImpact)
    .slice(0, 2)

  if (!issues.length) {
    return {
      ...snapshot,
      stores: [targetStore],
      scans,
      issues: [],
      summary: {
        ...snapshot.summary,
        estimatedMonthlyLeakage: 0,
        activeIssues: 0,
        monitoredStores: 1,
      },
      suggestedActions: [],
      revenueOpportunities: [],
    }
  }

  const issueIdSet = new Set(issues.map((issue) => issue.id))
  const suggestedActions = snapshot.suggestedActions
    .filter((action) => action.issueIds.some((issueId) => issueIdSet.has(issueId)))
    .slice(0, 2)

  const estimatedMonthlyLeakage = issues.reduce(
    (total, issue) => total + issue.estimatedMonthlyRevenueImpact,
    0
  )

  const revenueOpportunities = summarizeIssueImpactByLeakFamily(issues).map(
    ([family, impact]) => ({
      label: `Immediate ${formatLeakFamilyLabel(family).toLowerCase()} recovery`,
      estimatedMonthlyRevenueImpact: impact,
      confidence: "high" as const,
    })
  )

  return {
    ...snapshot,
    stores: [targetStore],
    scans,
    issues,
    summary: {
      ...snapshot.summary,
      estimatedMonthlyLeakage,
      activeIssues: issues.length,
      highestImpactIssue: issues[0],
      monitoredStores: 1,
    },
    suggestedActions,
    revenueOpportunities,
  }
}

function filterSnapshotForState(
  snapshot: DashboardSnapshot,
  state: OnboardingState
): DashboardSnapshot {
  if (isFirstResultState(state)) {
    return buildFirstResultSnapshot(snapshot, state)
  }

  if (state === "completed_shopify" || state === "completed_stripe") {
    return snapshot
  }

  const source = getConnectedSourceFromState(state)

  if (source === "demo") {
    return snapshot
  }

  if (source === "none") {
    return {
      ...snapshot,
      stores: [],
      scans: [],
      issues: [],
      summary: {
        ...snapshot.summary,
        estimatedMonthlyLeakage: 0,
        activeIssues: 0,
        monitoredStores: 0,
      },
    }
  }

  const targetStore = pickStoreByPlatform(snapshot, source)
  if (!targetStore) {
    return { ...snapshot, stores: [], scans: [], issues: [] }
  }

  const stores = [targetStore]
  const scans = snapshot.scans.filter((scan) => scan.storeId === targetStore.id)
  const issues = snapshot.issues.filter((issue) => issue.storeId === targetStore.id)

  const highestImpactIssue =
    [...issues].sort(
      (a, b) => b.estimatedMonthlyRevenueImpact - a.estimatedMonthlyRevenueImpact
    )[0] ?? snapshot.summary.highestImpactIssue

  const estimatedMonthlyLeakage = issues.reduce(
    (total, issue) => total + issue.estimatedMonthlyRevenueImpact,
    0
  )

  return {
    ...snapshot,
    stores,
    scans,
    issues,
    summary: {
      ...snapshot.summary,
      estimatedMonthlyLeakage,
      activeIssues: issues.length,
      highestImpactIssue,
      monitoredStores: stores.length,
    },
  }
}

function buildConnectingMonitor(state: OnboardingState) {
  const sourceLabel = getSourceLabel(state)

  return {
    storeId: `source_${sourceLabel.toLowerCase()}`,
    name: `${sourceLabel} source`,
    href: "/app/stores",
    statusLabel: "Connecting",
    statusTone: "text-sky-300",
    activeIssues: 0,
    latestScanLabel: "Connection in progress",
  }
}

function buildPendingMonitor(state: OnboardingState, store: Store | null) {
  const sourceLabel = getSourceLabel(state)

  return {
    storeId: store?.id ?? `source_${sourceLabel.toLowerCase()}`,
    name: store?.name ?? `${sourceLabel} source`,
    href: store ? `/app/stores/${store.id}` : "/app/stores",
    statusLabel: "First scan running",
    statusTone: "text-primary",
    activeIssues: 0,
    latestScanLabel: "First scan in progress",
  }
}

function buildFirstResultMonitor(state: OnboardingState, store: Store | null, issueCount: number) {
  const sourceLabel = getSourceLabel(state)

  return {
    storeId: store?.id ?? `source_${sourceLabel.toLowerCase()}`,
    name: store?.name ?? `${sourceLabel} source`,
    href: store ? `/app/stores/${store.id}` : "/app/stores",
    statusLabel: "First findings ready",
    statusTone: "text-primary",
    activeIssues: issueCount,
    latestScanLabel: "Initial scan completed",
  }
}

function buildReadyMonitors(snapshot: DashboardSnapshot) {
  return snapshot.stores.map((store) => {
    const storeIssues = snapshot.issues.filter(
      (issue) => issue.storeId === store.id && issue.status !== "resolved"
    )
    const latestScan = snapshot.scans.find((scan) => scan.storeId === store.id)
    const highestSeverity = getHighestSeverity(storeIssues.map((i) => i.severity))
    const status = getStoreStatus({
      issueCount: storeIssues.length,
      highestSeverity,
    })

    return {
      storeId: store.id,
      name: store.name,
      href: `/app/stores/${store.id}`,
      statusLabel: status.label,
      statusTone: status.tone,
      activeIssues: storeIssues.length,
      latestScanLabel: latestScan
        ? formatDistanceToNowStrict(new Date(latestScan.scannedAt), {
            addSuffix: true,
          })
        : "No scans yet",
    }
  })
}

function getPrimarySourceStatus(input: {
  onboardingState: OnboardingState
  shopifySourceState: Awaited<ReturnType<typeof getShopifySourceState>>
  stripeSourceState: Awaited<ReturnType<typeof getStripeSourceState>>
}) {
  const prefersShopify =
    input.onboardingState.endsWith("shopify") ||
    input.shopifySourceState.status !== "not_connected"
  const preferred = prefersShopify
    ? { provider: "shopify" as const, state: input.shopifySourceState }
    : { provider: "stripe" as const, state: input.stripeSourceState }

  const fallback =
    input.shopifySourceState.status !== "not_connected"
      ? { provider: "shopify" as const, state: input.shopifySourceState }
      : input.stripeSourceState.status !== "not_connected"
        ? { provider: "stripe" as const, state: input.stripeSourceState }
        : null

  if (preferred.state.status !== "not_connected") {
    return preferred
  }

  return fallback
}

async function getJourneyContext() {
  const cookieState = await getOnboardingState()
  const session = await getServerSession()

  if (!session) {
    console.info(
      "[auth] app route decision: authenticated=false; redirect=/auth/sign-in?next=/app; reason=no_server_session"
    )
    redirect("/auth/sign-in?next=/app")
  }

  let membership = session.membership
  if (!membership) {
    console.warn(
      `[auth] app route decision: authenticated=true; membership_missing=true; user=${session.user.id}`
    )
    try {
      membership = await ensureWorkspaceForUser({
        userId: session.user.id,
        email: session.user.email,
        fullName: session.user.fullName,
      })
    } catch {
      console.error(
        `[auth] app route decision: workspace_recovery_failed=true; user=${session.user.id}`
      )
      redirect("/app/billing?intent=workspace_setup_failed")
    }
  }

  const organizationId = membership.organizationId
  const planState = await getPlanStateForOrganization(organizationId)
  const entitlement = getPlanEntitlement(planState)
  const hasEntitledPlan = entitlement.hasActiveAccess
  const backendSignals = await loadBackendSourceSignals(organizationId)
  const state = deriveOnboardingStateFromSignals({
    cookieState,
    hasPlan: hasEntitledPlan,
    signals: backendSignals,
  })
  const hasPlan = hasEntitledPlan || state === "demo"
  const commercialAccessState = deriveCommercialAccessState({
    hasIdentity: true,
    hasPlan,
    onboardingState: state,
  })
  let shopifySourceState = await getShopifySourceState()
  let stripeSourceState = await getStripeSourceState()

  const providerFromState = getConnectedSourceFromState(state)
  const shopifyConnected = Boolean(backendSignals?.storeIdsByProvider.shopify.length)
  const stripeConnected = Boolean(backendSignals?.storeIdsByProvider.stripe.length)

  if (shopifyConnected) {
    const shopifyPhaseStatus =
      state === "pending_shopify"
        ? "syncing"
        : state === "connecting_shopify"
          ? "connecting"
          : "connected"

    shopifySourceState = {
      status: shopifyPhaseStatus,
      shopDomain: shopifySourceState.shopDomain,
      message:
        shopifyPhaseStatus === "syncing"
          ? "Initial scan in progress"
          : "Connected and monitoring",
    }
  } else if (
    providerFromState !== "shopify" &&
    cookieState !== "connecting_shopify" &&
    state !== "demo"
  ) {
    shopifySourceState = {
      status: "not_connected",
      shopDomain: null,
      message: null,
    }
  }

  if (stripeConnected) {
    const stripePhaseStatus =
      state === "pending_stripe"
        ? "syncing"
        : state === "connecting_stripe"
          ? "connecting"
          : "connected"

    stripeSourceState = {
      status: stripePhaseStatus,
      accountId: stripeSourceState.accountId,
      message:
        stripePhaseStatus === "syncing"
          ? "Initial billing scan in progress"
          : "Connected and monitoring",
    }
  } else if (
    providerFromState !== "stripe" &&
    cookieState !== "connecting_stripe" &&
    state !== "demo"
  ) {
    stripeSourceState = {
      status: "not_connected",
      accountId: null,
      message: null,
    }
  }

  const rawSnapshot =
    state === "demo"
      ? await getMockDashboardSnapshot()
      : await getDashboardSnapshotForOrganization(organizationId)
  const baseSnapshot: DashboardSnapshot = {
    ...rawSnapshot,
    organization: {
      ...rawSnapshot.organization,
      id: membership.organizationId,
      name: membership.organizationName,
      slug: membership.organizationSlug,
    },
  }
  let filteredSnapshot = filterSnapshotForState(baseSnapshot, state)
  const connectedSource = getConnectedSourceFromState(state)
  const sourceStore =
    connectedSource === "shopify" || connectedSource === "stripe"
      ? pickStoreByPlatform(baseSnapshot, connectedSource)
      : null

  if (isConnectingState(state)) {
    filteredSnapshot = {
      ...filteredSnapshot,
      stores: [],
      scans: [],
      issues: [],
      summary: {
        ...filteredSnapshot.summary,
        estimatedMonthlyLeakage: 0,
        activeIssues: 0,
        monitoredStores: 0,
      },
    }
  }

  if (isPendingScanState(state) && sourceStore) {
    filteredSnapshot = {
      ...filteredSnapshot,
      stores: [sourceStore],
      scans: [],
      issues: [],
      summary: {
        ...filteredSnapshot.summary,
        estimatedMonthlyLeakage: 0,
        activeIssues: 0,
        monitoredStores: 1,
      },
    }
  }

  if (state !== "demo" && filteredSnapshot.stores.length > 0) {
    const verifiedStoreIds = new Set<string>()
    const admin = createSupabaseAdminClient()

    for (const store of filteredSnapshot.stores) {
      const verification = await resolveStoreSourceVerification({
        admin,
        organizationId,
        storeId: store.id,
        operatorEmail: session.user.email,
      })
      if (verification.state === "verified") {
        verifiedStoreIds.add(store.id)
      }
    }

    const visibleIssues = filteredSnapshot.issues.filter((issue) =>
      verifiedStoreIds.has(issue.storeId)
    )
    const visibleScans = filteredSnapshot.scans.filter((scan) =>
      verifiedStoreIds.has(scan.storeId)
    )
    const activeIssues = visibleIssues.filter((issue) => issue.status !== "resolved")
    const highestImpactIssue =
      pickHighestImpactVisibleIssue(activeIssues) ??
      ({
        id: "protected_issue_placeholder",
        organizationId,
        storeId: filteredSnapshot.stores[0]?.id ?? "protected_source",
        scanId: visibleScans[0]?.id ?? "protected_scan",
        title: "No verified findings available",
        summary: "Verify a source to unlock detailed findings.",
        type: "setup_gap",
        severity: "low",
        status: "monitoring",
        estimatedMonthlyRevenueImpact: 0,
        recommendedAction: "Verify source ownership.",
        source: "system",
        detectedAt: new Date().toISOString(),
        whyItMatters:
          "Detailed findings are protected until source ownership is verified.",
      } as Issue)

    filteredSnapshot = {
      ...filteredSnapshot,
      scans: visibleScans,
      issues: visibleIssues,
      summary: {
        ...filteredSnapshot.summary,
        estimatedMonthlyLeakage: activeIssues.reduce(
          (total, issue) => total + issue.estimatedMonthlyRevenueImpact,
          0
        ),
        activeIssues: activeIssues.length,
        highestImpactIssue,
      },
      revenueOpportunities: buildVisibleRevenueOpportunities(activeIssues),
      suggestedActions: buildVisibleSuggestedActions(activeIssues),
    }
  }

  const displayName = buildDisplayName({
    email: session.user.email,
    fullName: session.user.fullName,
  })
  const shellUser = {
      id: session.user.id,
      fullName: displayName,
      email: session.user.email ?? "Unknown email",
      roleLabel: toRoleLabel(membership.role),
      initials: toInitials(displayName),
      timezone: session.user.timezone ?? "UTC",
    }

  return {
    state,
    cookieState,
    session,
    organizationId,
    planState,
    entitlement,
    hasPlan,
    commercialAccessState,
    shopifySourceState,
    stripeSourceState,
    backendSignals,
    connectedSource,
    baseSnapshot,
    snapshot: filteredSnapshot,
    sourceStore,
    shellUser,
  }
}

export async function getAppShellData() {
  const journey = await getJourneyContext()
  const primarySourceStatus = getPrimarySourceStatus({
    onboardingState: journey.state,
    shopifySourceState: journey.shopifySourceState,
    stripeSourceState: journey.stripeSourceState,
  })

  let liveMonitors: Array<{
    storeId: string
    name: string
    href: string
    statusLabel: string
    statusTone: string
    activeIssues: number
    latestScanLabel: string
  }> = []

  if (primarySourceStatus?.state.status === "connecting") {
    liveMonitors = [
      {
        ...buildConnectingMonitor(
          primarySourceStatus.provider === "shopify"
            ? "connecting_shopify"
            : "connecting_stripe"
        ),
        name:
          primarySourceStatus.provider === "shopify"
            ? primarySourceStatus.state.shopDomain ?? "Shopify source"
            : primarySourceStatus.state.accountId ?? "Stripe source",
      },
    ]
  } else if (primarySourceStatus?.state.status === "syncing") {
    liveMonitors = [
      buildPendingMonitor(
        primarySourceStatus.provider === "shopify"
          ? "pending_shopify"
          : "pending_stripe",
        journey.sourceStore
      ),
    ]
  } else if (isFirstResultState(journey.state)) {
    liveMonitors = [
      buildFirstResultMonitor(
        journey.state,
        journey.sourceStore,
        journey.snapshot.summary.activeIssues
      ),
    ]
  } else if (journey.state === "empty") {
    liveMonitors = []
  } else if (isConnectingState(journey.state)) {
    liveMonitors = [buildConnectingMonitor(journey.state)]
  } else if (isPendingScanState(journey.state)) {
    liveMonitors = [buildPendingMonitor(journey.state, journey.sourceStore)]
  } else {
    liveMonitors = buildReadyMonitors(journey.snapshot)
  }

  if (!journey.hasPlan) {
    liveMonitors = []
  }

  return {
    onboardingState: journey.state,
    isDemoMode: journey.state === "demo",
    commercialAccessState: journey.commercialAccessState,
    hasPlan: journey.hasPlan,
    planState: journey.planState,
    shopifySourceState: journey.shopifySourceState,
    stripeSourceState: journey.stripeSourceState,
    organization: journey.baseSnapshot.organization,
    user: journey.shellUser,
    activeIssueCount: journey.hasPlan ? journey.snapshot.summary.activeIssues : 0,
    liveMonitors,
  }
}

export async function getDashboardJourneyData() {
  const journey = await getJourneyContext()
  const shopifyDomainViews = await loadShopifyDomainViews(journey.organizationId)
  const setupAttentionView = Array.from(shopifyDomainViews.values()).find((view) =>
    isShopifySetupAttention(view)
  )
  const primaryOutcome = deriveScanOutcomeForPrimarySource({
    signals: journey.backendSignals,
  })
  const primarySourceStatus = getPrimarySourceStatus({
    onboardingState: journey.state,
    shopifySourceState: journey.shopifySourceState,
    stripeSourceState: journey.stripeSourceState,
  })

  if (primarySourceStatus?.state.status === "errored") {
    return {
      mode: "integration_error" as const,
      onboardingState: journey.state,
      organization: journey.baseSnapshot.organization,
      message:
        primarySourceStatus.state.message ??
        `${primarySourceStatus.provider === "shopify" ? "Shopify" : "Stripe"} connection encountered an error. Review connect status.`,
    }
  }

  if (journey.commercialAccessState === "authenticated_no_plan") {
    return {
      mode: "plan_required" as const,
      onboardingState: journey.state,
      organization: journey.baseSnapshot.organization,
      selectedPlan: journey.planState.plan,
      plans: mockPlanCatalog,
    }
  }

  if (setupAttentionView) {
    return {
      mode: "integration_error" as const,
      onboardingState: journey.state,
      organization: journey.baseSnapshot.organization,
      message:
        setupAttentionView.lastError ??
        "Shopify connected, but webhook registration needs attention. Review setup and retry.",
    }
  }

  if (primarySourceStatus?.state.status === "connecting") {
    return {
      mode: "connecting" as const,
      onboardingState: journey.state,
      organization: journey.baseSnapshot.organization,
      sourceLabel: primarySourceStatus.provider === "shopify" ? "Shopify" : "Stripe",
    }
  }

  if (primarySourceStatus?.state.status === "syncing" && journey.state === "empty") {
    return {
      mode: "pending_scan" as const,
      onboardingState: journey.state,
      organization: journey.baseSnapshot.organization,
      sourceLabel: primarySourceStatus.provider === "shopify" ? "Shopify" : "Stripe",
      checks: [
        "Checking checkout event continuity",
        "Mapping payment method coverage by session mix",
        "Evaluating billing retry and dunning configuration",
      ],
    }
  }

  if (journey.state === "demo") {
    return {
      mode: "ready" as const,
      scanOutcome:
        journey.snapshot.summary.activeIssues > 0 ? "issues_found" : "clean",
      onboardingState: journey.state,
      snapshot: journey.snapshot,
    }
  }

  if (primaryOutcome === "no_signal") {
    return {
      mode: "no_signal" as const,
      scanOutcome: "no_signal" as const,
      onboardingState: journey.state,
      organization: journey.baseSnapshot.organization,
      sourceLabel: getSourceLabel(journey.state),
      snapshot: journey.snapshot,
    }
  }

  if (isFirstResultState(journey.state) && primaryOutcome === "issues_found") {
    return {
      mode: "first_results" as const,
      scanOutcome: "issues_found" as const,
      onboardingState: journey.state,
      organization: journey.baseSnapshot.organization,
      sourceLabel: getSourceLabel(journey.state),
      snapshot: journey.snapshot,
    }
  }

  if (journey.state === "empty") {
    return {
      mode: "empty" as const,
      onboardingState: journey.state,
      organization: journey.baseSnapshot.organization,
    }
  }

  if (isConnectingState(journey.state)) {
    return {
      mode: "connecting" as const,
      onboardingState: journey.state,
      organization: journey.baseSnapshot.organization,
      sourceLabel: getSourceLabel(journey.state),
    }
  }

  if (isPendingScanState(journey.state)) {
    return {
      mode: "pending_scan" as const,
      onboardingState: journey.state,
      organization: journey.baseSnapshot.organization,
      sourceLabel: getSourceLabel(journey.state),
      checks: [
        "Checking checkout event continuity",
        "Mapping payment method coverage by session mix",
        "Evaluating billing retry and dunning configuration",
      ],
    }
  }

  return {
    mode: "ready" as const,
    scanOutcome: primaryOutcome ?? "clean",
    onboardingState: journey.state,
    snapshot: journey.snapshot,
  }
}

export async function getConnectJourneyData() {
  const journey = await getJourneyContext()
  const shopifySetup = getShopifySetupState()
  const stripeSetup = getStripeSetupState()
  const shopifyDomainViews = await loadShopifyDomainViews(journey.organizationId)
  const primaryShopifyView = Array.from(shopifyDomainViews.values())[0]
  const integrationLiveSourceContext = await loadLiveSourceContextFromIntegrations(
    journey.organizationId
  )
  const urlSourceIntegrationResult = await loadPrimaryUrlSourceIntegration(
    journey.organizationId
  )
  const cookieStore = await cookies()
  const cookieLiveSourceContext = parseLiveSourceContext(
    cookieStore.get(LIVE_SOURCE_CONTEXT_COOKIE)?.value
  )
  const liveSourceContext = integrationLiveSourceContext ?? cookieLiveSourceContext
  const connectedSystemDomains = await loadConnectedSystemDomains({
    admin: createSupabaseAdminClient(),
    organizationId: journey.organizationId,
  })

  const liveSourceVerification = liveSourceContext
    ? deriveSourceVerification({
        sourceDomain: liveSourceContext.domain,
        operatorEmail: journey.shellUser.email,
        connectedSystemDomains,
        metadataSources: [
          !urlSourceIntegrationResult.error
            ? urlSourceIntegrationResult.data?.metadata
            : null,
        ],
      })
    : null
  const urlSourceAnalysis =
    !urlSourceIntegrationResult.error && urlSourceIntegrationResult.data
      ? readUrlSourceAnalysisLastRunView({
          metadata: urlSourceIntegrationResult.data.metadata,
          storeId: urlSourceIntegrationResult.data.store_id,
        })
      : null
  const urlSourceStoreId =
    !urlSourceIntegrationResult.error && urlSourceIntegrationResult.data
      ? urlSourceIntegrationResult.data.store_id
      : null
  const latestUrlSourceScanResult = urlSourceStoreId
    ? await createSupabaseAdminClient()
        .from("scans")
        .select("id, organization_id, store_id, status, scanned_at, completed_at, detected_issues_count, estimated_monthly_leakage, error_message")
        .eq("organization_id", journey.organizationId)
        .eq("store_id", urlSourceStoreId)
        .order("scanned_at", { ascending: false })
        .limit(1)
        .maybeSingle()
    : null
  const latestUrlSourceScan =
    latestUrlSourceScanResult && !latestUrlSourceScanResult.error && latestUrlSourceScanResult.data
      ? mapScanView(latestUrlSourceScanResult.data)
      : null
  const urlSourceTopIssueResult = urlSourceStoreId
    ? await createSupabaseAdminClient()
        .from("issues")
        .select("id, title, summary, severity, estimated_monthly_revenue_impact, recommended_action, why_it_matters")
        .eq("organization_id", journey.organizationId)
        .eq("store_id", urlSourceStoreId)
        .neq("status", "resolved")
        .order("estimated_monthly_revenue_impact", { ascending: false })
        .order("detected_at", { ascending: false })
        .limit(1)
        .maybeSingle()
    : null
  const urlSourceTopIssue: UrlSourceTopIssueView | null =
    urlSourceTopIssueResult && !urlSourceTopIssueResult.error && urlSourceTopIssueResult.data
      ? {
          id: urlSourceTopIssueResult.data.id,
          title: urlSourceTopIssueResult.data.title,
          summary: urlSourceTopIssueResult.data.summary,
          severity: urlSourceTopIssueResult.data.severity,
          estimatedMonthlyRevenueImpact:
            urlSourceTopIssueResult.data.estimated_monthly_revenue_impact,
          recommendedAction: urlSourceTopIssueResult.data.recommended_action,
          whyItMatters: urlSourceTopIssueResult.data.why_it_matters,
          href: getFixPlanHrefForIssue(urlSourceTopIssueResult.data.id),
        }
      : null

  return {
    onboardingState: journey.state,
    commercialAccessState: journey.commercialAccessState,
    hasPlan: journey.hasPlan,
    selectedPlan: journey.planState.plan,
    shopifySourceState: journey.shopifySourceState,
    stripeSourceState: journey.stripeSourceState,
    shopifyConfigured: shopifySetup.configured,
    stripeConfigured: stripeSetup.configured,
    stripeSetupMissing: stripeSetup.missing,
    stripeWebhookConfigured: stripeSetup.webhookConfigured,
    shopifySetupAttention: isShopifySetupAttention(primaryShopifyView),
    shopifySetupAttentionMessage:
      primaryShopifyView?.lastError ??
      (primaryShopifyView?.syncStatus === "errored"
        ? "Shopify connected, but webhook registration needs attention."
        : null),
    liveSourceContext,
    liveSourceVerification,
    urlSourceAnalysis,
    urlSourceStoreId,
    latestUrlSourceScan,
    urlSourceTopIssue,
    organization: journey.baseSnapshot.organization,
  }
}

export async function getStoresIndexData() {
  const journey = await getJourneyContext()
  const shopifyDomainViews = await loadShopifyDomainViews(journey.organizationId)
  const primarySourceStatus = getPrimarySourceStatus({
    onboardingState: journey.state,
    shopifySourceState: journey.shopifySourceState,
    stripeSourceState: journey.stripeSourceState,
  })

  if (primarySourceStatus?.state.status === "connecting") {
    return {
      onboardingState: journey.state,
      commercialAccessState: journey.commercialAccessState,
      hasPlan: journey.hasPlan,
      shopifySourceState: journey.shopifySourceState,
      stripeSourceState: journey.stripeSourceState,
      organization: journey.baseSnapshot.organization,
      stores: [],
      stagingSource: {
        label: primarySourceStatus.provider === "shopify" ? "Shopify" : "Stripe",
        statusLabel: "Connecting",
        statusTone: "text-sky-300",
        message: "Credential handshake in progress. Source will appear after connection completes.",
      },
    }
  }

  if (primarySourceStatus?.state.status === "syncing" && !journey.sourceStore) {
    return {
      onboardingState: journey.state,
      commercialAccessState: journey.commercialAccessState,
      hasPlan: journey.hasPlan,
      shopifySourceState: journey.shopifySourceState,
      stripeSourceState: journey.stripeSourceState,
      organization: journey.baseSnapshot.organization,
      stores: [],
      stagingSource: {
        label: primarySourceStatus.provider === "shopify" ? "Shopify" : "Stripe",
        statusLabel: "First scan running",
        statusTone: "text-primary",
        message: "Source connected. First scan is preparing baseline signals.",
      },
    }
  }

  if (isFirstResultState(journey.state)) {
    return {
      onboardingState: journey.state,
      commercialAccessState: journey.commercialAccessState,
      hasPlan: journey.hasPlan,
      shopifySourceState: journey.shopifySourceState,
      stripeSourceState: journey.stripeSourceState,
      organization: journey.baseSnapshot.organization,
      stores: journey.snapshot.stores.map((store) => {
        const storeIssues = journey.snapshot.issues.filter(
          (issue) => issue.storeId === store.id && issue.status !== "resolved"
        )
        return {
          ...store,
          displayDomain:
            store.platform === "shopify"
              ? (shopifyDomainViews.get(store.id)?.displayDomain ?? store.domain)
              : store.domain,
          canonicalShopifyDomain:
            store.platform === "shopify"
              ? (shopifyDomainViews.get(store.id)?.canonicalDomain ?? store.domain)
              : null,
          setupAttention:
            store.platform === "shopify"
              ? (() => {
                  const view = shopifyDomainViews.get(store.id)
                  if (!view) {
                    return false
                  }
                  return (
                    view.status === "degraded" ||
                    view.connectionHealth === "degraded" ||
                    view.syncStatus === "errored"
                  )
                })()
              : false,
          setupAttentionMessage:
            store.platform === "shopify"
              ? (shopifyDomainViews.get(store.id)?.lastError ??
                (shopifyDomainViews.get(store.id)?.syncStatus === "errored"
                  ? "Webhook registration needs attention."
                  : null))
              : null,
          statusLabel: "First findings ready",
          statusTone: "text-primary",
          latestScanAt: journey.snapshot.scans[0]?.scannedAt ?? null,
          activeIssueCount: storeIssues.length,
          estimatedLeakage: storeIssues.reduce(
            (total, issue) => total + issue.estimatedMonthlyRevenueImpact,
            0
          ),
          topIssueTitle: storeIssues[0]?.title ?? null,
          href: `/app/stores/${store.id}`,
        }
      }),
      stagingSource: null,
    }
  }

  if (journey.state === "empty") {
    return {
      onboardingState: journey.state,
      commercialAccessState: journey.commercialAccessState,
      hasPlan: journey.hasPlan,
      shopifySourceState: journey.shopifySourceState,
      stripeSourceState: journey.stripeSourceState,
      organization: journey.baseSnapshot.organization,
      stores: [],
      stagingSource: null,
    }
  }

  if (isConnectingState(journey.state)) {
    return {
      onboardingState: journey.state,
      commercialAccessState: journey.commercialAccessState,
      hasPlan: journey.hasPlan,
      shopifySourceState: journey.shopifySourceState,
      stripeSourceState: journey.stripeSourceState,
      organization: journey.baseSnapshot.organization,
      stores: [],
      stagingSource: {
        label: getSourceLabel(journey.state),
        statusLabel: "Connecting",
        statusTone: "text-sky-300",
        message: "Credential handshake in progress. Source will appear after connection completes.",
      },
    }
  }

  if (isPendingScanState(journey.state)) {
    return {
      onboardingState: journey.state,
      commercialAccessState: journey.commercialAccessState,
      hasPlan: journey.hasPlan,
      shopifySourceState: journey.shopifySourceState,
      stripeSourceState: journey.stripeSourceState,
      organization: journey.baseSnapshot.organization,
      stores: journey.sourceStore
        ? [
            {
              ...journey.sourceStore,
              displayDomain:
                journey.sourceStore.platform === "shopify"
                  ? (shopifyDomainViews.get(journey.sourceStore.id)?.displayDomain ??
                    journey.sourceStore.domain)
                  : journey.sourceStore.domain,
              canonicalShopifyDomain:
                journey.sourceStore.platform === "shopify"
                  ? (shopifyDomainViews.get(journey.sourceStore.id)?.canonicalDomain ??
                    journey.sourceStore.domain)
                  : null,
              setupAttention:
                journey.sourceStore.platform === "shopify"
                  ? (() => {
                      const view = shopifyDomainViews.get(journey.sourceStore.id)
                      if (!view) {
                        return false
                      }
                      return (
                        view.status === "degraded" ||
                        view.connectionHealth === "degraded" ||
                        view.syncStatus === "errored"
                      )
                    })()
                  : false,
              setupAttentionMessage:
                journey.sourceStore.platform === "shopify"
                  ? (shopifyDomainViews.get(journey.sourceStore.id)?.lastError ??
                    (shopifyDomainViews.get(journey.sourceStore.id)?.syncStatus === "errored"
                      ? "Webhook registration needs attention."
                      : null))
                  : null,
              statusLabel: "First scan running",
              statusTone: "text-primary",
              latestScanAt: null,
              activeIssueCount: 0,
              estimatedLeakage: 0,
              topIssueTitle: null,
              href: `/app/stores/${journey.sourceStore.id}`,
            },
          ]
        : [],
      stagingSource: null,
    }
  }

  const stores = journey.snapshot.stores.filter((store) => store.platform !== "website").map((store) => {
    const storeIssues = journey.snapshot.issues.filter(
      (issue) => issue.storeId === store.id && issue.status !== "resolved"
    )
    const latestScan = journey.snapshot.scans.find((scan) => scan.storeId === store.id)
    const highestSeverity = getHighestSeverity(storeIssues.map((i) => i.severity))
    const status = getStoreStatus({
      issueCount: storeIssues.length,
      highestSeverity,
    })
    const estimatedLeakage = storeIssues.reduce(
      (total, issue) => total + issue.estimatedMonthlyRevenueImpact,
      0
    )
    const topIssue = [...storeIssues].sort(
      (a, b) => b.estimatedMonthlyRevenueImpact - a.estimatedMonthlyRevenueImpact
    )[0]

    return {
      ...store,
      displayDomain:
        store.platform === "shopify"
          ? (shopifyDomainViews.get(store.id)?.displayDomain ?? store.domain)
          : store.domain,
      canonicalShopifyDomain:
        store.platform === "shopify"
          ? (shopifyDomainViews.get(store.id)?.canonicalDomain ?? store.domain)
          : null,
      setupAttention:
        store.platform === "shopify"
          ? (() => {
              const view = shopifyDomainViews.get(store.id)
              if (!view) {
                return false
              }
              return (
                view.status === "degraded" ||
                view.connectionHealth === "degraded" ||
                view.syncStatus === "errored"
              )
            })()
          : false,
      setupAttentionMessage:
        store.platform === "shopify"
          ? (shopifyDomainViews.get(store.id)?.lastError ??
            (shopifyDomainViews.get(store.id)?.syncStatus === "errored"
              ? "Webhook registration needs attention."
              : null))
          : null,
      statusLabel:
        store.platform === "shopify" &&
        (() => {
          const view = shopifyDomainViews.get(store.id)
          return Boolean(
            view &&
              (view.status === "degraded" ||
                view.connectionHealth === "degraded" ||
                view.syncStatus === "errored")
          )
        })()
          ? "Setup attention"
          : status.label,
      statusTone:
        store.platform === "shopify" &&
        (() => {
          const view = shopifyDomainViews.get(store.id)
          return Boolean(
            view &&
              (view.status === "degraded" ||
                view.connectionHealth === "degraded" ||
                view.syncStatus === "errored")
          )
        })()
          ? "text-amber-300"
          : status.tone,
      latestScanAt: latestScan?.scannedAt ?? null,
      activeIssueCount: storeIssues.length,
      estimatedLeakage,
      topIssueTitle: topIssue?.title ?? null,
      href: `/app/stores/${store.id}`,
    }
  })

  return {
    onboardingState: journey.state,
    commercialAccessState: journey.commercialAccessState,
    hasPlan: journey.hasPlan,
    shopifySourceState: journey.shopifySourceState,
    stripeSourceState: journey.stripeSourceState,
    organization: journey.baseSnapshot.organization,
    stores,
    stagingSource: null,
  }
}

export async function getStoreDetailData(storeId: string) {
  const journey = await getJourneyContext()
  const shopifyDomainViews = await loadShopifyDomainViews(journey.organizationId)
  const admin = createSupabaseAdminClient()

  const snapshot =
    isPendingScanState(journey.state) && journey.sourceStore
      ? {
          ...journey.snapshot,
          stores: [journey.sourceStore],
          issues: [],
          scans: [],
        }
      : journey.snapshot

  let store: Store | undefined = snapshot.stores.find((item) => item.id === storeId)

  // For non-ready states, still allow access to website platform stores (URL source)
  if (!store && !isReadyState(journey.state) && !isPendingScanState(journey.state)) {
    const directResult = await admin
      .from("stores")
      .select("id, organization_id, name, platform, domain, timezone, currency, active, created_at")
      .eq("id", storeId)
      .eq("organization_id", journey.organizationId)
      .eq("platform", "website")
      .maybeSingle()
    if (!directResult.error && directResult.data) {
      const d = directResult.data
      store = {
        id: d.id,
        organizationId: d.organization_id,
        name: d.name,
        platform: d.platform as "website",
        domain: d.domain,
        timezone: d.timezone,
        currency: d.currency,
        active: d.active,
        createdAt: d.created_at,
      }
    }
  }

  if (!store) {
    return null
  }

  const isWebsiteStore = store.platform === "website"
  const useDirectQuery =
    isWebsiteStore || (isPendingScanState(journey.state) && store.id === storeId)

  let scans: typeof snapshot.scans
  let issues: typeof snapshot.issues

  if (useDirectQuery) {
    const [scansResult, issuesResult] = await Promise.all([
      admin
        .from("scans")
        .select("id, organization_id, store_id, status, scanned_at, completed_at, detected_issues_count, estimated_monthly_leakage, error_message")
        .eq("organization_id", journey.organizationId)
        .eq("store_id", storeId)
        .order("scanned_at", { ascending: false })
        .limit(5),
      admin
        .from("issues")
        .select("id, organization_id, store_id, scan_id, title, summary, type, severity, status, estimated_monthly_revenue_impact, recommended_action, source, detected_at, why_it_matters")
        .eq("organization_id", journey.organizationId)
        .eq("store_id", storeId)
        .neq("status", "resolved"),
    ])
    scans = (scansResult.data ?? []).map(mapScanView)
    issues = (issuesResult.data ?? []).map((i) => ({
      id: i.id,
      organizationId: i.organization_id,
      storeId: i.store_id,
      scanId: i.scan_id,
      title: i.title,
      summary: i.summary,
      type: i.type as import("@/types/domain").IssueType,
      severity: i.severity as import("@/types/domain").IssueSeverity,
      status: i.status as import("@/types/domain").IssueStatus,
      estimatedMonthlyRevenueImpact: i.estimated_monthly_revenue_impact,
      recommendedAction: i.recommended_action,
      source: i.source,
      detectedAt: i.detected_at,
      whyItMatters: i.why_it_matters,
    }))
  } else {
    scans = snapshot.scans.filter((scan) => scan.storeId === storeId)
    issues = snapshot.issues.filter(
      (issue) => issue.storeId === storeId && issue.status !== "resolved"
    )
  }
  const latestScan = scans[0] ?? null
  const latestSuccessfulScan = scans.find((scan) => scan.status === "completed") ?? null
  const highestSeverity = getHighestSeverity(issues.map((i) => i.severity))
  const status = getStoreStatus({ issueCount: issues.length, highestSeverity })
  const integrationView = shopifyDomainViews.get(storeId)
  const setupAttention =
    store.platform === "shopify" &&
    Boolean(
      integrationView &&
        (integrationView.status === "degraded" ||
          integrationView.connectionHealth === "degraded" ||
          integrationView.syncStatus === "errored")
    )
  const setupAttentionMessage =
    store.platform === "shopify"
      ? (integrationView?.lastError ??
        (integrationView?.syncStatus === "errored"
          ? "Webhook registration needs attention."
          : null))
      : null
  const estimatedLeakage = issues.reduce(
    (total, issue) => total + issue.estimatedMonthlyRevenueImpact,
    0
  )
  const context =
    mockStoreContexts.find((item) => item.storeId === storeId) ?? null
  const integrationResult = await admin
    .from("store_integrations")
    .select("id, provider, status, metadata, account_identifier, shop_domain")
    .eq("organization_id", journey.organizationId)
    .eq("store_id", storeId)
    .neq("status", "disconnected")
    .order("installed_at", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()
  const integration =
    integrationResult.error || !integrationResult.data
      ? null
      : {
          id: integrationResult.data.id,
          provider: integrationResult.data.provider,
          status: integrationResult.data.status,
          accountIdentifier: integrationResult.data.account_identifier,
          shopDomain: integrationResult.data.shop_domain,
          liveSourceSurface: readLiveSourceSurfaceView({
            metadata: integrationResult.data.metadata,
            storeDomain: store.domain,
            platform: store.platform,
            shopDomain: integrationResult.data.shop_domain,
            accountIdentifier: integrationResult.data.account_identifier,
          }),
          activationFlowHints: readActivationFlowHintsView(integrationResult.data.metadata),
          activationLastRun: readActivationFlowLastRunView(integrationResult.data.metadata),
        }
  const urlSourceAnalysis =
    isWebsiteStore && !integrationResult.error && integrationResult.data
      ? readUrlSourceAnalysisLastRunView({
          metadata: integrationResult.data.metadata,
          storeId: store.id,
        })
      : null
  const sourceVerification = await resolveStoreSourceVerification({
    admin,
    organizationId: journey.organizationId,
    storeId: store.id,
    operatorEmail: journey.shellUser.email,
  })

  const fixPlanLinks = issues
    .map((issue) => ({
      issueId: issue.id,
      title: issue.title,
      href: getFixPlanHrefForIssue(issue.id),
      estimatedMonthlyRevenueImpact: issue.estimatedMonthlyRevenueImpact,
    }))
    .filter((item): item is typeof item & { href: string } => Boolean(item.href))
    .slice(0, 3)

  return {
    onboardingState: journey.state,
    commercialAccessState: journey.commercialAccessState,
    hasPlan: journey.hasPlan,
    shopifySourceState: journey.shopifySourceState,
    stripeSourceState: journey.stripeSourceState,
    organization: journey.baseSnapshot.organization,
    store,
    storeDisplayDomain:
      store.platform === "shopify"
        ? (shopifyDomainViews.get(store.id)?.displayDomain ?? store.domain)
        : store.domain,
    canonicalShopifyDomain:
      store.platform === "shopify"
        ? (shopifyDomainViews.get(store.id)?.canonicalDomain ?? store.domain)
        : null,
    context,
    status:
      isPendingScanState(journey.state) && issues.length === 0
        ? { label: "First scan running", tone: "text-primary" }
        : setupAttention
          ? { label: "Setup attention", tone: "text-amber-300" }
          : status,
    latestScan,
    latestSuccessfulScan,
    issues,
    scans,
    estimatedLeakage,
    fixPlanLinks,
    setupAttention,
    setupAttentionMessage,
    integration,
    urlSourceAnalysis,
    sourceVerification,
  }
}

export async function getSettingsData() {
  const journey = await getJourneyContext()
  const stores = await getStoresIndexData()
  const fallbackPlan =
    journey.planState.subscription?.plan ?? journey.planState.plan ?? "growth"
  const planPricing = mockPlanCatalog[fallbackPlan]
  const subscription = journey.planState.subscription
    ? {
        ...mockSubscriptionState,
        plan: journey.planState.subscription.plan,
        status: normalizeSubscriptionStatusForUi(journey.planState.subscription.status),
        amount: planPricing.monthlyPrice,
        seats: journey.planState.subscription.seats,
        nextInvoiceDate: journey.planState.subscription.currentPeriodEnd,
      }
    : null

  const admin = createSupabaseAdminClient()
  const orgId = journey.baseSnapshot.organization.id
  const userId = journey.shellUser.id

  const [profileResult, wsResult] = await Promise.all([
    admin.from("operator_profiles").select("display_name, timezone").eq("user_id", userId).maybeSingle(),
    admin.from("workspace_settings").select("issue_alerts, weekly_digest_day, billing_alerts_enabled, digest_enabled").eq("org_id", orgId).maybeSingle(),
  ])

  const profile = profileResult.data
  const ws = wsResult.data

  const notificationPreferences = {
    issueAlerts: ws?.issue_alerts ?? mockNotificationPreferences.issueAlerts,
    weeklyDigestDay: ws?.weekly_digest_day ?? mockNotificationPreferences.weeklyDigestDay,
    billingAlerts: ws?.billing_alerts_enabled ?? mockNotificationPreferences.billingAlerts,
    digestEnabled: ws?.digest_enabled ?? true,
  }

  const user = {
    ...journey.shellUser,
    fullName: profile?.display_name ?? journey.shellUser.fullName,
    timezone: profile?.timezone ?? journey.shellUser.timezone,
    savedDisplayName: profile?.display_name ?? "",
    savedTimezone: profile?.timezone ?? journey.shellUser.timezone ?? "UTC",
  }

  return {
    onboardingState: journey.state,
    commercialAccessState: journey.commercialAccessState,
    hasPlan: journey.hasPlan,
    shopifySourceState: journey.shopifySourceState,
    stripeSourceState: journey.stripeSourceState,
    user,
    organization: journey.baseSnapshot.organization,
    notificationPreferences,
    subscription,
    connectedStores: stores.stores.map((store) => ({
      id: store.id,
      name: store.name,
      platform: store.platform,
      href: store.href,
    })),
  }
}

export async function getBillingData() {
  const journey = await getJourneyContext()
  const fallbackPlan = journey.planState.subscription?.plan ?? journey.planState.plan ?? "growth"
  const planPricing = mockPlanCatalog[fallbackPlan]
  const subscription = journey.planState.subscription
    ? {
        ...mockSubscriptionState,
        plan: journey.planState.subscription?.plan ?? fallbackPlan,
        status: normalizeSubscriptionStatusForUi(journey.planState.subscription.status),
        amount: planPricing.monthlyPrice,
        seats: journey.planState.subscription?.seats ?? mockSubscriptionState.seats,
        nextInvoiceDate:
          journey.planState.subscription?.currentPeriodEnd ??
          mockSubscriptionState.nextInvoiceDate,
      }
    : null

  return {
    onboardingState: journey.state,
    commercialAccessState: journey.commercialAccessState,
    hasPlan: journey.hasPlan,
    selectedPlan: journey.planState.plan,
    planCatalog: mockPlanCatalog,
    shopifySourceState: journey.shopifySourceState,
    stripeSourceState: journey.stripeSourceState,
    organization: journey.baseSnapshot.organization,
    subscription,
    billingStatus: journey.planState.status,
    hasBillingProfile: Boolean(journey.planState.subscription),
    activeIssueCount: journey.hasPlan ? journey.snapshot.summary.activeIssues : 0,
    estimatedLeakage: journey.hasPlan ? journey.snapshot.summary.estimatedMonthlyLeakage : 0,
    monitoredStores: journey.hasPlan ? journey.snapshot.summary.monitoredStores : 0,
  }
}
