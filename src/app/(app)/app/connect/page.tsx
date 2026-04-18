import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowRight, Check, ChevronRight, CircleCheck, CircleDashed } from "lucide-react"

import { ProcessingStagePanel } from "@/components/dashboard/processing-stage-panel"
import { cn } from "@/lib/utils"
import { getConnectJourneyData } from "@/server/services/app-service"
import { ShopifyConnectSubmitButton } from "./shopify-connect-submit-button"

const statusMessage: Record<string, string> = {
  setup_required: "Stripe connect setup is incomplete in this environment.",
  invalid_shop: "Use a valid Shopify domain in the format your-store.myshopify.com.",
  callback_missing: "Connection callback did not include required parameters.",
  callback_invalid: "Connection callback verification failed.",
  callback_failed: "Connection callback processing failed. Retry the connection.",
  callback_declined: "Stripe connection was not approved.",
  state_mismatch: "Connection state did not match this session. Retry the connection.",
  webhook_registration_failed:
    "Shopify connected, but webhook registration needs attention. Review setup and retry.",
  connected: "Source connected. CheckoutLeak is preparing your first scan.",
  disconnected: "Shopify has been disconnected. Reconnect when ready.",
  disconnect_failed: "Shopify disconnect failed. Retry in a moment.",
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
  "disconnect_failed",
])

function formatSourceStatus(status: string) {
  return status.replaceAll("_", " ")
}

const progressSteps = ["Plan active", "Connect source", "First scan", "Findings"]

function WorkspaceProgressSteps({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 pt-3">
      {progressSteps.map((label, i) => {
        const stepNumber = i + 1
        const isDone = stepNumber < currentStep
        const isCurrent = stepNumber === currentStep

        return (
          <span key={label} className="contents">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 font-mono text-[0.65rem] tracking-[0.08em] uppercase",
                isDone
                  ? "border-primary/25 bg-primary/[0.08] text-primary/65"
                  : isCurrent
                    ? "border-primary/55 bg-primary/[0.12] text-primary"
                    : "border-border/40 text-muted-foreground/40"
              )}
            >
              {isDone && <Check className="h-2.5 w-2.5" />}
              {label}
            </span>
            {i < progressSteps.length - 1 && (
              <ChevronRight className="h-3 w-3 shrink-0 text-border/35" />
            )}
          </span>
        )
      })}
    </div>
  )
}

