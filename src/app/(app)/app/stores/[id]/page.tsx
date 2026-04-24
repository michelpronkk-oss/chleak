import type { Metadata } from "next"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { ArrowLeft, ArrowRight } from "lucide-react"

export const metadata: Metadata = {
  title: "Source Detail",
}

import { MetaPill, RankedQueueRow, ScanStatePill, SeverityPill, VaultPanel } from "@/components/dashboard/vault-primitives"
import { EvidenceScreenshots } from "@/components/evidence/evidence-screenshots"
import { formatCompactCurrency, formatRelativeTimestamp } from "@/lib/format"
import { getDirectionalOpportunityEstimate } from "@/lib/opportunity-estimate"
import { SubmitButton } from "@/components/ui/submit-button"
import { getStoreDetailData, getStoresIndexData } from "@/server/services/app-service"
import { saveActivationFlowHints, triggerActivationTestRun, triggerUrlSourceAnalysisForStore } from "./actions"

const hintStatusMessage: Record<string, string> = {
  saved: "Activation flow hints saved.",
  invalid: "Hints were not saved. Check URL or selector formatting.",
  no_integration: "No active integration found for this source.",
  save_failed: "Hint save failed. Retry in a moment.",
  unauthorized: "You are not authorized to edit this store.",
  not_found: "Store context was not found for this workspace.",
}

const scanStatusMessage: Record<string, string> = {
  completed: "Scan completed. Results have been updated.",
  queued: "Scan queued. Results will appear here when the background run completes.",
  queue_failed: "Could not queue a test scan. Retry in a moment.",
  trigger_failed: "Scan was created, but the worker could not be started. Retry in a moment.",
  unsupported_provider: "This source does not have a supported scan worker yet.",
  unauthorized: "You are not authorized to trigger scans for this store.",
  not_found: "Store context was not found for this workspace.",
  scan_not_queued_or_missing: "Queued test scan could not be processed.",
  scan_not_queued_anymore: "Queued test scan was already picked by another runner.",
  lookup_failed: "Scan processor lookup failed.",
  store_missing: "Scan failed because store record was missing.",
  integration_missing: "Scan failed because integration was missing.",
  running_update_failed: "Scan failed before entering running state.",
  completion_failed: "Scan failed during completion update.",
}

function formatOperatorValue(value: string | null) {
  if (!value) {
    return "None"
  }
  return value.replaceAll("_", " ")
}

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

function formatRevenuePath(value: string | null | undefined) {
  if (value === "clear") return "Revenue path visible"
  if (value === "partial") return "Revenue path incomplete"
  if (value === "none") return "No clear revenue path"
  return "Revenue path pending"
}

function formatSignal(value: boolean | null | undefined) {
  if (value === true) return "Detected"
  if (value === false) return "Not detected"
  return "Not evaluated"
}

function getSurfaceSummary(input: {
  businessType: string | null | undefined
  revenuePathClarity: string | null | undefined
}) {
  const model = getBusinessTypeLabel(input.businessType)
  if (input.businessType === "agency" || input.businessType === "service_business") {
    return `${model} surface detected. Lead capture path ${input.revenuePathClarity === "clear" ? "is visible" : "needs attention"}.`
  }
  return `${model} surface detected. ${formatRevenuePath(input.revenuePathClarity)}.`
}

