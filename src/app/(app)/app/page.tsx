import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowRight } from "lucide-react"

export const metadata: Metadata = {
  title: "Overview",
}

import { PendingScanLiveRefresh } from "@/components/dashboard/pending-scan-live-refresh"
import {
  MetaPill,
  QueueEventRow,
  RankedQueueRow,
  SeverityPill,
  VaultPanel,
  cleanPrimaryCopy,
  formatImpactLabel,
  formatSourceLabel,
} from "@/components/dashboard/vault-primitives"
import { ProcessingStagePanel } from "@/components/dashboard/processing-stage-panel"
import { formatCompactCurrency, formatRelativeTimestamp } from "@/lib/format"
import { normalizeScanState } from "@/lib/scan-state"
import { SubmitButton } from "@/components/ui/submit-button"
import { getDashboardJourneyData } from "@/server/services/app-service"
import {
  getFallbackFixPlanHref,
  getFixPlanHrefForIssue,
} from "@/server/services/fix-plan-service"
import { EmptyWorkspaceActions } from "./empty-workspace-actions"
import { triggerUrlSourceAnalysisForStore } from "./stores/[id]/actions"

export default async function DashboardOverviewPage() {
  const journey = await getDashboardJourneyData()
  const isDemoMode = journey.onboardingState === "demo"
  const authOrgId =
    "organization" in journey
      ? journey.organization?.id ?? "none"
      : "snapshot" in journey
        ? journey.snapshot.organization.id
        : "none"
  console.info(
    `[auth] overview page auth decision: mode=${journey.mode}; org=${authOrgId}`
  )

  if (journey.mode === "plan_required") {
    redirect("/app/billing?intent=plan_required")
  }

  if (journey.mode === "source_workspace") {
    const scanState = normalizeScanState(journey.latestScan)
    const retryAnalysisAction = triggerUrlSourceAnalysisForStore.bind(
      null,
      journey.primarySource.storeId
    )
    const verificationLabel =
      journey.sourceVerification.state === "verified"
        ? "Verified"
        : journey.sourceVerification.state === "pending"
          ? "Verification pending"
          : "Ownership not verified"
    const verificationTone =
      journey.sourceVerification.state === "verified"
        ? "border-emerald-400/30 bg-emerald-400/[0.08] text-emerald-300"
        : journey.sourceVerification.state === "pending"
          ? "border-sky-300/35 bg-sky-300/[0.08] text-sky-200"
          : "border-amber-300/40 bg-amber-300/[0.08] text-amber-200"
    const scanTone =
      scanState.tone === "danger"
        ? "border-destructive/35 bg-destructive/10 text-destructive"
        : scanState.tone === "warning"
          ? "border-amber-300/30 bg-amber-300/[0.08] text-amber-200"
          : scanState.tone === "success"
            ? "border-emerald-400/30 bg-emerald-400/[0.08] text-emerald-300"
            : scanState.tone === "primary"
              ? "border-primary/30 bg-primary/[0.08] text-primary"
              : "border-border/70 bg-background/35 text-muted-foreground"

    return (
      <div className="space-y-5 pb-24 lg:pb-4">
        <section className="space-y-2">
          <p className="data-mono text-muted-foreground">Revenue Workspace</p>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl lg:text-3xl">
            {journey.primarySource.domain ?? journey.primarySource.name}
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
            {scanState.message || "Run analysis to build the first revenue surface baseline."}
          </p>
        </section>

        <section className="surface-card-strong grid gap-5 p-5 sm:p-6 lg:p-7 lg:grid-cols-[1.4fr_0.9fr]">
          <div>
            <p className="data-mono text-muted-foreground">Primary source</p>
            <h2 className="mt-2 break-all text-xl font-semibold tracking-tight">
              {journey.primarySource.domain ?? journey.primarySource.name}
            </h2>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className={`rounded-md border px-2.5 py-1 font-mono text-[0.65rem] uppercase ${verificationTone}`}>
                {verificationLabel}
              </span>
              <span className={`rounded-md border px-2.5 py-1 font-mono text-[0.65rem] uppercase ${scanTone}`}>
                {scanState.label}
              </span>
              <MetaPill>{journey.sourceUsage.usedSources} / {journey.sourceUsage.maxSources ?? "unlimited"} sources used</MetaPill>
            </div>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">
              {scanState.message ||
                "Run analysis to build the first revenue surface baseline."}
            </p>
          </div>

          <div className="rounded-xl border border-border/70 bg-background/35 p-4 sm:p-5">
            <p className="data-mono text-muted-foreground">Next action</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {journey.sourceVerification.state !== "verified"
                ? "Verify this source to unlock full evidence, monitoring, and action briefs."
                : scanState.nextAction === "retry"
                  ? "The latest scan is stale or failed. Queue a fresh analysis."
                  : scanState.state === "none"
                    ? "Run the first analysis for this source."
                    : "Open the source to review current status and evidence."}
            </p>
            <div className="mt-5 flex flex-wrap gap-2.5">
              <Link
                href={`/app/stores/${journey.primarySource.storeId}`}
                className="marketing-primary-cta inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-transform hover:-translate-y-px"
              >
                Open source
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              {scanState.nextAction === "retry" || scanState.state === "none" ? (
                <form action={retryAnalysisAction}>
                  <SubmitButton
                    label={scanState.state === "none" ? "Run analysis" : "Retry analysis"}
                    pendingLabel="Queueing scan..."
                    className="rounded-lg border border-border/70 px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                  />
                </form>
              ) : null}
            </div>
          </div>
        </section>
      </div>
    )
  }

  if (journey.mode === "empty") {
    return (
      <div className="space-y-5 pb-24 lg:pb-4">
        <section className="space-y-2">
          <p className="data-mono text-muted-foreground">Revenue Workspace</p>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl lg:text-3xl">
            Start with your primary revenue source
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
            Add the website, app, or revenue URL you want SilentLeak to monitor. The first surface scan starts from that source and optional systems can be connected after.
          </p>
        </section>

        <section className="surface-card p-5 sm:p-6 lg:p-7">
          <EmptyWorkspaceActions />
        </section>
      </div>
    )
  }

  if (journey.mode === "connecting") {
    return (
      <div className="space-y-5 pb-24 lg:pb-4">
        <section className="space-y-2">
          <p className="data-mono text-muted-foreground">Source Connection</p>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl lg:text-3xl">
            {journey.sourceLabel} authorization in progress
          </h1>
          <p className="max-w-xl text-sm text-muted-foreground sm:text-base">
            Authorize data access to complete setup. First scan queues immediately on confirmation.
          </p>
        </section>
        <section className="surface-card p-5 sm:p-6">
          <p className="text-sm leading-[1.72] text-muted-foreground">
            Authorization incomplete. Open Sources to verify data access scope and queue the first scan.
          </p>
          <Link
            href="/app/stores"
            className="marketing-primary-cta mt-5 inline-flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition-transform hover:-translate-y-px"
          >
            Complete connection setup
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </section>
      </div>
    )
  }

  if (journey.mode === "integration_error") {
    return (
      <div className="space-y-5 pb-24 lg:pb-4">
        <section className="space-y-2">
          <p className="data-mono text-muted-foreground">Integration Status</p>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl lg:text-3xl">
            Connection needs attention
          </h1>
          <p className="text-sm text-muted-foreground sm:text-base">{journey.message}</p>
        </section>
        <section className="surface-card p-5 sm:p-6 lg:p-7">
          <p className="text-sm text-muted-foreground">
            Retry authorization from Sources.
          </p>
          <Link
            href="/app/stores"
            className="marketing-primary-cta mt-5 inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-transform hover:-translate-y-px"
          >
            Open sources
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </section>
      </div>
    )
  }

  if (journey.mode === "pending_scan") {
    return (
      <div className="space-y-5 pb-24 lg:pb-4">
        <section className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-foreground/50" />
            <p className="data-mono text-muted-foreground">Scanning</p>
          </div>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl lg:text-3xl">
            {journey.sourceLabel} source connected. First scan running.
          </h1>
          <p className="max-w-xl text-sm text-muted-foreground sm:text-base">
            First scan is in progress. This view refreshes automatically and transitions when results are ready.
          </p>
        </section>

        <section className="surface-card-strong p-5 sm:p-6">
          <p className="data-mono mb-4 text-muted-foreground">Scan coverage</p>
          <ProcessingStagePanel
            title="Processing"
            className="mb-4"
            stages={[
              "Source connected",
              "Starting first scan...",
              "Reviewing source configuration...",
              "Checking signal readiness...",
              "Building monitoring baseline...",
            ]}
          />
          <ul className="space-y-2.5">
            {journey.checks.map((check) => (
              <li
                key={check}
                className="flex items-center gap-3 rounded-lg border border-border/70 bg-background/35 px-4 py-3 text-sm text-muted-foreground"
              >
                <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-foreground/40" />
                {check}
              </li>
            ))}
          </ul>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/app"
              className="marketing-primary-cta inline-flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition-transform hover:-translate-y-px"
            >
              Refresh scan status
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              href="/app/stores"
              className="rounded-lg border border-border/70 px-4 py-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Open sources
            </Link>
          </div>
          <PendingScanLiveRefresh />
        </section>
      </div>
    )
  }

  if (journey.mode === "first_results") {
    const firstSnapshot = journey.snapshot
    const primaryIssue = firstSnapshot.summary.highestImpactIssue
    const primaryFixPlanHref =
      getFixPlanHrefForIssue(primaryIssue.id) ?? getFallbackFixPlanHref()

    return (
      <div className="space-y-5 pb-24 lg:pb-4">
        <section className="space-y-2">
          <p className="data-mono text-muted-foreground">First Findings</p>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl lg:text-3xl">
            {journey.sourceLabel} scan completed. Initial leakage detected.
          </h1>
          <p className="max-w-3xl text-sm text-muted-foreground sm:text-base">
            Initial findings are ready with ranked impact and evidence-backed action briefs.
          </p>
        </section>

        <section className="surface-card-strong grid gap-5 p-5 sm:p-6 lg:p-7 lg:grid-cols-[1.3fr_1fr]">
          <div>
            <p className="data-mono text-muted-foreground">Primary Leak</p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight">{primaryIssue.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{primaryIssue.whyItMatters}</p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              <SeverityPill severity={primaryIssue.severity} />
              <MetaPill>{formatSourceLabel(primaryIssue.source)}</MetaPill>
            </div>
          </div>
          <div className="rounded-xl border border-border/70 bg-background/35 p-4">
            <p className="text-xs text-muted-foreground">Estimated monthly impact</p>
            <p className="mt-1 text-3xl font-semibold tracking-tight text-destructive">
              {formatImpactLabel(primaryIssue.estimatedMonthlyRevenueImpact)}
            </p>
            <p className="mt-3 text-xs text-muted-foreground">
              First completed scan returned {firstSnapshot.summary.activeIssues} findings.
            </p>
            <Link
              href={primaryFixPlanHref}
              className="marketing-primary-cta mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-transform hover:-translate-y-px"
            >
              Review action brief
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </section>

        <section className="surface-card p-4 sm:p-5 lg:p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold">What To Do Next</h2>
            <p className="data-mono text-muted-foreground">Operator queue</p>
          </div>
          <div className="mt-4 space-y-3">
            {firstSnapshot.issues.map((issue) => (
              <QueueEventRow
                key={issue.id}
                severity={issue.severity}
                title={issue.title}
                meta={cleanPrimaryCopy(issue.recommendedAction)}
                amount={formatImpactLabel(issue.estimatedMonthlyRevenueImpact)}
              />
            ))}
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href={primaryFixPlanHref}
              className="marketing-primary-cta inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-transform hover:-translate-y-px"
            >
              Review action brief
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              href="/app/stores"
              className="rounded-lg border border-border/70 px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Review source health
            </Link>
          </div>
        </section>
      </div>
    )
  }

  if (journey.mode === "no_signal") {
    return (
      <div className="space-y-5 pb-24 lg:pb-4">
        <section className="space-y-2">
          <p className="data-mono text-muted-foreground">First Scan Complete</p>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl lg:text-3xl">
            {journey.sourceLabel} connected. Baseline signal is still building.
          </h1>
          <p className="max-w-3xl text-sm text-muted-foreground sm:text-base">
            The latest scan completed, but there is not enough commercial signal yet to score leakage confidently.
          </p>
        </section>

        <section className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
          <article className="surface-card-strong p-5 sm:p-6 lg:p-7">
            <p className="data-mono text-muted-foreground">No-Signal Outcome</p>
            <h2 className="mt-2 text-lg font-semibold tracking-tight">
              Signal intake is healthy. Coverage increases as event volume grows.
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Keep the source connected while more activation, checkout, and billing events accumulate.
            </p>
          </article>

          <article className="surface-card p-4 sm:p-5 lg:p-6">
            <p className="data-mono text-muted-foreground">Next Operator Move</p>
            <p className="mt-3 text-sm text-muted-foreground">
              Validate source health and return after new orders, checkout sessions, or billing events are recorded.
            </p>
            <div className="mt-5 flex flex-wrap gap-2.5">
              <Link
                href="/app/stores"
                className="marketing-primary-cta inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-transform hover:-translate-y-px"
              >
                Open sources
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                href="/app/stores"
                className="rounded-lg border border-border/70 px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Connect another source
              </Link>
            </div>
          </article>
        </section>

      </div>
    )
  }

  if (journey.mode === "ready" && journey.scanOutcome === "clean") {
    return (
      <div className="space-y-5 pb-24 lg:pb-4">
        <section className="space-y-2">
          <p className="data-mono text-muted-foreground">
            {isDemoMode ? "Demo Workspace" : "Baseline Analysis Complete"}
          </p>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl lg:text-3xl">
            {isDemoMode
              ? "Simulated workspace currently shows no active leaks."
              : `${journey.snapshot.organization.name} has no detected leaks in the latest cycle.`}
          </h1>
          <p className="max-w-3xl text-sm text-muted-foreground sm:text-base">
            {isDemoMode
              ? "This is simulated data for product walkthrough and operator training."
              : "Monitoring remains active across activation, checkout, and billing recovery."}
          </p>
        </section>

        <section className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
          <article className="surface-card-strong p-5 sm:p-6 lg:p-7">
            <p className="data-mono text-muted-foreground">Monitoring Status</p>
            <h2 className="mt-2 text-lg font-semibold tracking-tight">
              {isDemoMode
                ? "Simulated baseline is currently clean."
                : "Leakage baseline is currently clean."}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {isDemoMode
                ? "No simulated interventions are required in this snapshot."
                : "No ranked fixes are required right now. Scan cycles continue automatically."}
            </p>
          </article>

          <article className="surface-card p-4 sm:p-5 lg:p-6">
            <p className="data-mono text-muted-foreground">Next Operator Move</p>
            <p className="mt-3 text-sm text-muted-foreground">
              {isDemoMode
                ? "Review simulated source detail or return to your live workspace."
                : "No corrective action required. Keep sources connected and review store status periodically."}
            </p>
            <div className="mt-5 flex flex-wrap gap-2.5">
              <Link
                href="/app/stores"
                className="marketing-primary-cta inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-transform hover:-translate-y-px"
              >
                {isDemoMode ? "Review demo sources" : "Open sources"}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              {isDemoMode ? (
                <Link
                  href="/api/mock/onboarding?state=empty&next=/app"
                  className="rounded-lg border border-border/70 px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Return to live workspace
                </Link>
              ) : (
                <Link
                  href="/app/stores"
                  className="rounded-lg border border-border/70 px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Connect another source
                </Link>
              )}
            </div>
          </article>
        </section>
      </div>
    )
  }

  const snapshot = journey.snapshot
  const liveSystemStores = snapshot.stores.filter((s) => s.platform !== "website")
  const primaryIssue = snapshot.summary.highestImpactIssue
  const fallbackFixPlanHref = getFallbackFixPlanHref()
  const primaryFixPlanHref =
    getFixPlanHrefForIssue(primaryIssue.id) ?? fallbackFixPlanHref
  const rankedIssues = [...snapshot.issues].sort(
    (a, b) => b.estimatedMonthlyRevenueImpact - a.estimatedMonthlyRevenueImpact
  )
  const topMove = snapshot.suggestedActions[0]
  const topMoveHref = topMove
    ? topMove.fixPlanId
      ? `/app/fix-plans/${topMove.fixPlanId}`
      : (getFixPlanHrefForIssue(topMove.issueIds[0]) ?? fallbackFixPlanHref)
    : primaryFixPlanHref
  const recoveredWindow = snapshot.revenueOpportunities.reduce(
    (total, item) => total + item.estimatedMonthlyRevenueImpact,
    0
  )
  const latestScanAt =
    snapshot.scans
      .map((scan) => scan.scannedAt)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0] ?? null

  return (
    <div className="space-y-5 pb-24 lg:pb-2">
      <section className="vault-page-intro">
        <p className="data-mono text-muted-foreground">
          {isDemoMode ? "Demo Revenue Workspace" : "Revenue Workspace"}
        </p>
        <h1 className="vault-page-intro-title">Revenue at risk | last 30 days</h1>
        <p className="font-mono text-[0.68rem] tracking-[0.05em] text-muted-foreground">
          Rolling window | ranked by exposure | latest scan{" "}
          {latestScanAt ? formatRelativeTimestamp(latestScanAt) : "pending"}
        </p>
        <p className="vault-page-intro-copy">
          {isDemoMode
            ? "Simulated operator queue with realistic evidence framing and next moves."
            : `${snapshot.organization.name} operator queue with explicit next move, source health, and supporting evidence.`}
        </p>
      </section>

      <section className="vault-metric-grid">
        <article className="vault-metric-cell vault-metric-cell-primary">
          <p className="vault-metric-key">Revenue at risk</p>
          <p className="vault-metric-value vault-metric-value-primary">
            {formatCompactCurrency(snapshot.summary.estimatedMonthlyLeakage)}
          </p>
          <p className="vault-metric-delta">
            Top finding {formatImpactLabel(primaryIssue.estimatedMonthlyRevenueImpact)}
          </p>
        </article>
        <article className="vault-metric-cell">
          <p className="vault-metric-key">Open findings</p>
          <p className="vault-metric-value">{snapshot.summary.activeIssues}</p>
          <div className="vault-metric-delta flex flex-wrap gap-2">
            <SeverityPill severity="critical" className="w-auto px-2 py-0.5" />
            <SeverityPill severity="high" className="w-auto px-2 py-0.5" />
          </div>
        </article>
        <article className="vault-metric-cell">
          <p className="vault-metric-key">Recovered potential</p>
          <p className="vault-metric-value">{formatCompactCurrency(recoveredWindow)}</p>
          <p className="vault-metric-delta">From ranked fix opportunities</p>
        </article>
        <article className="vault-metric-cell">
          <p className="vault-metric-key">Sources</p>
          <p className="vault-metric-value">
            {liveSystemStores.length}
            <span className="ml-1 text-xl text-muted-foreground">
              {isDemoMode ? "demo" : "live"}
            </span>
          </p>
          <p className="vault-metric-delta">System sources in workspace</p>
        </article>
      </section>

      <section className="vault-dashboard-grid">
        <div className="space-y-5">
          <VaultPanel
            title={`Leak queue | ${rankedIssues.length} open`}
            meta="Sorted by exposure"
            cta={<MetaPill>{snapshot.summary.monitoredStores} sources</MetaPill>}
          >
            {rankedIssues.length ? (
              rankedIssues.map((issue) => (
                <RankedQueueRow
                  key={issue.id}
                  severity={issue.severity}
                  title={issue.title}
                  meta={`${formatSourceLabel(issue.source)} | ${cleanPrimaryCopy(issue.recommendedAction)}`}
                  amount={formatImpactLabel(issue.estimatedMonthlyRevenueImpact)}
                  age={formatRelativeTimestamp(issue.detectedAt)}
                />
              ))
            ) : (
              <div className="px-5 py-8 text-sm text-muted-foreground">No findings. Monitoring active.</div>
            )}
          </VaultPanel>

          <VaultPanel
            title="Evidence | latest events"
            meta={latestScanAt ? `Last scan ${formatRelativeTimestamp(latestScanAt)}` : "Awaiting scans"}
          >
            <div className="space-y-1.5 px-4 py-3 font-mono text-[0.68rem] tracking-[0.03em] text-muted-foreground sm:px-5">
              {snapshot.scans.length ? (
                snapshot.scans.slice(0, 6).map((scan) => (
                  <p key={scan.id}>
                    {formatRelativeTimestamp(scan.scannedAt)} | scan {scan.id.slice(-4)} | {scan.detectedIssuesCount} findings |{" "}
                    {formatCompactCurrency(scan.estimatedMonthlyLeakage)}
                  </p>
                ))
              ) : (
                <p>No evidence lines yet. First scan will populate this region.</p>
              )}
            </div>
          </VaultPanel>
        </div>

        <div className="space-y-5">
          <section className="vault-panel-shell border-[color:var(--signal-line)] bg-[linear-gradient(180deg,var(--signal-dim),var(--ink-100)_60%)] p-5 sm:p-6">
            <p className="vault-metric-key text-[color:var(--signal)]">Recommended next move</p>
            <h2 className="mt-2 text-lg font-semibold tracking-tight text-foreground">
              {topMove?.title ?? primaryIssue.title}
            </h2>
            <p className="mt-2 text-sm leading-[1.65] text-muted-foreground">
              {topMove?.description ?? cleanPrimaryCopy(primaryIssue.recommendedAction)}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <SeverityPill severity={primaryIssue.severity} />
              <MetaPill>{formatImpactLabel(primaryIssue.estimatedMonthlyRevenueImpact)}</MetaPill>
            </div>
            <Link
              href={topMoveHref}
              className="marketing-primary-cta mt-5 inline-flex w-full items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold transition-transform hover:-translate-y-px"
            >
              Review action brief
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </section>

          <VaultPanel
            title="Source health"
            meta={latestScanAt ? `Scan ${formatRelativeTimestamp(latestScanAt)}` : "No scan data"}
          >
            <div className="divide-y divide-border/60">
              {liveSystemStores.map((store) => {
                const storeIssues = rankedIssues.filter((issue) => issue.storeId === store.id).length
                const storeLeakage = rankedIssues
                  .filter((issue) => issue.storeId === store.id)
                  .reduce((sum, issue) => sum + issue.estimatedMonthlyRevenueImpact, 0)
                return (
                  <div key={store.id} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-3 sm:px-5">
                    <span
                      className={`h-2 w-2 rounded-full ${storeIssues ? "bg-[color:var(--sev-high)]" : "bg-[color:var(--ok)]"}`}
                    />
                    <div>
                      <p className="font-mono text-[0.74rem] tracking-[0.04em] text-foreground">{store.name}</p>
                      <p className="font-mono text-[0.64rem] tracking-[0.04em] text-muted-foreground">
                        {store.platform} | {storeIssues} open
                      </p>
                    </div>
                    <p className="font-mono text-[0.66rem] tracking-[0.04em] text-muted-foreground tabular-nums">
                      {formatCompactCurrency(storeLeakage)}
                    </p>
                  </div>
                )
              })}
            </div>
          </VaultPanel>

        </div>
      </section>
    </div>
  )
}
