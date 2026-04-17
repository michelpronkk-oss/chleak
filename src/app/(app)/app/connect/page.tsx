import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowRight, CircleCheck, CircleDashed } from "lucide-react"

import { getConnectJourneyData } from "@/server/services/app-service"

const statusMessage: Record<string, string> = {
  setup_required:
    "Stripe connect setup is incomplete in this environment.",
  invalid_shop:
    "Use a valid Shopify domain in the format your-store.myshopify.com.",
  callback_missing: "Connection callback did not include required parameters.",
  callback_invalid: "Connection callback verification failed.",
  callback_failed: "Connection callback processing failed. Retry the connection.",
  callback_declined: "Stripe connection was not approved.",
  state_mismatch: "Connection state did not match this session. Retry the connection.",
  webhook_registration_failed:
    "Shopify connected, but webhook registration needs attention. Review setup and retry.",
  connected:
    "Source connected successfully. CheckoutLeak is preparing your first scan.",
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
])

function formatSourceStatus(status: string) {
  return status.replaceAll("_", " ")
}

export default async function ConnectPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const data = await getConnectJourneyData()

  if (!data.hasPlan) {
    redirect("/app/billing?intent=plan_required")
  }

  const state = data.onboardingState
  const params = await searchParams
  const provider = Array.isArray(params.provider) ? params.provider[0] : params.provider
  const status = Array.isArray(params.status) ? params.status[0] : params.status
  const missing = Array.isArray(params.missing) ? params.missing[0] : params.missing
  const shopFromParams = Array.isArray(params.shop) ? params.shop[0] : params.shop

  const isPendingShopify = state === "pending_shopify"
  const isPendingStripe = state === "pending_stripe"
  const isReady =
    state === "first_results_shopify" ||
    state === "first_results_stripe" ||
    state === "completed_shopify" ||
    state === "completed_stripe" ||
    state === "demo"

  const showStatusMessage =
    (provider === "shopify" || provider === "stripe") &&
    status &&
    statusMessage[status]

  const statusIsError = status ? errorStatuses.has(status) : false
  const stripeMissingList =
    (missing?.split(",").map((item) => item.trim()).filter(Boolean) ??
      data.stripeSetupMissing ??
      []) as string[]
  const stripeMissingText = stripeMissingList.length
    ? `Missing: ${stripeMissingList.join(", ")}.`
    : "Missing: Stripe connection configuration."

  return (
    <div className="space-y-5 pb-24 lg:pb-4">
      <section className="space-y-2">
        <p className="data-mono text-primary">Connect Source</p>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl lg:text-3xl">
          Onboarding step 2: connect your first source
        </h1>
        <p className="max-w-3xl text-sm text-muted-foreground sm:text-base">
          Plan status is active{data.selectedPlan ? ` on ${data.selectedPlan}` : ""}. Connect one source to start leakage detection, then move into first scan and findings.
        </p>
        <div className="flex flex-wrap gap-1.5 pt-2 text-xs text-muted-foreground sm:gap-2">
          <span className="rounded-md border border-primary/40 bg-primary/10 px-2 py-1 text-primary">
            1. Plan active
          </span>
          <span className="rounded-md border border-primary/40 bg-primary/10 px-2 py-1 text-primary">
            2. Connect source
          </span>
          <span className="rounded-md border border-border/70 px-2 py-1">
            3. First scan
          </span>
          <span className="rounded-md border border-border/70 px-2 py-1">
            4. Findings
          </span>
        </div>
      </section>

      {showStatusMessage ? (
        <section
          className={`surface-card border p-4 ${
            statusIsError
              ? "border-destructive/40 bg-destructive/[0.06]"
              : "border-primary/30 bg-primary/[0.06]"
          }`}
        >
          <p className="text-sm leading-6 text-muted-foreground">{showStatusMessage}</p>
        </section>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="surface-card p-4 sm:p-5 lg:p-6">
          <p className="data-mono text-primary">Shopify</p>
          <h2 className="mt-2 text-lg font-semibold tracking-tight">
            Checkout and payment flow source
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Detect checkout friction, payment method coverage gaps, and conversion leakage by device and market.
          </p>
          <p className="mt-3 text-xs text-muted-foreground">
            Data scope: checkout telemetry, order conversion metadata, and payment method coverage.
          </p>

          <form
            method="GET"
            action="/api/integrations/shopify/install"
            className="mt-5 space-y-3"
          >
            <input type="hidden" name="orgId" value={data.organization.id} />
            <label className="block text-xs text-muted-foreground" htmlFor="shop">
              Store domain
            </label>
            <input
              id="shop"
              name="shop"
              defaultValue={shopFromParams ?? data.shopifySourceState.shopDomain ?? ""}
              placeholder="your-store.myshopify.com"
              className="w-full rounded-lg border border-border/70 bg-background/35 px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary/40"
              required
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              inputMode="url"
              pattern="[a-z0-9-]+\.myshopify\.com"
              title="Use format: your-store.myshopify.com"
            />
            <p className="text-xs text-muted-foreground">
              Use the exact myshopify domain. We start app authorization and return here after approval.
            </p>
            <button
              type="submit"
              disabled={!data.shopifyConfigured}
              className="marketing-primary-cta inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-transform hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-55 sm:w-auto"
            >
              {data.shopifyConfigured ? "Start Shopify connection" : "Shopify setup required"}
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </form>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1 rounded-md border border-border/70 px-2 py-1">
              {data.shopifySourceState.status === "connected" ? (
                <CircleCheck className="h-3.5 w-3.5 text-primary" />
              ) : (
                <CircleDashed className="h-3.5 w-3.5 text-primary" />
              )}
              Status: {formatSourceStatus(data.shopifySourceState.status)}
            </span>
            {data.shopifySourceState.shopDomain ? (
              <span className="rounded-md border border-border/70 px-2 py-1">
                {data.shopifySourceState.shopDomain}
              </span>
            ) : null}
          </div>
        </article>

        <article className="surface-card p-4 sm:p-5 lg:p-6">
          <p className="data-mono text-primary">Stripe</p>
          <h2 className="mt-2 text-lg font-semibold tracking-tight">Subscription billing source</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Detect failed renewal leakage, retry gaps, and dunning lifecycle inefficiencies.
          </p>
          <p className="mt-3 text-xs text-muted-foreground">
            Data scope: invoice lifecycle events, payment intent outcomes, retry configuration, and reminder cadence.
          </p>

          <div className="mt-5">
            {isPendingStripe ? (
              <span className="inline-flex rounded-lg border border-primary/35 bg-primary/10 px-4 py-2.5 text-sm text-primary">
                First billing scan running
              </span>
            ) : data.stripeConfigured ? (
              <form method="GET" action="/api/integrations/stripe/connect">
                <input type="hidden" name="orgId" value={data.organization.id} />
                <button
                  type="submit"
                  className="marketing-primary-cta inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-transform hover:-translate-y-px sm:w-auto"
                >
                  Start Stripe connection
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </form>
            ) : (
              <div className="space-y-3 rounded-lg border border-border/70 bg-background/30 p-3.5">
                <p className="text-sm text-muted-foreground">
                  Stripe connection is not ready in this environment.
                </p>
                <p className="text-xs text-muted-foreground">{stripeMissingText}</p>
                <Link
                  href="/contact#demo"
                  className="inline-flex rounded-lg border border-border/70 px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Request setup support
                </Link>
              </div>
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1 rounded-md border border-border/70 px-2 py-1">
              {data.stripeSourceState.status === "connected" ? (
                <CircleCheck className="h-3.5 w-3.5 text-primary" />
              ) : (
                <CircleDashed className="h-3.5 w-3.5 text-primary" />
              )}
              Status: {formatSourceStatus(data.stripeSourceState.status)}
            </span>
            {data.stripeSourceState.accountId ? (
              <span className="rounded-md border border-border/70 px-2 py-1">
                {data.stripeSourceState.accountId}
              </span>
            ) : null}
          </div>
        </article>
      </section>

      <section className="surface-card p-4 sm:p-5 lg:p-6">
        <p className="data-mono text-primary">Next Step</p>
        <p className="mt-3 text-sm text-muted-foreground">
          Initial scan usually completes in minutes. CheckoutLeak then opens your first issue queue and fix plans.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/api/mock/onboarding?state=demo&next=/app"
            className="rounded-lg border border-border/70 px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Continue with demo data
          </Link>
          <Link
            href="/contact#demo"
            className="rounded-lg border border-border/70 px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Request guided setup
          </Link>
          {(isPendingShopify || isPendingStripe || isReady || status === "connected") && (
            <Link
              href={
                isPendingShopify
                  ? "/api/mock/onboarding?state=first_results_shopify&next=/app"
                  : isPendingStripe || provider === "stripe"
                    ? "/api/mock/onboarding?state=first_results_stripe&next=/app"
                    : status === "connected"
                      ? provider === "stripe"
                        ? "/api/mock/onboarding?state=first_results_stripe&next=/app"
                        : "/api/mock/onboarding?state=first_results_shopify&next=/app"
                      : "/app"
              }
              className="marketing-primary-cta inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-transform hover:-translate-y-px"
            >
              View first findings
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      </section>
    </div>
  )
}

