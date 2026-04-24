import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowRight, Check, ChevronRight, CircleCheck, CircleDashed, CircleDot, Globe2 } from "lucide-react"

export const metadata: Metadata = {
  title: "Sources",
}

import { SubmitButton } from "@/components/ui/submit-button"
import { ScanStatePill } from "@/components/dashboard/vault-primitives"
import { normalizeLiveSourceUrl } from "@/lib/live-source"
import { cn } from "@/lib/utils"
import { formatCompactCurrency, formatRelativeTimestamp } from "@/lib/format"
import { getConnectJourneyData, getStoresIndexData } from "@/server/services/app-service"
import {
  setLiveSourceContext,
  triggerPrimaryUrlSourceAnalysis,
} from "../connect/actions"
import { DisconnectButton } from "../connect/disconnect-button"
import { ShopifyConnectSubmitButton } from "../connect/shopify-connect-submit-button"
import { StripeConnectSubmitButton } from "../connect/stripe-connect-submit-button"

const statusMessage: Record<string, string> = {
  setup_required: "Stripe connect setup is incomplete in this environment.",
  invalid_shop: "Use a valid Shopify domain in the format your-store.myshopify.com.",
  callback_missing: "Connection callback did not include required parameters.",
  callback_invalid: "Connection callback verification failed.",
  callback_failed: "Connection callback processing failed. Retry the connection.",
  callback_declined: "Stripe connection was not approved.",
  state_mismatch: "Connection state did not match this session. Retry the connection.",
  webhook_registration_failed:
    "Shopify connected, but webhook registration needs attention. Review setup and retry.",
  connected: "Connected successfully. First scan has been queued.",
  disconnected: "Shopify has been disconnected.",
  disconnect_failed: "Shopify disconnect failed. Retry in a moment.",
  invalid_source_url: "Use a valid URL or domain for the live revenue surface.",
  context_saved: "Live source context saved.",
  context_save_failed: "Could not save live source context. Retry in a moment.",
  source_not_set: "Set a primary live source URL before running URL-source analysis.",
  queue_failed: "Could not queue URL-source analysis. Retry in a moment.",
  completed: "URL-source analysis completed. Summary has been updated.",
  queued: "URL-source analysis queued. The worker will update this source when results are ready.",
  trigger_failed: "URL-source analysis was created, but the worker could not be started. Retry in a moment.",
  unsupported_provider: "This source does not have a supported scan worker yet.",
  unauthorized: "You are not authorized to run URL-source analysis for this workspace.",
  lookup_failed: "URL-source analysis lookup failed. Retry in a moment.",
  store_missing: "URL-source analysis store context is missing.",
  integration_missing: "URL-source analysis integration context is missing.",
  running_update_failed: "URL-source analysis could not enter running state.",
  scan_not_queued_or_missing: "Queued URL-source analysis is no longer available.",
  scan_not_queued_anymore: "Queued URL-source analysis was already picked by another runner.",
  completion_failed: "URL-source analysis failed during completion.",
}

const errorStatuses = new Set([
  "setup_required",
  "invalid_shop",
  "callback_missing",
  "callback_invalid",
  "callback_failed",
  "callback_declined",
  "state_mismatch",
  "webhook_registration_failed",
  "disconnect_failed",
  "invalid_source_url",
  "context_save_failed",
  "source_not_set",
  "queue_failed",
  "trigger_failed",
  "unsupported_provider",
  "unauthorized",
  "lookup_failed",
  "store_missing",
  "integration_missing",
  "running_update_failed",
  "scan_not_queued_or_missing",
  "scan_not_queued_anymore",
  "completion_failed",
])

const progressSteps = ["Plan active", "Set source URL", "Connect systems", "Findings"]

function formatSourceStatus(status: string) {
  return status.replaceAll("_", " ")
}

