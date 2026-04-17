import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { ArrowLeft, ArrowRight } from "lucide-react"

import { formatCompactCurrency, formatRelativeTimestamp } from "@/lib/format"
import { getStoreDetailData, getStoresIndexData } from "@/server/services/app-service"

export default async function StoreDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const storesData = await getStoresIndexData()

  if (!storesData.hasPlan) {
    redirect("/app/billing?intent=plan_required")
  }

  if (storesData.onboardingState === "empty") {
    redirect("/app/connect")
  }

  const data = await getStoreDetailData(id)

  if (!data) {
    notFound()
  }

  return (
    <div className="space-y-5 pb-24 lg:pb-4">
      <section className="space-y-3">
        <Link
          href="/app/stores"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to stores
        </Link>
        <p className="data-mono text-primary">Store Detail</p>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl lg:text-3xl">{data.store.name}</h1>
        <p className="max-w-3xl text-sm text-muted-foreground sm:text-base">
          {data.context?.operationalArea ?? "Revenue monitoring source"} | {data.status.label}
        </p>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <article className="surface-card-strong p-5 sm:p-6 lg:p-7">
          <p className="data-mono text-primary">Source Overview</p>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="data-mono text-muted-foreground">Platform</dt>
              <dd className="mt-1 text-sm">{data.store.platform}</dd>
            </div>
            <div>
              <dt className="data-mono text-muted-foreground">Status</dt>
              <dd className={`mt-1 text-sm ${data.status.tone}`}>{data.status.label}</dd>
            </div>
            <div>
              <dt className="data-mono text-muted-foreground">Latest scan</dt>
              <dd className="mt-1 text-sm">
                {data.latestScan ? formatRelativeTimestamp(data.latestScan.scannedAt) : "No scans yet"}
              </dd>
            </div>
            <div>
              <dt className="data-mono text-muted-foreground">Estimated leakage</dt>
              <dd className="mt-1 text-sm text-primary">
                {formatCompactCurrency(data.estimatedLeakage)} / month
              </dd>
            </div>
          </dl>
          {data.context ? (
            <div className="mt-4 border-t border-border/60 pt-4 text-sm text-muted-foreground">
              <p>Owner team: {data.context.ownerTeam}</p>
              <p className="mt-1">Primary objective: {data.context.primaryObjective}</p>
            </div>
          ) : null}
        </article>

        <article className="surface-card p-4 sm:p-5 lg:p-6">
          <p className="data-mono text-primary">Current Status</p>
          <p className="mt-3 text-sm text-muted-foreground">
            {data.issues.length} open issues linked to this source.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {data.latestScan
              ? `Most recent scan found ${data.latestScan.detectedIssuesCount} issues.`
              : "Run an initial scan to populate issue and opportunity signals."}
          </p>
          <Link
            href="/app"
            className="mt-5 inline-flex items-center gap-2 text-sm text-primary transition-opacity hover:opacity-80"
          >
            Review dashboard decisions <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </article>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
        <article className="surface-card p-4 sm:p-5 lg:p-6">
          <p className="data-mono text-primary">Open Issues</p>
          <div className="mt-4 space-y-3">
            {data.issues.length ? (
              data.issues.map((issue) => (
                <div key={issue.id} className="rounded-xl border border-border/70 bg-background/35 p-3.5 sm:p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold sm:text-base">{issue.title}</p>
                    <p className="text-xs text-primary">
                      {formatCompactCurrency(issue.estimatedMonthlyRevenueImpact)} / month
                    </p>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{issue.summary}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No open issues for this source.</p>
            )}
          </div>
        </article>

        <div className="space-y-5">
          <article className="surface-card p-4 sm:p-5 lg:p-6">
            <p className="data-mono text-primary">Recent Activity</p>
            {data.scans.length ? (
              <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                {data.scans.slice(0, 4).map((scan) => (
                  <li key={scan.id} className="rounded-lg border border-border/70 bg-background/35 p-3">
                    <p>Scan {scan.id.slice(-4)} | {scan.status}</p>
                    <p className="mt-1 text-xs">
                      {formatRelativeTimestamp(scan.scannedAt)} | {scan.detectedIssuesCount} issues
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">
                Scan history will appear after initial pass completes.
              </p>
            )}
          </article>

          <article className="surface-card p-4 sm:p-5 lg:p-6">
            <p className="data-mono text-primary">Detected Opportunities</p>
            <ul className="mt-4 space-y-3">
              {data.fixPlanLinks.length ? (
                data.fixPlanLinks.map((plan) => (
                  <li key={plan.issueId} className="rounded-lg border border-border/70 bg-background/35 p-3">
                    <p className="text-sm font-medium">{plan.title}</p>
                    <p className="mt-1 text-xs text-primary">
                      {formatCompactCurrency(plan.estimatedMonthlyRevenueImpact)} / month
                    </p>
                    <Link
                      href={plan.href}
                      className="mt-2 inline-flex items-center gap-1 text-xs text-foreground transition-colors hover:text-primary"
                    >
                      Open fix plan <ArrowRight className="h-3 w-3" />
                    </Link>
                  </li>
                ))
              ) : (
                <li className="text-sm text-muted-foreground">
                  No fix plans linked to this source yet.
                </li>
              )}
            </ul>
          </article>
        </div>
      </section>
    </div>
  )
}