function getBusinessSignalRows(input: {
  businessType: string | null | undefined
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
  if (input.businessType === "agency" || input.businessType === "service_business") {
    return [
      { label: "Contact path", value: formatSignal(input.hasContactOrBookingPath) },
      { label: "Booking or quote path", value: formatSignal(input.hasContactOrBookingPath) },
      { label: "Revenue path", value: getRevenueModelLabel(input.revenueModel) },
      { label: "Primary action", value: primaryAction },
    ]
  }
  if (input.businessType === "ecommerce") {
    return [
      { label: "Product path", value: formatSignal(input.hasPricingPath || input.hasPrimaryCta) },
      { label: "Cart path", value: formatSignal(input.hasCheckoutSignal) },
      { label: "Checkout path", value: formatSignal(input.hasCheckoutSignal) },
      { label: "Payment handoff", value: formatSignal(input.hasCheckoutSignal) },
    ]
  }
  return [
    { label: "Pricing path", value: formatSignal(input.hasPricingPath) },
    { label: "Signup path", value: formatSignal(input.hasSignupPath) },
    { label: "Login or app path", value: formatSignal(input.hasLoginPath || input.hasSubscriptionLanguage) },
    { label: "Primary action", value: primaryAction },
  ]
}

function formatSelectorMatch(value: boolean | null) {
  if (value === true) {
    return "matched"
  }
  if (value === false) {
    return "not matched"
  }
  return "not evaluated"
}

export default async function StoreDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { id } = await params
  const query = await searchParams
  const storesData = await getStoresIndexData()

  if (!storesData.hasPlan) {
    redirect("/app/billing?intent=plan_required")
  }

  const data = await getStoreDetailData(id)

  if (!data && storesData.onboardingState === "empty") {
    redirect("/app/stores")
  }

  if (!data) {
    notFound()
  }

  const hintStatusRaw = query.hint_status
  const hintStatus = Array.isArray(hintStatusRaw) ? hintStatusRaw[0] : hintStatusRaw
  const scanStatusRaw = query.scan_status
  const scanStatus = Array.isArray(scanStatusRaw) ? scanStatusRaw[0] : scanStatusRaw
  const activeHintStatus = hintStatus ? hintStatusMessage[hintStatus] ?? null : null
  const activeScanStatus = scanStatus ? scanStatusMessage[scanStatus] ?? null : null
  const saveHintsAction = saveActivationFlowHints.bind(null, data.store.id)
  const runTestScanAction = triggerActivationTestRun.bind(null, data.store.id)
  const runSurfaceAnalysisAction = triggerUrlSourceAnalysisForStore.bind(null, data.store.id)
  const hintDefaults = data.integration?.activationFlowHints ?? {
    preferredEntryUrl: null,
    onboardingPathUrl: null,
    preferredPrimaryCtaSelector: null,
    preferredNextActionSelector: null,
    firstValueAreaSelector: null,
    authExpected: null,
    pageIntentHint: null,
  }
  const lastActivationRun = data.integration?.activationLastRun ?? null
  const screenshotReference =
    lastActivationRun?.progressionScreenshotRef ??
    lastActivationRun?.entryScreenshotRef ??
    null
  const screenshotSha =
    lastActivationRun?.progressionScreenshotSha256 ??
    lastActivationRun?.entryScreenshotSha256 ??
    null
  const screenshotBytes =
    lastActivationRun?.progressionScreenshotBytes ??
    lastActivationRun?.entryScreenshotBytes ??
    null
  const isDemoMode = data.onboardingState === "demo"
  const isShopifySource = data.store.platform === "shopify"
  const isWebsiteSource = data.store.platform === "website"
  const showLiveShopifyActivationControls = isShopifySource && !isDemoMode
  const showUrlSourceControls = isWebsiteSource && !isDemoMode
  const urlSourceAnalysis = data.urlSourceAnalysis ?? null
  const sourceTypeLabel = getBusinessTypeLabel(urlSourceAnalysis?.businessType)
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
      ]
    : []
  const opportunitySignal = getDirectionalOpportunityEstimate({
    businessType: urlSourceAnalysis?.businessType,
    revenueModel: urlSourceAnalysis?.revenueModel,
    revenuePathClarity: urlSourceAnalysis?.revenuePathClarity,
    issueImpact: data.estimatedLeakage,
    issueCount: data.issues.length,
    hasScreenshotEvidence: urlSourceScreenshots.some((shot) => Boolean(shot.src)),
    // Browser inspection signals available from the HTML analysis runner
    responseTimeMs: urlSourceAnalysis?.responseTimeMs ?? null,
  })
  const businessSignalRows = urlSourceAnalysis
    ? getBusinessSignalRows({
        businessType: urlSourceAnalysis.businessType,
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
  const latestScanIsActive =
    data.latestScan?.status === "queued" || data.latestScan?.status === "running"
  const liveSourceSurface = data.integration?.liveSourceSurface ?? null
  const connectedSystems = (
    liveSourceSurface?.connectedSystems?.length
      ? liveSourceSurface.connectedSystems
      : data.integration?.provider
        ? [data.integration.provider]
        : []
  ).filter((s) => s !== "checkoutleak_connector")

  const rankedIssues = [...data.issues].sort(
    (a, b) => b.estimatedMonthlyRevenueImpact - a.estimatedMonthlyRevenueImpact
  )
  // Hard issues require operator action (critical, high, medium).
  // Optimization opportunities are present but not broken (low severity).
  const hardIssues = rankedIssues.filter((i) => i.severity !== "low")
  const opportunityItems = rankedIssues.filter((i) => i.severity === "low")
  const primaryMove = hardIssues[0] ?? null
  const primaryOpportunity = opportunityItems[0] ?? null
  const hasHardIssue = hardIssues.length > 0
  const hasOpportunity = opportunityItems.length > 0

  return (
    <div className="space-y-5 pb-24 lg:pb-4">
      <section className="vault-page-intro space-y-3">
        <Link
          href="/app/stores"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to sources
        </Link>
        <p className="data-mono text-muted-foreground">Source Detail</p>
        <h1 className="vault-page-intro-title">{data.store.name}</h1>
        <p className="vault-page-intro-copy">
          {data.context?.operationalArea ?? "Revenue monitoring source"} |{" "}
          {isDemoMode ? `Simulated ${data.status.label.toLowerCase()}` : data.status.label}
        </p>
        {isDemoMode ? (
          <p className="text-sm text-amber-300">
            Demo source detail. Findings, scan history, and opportunities are simulated.
          </p>
        ) : null}
      </section>

      <section className="vault-metric-grid">
        <article className="vault-metric-cell vault-metric-cell-primary">
          <p className="vault-metric-key">
            {isWebsiteSource
              ? opportunitySignal.label
              : isDemoMode
                ? "Simulated leakage"
                : "Estimated leakage"}
          </p>
          <p className="vault-metric-value vault-metric-value-primary">
            {isWebsiteSource
              ? data.estimatedLeakage > 0
                ? formatCompactCurrency(data.estimatedLeakage)
                : opportunitySignal.estimatedLow !== null
                  ? formatCompactCurrency(opportunitySignal.estimatedLow)
                  : "Pending"
              : formatCompactCurrency(data.estimatedLeakage)}
          </p>
          {isWebsiteSource && opportunitySignal.leadsMeta ? (
            <p className="vault-metric-delta">{opportunitySignal.leadsMeta}</p>
          ) : null}
          <p className="vault-metric-delta">
            {isWebsiteSource
              ? `${opportunitySignal.confidence} confidence`
              : "Per month from this source"}
          </p>
        </article>
        <article className="vault-metric-cell">
          <p className="vault-metric-key">Open issues</p>
          <p className="vault-metric-value">{hardIssues.length}</p>
          <p className="vault-metric-delta">
            {hasOpportunity && !hasHardIssue
              ? `${opportunityItems.length} optimization${opportunityItems.length !== 1 ? "s" : ""} available`
              : hasOpportunity
                ? `${opportunityItems.length} optimization${opportunityItems.length !== 1 ? "s" : ""} also available`
                : "Ranked by exposure"}
          </p>
        </article>
        <article className="vault-metric-cell">
          <p className="vault-metric-key">Latest scan</p>
          <p className="vault-metric-value text-2xl sm:text-3xl">
            {data.latestScan ? formatRelativeTimestamp(data.latestScan.scannedAt) : "Pending"}
          </p>
          <p className="vault-metric-delta">
            {data.latestScan
              ? data.latestScan.status === "completed"
                ? `${data.latestScan.detectedIssuesCount} findings`
                : data.latestScan.status
              : isDemoMode
                ? "No simulated scan yet"
                : "Awaiting initial pass"}
          </p>
        </article>
        <article className="vault-metric-cell">
          <p className="vault-metric-key">Status</p>
          <p className={`vault-metric-value text-2xl sm:text-3xl ${data.status.tone}`}>{data.status.label}</p>
          <p className="vault-metric-delta">{data.store.platform}</p>
        </article>
      </section>

      <section className="vault-dashboard-grid">
        <div className="space-y-5">
          <VaultPanel title={`Issue queue | ${hardIssues.length} open`} meta="Sorted by exposure">
            {hardIssues.length ? (
              hardIssues.map((issue) => (
                <RankedQueueRow
                  key={issue.id}
                  severity={issue.severity}
                  title={issue.title}
                  meta={issue.summary}
                  amount={formatCompactCurrency(issue.estimatedMonthlyRevenueImpact)}
                  age={formatRelativeTimestamp(issue.detectedAt)}
                />
              ))
            ) : (
              <div className="px-5 py-8 text-sm text-muted-foreground">
                {hasOpportunity
                  ? "No active issues. Optimization opportunities are available below."
                  : "No open issues for this source."}
              </div>
            )}
          </VaultPanel>

          <VaultPanel title="Source profile" meta="Live source surface and connected systems">
            <dl className="grid gap-4 px-4 py-4 text-sm sm:grid-cols-2 sm:px-5">
              <div>
                <dt className="data-mono text-muted-foreground">Live source URL</dt>
                <dd className="mt-1 break-all">
                  {liveSourceSurface?.primaryUrl ?? "Not set"}
                </dd>
              </div>
              <div>
                <dt className="data-mono text-muted-foreground">
                  Source domain
                </dt>
                <dd className="mt-1">
                  {liveSourceSurface?.domain ?? data.storeDisplayDomain ?? "Unknown"}
                </dd>
              </div>
              <div>
                <dt className="data-mono text-muted-foreground">Source entity</dt>
                <dd className="mt-1">
                  {(liveSourceSurface?.sourceEntityType ?? "unknown").replaceAll("_", " ")}
                </dd>
              </div>
              <div>
                <dt className="data-mono text-muted-foreground">Connected systems</dt>
                <dd className="mt-1">
                  {connectedSystems.length
                    ? connectedSystems.join(", ")
                    : "None"}
                </dd>
              </div>
              {liveSourceSurface?.identifier ? (
                <div>
                  <dt className="data-mono text-muted-foreground">System identifier</dt>
                  <dd className="mt-1 break-all">{liveSourceSurface.identifier}</dd>
                </div>
              ) : null}
              {data.store.platform === "shopify" &&
              data.canonicalShopifyDomain &&
              data.canonicalShopifyDomain !== data.storeDisplayDomain ? (
                <div>
                  <dt className="data-mono text-muted-foreground">Canonical shop domain</dt>
                  <dd className="mt-1">{data.canonicalShopifyDomain}</dd>
                </div>
              ) : null}
              <div>
                <dt className="data-mono text-muted-foreground">Source status</dt>
                <dd className={`mt-1 ${data.status.tone}`}>{data.status.label}</dd>
              </div>
            </dl>
            {data.context ? (
              <div className="border-t border-border/60 px-4 py-3 text-sm text-muted-foreground sm:px-5">
                <p>Owner team: {data.context.ownerTeam}</p>
                <p className="mt-1">Primary objective: {data.context.primaryObjective}</p>
              </div>
            ) : null}
          </VaultPanel>

          {isWebsiteSource ? null : (
          <VaultPanel title="Activation flow hints" meta="Runner targeting controls">
            {showLiveShopifyActivationControls ? (
              <form action={saveHintsAction}>
                <div className="vault-settings-table">
                <div className="vault-settings-row">
                  <div>
                    <label htmlFor="preferred_entry_url" className="vault-settings-key">Preferred entry URL</label>
                    <p className="vault-settings-desc">Absolute URL for activation entry. Leave blank for default integration domain.</p>
                  </div>
                  <input
                    id="preferred_entry_url"
                    name="preferred_entry_url"
                    defaultValue={hintDefaults.preferredEntryUrl ?? ""}
                    placeholder="https://your-store.myshopify.com"
                    className="vault-input rounded-md px-3 py-2 text-sm outline-none w-full max-w-xs"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                  />
                </div>

                <div className="vault-settings-row">
                  <div>
                    <label htmlFor="onboarding_path_url" className="vault-settings-key">Onboarding path URL</label>
                    <p className="vault-settings-desc">Optional path or URL to start the first activation surface.</p>
                  </div>
                  <input
                    id="onboarding_path_url"
                    name="onboarding_path_url"
                    defaultValue={hintDefaults.onboardingPathUrl ?? ""}
                    placeholder="/onboarding"
                    className="vault-input rounded-md px-3 py-2 text-sm outline-none w-full max-w-xs"
                  />
                </div>

                <div className="vault-settings-row">
                  <div>
                    <label htmlFor="preferred_primary_cta_selector" className="vault-settings-key">Primary CTA selector</label>
                    <p className="vault-settings-desc">CSS selector for the expected primary forward action.</p>
                  </div>
                  <input
                    id="preferred_primary_cta_selector"
                    name="preferred_primary_cta_selector"
                    defaultValue={hintDefaults.preferredPrimaryCtaSelector ?? ""}
                    placeholder='button[data-test="start"]'
                    className="vault-input rounded-md px-3 py-2 text-sm outline-none w-full max-w-xs"
                  />
                </div>

                <div className="vault-settings-row">
                  <div>
                    <label htmlFor="preferred_next_action_selector" className="vault-settings-key">Next action selector</label>
                    <p className="vault-settings-desc">CSS selector for the first visible progression after entry.</p>
                  </div>
                  <input
                    id="preferred_next_action_selector"
                    name="preferred_next_action_selector"
                    defaultValue={hintDefaults.preferredNextActionSelector ?? ""}
                    placeholder='a[href*="next-step"]'
                    className="vault-input rounded-md px-3 py-2 text-sm outline-none w-full max-w-xs"
                  />
                </div>

                <div className="vault-settings-row">
                  <div>
                    <label htmlFor="first_value_area_selector" className="vault-settings-key">First value area selector</label>
                    <p className="vault-settings-desc">CSS selector marking first-value content presence.</p>
                  </div>
                  <input
                    id="first_value_area_selector"
                    name="first_value_area_selector"
                    defaultValue={hintDefaults.firstValueAreaSelector ?? ""}
                    placeholder='section[data-test="dashboard-main"]'
                    className="vault-input rounded-md px-3 py-2 text-sm outline-none w-full max-w-xs"
                  />
                </div>

                <div className="vault-settings-row">
                  <div>
                    <label htmlFor="auth_expected" className="vault-settings-key">Auth expected</label>
                    <p className="vault-settings-desc">Set when this surface is expected to show an auth gate before progression.</p>
                  </div>
                  <select
                    id="auth_expected"
                    name="auth_expected"
                    defaultValue={
                      hintDefaults.authExpected === true
                        ? "true"
                        : hintDefaults.authExpected === false
                          ? "false"
                          : ""
                    }
                    className="vault-input rounded-md px-3 py-2 text-sm outline-none w-full max-w-xs"
                  >
                    <option value="">Auto</option>
                    <option value="true">Expected</option>
                    <option value="false">Not expected</option>
                  </select>
                </div>

                <div className="vault-settings-row">
                  <div>
                    <label htmlFor="page_intent_hint" className="vault-settings-key">Page intent hint</label>
                    <p className="vault-settings-desc">Optional intent guidance for deterministic page classification.</p>
                  </div>
                  <select
                    id="page_intent_hint"
                    name="page_intent_hint"
                    defaultValue={hintDefaults.pageIntentHint ?? ""}
                    className="vault-input rounded-md px-3 py-2 text-sm outline-none w-full max-w-xs"
                  >
                    <option value="">Auto</option>
                    <option value="onboarding">Onboarding</option>
                    <option value="activation">Activation</option>
                    <option value="first_value">First value</option>
                    <option value="checkout_handoff">Checkout handoff</option>
                  </select>
                </div>
              </div>

                <div className="border-t border-border/60 px-4 py-3 sm:px-5">
                  <SubmitButton label="Save activation hints" />
                  {activeHintStatus ? (
                    <p className="mt-2 text-xs text-muted-foreground">{activeHintStatus}</p>
                  ) : null}
                </div>
              </form>
            ) : (
              <p className="px-5 py-6 text-sm text-muted-foreground">
                {isDemoMode
                  ? "Activation controls are available in live Shopify sources. Demo sources keep this view read-only."
                  : "Activation controls are available for Shopify sources."}
              </p>
            )}
          </VaultPanel>
          )}
        </div>

        <div className="space-y-5">
          <section className="vault-panel-shell border-[color:var(--signal-line)] bg-[linear-gradient(180deg,var(--signal-dim),var(--ink-100)_60%)] p-5 sm:p-6">
            <p className="vault-metric-key text-[color:var(--signal)]">
              {isDemoMode
                ? "Recommended move"
                : hasHardIssue
                  ? "Recommended move"
                  : hasOpportunity
                    ? "Optimization available"
                    : "Source status"}
            </p>
            <h2 className="mt-2 text-lg font-semibold tracking-tight text-foreground">
              {primaryMove?.title ??
                primaryOpportunity?.title ??
                (isDemoMode ? "No simulated intervention required" : "Source path is healthy")}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {primaryMove?.summary ??
                primaryOpportunity?.summary ??
                (isDemoMode
                  ? "This simulated source is currently stable."
                  : "Core revenue path is detected and active. Review the optimization brief or continue monitoring.")}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {hasHardIssue && primaryMove ? (
                <SeverityPill severity={primaryMove.severity} />
              ) : null}
              <MetaPill>
                {formatCompactCurrency(
                  primaryMove?.estimatedMonthlyRevenueImpact ??
                  primaryOpportunity?.estimatedMonthlyRevenueImpact ??
                  0
                )}
              </MetaPill>
            </div>
            {(hasHardIssue || hasOpportunity) ? (
              <Link
                href={data.fixPlanLinks[0]?.href ?? "/app/stores"}
                className="marketing-primary-cta mt-5 inline-flex w-full items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold transition-transform hover:-translate-y-px"
              >
                {hasHardIssue ? "Review action brief" : "Review optimization brief"}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            ) : (
              <Link
                href="/app/stores"
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-md border border-border/60 px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Open sources
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            )}
            {data.setupAttentionMessage ? (
              <p className="mt-3 text-xs text-amber-300">{data.setupAttentionMessage}</p>
            ) : null}
          </section>

          <VaultPanel
            title="Recent activity"
            meta={isDemoMode ? "Simulated scan timeline" : "Latest scans"}
          >
            {data.scans.length ? (
              <ul className="space-y-2.5 px-4 py-3 text-sm text-muted-foreground sm:px-5">
                {data.scans.slice(0, 4).map((scan) => (
                  <li key={scan.id} className="rounded-md border border-border/60 bg-background/30 px-3 py-2.5">
                    <p>
                      Scan {scan.id.slice(-4)} <ScanStatePill status={scan.status} className="ml-2 py-0.5" />
                    </p>
                    <p className="mt-1 text-xs">
                      {formatRelativeTimestamp(scan.scannedAt)}
                      {scan.status === "completed"
                        ? ` | ${scan.detectedIssuesCount} issues`
                        : " | results pending"}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-5 py-6 text-sm text-muted-foreground">
                {isDemoMode
                  ? "Simulated scan history appears when demo sources include recent runs."
                  : "Scan history will appear after initial pass completes."}
              </p>
            )}
          </VaultPanel>

          <VaultPanel
            title={hasOpportunity && !hasHardIssue ? "Optimization briefs" : "Linked opportunities"}
            meta={`${data.fixPlanLinks.length} ${isDemoMode ? "simulated " : ""}action brief${data.fixPlanLinks.length !== 1 ? "s" : ""}`}
          >
            <ul className="space-y-2.5 px-4 py-3 sm:px-5">
              {data.fixPlanLinks.length ? (
                data.fixPlanLinks.map((plan) => {
                  const isOpportunityPlan = opportunityItems.some(
                    (o) => o.id === plan.issueId
                  )
                  return (
                    <li key={plan.issueId} className="rounded-md border border-border/60 bg-background/30 px-3 py-2.5">
                      {isOpportunityPlan ? (
                        <span className="mb-1.5 inline-flex items-center rounded border border-emerald-400/25 bg-emerald-400/[0.07] px-1.5 py-0.5 font-mono text-[0.6rem] tracking-[0.07em] uppercase text-emerald-400">
                          Optimization
                        </span>
                      ) : null}
                      <p className="text-sm font-medium">{plan.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatCompactCurrency(plan.estimatedMonthlyRevenueImpact)} pipeline opportunity
                      </p>
                      <Link
                        href={plan.href}
                        className="vault-link mt-2 inline-flex items-center gap-1 text-xs"
                      >
                        {isOpportunityPlan ? "Review optimization brief" : "Review action brief"} <ArrowRight className="h-3 w-3" />
                      </Link>
                    </li>
                  )
                })
              ) : (
                <li className="text-sm text-muted-foreground">
                  {isDemoMode
                    ? "No simulated fix plans are linked to this source yet."
                    : "No fix plans linked to this source yet."}
                </li>
              )}
            </ul>
          </VaultPanel>

          {showUrlSourceControls ? (
            <div id="surface-analysis">
          <VaultPanel title="Surface analysis" meta="Latest revenue path and surface evidence">
            {urlSourceAnalysis ? (
              <div className="space-y-3 px-4 py-4 text-sm sm:px-5">
                <p className="text-sm leading-6 text-foreground">
                  {getSurfaceSummary({
                    businessType: urlSourceAnalysis.businessType,
                    revenuePathClarity: urlSourceAnalysis.revenuePathClarity,
                  })}
                </p>
                <dl className="grid gap-2 text-muted-foreground">
                  <div>
                    <dt className="data-mono text-[0.68rem]">Analyzed</dt>
                      <dd className="mt-1 text-foreground">
                        {urlSourceAnalysis.completedAt
                          ? formatRelativeTimestamp(urlSourceAnalysis.completedAt)
                          : "Unknown"}
                      </dd>
                  </div>
                  <div>
                    <dt className="data-mono text-[0.68rem]">Detected model</dt>
                    <dd className="mt-1 text-foreground">
                        {sourceTypeLabel}
                    </dd>
                  </div>
                  <div>
                    <dt className="data-mono text-[0.68rem]">Revenue path</dt>
                    <dd className="mt-1 text-foreground">
                        {getRevenueModelLabel(urlSourceAnalysis.revenueModel)}
                    </dd>
                  </div>
                  {businessSignalRows.map((row) => (
                    <div key={row.label}>
                      <dt className="data-mono text-[0.68rem]">{row.label}</dt>
                      <dd className="mt-1 text-foreground">{row.value}</dd>
                    </div>
                  ))}
                    <div>
                      <dt className="data-mono text-[0.68rem]">Entry URL</dt>
                      <dd className="mt-1 break-all">{urlSourceAnalysis.entryUrl ?? "Unknown"}</dd>
                    </div>
                    {urlSourceAnalysis.finalUrl && urlSourceAnalysis.finalUrl !== urlSourceAnalysis.entryUrl ? (
                      <div>
                        <dt className="data-mono text-[0.68rem]">Final URL</dt>
                        <dd className="mt-1 break-all">{urlSourceAnalysis.finalUrl}</dd>
                      </div>
                    ) : null}
                    {urlSourceAnalysis.errorMessage ? (
                      <div>
                        <dt className="data-mono text-[0.68rem]">Note</dt>
                        <dd className="mt-1 text-amber-300">{urlSourceAnalysis.errorMessage}</dd>
                      </div>
                    ) : null}
                </dl>
                <EvidenceScreenshots screenshots={urlSourceScreenshots} />
              </div>
              ) : (
                <p className="px-5 py-6 text-sm text-muted-foreground">
                  No surface analysis has been run for this source yet.
                </p>
              )}
            </VaultPanel>
            </div>
          ) : (
            <VaultPanel title="Last activation run" meta="Latest deterministic flow summary">
              {showLiveShopifyActivationControls ? (
                lastActivationRun ? (
                  <div className="space-y-3 px-4 py-4 text-sm sm:px-5">
                    <dl className="grid gap-2 text-muted-foreground">
                      <div>
                        <dt className="data-mono text-[0.68rem]">Run time</dt>
                        <dd className="mt-1 text-foreground">
                          {lastActivationRun.lastRunAt
                            ? formatRelativeTimestamp(lastActivationRun.lastRunAt)
                            : "Unknown"}
                        </dd>
                      </div>
                      <div>
                        <dt className="data-mono text-[0.68rem]">Runner</dt>
                        <dd className="mt-1">
                          {lastActivationRun.detectorVersion ?? "Unknown"} | {formatOperatorValue(lastActivationRun.runStatus)}
                        </dd>
                      </div>
                      <div>
                        <dt className="data-mono text-[0.68rem]">Progression</dt>
                        <dd className="mt-1">
                          {formatOperatorValue(lastActivationRun.progressionOutcome)}
                          {" | "}
                          dead end: {formatOperatorValue(lastActivationRun.deadEndReason)}
                        </dd>
                      </div>
                      <div>
                        <dt className="data-mono text-[0.68rem]">URLs</dt>
                        <dd className="mt-1 break-all">
                          Entry: {lastActivationRun.entryUrl ?? "Unknown"}
                        </dd>
                        <dd className="mt-1 break-all">
                          Final: {lastActivationRun.finalUrl ?? "Unknown"}
                        </dd>
                      </div>
                      <div>
                        <dt className="data-mono text-[0.68rem]">Page state</dt>
                        <dd className="mt-1">
                          Entry: {formatOperatorValue(lastActivationRun.entryPageClassification)}
                        </dd>
                        <dd className="mt-1">
                          Final: {formatOperatorValue(lastActivationRun.finalPageClassification)}
                        </dd>
                      </div>
                      <div>
                        <dt className="data-mono text-[0.68rem]">Primary action</dt>
                        <dd className="mt-1">
                          {lastActivationRun.primaryActionLabel ?? "None"}{" "}
                          ({formatOperatorValue(lastActivationRun.primaryActionKind)})
                        </dd>
                        <dd className="mt-1 break-all">
                          Target: {lastActivationRun.primaryActionTarget ?? "None"}
                        </dd>
                      </div>
                      <div>
                        <dt className="data-mono text-[0.68rem]">Hint usage</dt>
                        <dd className="mt-1">
                          Source: {lastActivationRun.hintSource ?? "none"}
                        </dd>
                        <dd className="mt-1 break-all">
                          Primary selector: {lastActivationRun.hintPrimarySelector ?? "None"} ({formatSelectorMatch(lastActivationRun.hintPrimarySelectorMatched)})
                        </dd>
                        <dd className="mt-1 break-all">
                          Next-action selector: {lastActivationRun.hintNextActionSelector ?? "None"} ({formatSelectorMatch(lastActivationRun.hintNextActionSelectorMatched)})
                        </dd>
                        <dd className="mt-1 break-all">
                          First-value selector: {lastActivationRun.hintFirstValueSelector ?? "None"} ({formatSelectorMatch(lastActivationRun.hintFirstValueSelectorMatched)})
                        </dd>
                        <dd className="mt-1">
                          Auth expected:{" "}
                          {lastActivationRun.hintAuthExpected === null
                            ? "auto"
                            : lastActivationRun.hintAuthExpected
                              ? "true"
                              : "false"}{" "}
                          | intent: {lastActivationRun.hintPageIntent ?? "auto"}
                        </dd>
                      </div>
                      <div>
                        <dt className="data-mono text-[0.68rem]">Screenshot evidence</dt>
                        <dd className="mt-1 break-all">
                          Ref: {screenshotReference ?? "None"}
                        </dd>
                        <dd className="mt-1 break-all">
                          SHA-256: {screenshotSha ?? "None"}
                        </dd>
                        <dd className="mt-1">
                          Bytes: {screenshotBytes ?? "None"}
                        </dd>
                      </div>
                    </dl>
                  </div>
                ) : (
                  <p className="px-5 py-6 text-sm text-muted-foreground">
                    No activation flow run has been recorded for this source yet. Run a test scan to generate the first summary.
                  </p>
                )
              ) : (
                <p className="px-5 py-6 text-sm text-muted-foreground">
                  {isDemoMode
                    ? "Activation run summary appears for live Shopify sources after an activation test run."
                    : "Activation run summary is available for Shopify sources."}
                </p>
              )}
            </VaultPanel>
          )}

          {showUrlSourceControls ? (
            <VaultPanel title="Surface analysis scan" meta="Run surface analysis on this source">
              <div className="px-4 py-4 sm:px-5">
                <p className="text-sm text-muted-foreground">
                  Analyze the live revenue surface to detect pricing path, signup flow, and checkout signal presence. Results appear in Surface analysis.
                </p>
                {latestScanIsActive ? (
                  <div className="mt-3 rounded-md border border-primary/25 bg-primary/[0.06] px-3 py-2 text-xs text-muted-foreground">
                    <ScanStatePill status={data.latestScan.status} className="mr-2 py-0.5" />
                    Background analysis is active. This page will show new evidence when it completes.
                  </div>
                ) : null}
                <form action={runSurfaceAnalysisAction} className="mt-4">
                  <SubmitButton
                    label={urlSourceAnalysis ? "Re-run surface analysis" : "Run surface analysis"}
                    pendingLabel="Queueing scan..."
                  />
                </form>
                {activeScanStatus ? (
                  <p className="mt-2 text-xs text-muted-foreground">{activeScanStatus}</p>
                ) : null}
              </div>
            </VaultPanel>
          ) : (
            <VaultPanel
              title="Activation test-run"
              meta={
                showLiveShopifyActivationControls
                  ? "Run and validate activation behavior on this source"
                  : "Source-specific scan controls"
              }
            >
              <div className="px-4 py-4 sm:px-5">
                {showLiveShopifyActivationControls ? (
                  <>
                    <p className="text-sm text-muted-foreground">
                      Trigger a fresh activation scan and review evidence in this source detail when the worker completes.
                    </p>
                    {latestScanIsActive ? (
                      <div className="mt-3 rounded-md border border-primary/25 bg-primary/[0.06] px-3 py-2 text-xs text-muted-foreground">
                        <ScanStatePill status={data.latestScan.status} className="mr-2 py-0.5" />
                        Background scan is active. Results will appear in recent activity and linked opportunities.
                      </div>
                    ) : null}
                    <form action={runTestScanAction} className="mt-4">
                      <SubmitButton
                        label="Run activation test scan"
                        pendingLabel="Queueing scan..."
                      />
                    </form>
                    {activeScanStatus ? (
                      <p className="mt-2 text-xs text-muted-foreground">{activeScanStatus}</p>
                    ) : null}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {isDemoMode
                      ? "Test scans run in live Shopify sources. Use Return to live workspace to validate real behavior."
                      : "Activation test scans are available for Shopify sources."}
                  </p>
                )}
              </div>
            </VaultPanel>
          )}
        </div>
      </section>

      {isShopifySource && !isDemoMode ? (
        <form method="POST" action="/api/integrations/shopify/disconnect">
          <input type="hidden" name="next" value="/app/stores?provider=shopify&status=disconnected" />
          <button
            type="submit"
            className="inline-flex items-center rounded-md border border-border/70 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            Disconnect Shopify
          </button>
        </form>
      ) : null}
    </div>
  )
}
