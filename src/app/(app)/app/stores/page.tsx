import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import {
  ArrowRight,
  Check,
  ChevronRight,
  CircleCheck,
  CircleDashed,
  CircleDot,
  CreditCard,
  Globe2,
  ShoppingBag,
} from "lucide-react"

export const metadata: Metadata = {
  title: "Sources",
}

import { SubmitButton } from "@/components/ui/submit-button"
import { EvidenceScreenshots } from "@/components/evidence/evidence-screenshots"
import { ScanStatePill, SeverityPill } from "@/components/dashboard/vault-primitives"
import { normalizeLiveSourceUrl } from "@/lib/live-source"
import { cn } from "@/lib/utils"
import { formatCompactCurrency, formatRelativeTimestamp } from "@/lib/format"
import { getDirectionalOpportunityEstimate } from "@/lib/opportunity-estimate"
import { getConnectJourneyData, getStoresIndexData } from "@/server/services/app-service"
import type { IssueSeverity } from "@/types/domain"
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
  source_not_set: "Set a primary live source URL before running surface analysis.",
  queue_failed: "Could not queue surface analysis. Retry in a moment.",
  completed: "Surface analysis completed. Summary has been updated.",
  queued: "Surface analysis queued. This source will update when results are ready.",
  trigger_failed: "Surface analysis was created, but the background run could not start. Retry in a moment.",
  unsupported_provider: "This source does not support surface analysis yet.",
  unauthorized: "You are not authorized to run surface analysis for this workspace.",
  lookup_failed: "Surface analysis lookup failed. Retry in a moment.",
  store_missing: "Surface analysis source context is missing.",
  integration_missing: "Surface analysis connection context is missing.",
  running_update_failed: "Surface analysis could not start cleanly.",
  scan_not_queued_or_missing: "Queued surface analysis is no longer available.",
  scan_not_queued_anymore: "Queued surface analysis is already running.",
  completion_failed: "Surface analysis could not finish cleanly.",
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

const progressSteps = ["Plan active", "Set source", "Analyze", "Enrich"]

type SystemRelevance = "recommended" | "useful" | "optional" | "not_needed"

function getBusinessTypeLabel(value: string | null | undefined) {
  if (value === "agency") return "Agency"
  if (value === "saas") return "SaaS"
  if (value === "service_business") return "Service business"
  if (value === "ecommerce") return "Ecommerce"
  if (value === "mixed") return "Mixed revenue model"
  return "Source type pending"
}

function getRevenueModelLabel(value: string | null | undefined) {
  if (value === "lead_generation") return "Lead generation"
  if (value === "self_serve_signup") return "Self-serve signup"
  if (value === "checkout") return "Checkout"
  if (value === "hybrid") return "Hybrid revenue path"
  return "Revenue model pending"
}

function getSystemRelevanceLabel(relevance: SystemRelevance) {
  if (relevance === "recommended") return "Recommended"
  if (relevance === "useful") return "Relevant"
  if (relevance === "not_needed") return "Not needed yet"
  return "Optional"
}

function getSystemRelevanceClass(relevance: SystemRelevance) {
  if (relevance === "recommended") {
    return "border-primary/35 bg-primary/[0.08] text-primary"
  }
  if (relevance === "useful") {
    return "border-emerald-400/30 bg-emerald-400/[0.08] text-emerald-300"
  }
  if (relevance === "not_needed") {
    return "border-border/50 bg-background/20 text-muted-foreground/60"
  }
  return "border-border/60 bg-background/30 text-muted-foreground"
}

function formatRevenuePath(value: string | null | undefined) {
  if (value === "clear") return "Revenue path visible"
  if (value === "partial") return "Revenue path incomplete"
  if (value === "none") return "No clear revenue path"
  return "Revenue path pending"
}