function SourceStatusBadge({ status }: { status: string }) {
  const isConnected = status === "connected"

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-md border px-2.5 py-1 font-mono text-[0.65rem] tracking-[0.08em] uppercase",
        isConnected
          ? "border-emerald-400/30 bg-emerald-400/[0.08] text-emerald-400"
          : "border-border/50 text-muted-foreground/50"
      )}
    >
      {isConnected ? (
        <CircleCheck className="h-3 w-3" />
      ) : (
        <CircleDashed className="h-3 w-3" />
      )}
      {formatSourceStatus(status)}
    </span>
  )
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
    (provider === "shopify" || provider === "stripe") && status && statusMessage[status]
  const statusIsError = status ? errorStatuses.has(status) : false
  const stripeMissingList = (
    missing?.split(",").map((item) => item.trim()).filter(Boolean) ??
    data.stripeSetupMissing ??
    []
  ) as string[]
  const stripeMissingText = stripeMissingList.length
    ? `Missing: ${stripeMissingList.join(", ")}.`
    : "Missing: Stripe connection configuration."

  const currentProgressStep = isReady ? 4 : isPendingShopify || isPendingStripe ? 3 : 2
  const shopifyButtonLabel =
    data.shopifySetupAttention
      ? "Retry Shopify setup"
      : data.shopifySourceState.status === "connected"
        ? "Reconnect Shopify"
        : data.shopifySourceState.status === "syncing"
          ? "Reconnect Shopify"
          : data.shopifySourceState.status === "errored"
            ? "Retry Shopify setup"
            : "Connect Shopify"
  const shopifySetupMessage =
    data.shopifySetupAttentionMessage ??
    (data.shopifySetupAttention
      ? "Shopify connected, but webhook registration needs attention. Retry setup."
      : null)
  const showShopifyProcessingHandoff =
    provider === "shopify" && (status === "connected" || isPendingShopify)

  return (
    <div className="space-y-5 pb-24 lg:pb-4">
      {/* Page header */}
      <section className="space-y-1">
        <p className="data-mono text-primary">Workspace Setup</p>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl lg:text-3xl">
          Connect your first revenue source
        </h1>
        <p className="max-w-xl text-sm text-muted-foreground sm:text-base">
          CheckoutLeak needs one data source to begin detecting leakage. Connect Shopify for checkout signals or Stripe for billing recovery analysis.
        </p>
        <WorkspaceProgressSteps currentStep={currentProgressStep} />
      </section>

      {/* Status message */}
      {showStatusMessage ? (
        <section
          className={cn(
            "surface-card border p-4",
            statusIsError
              ? "border-destructive/40 bg-destructive/[0.06]"
              : "border-primary/30 bg-primary/[0.06]"
          )}
        >
          <p className="text-sm leading-6 text-muted-foreground">{showStatusMessage}</p>
        </section>
      ) : null}
      {showShopifyProcessingHandoff ? (
        <ProcessingStagePanel
          title="Connection Handoff"
          stages={[
            "Source connected",
            "Starting first scan...",
            "Reviewing source configuration...",
            "Checking signal readiness...",
            "Preparing monitoring baseline...",
          ]}
        />
      ) : null}

      {/* Source cards */}
      <section className="grid gap-4 lg:grid-cols-2">
        {/* Shopify */}
        <article className="surface-card p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-mono text-[0.68rem] tracking-[0.1em] uppercase text-primary/60">
                Shopify
              </p>
              <h2 className="mt-1.5 text-base font-semibold tracking-tight">
                Checkout and payment signals
              </h2>
            </div>
            <SourceStatusBadge status={data.shopifySourceState.status} />
          </div>

          <p className="mt-2.5 text-sm leading-[1.72] text-muted-foreground">
            Detects checkout friction, payment method gaps, and conversion leakage by device and market.
          </p>

          <div className="my-4 h-px bg-border/40" />

          <form method="GET" action="/api/integrations/shopify/install" className="space-y-3">
            <input type="hidden" name="orgId" value={data.organization.id} />
            <div className="space-y-2">
              <label
                className="block font-mono text-[0.68rem] tracking-[0.08em] uppercase text-muted-foreground/60"
                htmlFor="shop"
              >
                Store domain
              </label>
              <input
                id="shop"
                name="shop"
                defaultValue={shopFromParams ?? data.shopifySourceState.shopDomain ?? ""}
                placeholder="your-store.myshopify.com"
                className="w-full rounded-lg border border-border/60 bg-background/40 px-3.5 py-3 text-base outline-none transition-colors placeholder:text-muted-foreground/40 focus:border-primary/50"
                required
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                inputMode="url"
                pattern="[a-z0-9-]+\.myshopify\.com"
                title="Use format: your-store.myshopify.com"
              />
              <p className="text-xs text-muted-foreground/55">
                Exact myshopify domain. We initiate app authorization and return after approval.
              </p>
            </div>
            <ShopifyConnectSubmitButton
              disabled={!data.shopifyConfigured}
              label={data.shopifyConfigured ? shopifyButtonLabel : "Shopify setup required"}
            />
          </form>

          {data.shopifySourceState.status !== "not_connected" ? (
            <form method="POST" action="/api/integrations/shopify/disconnect" className="mt-2">
              <input type="hidden" name="next" value="/app/connect?provider=shopify&status=disconnected" />
              <button
                type="submit"
                className="inline-flex w-full items-center justify-center rounded-lg border border-border/60 px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground sm:w-auto"
              >
                Disconnect Shopify
              </button>
            </form>
          ) : null}

          {data.shopifySourceState.shopDomain ? (
            <p className="mt-3 font-mono text-[0.65rem] tracking-[0.06em] text-muted-foreground/45">
              {data.shopifySourceState.shopDomain}
            </p>
          ) : null}
          {shopifySetupMessage ? (
            <p className="mt-2 text-xs text-amber-300">{shopifySetupMessage}</p>
          ) : null}
        </article>

        {/* Stripe */}
        <article className="surface-card p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-mono text-[0.68rem] tracking-[0.1em] uppercase text-primary/60">
                Stripe
              </p>
              <h2 className="mt-1.5 text-base font-semibold tracking-tight">
                Billing recovery source
              </h2>
            </div>
            <SourceStatusBadge status={data.stripeSourceState.status} />
          </div>

          <p className="mt-2.5 text-sm leading-[1.72] text-muted-foreground">
            Detects failed renewal leakage, retry gaps, and dunning lifecycle inefficiencies in subscription billing.
          </p>

          <div className="my-4 h-px bg-border/40" />

          <div>
            {isPendingStripe ? (
              <div className="inline-flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/[0.08] px-4 py-3 text-sm text-primary">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
                First billing scan running
              </div>
            ) : data.stripeConfigured ? (
              <form method="GET" action="/api/integrations/stripe/connect">
                <input type="hidden" name="orgId" value={data.organization.id} />
                <button
                  type="submit"
                  className="marketing-primary-cta inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition-transform hover:-translate-y-px sm:w-auto"
                >
                  Connect Stripe
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </form>
            ) : (
              <div className="space-y-3 rounded-lg border border-border/60 bg-background/30 p-4">
                <p className="text-sm text-muted-foreground">
                  Stripe connection is not configured in this environment.
                </p>
                <p className="font-mono text-[0.65rem] tracking-[0.06em] text-muted-foreground/50">
                  {stripeMissingText}
                </p>
                <Link
                  href="/contact#demo"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Request setup support
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            )}
          </div>

          {data.stripeSourceState.accountId ? (
            <p className="mt-3 font-mono text-[0.65rem] tracking-[0.06em] text-muted-foreground/45">
              {data.stripeSourceState.accountId}
            </p>
          ) : null}
        </article>
      </section>

      {/* Tertiary actions */}
      <section className="surface-card p-4 sm:p-5">
        <p className="text-sm text-muted-foreground">
          Initial scans complete in minutes. CheckoutLeak then opens your first issue queue ranked by revenue impact.
        </p>
        <div className="mt-4 flex flex-wrap gap-2.5">
          <Link
            href="/api/mock/onboarding?state=demo&next=/app"
            className="rounded-lg border border-border/60 px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Continue with demo data
          </Link>
          <Link
            href="/contact#demo"
            className="rounded-lg border border-border/60 px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
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