function formatVerificationReason(
  reason: "email_domain_match" | "connected_system_domain_match" | "manual_unverified"
) {
  if (reason === "email_domain_match") {
    return "Verified by operator email domain"
  }
  if (reason === "connected_system_domain_match") {
    return "Verified by connected system domain match"
  }
  return "Manual source context. Ownership is not verified yet."
}

function SourceStatusBadge({ status }: { status: string }) {
  const isConnected = status === "connected"

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-md border px-2.5 py-1 font-mono text-[0.65rem] tracking-[0.08em] uppercase",
        isConnected
          ? "border-emerald-400/30 bg-emerald-400/[0.08] text-emerald-400"
          : "border-border/50 text-muted-foreground/50"
      )}
    >
      {isConnected ? (
        <CircleCheck className="h-3 w-3" />
      ) : (
        <CircleDashed className="h-3 w-3" />
      )}
      {formatSourceStatus(status)}
    </span>
  )
}

function WorkspaceProgressSteps({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 pt-3">
      {progressSteps.map((label, i) => {
        const stepNumber = i + 1
        const isDone = stepNumber < currentStep
        const isCurrent = stepNumber === currentStep

        return (
          <span key={label} className="contents">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 font-mono text-[0.65rem] tracking-[0.08em] uppercase",
                isDone
                  ? "border-border/40 bg-card/40 text-muted-foreground/55"
                  : isCurrent
                    ? "border-foreground/25 bg-foreground/[0.06] text-foreground"
                    : "border-border/40 text-muted-foreground/40"
              )}
            >
              {isDone && <Check className="h-2.5 w-2.5" />}
              {label}
            </span>
            {i < progressSteps.length - 1 && (
              <ChevronRight className="h-3 w-3 shrink-0 text-border/35" />
            )}
          </span>
        )
      })}
    </div>
  )
}

