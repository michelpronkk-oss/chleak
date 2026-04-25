import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowRight, CheckCircle2 } from "lucide-react"

export const metadata: Metadata = {
  title: "Billing",
}

import { sanitizeNextPath } from "@/lib/auth/navigation"
import { formatCompactCurrency } from "@/lib/format"
import { getBillingData } from "@/server/services/app-service"

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const data = await getBillingData()
  console.info(
    `[auth] billing page auth decision: has_plan=${data.hasPlan}; org=${data.organization.id}`
  )
  const params = await searchParams
  const intent = Array.isArray(params.intent) ? params.intent[0] : params.intent
  const nextParam = Array.isArray(params.next) ? params.next[0] : params.next
  const nextAfterCheckout = sanitizeNextPath(nextParam, "/app")
  const selectedPlanParam = Array.isArray(params.plan) ? params.plan[0] : params.plan
  const selectedPlan =
    (selectedPlanParam === "starter" ||
    selectedPlanParam === "growth" ||
    selectedPlanParam === "pro"
      ? selectedPlanParam
      : data.selectedPlan) ?? "growth"
  const hasDegradedSubscription = !data.hasPlan && Boolean(data.subscription)
  const selectedPlanDetails = data.planCatalog[selectedPlan]
  const billingStatusLabel =
    data.billingStatus === "active"
      ? "Active"
      : data.billingStatus === "trialing"
        ? "Trialing"
        : data.billingStatus === "past_due"
          ? "Past due"
          : data.billingStatus === "canceled"
            ? "Canceled"
            : data.billingStatus === "incomplete"
              ? "Incomplete"
              : "No active plan"
  const intentMessage =
    intent === "plan_required"
      ? "An active plan is required before operator dashboard access."
      : intent === "checkout_success"
        ? "Checkout submitted. Subscription state will unlock automatically after webhook sync."
        : intent === "checkout_cancelled"
          ? "Checkout was canceled. Select a plan to continue."
          : intent === "billing_config_missing"
            ? "Billing is not fully configured in this environment."
            : intent === "checkout_creation_failed"
              ? "Checkout session could not be created. Retry in a moment."
              : intent === "plan_activation_failed"
                ? "Plan activation did not complete. Retry or contact support."
        : intent === "workspace_setup_failed"
          ? "Workspace setup is incomplete. Contact support to finish provisioning."
          : null

  if (data.hasPlan && intent === "checkout_success" && nextAfterCheckout !== "/app/billing") {
    redirect(nextAfterCheckout)
  }

  if (!data.hasPlan) {
    return (
      <div className="space-y-5 pb-24 lg:pb-4">
        <section className="vault-page-intro">
          <p className="data-mono text-muted-foreground">Plan Activation</p>
          <h1 className="vault-page-intro-title">
            Activate your workspace plan
          </h1>
          <p className="vault-page-intro-copy">
            Select the plan that matches your source footprint. SilentLeak unlocks onboarding after Dodo confirms subscription state.
          </p>
          {intentMessage ? (
            <p className="text-sm text-muted-foreground">
              {intentMessage}
            </p>
          ) : null}
        </section>

        {hasDegradedSubscription ? (
          <section className="vault-panel-shell p-4 sm:p-5 lg:p-6">
            <p className="vault-metric-key text-muted-foreground">Billing Status</p>
            <h2 className="mt-2 text-lg font-semibold tracking-tight text-foreground">
              {data.subscription?.plan} plan is currently {billingStatusLabel.toLowerCase()}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Monitoring is gated until billing returns to active or trialing status.
            </p>
          </section>
        ) : null}

        <section className="vault-source-grid">
          {Object.values(data.planCatalog).map((plan) => (
            <article
              key={plan.id}
              className={`vault-source-cell ${
                plan.id === selectedPlan ? "border border-primary/40 bg-primary/[0.04]" : ""
              }`}
            >
              <p className="text-sm font-semibold">{plan.name}</p>
              <p className="mt-1 font-mono text-3xl text-primary">${plan.monthlyPrice}</p>
              <p className="mt-1 text-xs text-muted-foreground">/month</p>
              <p className="mt-3 text-sm text-muted-foreground">{plan.summary}</p>
              <p className="mt-2 text-xs text-muted-foreground">{plan.highlight}</p>
              <a
                href={`/api/app/plan/activate?plan=${plan.id}&next=/app&source=billing_plan_activation`}
                className="marketing-primary-cta mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-transform hover:-translate-y-px"
              >
                Continue to checkout
                <ArrowRight className="h-3.5 w-3.5" />
              </a>
            </article>
          ))}
        </section>

        <section className="vault-panel-shell p-4 sm:p-5 lg:p-6">
          <p className="data-mono text-muted-foreground">Activation Step</p>
          <p className="mt-3 text-sm text-muted-foreground">
            Selected plan: {selectedPlanDetails.name} | {formatCompactCurrency(selectedPlanDetails.monthlyPrice)} / month
          </p>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Billing is confirmed in the next step.
          </p>
        </section>

        <section className="vault-panel-shell p-4 sm:p-5 lg:p-6">
          <p className="data-mono text-muted-foreground">Checkout Note</p>
          <p className="mt-3 text-sm text-muted-foreground">
            Billing access is enforced by subscription state synced from Dodo webhooks. If checkout completed recently, refresh this page after a few seconds.
          </p>
          <Link
            href="/contact"
            className="vault-link mt-4 inline-flex items-center gap-1 text-sm"
          >
            Contact support
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </section>
      </div>
    )
  }

  return (
    <div className="space-y-5 pb-24 lg:pb-4">
      <section className="vault-page-intro">
        <p className="data-mono text-muted-foreground">Billing</p>
        <h1 className="vault-page-intro-title">
          Subscription and Plan Controls
        </h1>
        <p className="vault-page-intro-copy">
          Manage plan state, seats, and upgrade path as monitored source coverage expands.
        </p>
        {data.onboardingState === "demo" ? (
          <p className="text-sm text-amber-300">
            Demo mode is active. Workspace metrics may reflect simulated data.
          </p>
        ) : null}
        {data.onboardingState === "empty" ? (
          <Link
            href="/app/stores"
            className="vault-link inline-flex items-center gap-1 text-sm"
          >
            Continue onboarding by connecting your first source
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        ) : null}
      </section>

      <div className="space-y-5">
        <section className="vault-panel-shell">
          <header className="vault-panel-head">
            <p className="vault-panel-title">Plan</p>
            <p className="vault-panel-meta">Status {billingStatusLabel}</p>
          </header>
          <div className="px-4 py-4 sm:px-5">
            <h2 className="text-2xl font-semibold tracking-tight capitalize">{data.subscription?.plan}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {data.subscription?.billingCycle} billing | {data.subscription?.seats} operator seats
            </p>
            <p className="mt-4 text-3xl font-semibold tracking-tight text-primary">
              {formatCompactCurrency(data.subscription?.amount ?? 0)}
              <span className="ml-1 text-base text-muted-foreground">/month</span>
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              Monitoring for {data.monitoredStores} connected sources.
            </p>
          </div>
        </section>

        <section className="vault-panel-shell">
          <header className="vault-panel-head">
            <p className="vault-panel-title">Billing health</p>
            <p className="vault-panel-meta">Webhook synced</p>
          </header>
          <ul className="space-y-3 px-4 py-4 text-sm sm:px-5">
            <li className="flex items-start gap-2 text-muted-foreground">
              <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-300" />
              Subscription state synced from Dodo webhooks.
            </li>
            <li className="flex items-start gap-2 text-muted-foreground">
              <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-300" />
              Next invoice date:{" "}
              {data.subscription?.nextInvoiceDate
                ? new Date(data.subscription.nextInvoiceDate).toLocaleDateString("en-US")
                : "Pending"}
            </li>
            <li className="flex items-start gap-2 text-muted-foreground">
              <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-300" />
              Leakage currently monitored: {formatCompactCurrency(data.estimatedLeakage)} / month.
            </li>
          </ul>
        </section>

        <section className="vault-panel-shell">
          <header className="vault-panel-head">
            <p className="vault-panel-title">Commercial summary</p>
            <p className="vault-panel-meta">{data.organization.name}</p>
          </header>
          <div className="grid gap-4 px-4 py-4 sm:grid-cols-3 sm:px-5">
            <div className="rounded-md border border-border/70 bg-background/35 p-4">
              <p className="text-sm text-muted-foreground">Organization</p>
              <p className="mt-1 text-sm">{data.organization.name}</p>
            </div>
            <div className="rounded-md border border-border/70 bg-background/35 p-4">
              <p className="text-sm text-muted-foreground">Active issues</p>
              <p className="mt-1 text-sm">{data.activeIssueCount}</p>
            </div>
            <div className="rounded-md border border-border/70 bg-background/35 p-4">
              <p className="text-sm text-muted-foreground">Plan fit</p>
              <p className="mt-1 text-sm capitalize">
                {data.subscription?.plan ?? "No plan"} | {data.monitoredStores} source{data.monitoredStores !== 1 ? "s" : ""} monitored
              </p>
            </div>
          </div>
          <div className="px-4 pb-4 sm:px-5">
            <Link
              href="/app/settings"
              className="vault-link inline-flex items-center gap-1 text-sm"
            >
              Open workspace settings <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}