function getSurfaceSummary(input: {
  businessType: string | null
  surfaceClassification: string | null | undefined
  revenuePathClarity: string | null | undefined
}) {
  const typeLabel = getBusinessTypeLabel(input.businessType)
  const revenueLabel = formatRevenuePath(input.revenuePathClarity)

  if (input.businessType === "saas") {
    return `${typeLabel} surface detected. ${revenueLabel}.`
  }
  if (input.businessType === "ecommerce") {
    return `${typeLabel} surface detected. ${revenueLabel}.`
  }
  if (input.businessType === "agency" || input.businessType === "service_business") {
    return `${typeLabel} surface detected. Lead capture path ${input.revenuePathClarity === "clear" ? "is visible" : "needs attention"}.`
  }
  if (input.businessType === "mixed") {
    return `Mixed revenue surface detected. ${revenueLabel}.`
  }
  if (input.surfaceClassification === "marketing_only") {
    return `Marketing surface detected. ${revenueLabel}.`
  }
  return `Surface analysis complete. ${revenueLabel}.`
}

function formatSignal(value: boolean | null | undefined) {
  if (value === true) return "Detected"
  if (value === false) return "Not detected"
  return "Not evaluated"
}

function getBusinessSignalRows(input: {
  businessType: string | null
  revenueModel: string | null | undefined
  hasPricingPath: boolean | null | undefined
  hasSignupPath: boolean | null | undefined
  hasLoginPath: boolean | null | undefined
  hasPrimaryCta: boolean | null | undefined
  primaryCtaLabel: string | null | undefined
  hasCheckoutSignal: boolean | null | undefined
  hasContactOrBookingPath: boolean | null | undefined
  hasSubscriptionLanguage: boolean | null | undefined
}) {
  const primaryAction = input.primaryCtaLabel ?? formatSignal(input.hasPrimaryCta)

  if (input.businessType === "ecommerce") {
    return [
      { label: "Product path", value: formatSignal(input.hasPricingPath || input.hasPrimaryCta) },
      { label: "Cart path", value: formatSignal(input.hasCheckoutSignal) },
      { label: "Checkout path", value: formatSignal(input.hasCheckoutSignal) },
      { label: "Payment handoff", value: formatSignal(input.hasCheckoutSignal) },
    ]
  }

  if (input.businessType === "agency" || input.businessType === "service_business") {
    return [
      { label: "Contact path", value: formatSignal(input.hasContactOrBookingPath) },
      { label: "Booking or quote path", value: formatSignal(input.hasContactOrBookingPath) },
      { label: "Revenue path", value: getRevenueModelLabel(input.revenueModel) },
      { label: "Primary action", value: primaryAction },
    ]
  }

  return [
    { label: "Pricing path", value: formatSignal(input.hasPricingPath) },
    { label: "Signup path", value: formatSignal(input.hasSignupPath) },
    { label: "Login or app path", value: formatSignal(input.hasLoginPath || input.hasSubscriptionLanguage) },
    { label: "Primary action", value: primaryAction },
  ]
}

function formatSourceStatus(status: string) {
  return status.replaceAll("_", " ")
}