export default async function SourcesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const [storesData, connectData, params] = await Promise.all([
    getStoresIndexData(),
    getConnectJourneyData(),
    searchParams,
  ])
  const isDemoMode = storesData.onboardingState === "demo"

  if (!storesData.hasPlan) {
    redirect("/app/billing?intent=plan_required")
  }

  const provider = Array.isArray(params.provider) ? params.provider[0] : params.provider
  const status = Array.isArray(params.status) ? params.status[0] : params.status
  const missing = Array.isArray(params.missing) ? params.missing[0] : params.missing
  const sourceUrlParam =
    Array.isArray(params.source_url) ? params.source_url[0] : params.source_url
  const shopFromParams = Array.isArray(params.shop) ? params.shop[0] : params.shop
  const normalizedLiveSource = sourceUrlParam
    ? normalizeLiveSourceUrl(sourceUrlParam)
    : connectData.liveSourceContext?.url
      ? normalizeLiveSourceUrl(connectData.liveSourceContext.url)
      : null

  const showStatusMessage =
    (provider === "shopify" ||
      provider === "stripe" ||
      provider === "source_url" ||
      provider === "source_url_analysis") &&
    status &&
    statusMessage[status]
  const statusIsError = status ? errorStatuses.has(status) : false
  const isPendingShopify = connectData.onboardingState === "pending_shopify"
  const isPendingStripe = connectData.onboardingState === "pending_stripe"
  const isReady =
    connectData.onboardingState === "first_results_shopify" ||
    connectData.onboardingState === "first_results_stripe" ||
    connectData.onboardingState === "completed_shopify" ||
    connectData.onboardingState === "completed_stripe" ||
    connectData.onboardingState === "demo"
  const currentProgressStep = isReady ? 4 : isPendingShopify || isPendingStripe ? 3 : 2

  const stripeMissingList = (
    missing?.split(",").map((item) => item.trim()).filter(Boolean) ??
    connectData.stripeSetupMissing ??
    []
  ) as string[]
  const stripeMissingText = stripeMissingList.length
    ? `Missing: ${stripeMissingList.join(", ")}.`
    : "Missing: Stripe connection configuration."

  const shopifyButtonLabel =
    connectData.shopifySetupAttention
      ? "Retry Shopify setup"
      : connectData.shopifySourceState.status === "connected"
        ? "Reconnect Shopify"
        : connectData.shopifySourceState.status === "syncing"
          ? "Reconnect Shopify"
          : connectData.shopifySourceState.status === "errored"
            ? "Retry Shopify setup"
            : "Connect Shopify"

  const shopifySetupMessage =
    connectData.shopifySetupAttentionMessage ??
    (connectData.shopifySetupAttention
      ? "Shopify connected, but webhook registration needs attention. Retry setup."
      : null)
  const primarySourceSaved = Boolean(normalizedLiveSource)
  const connectedSystems = [
    { label: "Shopify", status: connectData.shopifySourceState.status },
    { label: "Stripe", status: connectData.stripeSourceState.status },
  ]
  const connectedSystemsCount = connectedSystems.filter(
    (system) => system.status !== "not_connected"
  ).length
  const hasCompletedSystemScan = storesData.stores.some((store) => Boolean(store.latestScanAt))
  const latestStoreScanAt = [...storesData.stores]
    .map((store) => store.latestScanAt)
    .filter((value): value is string => Boolean(value))
    .sort((left, right) => new Date(right).getTime() - new Date(left).getTime())[0] ?? null
  const urlSourceAnalysis = connectData.urlSourceAnalysis
  const urlSourceStoreId = connectData.urlSourceStoreId ?? urlSourceAnalysis?.storeId ?? null
  const latestUrlSourceScan = connectData.latestUrlSourceScan
  const latestUrlSourceScanIsActive =
    latestUrlSourceScan?.status === "queued" || latestUrlSourceScan?.status === "running"
  const latestAnalysisAt = urlSourceAnalysis?.completedAt ?? latestStoreScanAt
  const sourceScanStateLabel = !primarySourceSaved
    ? "Not set"
    : latestUrlSourceScan?.status === "failed"
      ? "Analysis failed"
    : latestUrlSourceScan?.status === "queued"
      ? "Analysis queued"
    : latestUrlSourceScan?.status === "running"
      ? "Analysis running"
    : urlSourceAnalysis?.status === "completed"
      ? "Analyzed"
    : connectedSystemsCount === 0
      ? "Saved | ready for scan"
      : hasCompletedSystemScan
        ? "Active context"
        : isPendingShopify || isPendingStripe
          ? "Saved | first scan running"
          : "Saved | waiting for first scan"
  const sourceScanStateTone = !primarySourceSaved
    ? "text-muted-foreground"
    : latestUrlSourceScan?.status === "failed"
      ? "text-destructive"
    : latestUrlSourceScanIsActive
      ? "text-primary"
    : urlSourceAnalysis?.status === "completed"
      ? "text-emerald-300"
    : hasCompletedSystemScan
      ? "text-emerald-300"
      : isPendingShopify || isPendingStripe
        ? "text-primary"
        : "text-amber-300"
  const sourceScanStateDetail = !primarySourceSaved
    ? "Set a primary URL or domain to create the canonical source context."
    : latestUrlSourceScan?.status === "failed"
      ? "The latest analysis failed before completion. Queue another run when ready."
    : latestUrlSourceScan?.status === "queued"
      ? "Analysis is queued in the worker. Results will appear in the source detail."
    : latestUrlSourceScan?.status === "running"
      ? "Analysis is running in the background. Findings and evidence will update when it completes."
    : urlSourceAnalysis?.status === "completed"
      ? "Surface analysis completed. Revenue path and checkout signals are now in evidence."
    : connectedSystemsCount === 0
      ? "Primary source saved. Connect Shopify or Stripe for deeper activation and checkout evidence."
      : hasCompletedSystemScan
        ? "Primary source is active and used as canonical context for connected system scans."
        : isPendingShopify || isPendingStripe
          ? "Connected systems are running first analysis. Primary source is attached as context."
          : "Connected systems exist. First analysis has not completed yet."
  const liveSourceUpdatedAt =
    connectData.liveSourceContext && "updatedAt" in connectData.liveSourceContext
      ? connectData.liveSourceContext.updatedAt
      : null
  const liveSourceVerification = connectData.liveSourceVerification
  const verificationBadgeTone =
    liveSourceVerification?.state === "verified"
      ? "border-emerald-400/30 bg-emerald-400/[0.08] text-emerald-300"
      : "border-amber-300/40 bg-amber-300/[0.08] text-amber-200"

  return (
    <div className="space-y-5 pb-24 lg:pb-4">
      <section className="space-y-2" id="source-setup">
        <p className="data-mono text-muted-foreground">Sources</p>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl lg:text-3xl">
          Live Source and System Connections
        </h1>
        <p className="max-w-3xl text-sm text-muted-foreground sm:text-base">
          Set the primary live source URL, then connect Shopify and Stripe systems for deeper activation, checkout, and billing evidence.
        </p>
        {isDemoMode ? (
          <p className="text-sm text-amber-300">
            Demo mode is active. Source cards below use simulated data.
          </p>
        ) : null}
        <WorkspaceProgressSteps currentStep={currentProgressStep} />
      </section>

      {showStatusMessage ? (
        <section
          className={cn(
            "vault-panel-shell border p-4",
            statusIsError
              ? "border-destructive/40 bg-destructive/[0.06]"
              : "border-primary/30 bg-primary/[0.06]"
          )}
        >
          <p className="text-sm leading-6 text-muted-foreground">{showStatusMessage}</p>
          {provider === "source_url_analysis" && status === "completed" && urlSourceAnalysis ? (
            <div className="mt-3 flex flex-wrap items-center gap-4">
              <p className="text-sm text-foreground">
                {urlSourceAnalysis.surfaceClassification ?? "unknown"} | Revenue path:{" "}
                {urlSourceAnalysis.revenuePathClarity ?? "unknown"}
              </p>
              {urlSourceStoreId ? (
                <Link
                  href={`/app/stores/${urlSourceStoreId}`}
                  className="vault-link inline-flex items-center gap-1 text-sm"
                >
                  Open surface detail <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              ) : null}
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="vault-panel-shell p-4 sm:p-5">
        <p className="data-mono text-muted-foreground">Primary live source</p>
        <p className="mt-2 text-sm text-muted-foreground">
          This URL or domain is the canonical source context for scans and source detail evidence.
        </p>
        <form action={setLiveSourceContext} className="mt-4 space-y-3">
          <div className="space-y-2">
            <label
              htmlFor="source_url"
              className="block font-mono text-[0.68rem] tracking-[0.08em] uppercase text-muted-foreground/60"
            >
              Live source URL
            </label>
            <input
              id="source_url"
              name="source_url"
              defaultValue={normalizedLiveSource?.normalizedUrl ?? ""}
              placeholder="https://yourstore.com"
              className="vault-input w-full rounded-lg px-3.5 py-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/40"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              inputMode="url"
            />
          </div>
          <SubmitButton
            label="Save as primary source"
            pendingLabel="Saving..."
            className="rounded-lg border border-border/70 px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          />
        </form>
        {connectData.liveSourceContext?.url ? (
          <p className="mt-3 text-xs text-emerald-300">
            Primary source: {connectData.liveSourceContext.url}
          </p>
        ) : null}
        {normalizedLiveSource ? (
          <p className="mt-3 text-xs text-muted-foreground">
            Source domain: {normalizedLiveSource.hostname}
          </p>
        ) : null}
      </section>

      <section id="primary-source" className="surface-card p-4 sm:p-5 lg:p-6">
        <p className="data-mono text-muted-foreground">Primary source</p>
        <article className="mt-4 rounded-xl border border-border/70 bg-background/35 p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-mono text-[0.68rem] tracking-[0.1em] uppercase text-muted-foreground/60">
                Primary live source
              </p>
              <h2 className="mt-1.5 flex items-center gap-2 text-base font-semibold tracking-tight sm:text-lg">
                <Globe2 className="h-4 w-4 text-muted-foreground/70" />
                {normalizedLiveSource?.hostname ?? "No primary source saved"}
              </h2>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className={`text-xs ${sourceScanStateTone}`}>{sourceScanStateLabel}</span>
              {primarySourceSaved && liveSourceVerification ? (
                <span
                  className={cn(
                    "inline-flex items-center rounded-md border px-2 py-1 font-mono text-[0.62rem] tracking-[0.08em] uppercase",
                    verificationBadgeTone
                  )}
                >
                  {liveSourceVerification.state === "verified" ? "verified" : "unverified"}
                </span>
              ) : null}
            </div>
          </div>

          <p className="mt-2 text-sm text-muted-foreground">{sourceScanStateDetail}</p>
          {primarySourceSaved && liveSourceVerification ? (
            <p className="mt-2 text-xs text-muted-foreground">
              {formatVerificationReason(liveSourceVerification.reason)}
              {liveSourceVerification.matchedDomain
                ? ` (${liveSourceVerification.matchedDomain})`
                : ""}
              {liveSourceVerification.matchedSystem
                ? ` | system: ${liveSourceVerification.matchedSystem}`
                : ""}
            </p>
          ) : null}

          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div className="rounded-lg border border-border/60 bg-background/30 p-3">
              <dt className="data-mono text-muted-foreground">Primary URL</dt>
              <dd className="mt-1 break-all text-foreground">
                {normalizedLiveSource?.normalizedUrl ?? "Not set"}
              </dd>
            </div>
            <div className="rounded-lg border border-border/60 bg-background/30 p-3">
              <dt className="data-mono text-muted-foreground">Last updated</dt>
              <dd className="mt-1 text-foreground">
                {liveSourceUpdatedAt ? formatRelativeTimestamp(liveSourceUpdatedAt) : "Not set"}
              </dd>
            </div>
            <div className="rounded-lg border border-border/60 bg-background/30 p-3">
              <dt className="data-mono text-muted-foreground">Connected systems</dt>
              <dd className="mt-1 text-foreground">
                {connectedSystemsCount > 0 ? connectedSystemsCount : "None"}
              </dd>
            </div>
            <div className="rounded-lg border border-border/60 bg-background/30 p-3">
              <dt className="data-mono text-muted-foreground">Latest analysis</dt>
              <dd className="mt-1 text-foreground">
                {latestUrlSourceScanIsActive
                  ? latestUrlSourceScan.status
                  : latestAnalysisAt
                    ? formatRelativeTimestamp(latestAnalysisAt)
                    : "Not run yet"}
              </dd>
            </div>
          </dl>

          {urlSourceAnalysis ? (
            <div className="mt-4 rounded-lg border border-border/60 bg-background/30 p-3">
              <p className="data-mono text-muted-foreground">Surface analysis</p>
              <p className="mt-2 text-sm text-foreground">
                {urlSourceAnalysis.surfaceClassification ?? "unknown"} | Revenue path:{" "}
                {urlSourceAnalysis.revenuePathClarity ?? "unknown"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Pricing path: {urlSourceAnalysis.hasPricingPath ? "yes" : "no"} | Signup path:{" "}
                {urlSourceAnalysis.hasSignupPath ? "yes" : "no"} | Checkout signal:{" "}
                {urlSourceAnalysis.hasCheckoutSignal ? "yes" : "no"}
              </p>
              {urlSourceAnalysis.primaryCtaLabel ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  Primary action: {urlSourceAnalysis.primaryCtaLabel}
                </p>
              ) : null}
              {urlSourceAnalysis.errorMessage ? (
                <p className="mt-1 text-xs text-amber-300">
                  {urlSourceAnalysis.errorMessage}
                </p>
              ) : null}
            </div>
          ) : null}

          {connectedSystemsCount > 0 ? (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {connectedSystems
                .filter((system) => system.status !== "not_connected")
                .map((system) => (
                  <span
                    key={system.label}
                    className="inline-flex items-center rounded-md border border-primary/30 px-2 py-1 text-[11px] uppercase text-foreground"
                  >
                    {system.label} | {formatSourceStatus(system.status)}
                  </span>
                ))}
            </div>
          ) : null}

          {primarySourceSaved ? (
            <form action={triggerPrimaryUrlSourceAnalysis} className="mt-4">
              <SubmitButton
                label={urlSourceAnalysis ? "Re-run surface analysis" : "Run surface analysis"}
                pendingLabel="Queueing scan..."
                className="rounded-lg border border-border/70 px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
              />
            </form>
          ) : null}
          {latestUrlSourceScan ? (
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <ScanStatePill status={latestUrlSourceScan.status} className="py-0.5" />
              <span>
                Last run {formatRelativeTimestamp(latestUrlSourceScan.scannedAt)}
                {latestUrlSourceScan.status === "completed"
                  ? ` | ${latestUrlSourceScan.detectedIssuesCount} findings`
                  : " | results pending"}
              </span>
            </div>
          ) : null}
        </article>
      </section>

      <section className="vault-source-grid">
        <article className="vault-source-cell">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-mono text-[0.68rem] tracking-[0.1em] uppercase text-muted-foreground/60">
                Shopify
              </p>
              <h2 className="mt-1.5 text-base font-semibold tracking-tight">
                Connected system | checkout and activation depth
              </h2>
            </div>
            <SourceStatusBadge status={connectData.shopifySourceState.status} />
          </div>
          <p className="mt-2.5 text-sm leading-[1.72] text-muted-foreground">
            Detects checkout friction, payment method gaps, and activation progression leaks.
          </p>
          <div className="my-4 h-px bg-border/40" />
          <form method="GET" action="/api/integrations/shopify/install" className="space-y-3">
            <input type="hidden" name="orgId" value={connectData.organization.id} />
            <div className="space-y-2">
              <label
                className="block font-mono text-[0.68rem] tracking-[0.08em] uppercase text-muted-foreground/60"
                htmlFor="shop"
              >
                Shopify domain
              </label>
              <input
                id="shop"
                name="shop"
                defaultValue={shopFromParams ?? connectData.shopifySourceState.shopDomain ?? ""}
                placeholder="your-store.myshopify.com"
                className="vault-input w-full rounded-lg px-3.5 py-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/40"
                required
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                inputMode="url"
                pattern="[a-z0-9-]+\.myshopify\.com"
                title="Use format: your-store.myshopify.com"
              />
            </div>
            <ShopifyConnectSubmitButton
              disabled={!connectData.shopifyConfigured}
              label={connectData.shopifyConfigured ? shopifyButtonLabel : "Shopify setup required"}
            />
          </form>
          {connectData.shopifySourceState.status !== "not_connected" ? (
            <div className="mt-2">
              <DisconnectButton
                label="Disconnect Shopify"
                action="/api/integrations/shopify/disconnect"
                next="/app/stores?provider=shopify&status=disconnected"
              />
            </div>
          ) : null}
          {connectData.shopifySourceState.shopDomain ? (
            <p className="mt-3 font-mono text-[0.65rem] tracking-[0.06em] text-muted-foreground/45">
              {connectData.shopifySourceState.shopDomain}
            </p>
          ) : null}
          {shopifySetupMessage ? (
            <p className="mt-2 text-xs text-amber-300">{shopifySetupMessage}</p>
          ) : null}
        </article>

        <article className="vault-source-cell">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-mono text-[0.68rem] tracking-[0.1em] uppercase text-muted-foreground/60">
                Stripe
              </p>
              <h2 className="mt-1.5 text-base font-semibold tracking-tight">
                Connected system | billing recovery depth
              </h2>
            </div>
            <SourceStatusBadge status={connectData.stripeSourceState.status} />
          </div>
          <p className="mt-2.5 text-sm leading-[1.72] text-muted-foreground">
            Detects failed renewal leakage, retry gaps, and dunning lifecycle inefficiencies.
          </p>
          <div className="my-4 h-px bg-border/40" />
          <div>
            {isPendingStripe ? (
              <div className="inline-flex items-center gap-2 rounded-lg border border-border/60 bg-card/50 px-4 py-3 text-sm text-foreground">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-foreground/50" />
                First billing scan running
              </div>
            ) : connectData.stripeConfigured ? (
              <form method="GET" action="/api/integrations/stripe/connect">
                <input type="hidden" name="orgId" value={connectData.organization.id} />
                <StripeConnectSubmitButton />
              </form>
            ) : (
              <div className="space-y-3 rounded-lg border border-border/60 bg-background/30 p-4">
                <p className="text-sm text-muted-foreground">
                  Stripe connection is not configured in this environment.
                </p>
                <p className="font-mono text-[0.65rem] tracking-[0.06em] text-muted-foreground/50">
                  {stripeMissingText}
                </p>
              </div>
            )}
          </div>
          {connectData.stripeSourceState.accountId ? (
            <p className="mt-3 font-mono text-[0.65rem] tracking-[0.06em] text-muted-foreground/45">
              {connectData.stripeSourceState.accountId}
            </p>
          ) : null}
        </article>
      </section>

      <section className="surface-card p-4 sm:p-5 lg:p-6">
        {storesData.stagingSource ? (
          <article className="rounded-xl border border-border/70 bg-background/35 p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold tracking-tight sm:text-lg">
                {storesData.stagingSource.label} source
              </h2>
              <span className={`text-xs ${storesData.stagingSource.statusTone}`}>
                {storesData.stagingSource.statusLabel}
              </span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{storesData.stagingSource.message}</p>
          </article>
        ) : storesData.stores.length || primarySourceSaved ? (
          <div className="divide-y divide-border/60">
            {primarySourceSaved ? (
              <article className="grid gap-3 py-4 sm:gap-4 sm:py-5 sm:grid-cols-[1.3fr_1fr_auto] sm:items-center">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-semibold tracking-tight sm:text-lg">
                      {normalizedLiveSource?.hostname ?? "Primary URL source"}
                    </h2>
                    <span className="rounded-md border border-border/70 px-2 py-0.5 text-[11px] uppercase text-muted-foreground">
                      website
                    </span>
                    <span className={`text-xs ${sourceScanStateTone}`}>{sourceScanStateLabel}</span>
                    {liveSourceVerification ? (
                      <span
                        className={cn(
                          "rounded-md border px-2 py-0.5 text-[11px] uppercase",
                          liveSourceVerification.state === "verified"
                            ? "border-emerald-400/30 bg-emerald-400/[0.08] text-emerald-300"
                            : "border-amber-300/40 bg-amber-300/[0.08] text-amber-200"
                        )}
                      >
                        {liveSourceVerification.state}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {normalizedLiveSource?.normalizedUrl ?? "No URL saved"} | canonical source context
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {sourceScanStateDetail}
                  </p>
                  {liveSourceVerification ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatVerificationReason(liveSourceVerification.reason)}
                      {liveSourceVerification.matchedDomain
                        ? ` (${liveSourceVerification.matchedDomain})`
                        : ""}
                    </p>
                  ) : null}
                </div>

                <div className="grid gap-1 text-sm">
                  <p className="text-muted-foreground">
                    Latest analysis:{" "}
                    {latestUrlSourceScanIsActive
                      ? latestUrlSourceScan.status
                      : latestAnalysisAt
                        ? formatRelativeTimestamp(latestAnalysisAt)
                        : "Not run yet"}
                  </p>
                  <p className="font-semibold text-primary">
                    {connectedSystemsCount > 0
                      ? `${connectedSystemsCount} connected system${connectedSystemsCount !== 1 ? "s" : ""}`
                      : "No systems connected"}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                  <Link href="#source-setup" className="vault-link inline-flex items-center gap-1 text-sm">
                    Edit source <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                  {urlSourceStoreId &&
                  (storesData.onboardingState !== "empty" || Boolean(urlSourceAnalysis)) ? (
                    <Link
                      href={`/app/stores/${urlSourceStoreId}`}
                      className="vault-link inline-flex items-center gap-1 text-sm"
                    >
                      Open surface detail <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  ) : null}
                </div>
              </article>
            ) : null}
            {storesData.stores.map((store) => (
              <article
                key={store.id}
                className="grid gap-3 py-4 sm:gap-4 sm:py-5 sm:grid-cols-[1.3fr_1fr_auto] sm:items-center"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-semibold tracking-tight sm:text-lg">{store.name}</h2>
                    <span className="rounded-md border border-border/70 px-2 py-0.5 text-[11px] uppercase text-muted-foreground">
                      {store.platform}
                    </span>
                    {isDemoMode ? (
                      <span className="rounded-md border border-amber-400/35 bg-amber-400/[0.08] px-2 py-0.5 text-[11px] uppercase text-amber-300">
                        demo
                      </span>
                    ) : null}
                    <span className={`text-xs ${store.statusTone}`}>{store.statusLabel}</span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {store.platform === "shopify"
                      ? `Shopify domain: ${store.displayDomain ?? "unknown"}`
                      : (store.domain ?? "Internal billing source")} | {store.activeIssueCount} active issues
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {store.topIssueTitle ? `Top issue: ${store.topIssueTitle}` : "No critical issue detected."}
                  </p>
                </div>

                <div className="grid gap-1 text-sm">
                  <p className="text-muted-foreground">
                    Latest scan: {store.latestScanAt ? formatRelativeTimestamp(store.latestScanAt) : "No scans yet"}
                  </p>
                  <p className="font-semibold text-primary">
                    {formatCompactCurrency(store.estimatedLeakage)} / month
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                  <Link
                    href={store.href}
                    className="vault-link inline-flex items-center gap-1 text-sm"
                  >
                    Open source <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                  {store.platform === "shopify" && !isDemoMode ? (
                    <form method="POST" action="/api/integrations/shopify/disconnect">
                      <input
                        type="hidden"
                        name="next"
                        value="/app/stores?provider=shopify&status=disconnected"
                      />
                      <button
                        type="submit"
                        className="rounded-lg border border-border/70 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
                      >
                        Disconnect
                      </button>
                    </form>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border/70 p-8 text-center text-sm text-muted-foreground">
            <p>No sources connected yet. Set a live source URL and connect Shopify or Stripe to begin monitoring.</p>
          </div>
        )}
      </section>

      <section className="surface-card p-4 sm:p-5 lg:p-6">
        <p className="data-mono text-muted-foreground">Coverage Snapshot</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3 sm:gap-4">
          <div className="rounded-xl border border-border/70 bg-background/35 p-3.5 sm:p-4">
            <p className="text-sm text-muted-foreground">Active sources</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight">
              {storesData.stores.length + (primarySourceSaved ? 1 : 0)}
            </p>
          </div>
          <div className="rounded-xl border border-border/70 bg-background/35 p-3.5 sm:p-4">
            <p className="text-sm text-muted-foreground">Total active issues</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight">
              {storesData.stores.reduce((count, store) => count + store.activeIssueCount, 0)}
            </p>
          </div>
          <div className="rounded-xl border border-border/70 bg-background/35 p-3.5 sm:p-4">
            <p className="text-sm text-muted-foreground">Combined leakage estimate</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight text-primary">
              {formatCompactCurrency(
                storesData.stores.reduce((total, store) => total + store.estimatedLeakage, 0)
              )}
            </p>
          </div>
        </div>
        <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
          <CircleDot className="h-3.5 w-3.5 text-muted-foreground/60" />
          {isDemoMode
            ? "Demo source health reflects simulated scan and issue changes."
            : "Source health updates as scans complete and issue status changes."}
        </p>
      </section>
    </div>
  )
}
