import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { ArrowLeft, ArrowRight, CircleDot } from "lucide-react"

import { FixPlanControls } from "@/components/fix-plans/fix-plan-controls"
import { Badge } from "@/components/ui/badge"
import { formatCompactCurrency, formatRelativeTimestamp } from "@/lib/format"
import { getFixPlanById } from "@/server/services/fix-plan-service"
import { getBillingData } from "@/server/services/app-service"
import { cn } from "@/lib/utils"
import type { FixPlan } from "@/types/domain"

const severityStyles: Record<FixPlan["severity"], string> = {
  critical: "border-destructive/40 bg-destructive/10 text-destructive",
  high: "border-amber-300/40 bg-amber-300/10 text-amber-300",
  medium: "border-sky-300/40 bg-sky-300/10 text-sky-300",
  low: "border-emerald-300/40 bg-emerald-300/10 text-emerald-300",
}

const confidenceLabel: Record<FixPlan["confidence"], string> = {
  strong_signal: "Strong signal",
  high: "High confidence",
  medium: "Medium confidence",
  emerging: "Emerging signal",
}

const issueTypeLabel: Record<FixPlan["issueType"], string> = {
  checkout_friction: "Checkout friction",
  payment_method_coverage: "Payment method coverage",
  failed_payment_recovery: "Failed payment recovery",
  setup_gap: "Setup gap",
  fraud_false_decline: "Fraud false decline",
}

const statusLabel: Record<FixPlan["status"], string> = {
  open: "Open",
  in_progress: "In progress",
  resolved: "Resolved",
}

export default async function FixPlanPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const billing = await getBillingData()

  if (!billing.hasPlan) {
    redirect("/app/billing?intent=plan_required")
  }

  if (billing.onboardingState === "empty") {
    redirect("/app/connect")
  }

  const fixPlan = await getFixPlanById(id)

  if (!fixPlan) {
    notFound()
  }

  return (
    <div className="space-y-5 pb-24 lg:pb-4">
      <section className="space-y-3">
        <Link
          href="/app"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to dashboard
        </Link>
        <p className="data-mono text-muted-foreground">Fix Plan</p>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl lg:text-3xl">
          {fixPlan.title}
        </h1>
        <p className="max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
          {fixPlan.summary}
        </p>
      </section>

      <section className="surface-card-strong p-5 sm:p-6 lg:p-7">
        <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr] lg:items-end">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={cn("border text-[11px] uppercase", severityStyles[fixPlan.severity])}>
                {fixPlan.severity}
              </Badge>
              <Badge variant="outline" className="text-[11px] uppercase text-muted-foreground">
                {issueTypeLabel[fixPlan.issueType]}
              </Badge>
              <Badge variant="outline" className="text-[11px] uppercase text-muted-foreground">
                {confidenceLabel[fixPlan.confidence]}
              </Badge>
            </div>

            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="data-mono text-muted-foreground">Source</dt>
                <dd className="mt-1 text-sm">{fixPlan.source}</dd>
              </div>
              <div>
                <dt className="data-mono text-muted-foreground">Detected</dt>
                <dd className="mt-1 text-sm">{formatRelativeTimestamp(fixPlan.detectedAt)}</dd>
              </div>
              <div>
                <dt className="data-mono text-muted-foreground">Current status</dt>
                <dd className="mt-1 text-sm">{statusLabel[fixPlan.status]}</dd>
              </div>
              <div>
                <dt className="data-mono text-muted-foreground">Issue ID</dt>
                <dd className="mt-1 text-sm">{fixPlan.issueId}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-xl border border-border/70 bg-background/35 p-4 sm:p-5">
            <p className="data-mono text-muted-foreground">Estimated monthly impact</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-primary">
              {formatCompactCurrency(fixPlan.estimatedMonthlyImpact)}
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              Confidence: {confidenceLabel[fixPlan.confidence]}
            </p>
            <Link
              href="/app"
              className="marketing-primary-cta mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-transform hover:-translate-y-px"
            >
              Review issue
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.65fr_1fr]">
        <div className="space-y-5">
          <section className="surface-card p-4 sm:p-5 lg:p-6">
            <p className="data-mono text-muted-foreground">Why this matters</p>
            <p className="mt-3 text-sm leading-7 text-muted-foreground sm:text-base">
              {fixPlan.whyItMatters}
            </p>
          </section>

          <section className="surface-card p-4 sm:p-5 lg:p-6">
            <p className="data-mono text-muted-foreground">Recommended fix</p>
            <p className="mt-3 text-sm leading-7 text-muted-foreground sm:text-base">
              {fixPlan.recommendedFix}
            </p>
          </section>

          <section className="surface-card p-4 sm:p-5 lg:p-6">
            <p className="data-mono text-muted-foreground">Action steps</p>
            <ol className="mt-4 space-y-3 sm:space-y-4">
              {fixPlan.steps.map((step, index) => (
                <li key={step.id} className="rounded-xl border border-border/70 bg-background/40 p-4">
                  <p className="data-mono text-muted-foreground">
                    Step {String(index + 1).padStart(2, "0")}
                  </p>
                  <p className="mt-2 text-sm font-semibold sm:text-base">{step.title}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{step.detail}</p>
                </li>
              ))}
            </ol>
          </section>

          <FixPlanControls initialStatus={fixPlan.status} />
        </div>

        <div className="space-y-5">
          <section className="surface-card p-4 sm:p-5 lg:p-6">
            <p className="data-mono text-muted-foreground">Platform context</p>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              {fixPlan.platformContext.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <CircleDot className="mt-0.5 h-3.5 w-3.5 text-muted-foreground/60" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="surface-card p-4 sm:p-5 lg:p-6">
            <p className="data-mono text-muted-foreground">Expected outcome</p>
            <p className="mt-3 text-sm text-muted-foreground">{fixPlan.expectedOutcome}</p>
          </section>

          <section className="surface-card p-4 sm:p-5 lg:p-6">
            <p className="data-mono text-muted-foreground">Success signal</p>
            <p className="mt-3 text-sm text-muted-foreground">{fixPlan.successSignal}</p>
          </section>

          {fixPlan.relatedIssues.length ? (
            <section className="surface-card p-4 sm:p-5 lg:p-6">
              <p className="data-mono text-muted-foreground">Related signals</p>
              <ul className="mt-4 space-y-3">
                {fixPlan.relatedIssues.slice(0, 2).map((related) => (
                  <li
                    key={related.issueId}
                    className="rounded-lg border border-border/70 bg-background/40 p-3"
                  >
                    <p className="text-sm font-medium">{related.title}</p>
                    <p className="mt-1 text-xs text-primary">
                      {formatCompactCurrency(related.estimatedMonthlyRevenueImpact)} / month
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      </section>
    </div>
  )
}