function formatVerificationReason(
  reason:
    | "email_domain_match"
    | "connected_system_domain_match"
    | "manual_verified"
    | "dns_txt_verified"
    | "manual_unverified"
) {
  if (reason === "email_domain_match") {
    return "Verified by operator email domain"
  }
  if (reason === "connected_system_domain_match") {
    return "Verified by connected system domain match"
  }
  if (reason === "manual_verified") {
    return "Verified manually"
  }
  if (reason === "dns_txt_verified") {
    return "Verified by DNS TXT record"
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
  const stripeMissingList = (
    missing?.split(",").map((item) => item.trim()).filter(Boolean) ??
    connectData.stripeSetupMissing ??
    []
  ) as string[]
  const stripeMissingText = stripeMissingList.length
    ? `Missing: ${stripeMissingList.join(", ")}.`
    : "Missing: Stripe connection configuration."

  const inferredShopDomain =
    normalizedLiveSource?.hostname.endsWith(".myshopify.com")
      ? normalizedLiveSource.hostname
      : null
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
  const liveSourceUpdatedAt =
    connectData.liveSourceContext && "updatedAt" in connectData.liveSourceContext
      ? connectData.liveSourceContext.updatedAt
      : null
  const urlSourceAnalysis = connectData.urlSourceAnalysis
  const urlSourceStoreId = connectData.urlSourceStoreId ?? urlSourceAnalysis?.storeId ?? null
  const latestUrlSourceScan = connectData.latestUrlSourceScan
  const urlSourceTopIssue = connectData.urlSourceTopIssue
  const latestUrlSourceScanIsActive =
    latestUrlSourceScan?.status === "queued" || latestUrlSourceScan?.status === "running"
  const latestAnalysisAt = urlSourceAnalysis?.completedAt ?? latestStoreScanAt
  const businessType = urlSourceAnalysis?.businessType ?? null
  const sourceTypeLabel = getBusinessTypeLabel(businessType)
  const sourceFreshnessAt =
    liveSourceUpdatedAt ?? urlSourceAnalysis?.completedAt ?? latestUrlSourceScan?.scannedAt ?? null
  const sourceFreshnessLabel = urlSourceAnalysis
    ? "Analysis updated"
    : liveSourceUpdatedAt
      ? "Source saved"
      : "Source state"
  const businessSignalRows = urlSourceAnalysis
    ? getBusinessSignalRows({
        businessType,
        revenueModel: urlSourceAnalysis.revenueModel,
        hasPricingPath: urlSourceAnalysis.hasPricingPath,
        hasSignupPath: urlSourceAnalysis.hasSignupPath,
        hasLoginPath: urlSourceAnalysis.hasLoginPath,
        hasPrimaryCta: urlSourceAnalysis.hasPrimaryCta,
        primaryCtaLabel: urlSourceAnalysis.primaryCtaLabel,
        hasCheckoutSignal: urlSourceAnalysis.hasCheckoutSignal,
        hasContactOrBookingPath: urlSourceAnalysis.hasContactOrBookingPath,
        hasSubscriptionLanguage: urlSourceAnalysis.hasSubscriptionLanguage,
      })
    : []
  const hasEcommerceSignal =
    businessType === "ecommerce" ||
    businessType === "mixed" ||
    urlSourceAnalysis?.surfaceClassification === "ecommerce" ||
    urlSourceAnalysis?.hasCheckoutSignal === true ||
    Boolean(inferredShopDomain)
  const hasSaasSignal =
    businessType === "saas" ||
    businessType === "mixed" ||
    urlSourceAnalysis?.hasSignupPath === true ||
    urlSourceAnalysis?.hasLoginPath === true ||
    urlSourceAnalysis?.hasSubscriptionLanguage === true
  const hasBillingSignal =
    hasSaasSignal ||
    urlSourceAnalysis?.hasPricingPath === true ||
    urlSourceAnalysis?.revenueModel === "checkout"
  const isLeadBusiness = businessType === "agency" || businessType === "service_business"
  const shopifyRelevance: SystemRelevance =
    hasEcommerceSignal ? "recommended" : isLeadBusiness || hasSaasSignal ? "not_needed" : "optional"
  const stripeRelevance: SystemRelevance =
    hasSaasSignal ? "recommended" : hasEcommerceSignal || hasBillingSignal ? "useful" : isLeadBusiness ? "optional" : "optional"
  const urlSourceScreenshots = urlSourceAnalysis
    ? [
        {
          label: "Mobile evidence",
          src: urlSourceAnalysis.mobileScreenshotRef,
          viewport: "375px mobile",
          capturedUrl: urlSourceAnalysis.browserFinalUrl ?? urlSourceAnalysis.finalUrl,
          capturedAt: urlSourceAnalysis.completedAt,
          sha256: urlSourceAnalysis.mobileScreenshotSha256,
          bytes: urlSourceAnalysis.mobileScreenshotBytes,
        },
        {
          label: "Desktop evidence",
          src: urlSourceAnalysis.desktopScreenshotRef,
          viewport: "1280px desktop",
          capturedUrl: urlSourceAnalysis.browserFinalUrl ?? urlSourceAnalysis.finalUrl,
          capturedAt: urlSourceAnalysis.completedAt,
          sha256: urlSourceAnalysis.desktopScreenshotSha256,
          bytes: urlSourceAnalysis.desktopScreenshotBytes,
        },
        ...(urlSourceAnalysis.funnelPages ?? []).flatMap((page) => [
          {
            label: `${page.role ?? "Funnel"} mobile`,
            src: page.mobileScreenshotRef,
            viewport: "375px mobile",
            capturedUrl: page.capturedUrl,
            capturedAt: urlSourceAnalysis.completedAt,
            sha256: page.mobileScreenshotSha256,
            bytes: page.mobileScreenshotBytes,
          },
          {
            label: `${page.role ?? "Funnel"} desktop`,
            src: page.desktopScreenshotRef,
            viewport: "1280px desktop",
            capturedUrl: page.capturedUrl,
            capturedAt: urlSourceAnalysis.completedAt,
            sha256: page.desktopScreenshotSha256,
            bytes: page.desktopScreenshotBytes,
          },
        ]),
      ]
    : []
  const opportunitySignal = getDirectionalOpportunityEstimate({
    businessType,
    revenueModel: urlSourceAnalysis?.revenueModel,
    revenuePathClarity: urlSourceAnalysis?.revenuePathClarity,
    issueImpact: urlSourceTopIssue?.estimatedMonthlyRevenueImpact,
    issueCount: latestUrlSourceScan?.detectedIssuesCount ?? (urlSourceTopIssue ? 1 : 0),
    hasScreenshotEvidence: urlSourceScreenshots.some((shot) => Boolean(shot.src)),
  })
  const showShopifyInlineSetup =
    connectData.shopifySourceState.status !== "not_connected" ||
    shopifyRelevance === "recommended" ||
    Boolean(inferredShopDomain)
  const showStripeCard =
    connectData.stripeSourceState.status !== "not_connected" ||
    hasBillingSignal ||
    !isLeadBusiness
  const systemLaneCopy = isLeadBusiness
    ? "CRM, booking, form, and lifecycle systems are the next useful evidence lanes for this source type. Commerce and billing systems stay optional unless the URL shows those signals."
    : businessType === "saas"
      ? "Billing, lifecycle, CRM, and product analytics systems can deepen signup and revenue evidence after the URL surface is monitored."
      : businessType === "ecommerce"
        ? "Commerce, payments, lifecycle, and support systems can deepen checkout and buyer evidence after the URL surface is monitored."
        : "Booking, CRM, lifecycle, ecommerce, and payment systems can fit here later. The primary URL remains the source of truth."
  const currentProgressStep =
    isReady || Boolean(urlSourceAnalysis)
      ? 4
      : latestUrlSourceScanIsActive || primarySourceSaved
        ? 3
        : 2
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
      ? "Analysis is queued. Results will appear in the source detail."
    : latestUrlSourceScan?.status === "running"
      ? "Analysis is running in the background. Findings and evidence will update when it completes."
    : urlSourceAnalysis?.status === "completed"
      ? "Surface analysis completed. Revenue path and checkout signals are now in evidence."
    : connectedSystemsCount === 0
      ? "Primary source saved. Run analysis first, then connect relevant systems for deeper evidence."
    : hasCompletedSystemScan
      ? "Primary source is active and used as canonical context for optional system scans."
    : isPendingShopify || isPendingStripe
      ? "Connected systems are running first analysis. Primary source is attached as context."
      : "Connected systems exist. First analysis has not completed yet."
  const liveSourceVerification = connectData.liveSourceVerification
  const primarySourceVerified = liveSourceVerification?.state === "verified"
  const verificationBadgeTone =
    liveSourceVerification?.state === "verified"
      ? "border-emerald-400/30 bg-emerald-400/[0.08] text-emerald-300"
      : liveSourceVerification?.state === "pending"
        ? "border-sky-300/35 bg-sky-300/[0.08] text-sky-200"
      : "border-amber-300/40 bg-amber-300/[0.08] text-amber-200"

  return (
    <div className="space-y-5 pb-24 lg:pb-4">
      <section className="space-y-2" id="source-setup">
        <p className="data-mono text-muted-foreground">Sources</p>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl lg:text-3xl">
          Revenue Source and Signal Coverage
        </h1>
        <p className="max-w-3xl text-sm text-muted-foreground sm:text-base">
          Set the primary URL first. SilentLeak analyzes the revenue surface, then recommends optional systems that can deepen signal quality.
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
                {getSurfaceSummary({
                  businessType,
                  surfaceClassification: urlSourceAnalysis.surfaceClassification,
                  revenuePathClarity: urlSourceAnalysis.revenuePathClarity,
                })}
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
        <p className="data-mono text-muted-foreground">
          {primarySourceSaved ? "Edit primary source" : "Primary live source"}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          {primarySourceSaved
            ? "Update the canonical revenue surface when the monitored URL changes."
            : "This URL or domain is the canonical revenue surface. Connected systems enrich it, but they do not replace it."}
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
            Current URL: {connectData.liveSourceContext.url}
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
              <dt className="data-mono text-muted-foreground">{sourceFreshnessLabel}</dt>
              <dd className="mt-1 text-foreground">
                {sourceFreshnessAt
                  ? formatRelativeTimestamp(sourceFreshnessAt)
                  : primarySourceSaved
                    ? "Saved"
                    : "Not set"}
              </dd>
            </div>
            <div className="rounded-lg border border-border/60 bg-background/30 p-3">
              <dt className="data-mono text-muted-foreground">Detected model</dt>
              <dd className="mt-1 text-foreground">
                {urlSourceAnalysis ? sourceTypeLabel : "Analyze source"}
              </dd>
            </div>
            <div className="rounded-lg border border-border/60 bg-background/30 p-3">
              <dt className="data-mono text-muted-foreground">Revenue path</dt>
              <dd className="mt-1 text-foreground">
                {urlSourceAnalysis
                  ? getRevenueModelLabel(urlSourceAnalysis.revenueModel)
                  : "Analyze source"}
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
            <div className="rounded-lg border border-[color:var(--signal-line)] bg-[color:var(--signal-dim)] p-3">
              <dt className="data-mono text-[color:var(--signal)]">{opportunitySignal.label}</dt>
              <dd className="mt-1 text-foreground">{opportunitySignal.detail}</dd>
              <dd className="mt-1 text-xs text-muted-foreground">
                Directional, confidence {opportunitySignal.confidence}
              </dd>
              <dd className="mt-1 text-xs text-muted-foreground">
                {opportunitySignal.reason}
              </dd>
            </div>
          </dl>

          {urlSourceAnalysis ? (
            <div className="mt-4 rounded-lg border border-border/60 bg-background/30 p-3">
              <p className="data-mono text-muted-foreground">Surface analysis</p>
              <p className="mt-2 text-sm text-foreground">
                {getSurfaceSummary({
                  businessType,
                  surfaceClassification: urlSourceAnalysis.surfaceClassification,
                  revenuePathClarity: urlSourceAnalysis.revenuePathClarity,
                })}
              </p>
              <dl className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                {businessSignalRows.map((row) => (
                  <div key={row.label}>
                    <dt className="data-mono text-[0.65rem]">{row.label}</dt>
                    <dd className="mt-1 text-foreground">{row.value}</dd>
                  </div>
                ))}
              </dl>
              {urlSourceAnalysis.errorMessage ? (
                <p className="mt-1 text-xs text-amber-300">
                  {urlSourceAnalysis.errorMessage}
                </p>
              ) : null}
              {urlSourceAnalysis.funnelSummary ? (
                <div className="mt-3 rounded-md border border-border/50 bg-background/40 p-3">
                  <p className="data-mono text-[0.65rem] text-muted-foreground">
                    Funnel pages
                  </p>
                  <p className="mt-1 text-xs leading-5 text-foreground">
                    {urlSourceAnalysis.funnelSummary}
                  </p>
                  {urlSourceAnalysis.funnelPages.length ? (
                    <div className="mt-2 flex flex-wrap gap-2 text-[0.65rem] text-muted-foreground">
                      {urlSourceAnalysis.funnelPages.slice(0, 5).map((page) => (
                        <span
                          key={`${page.role}-${page.url}`}
                          className="rounded-full border border-border/60 px-2 py-1"
                        >
                          {(page.role ?? "page").replaceAll("_", " ")}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}

              {urlSourceAnalysis && primarySourceVerified ? (
            <div className="mt-4">
              <EvidenceScreenshots screenshots={urlSourceScreenshots} />
            </div>
          ) : null}

          {primarySourceSaved && !primarySourceVerified ? (
            <div className="mt-4 rounded-lg border border-amber-300/25 bg-amber-300/[0.06] p-3">
              <p className="data-mono text-amber-200">Protected preview</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Ownership not verified. Full evidence and monitoring require verification.
              </p>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                Public preview is available. Detailed findings, screenshots, action briefs, and scheduled monitoring stay protected until this source is verified.
              </p>
            </div>
          ) : null}

          {urlSourceTopIssue && primarySourceVerified ? (
            <div className="mt-4 rounded-lg border border-[color:var(--signal-line)] bg-[color:var(--signal-dim)] p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="data-mono text-[color:var(--signal)]">Top finding</p>
                  <h3 className="mt-1 text-sm font-semibold text-foreground">
                    {urlSourceTopIssue.title}
                  </h3>
                </div>
                <SeverityPill severity={urlSourceTopIssue.severity as IssueSeverity} />
              </div>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                {urlSourceTopIssue.summary}
              </p>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                {urlSourceTopIssue.whyItMatters}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <span className="font-mono text-xs text-[color:var(--signal)]">
                  {opportunitySignal.label}: {opportunitySignal.detail}
                </span>
                <Link
                  href={urlSourceTopIssue.href ?? `/app/stores/${urlSourceStoreId}`}
                  className="vault-link inline-flex items-center gap-1 text-xs"
                >
                  Open action path <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              <p className="mt-3 text-xs leading-5 text-muted-foreground">
                Next action: {urlSourceTopIssue.recommendedAction}
              </p>
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
                  : latestUrlSourceScan.status === "failed"
                    ? ` | ${latestUrlSourceScan.errorMessage ?? "analysis failed"}`
                    : " | results pending"}
              </span>
            </div>
          ) : null}
        </article>
      </section>

      <section className="surface-card p-5 sm:p-6 lg:p-7">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="data-mono text-muted-foreground">Optional signal systems</p>
            <h2 className="mt-1.5 text-base font-semibold tracking-tight sm:text-lg">
              Recommended enrichments
            </h2>
          </div>
          <span className="rounded-md border border-border/70 px-2 py-1 font-mono text-[0.65rem] uppercase text-muted-foreground">
            {urlSourceAnalysis ? sourceTypeLabel : "Analyze source first"}
          </span>
        </div>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
          Systems add operational evidence to the primary source. Relevance updates after surface analysis, and unsupported systems can stay unconnected.
        </p>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <article className="rounded-xl border border-border/70 bg-background/35 p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-mono text-[0.68rem] tracking-[0.1em] uppercase text-muted-foreground/60">
                  Commerce evidence
                </p>
                <h3 className="mt-1.5 flex items-center gap-2 text-base font-semibold tracking-tight">
                  <ShoppingBag className="h-4 w-4 text-muted-foreground/70" />
                  Shopify connection
                </h3>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span
                  className={cn(
                    "rounded-md border px-2 py-1 font-mono text-[0.62rem] uppercase",
                    getSystemRelevanceClass(shopifyRelevance)
                  )}
                >
                  {getSystemRelevanceLabel(shopifyRelevance)}
                </span>
                <SourceStatusBadge status={connectData.shopifySourceState.status} />
              </div>
            </div>
            <p className="mt-4 max-w-[34rem] text-sm leading-6 text-muted-foreground">
              Adds checkout, product, and catalog evidence when the primary source is a webshop or routes buyers into Shopify.
            </p>
            <p className="mt-3 max-w-[34rem] text-xs leading-5 text-muted-foreground">
              {hasEcommerceSignal
                ? "Commerce signals were detected, so Shopify evidence can improve checkout confidence."
                : isLeadBusiness
                  ? "This source looks lead-driven. Shopify is not needed unless the business also sells through a shop."
                  : "No strong commerce signal yet. Keep this optional unless Shopify is part of the revenue path."}
            </p>
            <div className="my-5 h-px bg-border/40" />
            {showShopifyInlineSetup ? (
              <form method="GET" action="/api/integrations/shopify/install" className="space-y-3">
                <input type="hidden" name="orgId" value={connectData.organization.id} />
                <div className="space-y-2">
                  <label
                    className="block font-mono text-[0.68rem] tracking-[0.08em] uppercase text-muted-foreground/60"
                    htmlFor="shop"
                  >
                    Shopify shop domain
                  </label>
                  <input
                    id="shop"
                    name="shop"
                    defaultValue={
                      shopFromParams ??
                      connectData.shopifySourceState.shopDomain ??
                      inferredShopDomain ??
                      ""
                    }
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
            ) : (
              <details className="rounded-lg border border-border/60 bg-background/30 p-4">
                <summary className="cursor-pointer text-sm text-muted-foreground">
                  Connect Shopify only if this source uses a Shopify shop
                </summary>
                <form method="GET" action="/api/integrations/shopify/install" className="mt-3 space-y-3">
                  <input type="hidden" name="orgId" value={connectData.organization.id} />
                  <input
                    id="shop"
                    name="shop"
                    defaultValue={shopFromParams ?? ""}
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
                  <ShopifyConnectSubmitButton
                    disabled={!connectData.shopifyConfigured}
                    label={connectData.shopifyConfigured ? shopifyButtonLabel : "Shopify setup required"}
                  />
                </form>
              </details>
            )}
            {connectData.shopifySourceState.status !== "not_connected" ? (
              <div className="mt-2">
                <DisconnectButton
                  label="Disconnect Shopify"
                  action="/api/integrations/shopify/disconnect"
                  next="/app/stores?provider=shopify&status=disconnected"
                />
              </div>
            ) : null}
            {shopifySetupMessage ? (
              <p className="mt-2 text-xs text-amber-300">{shopifySetupMessage}</p>
            ) : null}
          </article>

          {showStripeCard ? (
          <article className="rounded-xl border border-border/70 bg-background/35 p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-mono text-[0.68rem] tracking-[0.1em] uppercase text-muted-foreground/60">
                  Billing evidence
                </p>
                <h3 className="mt-1.5 flex items-center gap-2 text-base font-semibold tracking-tight">
                  <CreditCard className="h-4 w-4 text-muted-foreground/70" />
                  Stripe connection
                </h3>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span
                  className={cn(
                    "rounded-md border px-2 py-1 font-mono text-[0.62rem] uppercase",
                    getSystemRelevanceClass(stripeRelevance)
                  )}
                >
                  {getSystemRelevanceLabel(stripeRelevance)}
                </span>
                <SourceStatusBadge status={connectData.stripeSourceState.status} />
              </div>
            </div>
            <p className="mt-4 max-w-[34rem] text-sm leading-6 text-muted-foreground">
              Adds billing recovery and payment failure evidence when the source sells plans, subscriptions, paid services, or checkout flows.
            </p>
            <p className="mt-3 max-w-[34rem] text-xs leading-5 text-muted-foreground">
              {hasSaasSignal
                ? "Pricing or signup signals make billing depth a strong next enrichment."
                : hasEcommerceSignal
                  ? "Useful when payment and recovery signals live in Stripe."
                  : isLeadBusiness
                    ? "Optional for lead-driven businesses unless payment collection or retainers run through Stripe."
                    : "Optional until the revenue path shows billing or payment recovery risk."}
            </p>
            <div className="my-5 h-px bg-border/40" />
            {isPendingStripe ? (
              <div className="inline-flex items-center gap-2 rounded-lg border border-border/60 bg-card/50 px-4 py-3 text-sm text-foreground">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-foreground/50" />
                Billing scan running
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
            {connectData.stripeSourceState.accountId ? (
              <p className="mt-3 font-mono text-[0.65rem] tracking-[0.06em] text-muted-foreground/45">
                {connectData.stripeSourceState.accountId}
              </p>
            ) : null}
          </article>
          ) : null}
        </div>

        <div className="mt-5 rounded-xl border border-dashed border-border/60 bg-background/20 p-5">
          <p className="font-mono text-[0.68rem] uppercase tracking-[0.08em] text-muted-foreground/60">
            Future system lanes
          </p>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            {systemLaneCopy}
          </p>
        </div>
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
                      URL surface summary
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
                    {normalizedLiveSource?.hostname ?? "No URL saved"} | canonical source context
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {urlSourceTopIssue && primarySourceVerified
                      ? `Top finding: ${urlSourceTopIssue.title}`
                      : urlSourceAnalysis
                        ? getSurfaceSummary({
                            businessType,
                            surfaceClassification: urlSourceAnalysis.surfaceClassification,
                            revenuePathClarity: urlSourceAnalysis.revenuePathClarity,
                          })
                        : sourceScanStateDetail}
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
                    {opportunitySignal.detail}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {connectedSystemsCount > 0
                      ? `${connectedSystemsCount} evidence enrichment${connectedSystemsCount !== 1 ? "s" : ""}`
                      : urlSourceAnalysis
                        ? "URL-only analysis"
                        : "No enrichments connected"}
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
            <p>No sources connected yet. Set a primary URL to begin revenue-surface monitoring.</p>
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
