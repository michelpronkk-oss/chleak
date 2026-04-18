import { formatDistanceToNowStrict } from "date-fns"
import { redirect } from "next/navigation"

import {
  mockNotificationPreferences,
  mockPlanCatalog,
  mockStoreContexts,
  mockSubscriptionState,
} from "@/data/mock/app-state"
import { getMockDashboardSnapshot } from "@/data/mock/dashboard"
import { getServerSession } from "@/lib/auth/session"
import { createSupabaseAdminClient } from "@/lib/supabase/shared"
import { ensureWorkspaceForUser } from "@/server/services/account-bootstrap-service"
import { getFixPlanHrefForIssue } from "@/server/services/fix-plan-service"
import type { DashboardSnapshot, Store } from "@/types/domain"

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
} from "./source-connection-state-service"
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
}

interface ShopifyDomainView {
  displayDomain: string | null
  canonicalDomain: string | null
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

  if (scans === 0) {
    return null
  }

  if (issues > 0) {
    return "issues_found"
  }

  return scans <= 1 ? "no_signal" : "clean"
}

async function loadBackendSourceSignals(
  organizationId: string
): Promise<BackendSourceSignals | null> {
  try {
    const admin = createSupabaseAdminClient()
    const integrationsResult = await admin
      .from("store_integrations")
      .select("provider, status, store_id, installed_at, created_at")
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

    if (!rows.length) {
      return {
        providers: [],
        primaryProvider: null,
        storeIdsByProvider: { shopify: [], stripe: [] },
        scanCountByProvider: { shopify: 0, stripe: 0 },
        issueCountByProvider: { shopify: 0, stripe: 0 },
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

    const primaryRow = [...rows].sort((a, b) => {
      const left = a.installed_at ?? a.created_at ?? ""
      const right = b.installed_at ?? b.created_at ?? ""
      return right.localeCompare(left)
    })[0]

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

    return {
      providers,
      primaryProvider,
      storeIdsByProvider,
      scanCountByProvider,
      issueCountByProvider,
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

async function loadShopifyDomainViews(organizationId: string) {
  const admin = createSupabaseAdminClient()
  const result = await admin
    .from("store_integrations")
    .select("store_id, shop_domain, metadata, installed_at, created_at")
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

    viewByStoreId.set(row.store_id, {
      displayDomain: row.shop_domain ?? null,
      canonicalDomain: canonical,
    })
  }

  return viewByStoreId
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
  if (!input.hasPlan) {
    return input.cookieState === "demo" ? "demo" : "empty"
  }

  if (isConnectingState(input.cookieState)) {
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

  if (input.cookieState === toStateForProvider({ provider, phase: "first_results" }) && scans < 2) {
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
    return "CheckoutLeak Operator"
  }

  const [localPart] = input.email.split("@")
  if (!localPart) {
    return "CheckoutLeak Operator"
  }

  const cleaned = localPart.replaceAll(/[._-]+/g, " ").trim()
  if (!cleaned) {
    return "CheckoutLeak Operator"
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

  const revenueOpportunities = [
    {
      label:
        source === "shopify"
          ? "Immediate checkout recovery"
          : "Immediate billing recovery",
      estimatedMonthlyRevenueImpact: estimatedMonthlyLeakage,
      confidence: "high" as const,
    },
  ]

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
    href: "/app/connect",
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
    href: store ? `/app/stores/${store.id}` : "/app/connect",
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
    href: store ? `/app/stores/${store.id}` : "/app/connect",
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
    console.info("[auth] app route decision: authenticated=false; redirect=/auth/sign-in")
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
  const hasPlan = entitlement.hasActiveAccess
  const backendSignals = await loadBackendSourceSignals(organizationId)
  const state = deriveOnboardingStateFromSignals({
    cookieState,
    hasPlan,
    signals: backendSignals,
  })
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
  } else if (providerFromState !== "shopify" && cookieState !== "connecting_shopify") {
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
  } else if (providerFromState !== "stripe" && cookieState !== "connecting_stripe") {
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

  if (isFirstResultState(journey.state)) {
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

  const stores = journey.snapshot.stores.map((store) => {
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
      statusLabel: status.label,
      statusTone: status.tone,
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

  if (!isReadyState(journey.state) && !isPendingScanState(journey.state)) {
    return null
  }

  const snapshot =
    isPendingScanState(journey.state) && journey.sourceStore
      ? {
          ...journey.snapshot,
          stores: [journey.sourceStore],
          issues: [],
          scans: [],
        }
      : journey.snapshot

  const store = snapshot.stores.find((item) => item.id === storeId)
  if (!store) {
    return null
  }

  const scans = snapshot.scans.filter((scan) => scan.storeId === storeId)
  const issues = snapshot.issues.filter(
    (issue) => issue.storeId === storeId && issue.status !== "resolved"
  )
  const latestScan = scans[0] ?? null
  const highestSeverity = getHighestSeverity(issues.map((i) => i.severity))
  const status = getStoreStatus({ issueCount: issues.length, highestSeverity })
  const estimatedLeakage = issues.reduce(
    (total, issue) => total + issue.estimatedMonthlyRevenueImpact,
    0
  )
  const context =
    mockStoreContexts.find((item) => item.storeId === storeId) ?? null

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
        : status,
    latestScan,
    issues,
    scans,
    estimatedLeakage,
    fixPlanLinks,
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

  return {
    onboardingState: journey.state,
    commercialAccessState: journey.commercialAccessState,
    hasPlan: journey.hasPlan,
    shopifySourceState: journey.shopifySourceState,
    stripeSourceState: journey.stripeSourceState,
    user: journey.shellUser,
    organization: journey.baseSnapshot.organization,
    notificationPreferences: mockNotificationPreferences,
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
