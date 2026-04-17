import { formatDistanceToNowStrict } from "date-fns"

import {
  mockNotificationPreferences,
  mockOperatorUser,
  mockStoreContexts,
  mockSubscriptionState,
} from "@/data/mock/app-state"
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
  getShopifySourceState,
  getStripeSourceState,
} from "./source-connection-state-service"
import { getShopifySetupState } from "./shopify-service"
import { getStripeSetupState } from "./stripe-service"

const organizationId =
  process.env.CHECKOUTLEAK_DEFAULT_ORGANIZATION_ID ?? "org_luma-health"

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
  const state = await getOnboardingState()
  const shopifySourceState = await getShopifySourceState()
  const stripeSourceState = await getStripeSourceState()
  const baseSnapshot = await getDashboardSnapshotForOrganization(organizationId)
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

  return {
    state,
    shopifySourceState,
    stripeSourceState,
    connectedSource,
    baseSnapshot,
    snapshot: filteredSnapshot,
    sourceStore,
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

  return {
    onboardingState: journey.state,
    shopifySourceState: journey.shopifySourceState,
    stripeSourceState: journey.stripeSourceState,
    organization: journey.baseSnapshot.organization,
    user: mockOperatorUser,
    activeIssueCount: journey.snapshot.summary.activeIssues,
    liveMonitors,
  }
}

export async function getDashboardJourneyData() {
  const journey = await getJourneyContext()
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

  if (isFirstResultState(journey.state)) {
    return {
      mode: "first_results" as const,
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
    shopifySourceState: journey.shopifySourceState,
    stripeSourceState: journey.stripeSourceState,
    shopifyConfigured: shopifySetup.configured,
    stripeConfigured: stripeSetup.configured,
    organization: journey.baseSnapshot.organization,
  }
}

export async function getStoresIndexData() {
  const journey = await getJourneyContext()
  const primarySourceStatus = getPrimarySourceStatus({
    onboardingState: journey.state,
    shopifySourceState: journey.shopifySourceState,
    stripeSourceState: journey.stripeSourceState,
  })

  if (primarySourceStatus?.state.status === "connecting") {
    return {
      onboardingState: journey.state,
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
      shopifySourceState: journey.shopifySourceState,
      stripeSourceState: journey.stripeSourceState,
      organization: journey.baseSnapshot.organization,
      stores: journey.snapshot.stores.map((store) => {
        const storeIssues = journey.snapshot.issues.filter(
          (issue) => issue.storeId === store.id && issue.status !== "resolved"
        )
        return {
          ...store,
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
      shopifySourceState: journey.shopifySourceState,
      stripeSourceState: journey.stripeSourceState,
      organization: journey.baseSnapshot.organization,
      stores: journey.sourceStore
        ? [
            {
              ...journey.sourceStore,
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
    shopifySourceState: journey.shopifySourceState,
    stripeSourceState: journey.stripeSourceState,
    organization: journey.baseSnapshot.organization,
    stores,
    stagingSource: null,
  }
}

export async function getStoreDetailData(storeId: string) {
  const journey = await getJourneyContext()

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
    shopifySourceState: journey.shopifySourceState,
    stripeSourceState: journey.stripeSourceState,
    organization: journey.baseSnapshot.organization,
    store,
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

  return {
    onboardingState: journey.state,
    shopifySourceState: journey.shopifySourceState,
    stripeSourceState: journey.stripeSourceState,
    user: mockOperatorUser,
    organization: journey.baseSnapshot.organization,
    notificationPreferences: mockNotificationPreferences,
    subscription: mockSubscriptionState,
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

  return {
    onboardingState: journey.state,
    shopifySourceState: journey.shopifySourceState,
    stripeSourceState: journey.stripeSourceState,
    organization: journey.baseSnapshot.organization,
    subscription: mockSubscriptionState,
    activeIssueCount: journey.snapshot.summary.activeIssues,
    estimatedLeakage: journey.snapshot.summary.estimatedMonthlyLeakage,
    monitoredStores: journey.snapshot.summary.monitoredStores,
  }
}
