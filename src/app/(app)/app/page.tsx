import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowRight } from "lucide-react"

import { DecisionBanner } from "@/components/dashboard/decision-banner"
import { IssueCard } from "@/components/dashboard/issue-card"
import { RevenueOpportunityPanel } from "@/components/dashboard/revenue-opportunity-panel"
import { ScanActivity } from "@/components/dashboard/scan-activity"
import { SuggestedActions } from "@/components/dashboard/suggested-actions"
import { formatCompactCurrency } from "@/lib/format"
import { getDashboardJourneyData } from "@/server/services/app-service"
import {
  getFallbackFixPlanHref,
  getFixPlanHrefForIssue,
} from "@/server/services/fix-plan-service"

export default async function DashboardOverviewPage() {
  const journey = await getDashboardJourneyData()

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
            Complete the connection setup to authorize data access and activate your first scan.
          </p>
        </section>
        <section className="surface-card p-5 sm:p-6">
          <p className="text-sm leading-[1.72] text-muted-foreground">
            Open the connection flow to finish authorization and verify data access scope. CheckoutLeak will begin scanning immediately after confirmation.
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
            Review the connection flow and retry authorization from the connect page.
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
            CheckoutLeak is processing your checkout and billing data. First findings will be available shortly, ranked by revenue impact.
          </p>
        </section>

        <section className="surface-card-strong p-5 sm:p-6">
          <p className="data-mono mb-4 text-muted-foreground">Scan coverage</p>
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
            CheckoutLeak found the first high-impact opportunities and ranked what should be fixed first.
          </p>
        </section>

        <section className="surface-card-strong grid gap-5 p-5 sm:p-6 lg:p-7 lg:grid-cols-[1.3fr_1fr]">
          <div>
            <p className="data-mono text-primary">Primary Leak</p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight">{primaryIssue.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{primaryIssue.whyItMatters}</p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              <span className="rounded-md border border-border/70 px-2 py-1 text-muted-foreground">
                {primaryIssue.severity.toUpperCase()} severity
              </span>
              <span className="rounded-md border border-primary/40 bg-primary/10 px-2 py-1 text-primary">
                {primaryIssue.source}
              </span>
            </div>
          </div>
          <div className="rounded-xl border border-border/70 bg-background/35 p-4">
            <p className="text-xs text-muted-foreground">Estimated monthly impact</p>
            <p className="mt-1 text-3xl font-semibold tracking-tight text-destructive">
              {formatCompactCurrency(primaryIssue.estimatedMonthlyRevenueImpact)}
            </p>
            <p className="mt-3 text-xs text-muted-foreground">
              First scan surfaced {firstSnapshot.summary.activeIssues} immediate issues.
            </p>
            <Link
              href={primaryFixPlanHref}
              className="marketing-primary-cta mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-transform hover:-translate-y-px"
            >
              Open fix plan
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
              <div
                key={issue.id}
                className="rounded-xl border border-border/70 bg-background/35 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold tracking-tight">{issue.title}</h3>
                  <p className="text-sm font-semibold text-destructive">
                    {formatCompactCurrency(issue.estimatedMonthlyRevenueImpact)}
                  </p>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{issue.recommendedAction}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href={primaryFixPlanHref}
              className="marketing-primary-cta inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-transform hover:-translate-y-px"
            >
              Fix this issue
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
            First scan completed successfully, but there is not enough commercial activity yet for meaningful leakage analysis.
          </p>
        </section>

        <section className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
          <article className="surface-card-strong p-5 sm:p-6 lg:p-7">
            <p className="data-mono text-primary">No-Signal Outcome</p>
            <h2 className="mt-2 text-lg font-semibold tracking-tight">
              Data pipeline is healthy. Analysis depth will increase with activity.
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              CheckoutLeak will continue monitoring checkout and billing signals automatically as new activity arrives.
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
            No meaningful commercial signal was detected yet. Monitoring stays active and leakage scoring will update automatically as activity appears.
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
              <p className="text-sm text-muted-foreground">Estimated monthly leakage</p>
              <p className="mt-1 text-3xl font-semibold tracking-tight text-destructive">
                {formatCompactCurrency(snapshot.summary.estimatedMonthlyLeakage)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active issues</p>
              <p className="mt-1 text-3xl font-semibold tracking-tight">
                {snapshot.summary.activeIssues}
              </p>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-border/60 pt-4 text-xs">
            <span className="rounded-md border border-border/70 px-2 py-1 text-muted-foreground">
              Highest impact: {formatCompactCurrency(primaryIssue.estimatedMonthlyRevenueImpact)}
            </span>
            <span className="rounded-md border border-border/70 px-2 py-1 text-muted-foreground">
              Monitored stores: {snapshot.summary.monitoredStores}
            </span>
            <span className="rounded-md border border-primary/35 bg-primary/10 px-2 py-1 text-primary">
              Confidence weighted prioritization enabled
            </span>
          </div>
        </article>

        <article className="surface-card p-4 sm:p-5 lg:p-6">
          <p className="data-mono text-primary">Next Operator Move</p>
          <h3 className="mt-2 text-lg font-semibold tracking-tight">
            {primaryIssue.title}
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {primaryIssue.recommendedAction}
          </p>
          <Link
            href={primaryFixPlanHref}
            className="marketing-primary-cta mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-transform hover:-translate-y-px"
          >
            Open fix plan
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
              <h2 className="text-base font-semibold">Issue Feed</h2>
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
                  No issues detected yet. Monitoring is active and issue insights will appear automatically as source activity grows.
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
