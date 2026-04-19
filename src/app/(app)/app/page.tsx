import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowRight } from "lucide-react"

import { DecisionBanner } from "@/components/dashboard/decision-banner"
import { IssueCard } from "@/components/dashboard/issue-card"
import { PendingScanLiveRefresh } from "@/components/dashboard/pending-scan-live-refresh"
import { RevenueOpportunityPanel } from "@/components/dashboard/revenue-opportunity-panel"
import { ScanActivity } from "@/components/dashboard/scan-activity"
import { SuggestedActions } from "@/components/dashboard/suggested-actions"
import {
  MetaPill,
  QueueEventRow,
  SeverityPill,
  cleanPrimaryCopy,
  formatImpactLabel,
  formatSourceLabel,
} from "@/components/dashboard/vault-primitives"
import { ProcessingStagePanel } from "@/components/dashboard/processing-stage-panel"
import { formatCompactCurrency } from "@/lib/format"
import { getDashboardJourneyData } from "@/server/services/app-service"
import {
  getFallbackFixPlanHref,
  getFixPlanHrefForIssue,
} from "@/server/services/fix-plan-service"

export default async function DashboardOverviewPage() {
  const journey = await getDashboardJourneyData()
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

  if (journey.mode === "empty") {
    redirect("/app/connect")
  }

  if (journey.mode === "connecting") {
    return (
      <div className="space-y-5 pb-24 lg:pb-4">
        <section className="space-y-2">
          <p className="data-mono text-primary">Source Connection</p>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl lg:text-3xl">
            {journey.sourceLabel} authorization in progress
          </h1>
          <p className="max-w-xl text-sm text-muted-foreground sm:text-base">
            Authorize data access to complete setup. First scan queues immediately on confirmation.
          </p>
        </section>
        <section className="surface-card p-5 sm:p-6">
          <p className="text-sm leading-[1.72] text-muted-foreground">
            Authorization incomplete. Open the connect flow to verify data access scope and queue the first scan.
          </p>
          <Link
            href="/app/connect"
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
          <p className="data-mono text-primary">Integration Status</p>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl lg:text-3xl">
            Connection needs attention
          </h1>
          <p className="text-sm text-muted-foreground sm:text-base">{journey.message}</p>
        </section>
        <section className="surface-card p-5 sm:p-6 lg:p-7">
          <p className="text-sm text-muted-foreground">
            Retry authorization from the connect flow.
          </p>
          <Link
            href="/app/connect"
            className="marketing-primary-cta mt-5 inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-transform hover:-translate-y-px"
          >
            Open connect flow
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
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
            <p className="data-mono text-primary">Scanning</p>
          </div>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl lg:text-3xl">
            {journey.sourceLabel} source connected. First scan running.
          </h1>
          <p className="max-w-xl text-sm text-muted-foreground sm:text-base">
            First scan in progress. Findings appear as they land, ranked by exposure.
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
                <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-primary/60" />
                {check}
              </li>
            ))}
          </ul>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href={`/api/mock/onboarding?state=first_results_${journey.sourceLabel.toLowerCase()}&next=/app`}
              className="marketing-primary-cta inline-flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition-transform hover:-translate-y-px"
            >
              View first results
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              href="/app/stores"
              className="rounded-lg border border-border/70 px-4 py-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Open stores
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
          <p className="data-mono text-primary">First Findings</p>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl lg:text-3xl">
            {journey.sourceLabel} scan completed. Initial leakage detected.
          </h1>
          <p className="max-w-3xl text-sm text-muted-foreground sm:text-base">
            First scan complete. Findings ranked by exposure.
          </p>
        </section>

        <section className="surface-card-strong grid gap-5 p-5 sm:p-6 lg:p-7 lg:grid-cols-[1.3fr_1fr]">
          <div>
            <p className="data-mono text-primary">Primary Leak</p>
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
              First scan: {firstSnapshot.summary.activeIssues} findings.
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
              href={`/api/mock/onboarding?state=completed_${journey.sourceLabel.toLowerCase()}&next=/app`}
              className="rounded-lg border border-border/70 px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Open full dashboard
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
          <p className="data-mono text-primary">First Scan Complete</p>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl lg:text-3xl">
            {journey.sourceLabel} source connected. Monitoring is active.
          </h1>
          <p className="max-w-3xl text-sm text-muted-foreground sm:text-base">
            First scan complete — insufficient signal for leakage analysis. Monitoring continues.
          </p>
        </section>

        <section className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
          <article className="surface-card-strong p-5 sm:p-6 lg:p-7">
            <p className="data-mono text-primary">No-Signal Outcome</p>
            <h2 className="mt-2 text-lg font-semibold tracking-tight">
              Data pipeline healthy. Coverage increases with activity.
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Monitoring continues. Checkout and billing coverage active.
            </p>
          </article>

          <article className="surface-card p-4 sm:p-5 lg:p-6">
            <p className="data-mono text-primary">Next Operator Move</p>
            <p className="mt-3 text-sm text-muted-foreground">
              Keep this source connected, then review store details after orders, checkout sessions, or billing events are available.
            </p>
            <div className="mt-5 flex flex-wrap gap-2.5">
              <Link
                href="/app/stores"
                className="marketing-primary-cta inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-transform hover:-translate-y-px"
              >
                Open store details
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                href="/app/connect"
                className="rounded-lg border border-border/70 px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Connect another source
              </Link>
            </div>
          </article>
        </section>

        <section className="surface-card p-5 sm:p-6 lg:p-7">
          <p className="text-sm text-muted-foreground">
            No leakage signal detected. Monitoring active.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/app/connect"
              className="marketing-primary-cta inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-transform hover:-translate-y-px"
            >
              Review connected source
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </section>
      </div>
    )
  }

  if (journey.mode === "ready" && journey.scanOutcome === "clean") {
    return (
      <div className="space-y-5 pb-24 lg:pb-4">
        <section className="space-y-2">
          <p className="data-mono text-primary">Baseline Analysis Complete</p>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl lg:text-3xl">
            {journey.snapshot.organization.name} is currently clean.
          </h1>
          <p className="max-w-3xl text-sm text-muted-foreground sm:text-base">
            No leaks detected. Coverage active.
          </p>
        </section>

        <section className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
          <article className="surface-card-strong p-5 sm:p-6 lg:p-7">
            <p className="data-mono text-primary">Monitoring Status</p>
            <h2 className="mt-2 text-lg font-semibold tracking-tight">
              No leaks detected. Monitoring active.
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Coverage healthy. Scan cycle continues.
            </p>
          </article>

          <article className="surface-card p-4 sm:p-5 lg:p-6">
            <p className="data-mono text-primary">Next Operator Move</p>
            <p className="mt-3 text-sm text-muted-foreground">
              No corrective action required. Keep sources connected and review store status periodically.
            </p>
            <div className="mt-5 flex flex-wrap gap-2.5">
              <Link
                href="/app/stores"
                className="marketing-primary-cta inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-transform hover:-translate-y-px"
              >
                Open store details
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                href="/app/connect"
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

  const snapshot = journey.snapshot
  const primaryIssue = snapshot.summary.highestImpactIssue
  const fallbackFixPlanHref = getFallbackFixPlanHref()
  const primaryFixPlanHref =
    getFixPlanHrefForIssue(primaryIssue.id) ?? fallbackFixPlanHref

  const actionQueue = snapshot.suggestedActions.map((action) => {
    const fixPlanHref = action.fixPlanId
      ? `/app/fix-plans/${action.fixPlanId}`
      : (getFixPlanHrefForIssue(action.issueIds[0]) ?? fallbackFixPlanHref)

    return {
      ...action,
      fixPlanHref,
    }
  })

  return (
    <div className="space-y-5 pb-24 lg:pb-2">
      <section className="space-y-2">
        <p className="data-mono text-primary">Revenue Intelligence</p>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl lg:text-3xl">
          {snapshot.organization.name}
        </h1>
        <p className="max-w-3xl text-sm text-muted-foreground sm:text-base">
          Prioritized leak detection across checkout, payment setup, and billing recovery flows.
        </p>
      </section>

      <DecisionBanner issue={primaryIssue} fixPlanHref={primaryFixPlanHref} />

      <section className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <article className="surface-card p-4 sm:p-5 lg:p-6">
          <p className="data-mono text-muted-foreground">Command Summary</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Revenue at risk · 30d</p>
              <p className="mt-1 font-mono text-3xl font-semibold tracking-tight text-signal tabular-nums">
                {formatCompactCurrency(snapshot.summary.estimatedMonthlyLeakage)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active findings</p>
              <p className="mt-1 text-3xl font-semibold tracking-tight">
                {snapshot.summary.activeIssues}
              </p>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-border/60 pt-4 text-xs">
            <MetaPill>
              Highest impact: {formatImpactLabel(primaryIssue.estimatedMonthlyRevenueImpact)}
            </MetaPill>
            <MetaPill>
              Monitored stores: {snapshot.summary.monitoredStores}
            </MetaPill>
            <MetaPill className="text-primary">Confidence weighted prioritization enabled</MetaPill>
          </div>
        </article>

        <article className="surface-card p-4 sm:p-5 lg:p-6">
          <p className="data-mono text-primary">Next Operator Move</p>
          <h3 className="mt-2 text-lg font-semibold tracking-tight">
            {primaryIssue.title}
          </h3>
          <div className="mt-2">
            <SeverityPill severity={primaryIssue.severity} />
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {cleanPrimaryCopy(primaryIssue.recommendedAction)}
          </p>
          <Link
            href={primaryFixPlanHref}
            className="marketing-primary-cta mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-transform hover:-translate-y-px"
          >
            Review action brief
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <p className="mt-3 text-xs text-muted-foreground">
            Direct execution path for the highest impact leak.
          </p>
        </article>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.7fr,1fr]">
        <div className="space-y-5">
          <SuggestedActions actions={actionQueue} />

          <section className="surface-card space-y-4 p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">Findings</h2>
              <p className="data-mono text-muted-foreground">
                {snapshot.issues.length} items
              </p>
            </div>
            <div className="space-y-4">
              {snapshot.issues.length ? (
                snapshot.issues.map((issue) => (
                  <IssueCard
                    key={issue.id}
                    issue={issue}
                    fixPlanHref={getFixPlanHrefForIssue(issue.id) ?? fallbackFixPlanHref}
                  />
                ))
              ) : (
                <div className="surface-card border-dashed p-8 text-center text-sm text-muted-foreground">
                  No findings. Monitoring active.
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="space-y-5">
          <RevenueOpportunityPanel opportunities={snapshot.revenueOpportunities} />
          <ScanActivity scans={snapshot.scans} />
        </div>
      </section>
    </div>
  )
}
