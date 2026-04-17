import Link from "next/link"
import { ArrowRight, CheckCircle2 } from "lucide-react"

import { formatCompactCurrency } from "@/lib/format"
import { getBillingData } from "@/server/services/app-service"

export default async function BillingPage() {
  const data = await getBillingData()

  return (
    <div className="space-y-6 pb-20 lg:pb-4">
      <section className="space-y-2">
        <p className="data-mono text-primary">Billing</p>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Subscription and Plan Controls
        </h1>
        <p className="text-sm text-muted-foreground sm:text-base">
          Manage plan state, seats, and upgrade path as monitored store coverage expands.
        </p>
        {data.onboardingState === "empty" ? (
          <p className="text-sm text-muted-foreground">
            Connect your first source to activate monitored coverage under this plan.
          </p>
        ) : null}
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <article className="surface-card-strong p-6">
          <p className="data-mono text-primary">Current Plan</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight capitalize">
            {data.subscription.plan}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Status: {data.subscription.status} · {data.subscription.billingCycle} billing
          </p>
          <p className="mt-4 text-3xl font-semibold tracking-tight text-primary">
            {formatCompactCurrency(data.subscription.amount)}
            <span className="ml-1 text-base text-muted-foreground">/month</span>
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            Includes {data.subscription.seats} operator seats and monitoring for {data.monitoredStores} connected sources.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              className="marketing-primary-cta rounded-lg px-4 py-2.5 text-sm font-semibold transition-transform hover:-translate-y-px"
            >
              Change plan
            </button>
            <button
              type="button"
              className="rounded-lg border border-border/70 px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Update seat count
            </button>
          </div>
        </article>

        <article className="surface-card p-6">
          <p className="data-mono text-primary">Plan Health</p>
          <ul className="mt-4 space-y-3 text-sm">
            <li className="flex items-start gap-2 text-muted-foreground">
              <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-300" />
              Subscription active and in good standing.
            </li>
            <li className="flex items-start gap-2 text-muted-foreground">
              <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-300" />
              Next invoice date: {new Date(data.subscription.nextInvoiceDate).toLocaleDateString("en-US")}
            </li>
            <li className="flex items-start gap-2 text-muted-foreground">
              <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-300" />
              Leakage currently monitored: {formatCompactCurrency(data.estimatedLeakage)} / month.
            </li>
          </ul>
        </article>
      </section>

      <section className="surface-card p-5 sm:p-6">
        <p className="data-mono text-primary">Commercial Summary</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border/70 bg-background/35 p-4">
            <p className="text-sm text-muted-foreground">Organization</p>
            <p className="mt-1 text-sm">{data.organization.name}</p>
          </div>
          <div className="rounded-xl border border-border/70 bg-background/35 p-4">
            <p className="text-sm text-muted-foreground">Active issues</p>
            <p className="mt-1 text-sm">{data.activeIssueCount}</p>
          </div>
          <div className="rounded-xl border border-border/70 bg-background/35 p-4">
            <p className="text-sm text-muted-foreground">Plan fit</p>
            <p className="mt-1 text-sm">Growth tier aligns with current source footprint.</p>
          </div>
        </div>
        <Link
          href="/app/settings"
          className="mt-5 inline-flex items-center gap-1 text-sm text-primary transition-opacity hover:opacity-80"
        >
          Open workspace settings <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </section>
    </div>
  )
}
