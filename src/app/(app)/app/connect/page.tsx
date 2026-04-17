import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { getConnectJourneyData } from "@/server/services/app-service"

const statusMessage: Record<string, string> = {
  setup_required:
    "Integration credentials are not configured in this environment. Add required environment variables to enable live install.",
  invalid_shop: "Enter a valid Shopify domain using format your-shop.myshopify.com.",
  callback_missing: "Callback did not include required parameters.",
  callback_invalid: "Callback verification failed.",
  callback_failed: "Callback processing failed. Retry connection.",
  callback_declined: "Connection was not approved in Stripe.",
  state_mismatch: "Install state did not match expected session. Retry installation.",
  webhook_registration_failed:
    "Shopify installed but webhook registration failed. Review configuration and retry.",
  connected: "Source connected. Run first scan to transition into full issue detection.",
}

export default async function ConnectPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const data = await getConnectJourneyData()
  const state = data.onboardingState
  const params = await searchParams
  const provider = Array.isArray(params.provider) ? params.provider[0] : params.provider
  const status = Array.isArray(params.status) ? params.status[0] : params.status

  const isPendingShopify = state === "pending_shopify"
  const isPendingStripe = state === "pending_stripe"
  const isReady =
    state === "first_results_shopify" ||
    state === "first_results_stripe" ||
    state === "completed_shopify" || state === "completed_stripe" || state === "demo"
  const showStatusMessage =
    (provider === "shopify" || provider === "stripe") &&
    status &&
    statusMessage[status]

  return (
    <div className="space-y-6 pb-20 lg:pb-4">
      <section className="space-y-2">
        <p className="data-mono text-primary">Connect Source</p>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Connect your first monitored source
        </h1>
        <p className="max-w-3xl text-sm text-muted-foreground sm:text-base">
          CheckoutLeak reads checkout and billing metadata for leakage detection. Source configuration remains under merchant control.
        </p>
      </section>

      {showStatusMessage ? (
        <section className="surface-card p-4">
          <p className="text-sm text-muted-foreground">{showStatusMessage}</p>
        </section>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="surface-card p-5 sm:p-6">
          <p className="data-mono text-primary">Shopify</p>
          <h2 className="mt-2 text-lg font-semibold tracking-tight">
            Checkout and payment flow source
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Detect checkout friction, payment method coverage gaps, and conversion leakage by device and market.
          </p>
          <p className="mt-3 text-xs text-muted-foreground">
            Data scope: checkout telemetry, order conversion metadata, payment method coverage.
          </p>

          <form
            method="GET"
            action="/api/integrations/shopify/install"
            className="mt-5 space-y-3"
          >
            <input type="hidden" name="orgId" value={data.organization.id} />
            <label className="block text-xs text-muted-foreground" htmlFor="shop">
              Shopify domain
            </label>
            <input
              id="shop"
              name="shop"
              placeholder="your-shop.myshopify.com"
              className="w-full rounded-lg border border-border/70 bg-background/35 px-3 py-2 text-sm outline-none transition-colors focus:border-primary/40"
              required
            />
            <button
              type="submit"
              disabled={!data.shopifyConfigured}
              className="marketing-primary-cta inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-transform hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-55"
            >
              {data.shopifyConfigured ? "Connect Shopify" : "Setup required"}
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </form>

          {data.shopifySourceState.status !== "not_connected" ? (
            <p className="mt-3 text-xs text-muted-foreground">
              Current status: {data.shopifySourceState.status}
              {data.shopifySourceState.shopDomain
                ? ` | ${data.shopifySourceState.shopDomain}`
                : ""}
            </p>
          ) : null}
        </article>

        <article className="surface-card p-5 sm:p-6">
          <p className="data-mono text-primary">Stripe</p>
          <h2 className="mt-2 text-lg font-semibold tracking-tight">Subscription billing source</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Detect failed renewal leakage, retry gaps, and dunning lifecycle inefficiencies.
          </p>
          <p className="mt-3 text-xs text-muted-foreground">
            Data scope: invoice lifecycle events, payment intent outcomes, retry and reminder settings.
          </p>
          <div className="mt-5">
            {isPendingStripe ? (
              <span className="inline-flex rounded-lg border border-primary/35 bg-primary/10 px-4 py-2.5 text-sm text-primary">
                First scan running
              </span>
            ) : (
              <form method="GET" action="/api/integrations/stripe/connect">
                <input type="hidden" name="orgId" value={data.organization.id} />
                <button
                  type="submit"
                  disabled={!data.stripeConfigured}
                  className="rounded-lg border border-border/70 px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-55"
                >
                  {data.stripeConfigured ? "Connect Stripe" : "Setup required"}
                </button>
              </form>
            )}
          </div>

          {data.stripeSourceState.status !== "not_connected" ? (
            <p className="mt-3 text-xs text-muted-foreground">
              Current status: {data.stripeSourceState.status}
              {data.stripeSourceState.accountId
                ? ` | ${data.stripeSourceState.accountId}`
                : ""}
            </p>
          ) : null}
        </article>
      </section>

      <section className="surface-card p-5 sm:p-6">
        <p className="data-mono text-primary">Next Step</p>
        <p className="mt-3 text-sm text-muted-foreground">
          First scan usually completes in minutes. CheckoutLeak then opens with a prioritized issue list and fix plans.
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
              View first results
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      </section>
    </div>
  )
}
