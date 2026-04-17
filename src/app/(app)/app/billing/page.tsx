import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowRight, CheckCircle2 } from "lucide-react"

import { sanitizeNextPath } from "@/lib/auth/navigation"
import { formatCompactCurrency } from "@/lib/format"
import { getBillingData } from "@/server/services/app-service"

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const data = await getBillingData()
  const params = await searchParams
  const intent = Array.isArray(params.intent) ? params.intent[0] : params.intent
  const nextParam = Array.isArray(params.next) ? params.next[0] : params.next
  const nextAfterCheckout = sanitizeNextPath(nextParam, "/app/connect")
  const selectedPlanParam = Array.isArray(params.plan) ? params.plan[0] : params.plan
  const selectedPlan =
    (selectedPlanParam === "starter" ||
    selectedPlanParam === "growth" ||
    selectedPlanParam === "pro"
      ? selectedPlanParam
      : data.selectedPlan) ?? "growth"
  const hasDegradedSubscription = !data.hasPlan && Boolean(data.subscription)
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
        <section className="space-y-2">
          <p className="data-mono text-primary">Plan Activation</p>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl lg:text-3xl">
            Activate your workspace plan
          </h1>
          <p className="max-w-3xl text-sm text-muted-foreground sm:text-base">
            Select the plan that matches your source footprint. CheckoutLeak unlocks onboarding after Dodo confirms subscription state.
          </p>
          {intentMessage ? (
            <p className="text-sm text-muted-foreground">
              {intentMessage}
            </p>
          ) : null}
        </section>

        {hasDegradedSubscription ? (
          <section className="surface-card p-4 sm:p-5 lg:p-6">
            <p className="data-mono text-primary">Billing Status</p>
            <h2 className="mt-2 text-lg font-semibold tracking-tight">
              {data.subscription?.plan} plan is currently {billingStatusLabel.toLowerCase()}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Monitoring is gated until billing returns to active or trialing status.
            </p>
          </section>
        ) : null}

        <section className="grid gap-4 lg:grid-cols-3">
          {Object.values(data.planCatalog).map((plan) => (
            <article
              key={plan.id}
              className={`surface-card p-4 sm:p-5 lg:p-6 ${
                plan.id === selectedPlan ? "border-primary/40 bg-primary/[0.04]" : ""
              }`}
            >
              <p className="text-sm font-semibold">{plan.name}</p>
              <p className="mt-1 font-mono text-3xl text-primary">${plan.monthlyPrice}</p>
              <p className="mt-1 text-xs text-muted-foreground">/month</p>
              <p className="mt-3 text-sm text-muted-foreground">{plan.summary}</p>
              <p className="mt-2 text-xs text-muted-foreground">{plan.highlight}</p>
              <Link
                href={`/api/app/plan/activate?plan=${plan.id}&next=/app/connect&source=billing_plan_activation`}
                className="marketing-primary-cta mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-transform hover:-translate-y-px"
              >
                Continue to checkout
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </article>
          ))}
        </section>

        <section className="surface-card p-4 sm:p-5 lg:p-6">
          <p className="data-mono text-primary">Checkout Note</p>
          <p className="mt-3 text-sm text-muted-foreground">
            Billing access is enforced by subscription state synced from Dodo webhooks. If checkout completed recently, refresh this page after a few seconds.
          </p>
          <Link
            href="/contact#demo"
            className="mt-4 inline-flex items-center gap-1 text-sm text-primary transition-opacity hover:opacity-80"
          >
            Request production billing setup
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </section>
      </div>
    )
  }

  return (
    <div className="space-y-5 pb-24 lg:pb-4">
      <section className="space-y-2">
        <p className="data-mono text-primary">Billing</p>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl lg:text-3xl">
          Subscription and Plan Controls
        </h1>
        <p className="text-sm text-muted-foreground sm:text-base">
          Manage plan state, seats, and upgrade path as monitored source coverage expands.
        </p>
        {data.onboardingState === "empty" ? (
          <Link
            href="/app/connect"
            className="inline-flex items-center gap-1 text-sm text-primary transition-opacity hover:opacity-80"
          >
            Continue onboarding by connecting your first source
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        ) : null}
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <article className="surface-card-strong p-5 sm:p-6 lg:p-7">
          <p className="data-mono text-primary">Current Plan</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight capitalize">
            {data.subscription?.plan}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Status: {billingStatusLabel} | {data.subscription?.billingCycle} billing
          </p>
          <p className="mt-4 text-3xl font-semibold tracking-tight text-primary">
            {formatCompactCurrency(data.subscription?.amount ?? 0)}
            <span className="ml-1 text-base text-muted-foreground">/month</span>
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            Includes {data.subscription?.seats} operator seats and monitoring for {data.monitoredStores} connected sources.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/app/billing?intent=choose-plan"
              className="marketing-primary-cta rounded-lg px-4 py-2.5 text-sm font-semibold transition-transform hover:-translate-y-px"
            >
              Change plan
            </Link>
            <button
              type="button"
              className="rounded-lg border border-border/70 px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Update seat count
            </button>
          </div>
        </article>

        <article className="surface-card p-4 sm:p-5 lg:p-6">
          <p className="data-mono text-primary">Plan Health</p>
          <ul className="mt-4 space-y-3 text-sm">
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
        </article>
      </section>

      <section className="surface-card p-4 sm:p-5 lg:p-6">
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

