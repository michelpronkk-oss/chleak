import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowRight, Check, ChevronRight, CircleCheck, CircleDashed } from "lucide-react"

export const metadata: Metadata = {
  title: "Connect Source",
}

import { cn } from "@/lib/utils"
import {
  inferShopifyDomainFromLiveSource,
  normalizeLiveSourceUrl,
} from "@/lib/live-source"
import { SubmitButton } from "@/components/ui/submit-button"
import { getConnectJourneyData } from "@/server/services/app-service"
import { DisconnectButton } from "./disconnect-button"
import { PostOauthHandoff } from "./post-oauth-handoff"
import { ShopifyConnectSubmitButton } from "./shopify-connect-submit-button"
import { StripeConnectSubmitButton } from "./stripe-connect-submit-button"
import { setLiveSourceContext } from "./actions"

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
  connected: "Source connected. First scan queued.",
  disconnected: "Shopify has been disconnected. Reconnect when ready.",
  disconnect_failed: "Shopify disconnect failed. Retry in a moment.",
  invalid_source_url: "Use a valid URL or domain for the live revenue surface.",
  context_saved: "Live source context saved.",
  context_save_failed: "Could not save live source context. Retry in a moment.",
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
  "invalid_source_url",
  "context_save_failed",
])

function formatSourceStatus(status: string) {
  return status.replaceAll("_", " ")
}

const progressSteps = ["Plan active", "Set source URL", "First scan", "Findings"]

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
                  ? "border-border/40 bg-card/40 text-muted-foreground/55"
                  : isCurrent
                    ? "border-foreground/25 bg-foreground/[0.06] text-foreground"
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
  const sourceUrlParam =
    Array.isArray(params.source_url) ? params.source_url[0] : params.source_url
  const persistedLiveSource =
    data.liveSourceContext?.url && normalizeLiveSourceUrl(data.liveSourceContext.url)
      ? normalizeLiveSourceUrl(data.liveSourceContext.url)
      : null
  const normalizedLiveSource = sourceUrlParam
    ? normalizeLiveSourceUrl(sourceUrlParam)
    : persistedLiveSource
  const sourceUrlInvalid = Boolean(sourceUrlParam && !normalizeLiveSourceUrl(sourceUrlParam))
  const inferredShopDomain = inferShopifyDomainFromLiveSource(
    normalizedLiveSource?.normalizedUrl ?? sourceUrlParam ?? null
  )

  const isPendingShopify = state === "pending_shopify"
  const isPendingStripe = state === "pending_stripe"
  const isReady =
    state === "first_results_shopify" ||
    state === "first_results_stripe" ||
    state === "completed_shopify" ||
    state === "completed_stripe" ||
    state === "demo"

  const showStatusMessage =
    (provider === "shopify" || provider === "stripe" || provider === "source_url") &&
    status &&
    statusMessage[status]
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
  const showPostOauthHandoff =
    provider === "shopify" && (status === "connected" || isPendingShopify || isReady)

  return (
    <div className="space-y-5 pb-24 lg:pb-4">
      {/* Page header */}
      <section className="vault-page-intro">
        <p className="data-mono text-muted-foreground">Workspace Setup</p>
        <h1 className="vault-page-intro-title">
          Connect your first revenue source
        </h1>
        <p className="vault-page-intro-copy">
          Start with your live revenue URL or domain. Connect Shopify and Stripe as optional system enrichments for deeper evidence.
        </p>
        {state === "demo" ? (
          <p className="text-sm text-amber-300">
            Demo mode is active. This setup state is simulated.
          </p>
        ) : null}
        <WorkspaceProgressSteps currentStep={currentProgressStep} />
      </section>

      {/* Status message */}
      {showStatusMessage ? (
        <section
          className={cn(
            "vault-panel-shell border p-4",
            statusIsError
              ? "border-destructive/40 bg-destructive/[0.06]"
              : "border-primary/30 bg-primary/[0.06]"
          )}
        >
          <p className="text-sm leading-6 text-muted-foreground">{showStatusMessage}</p>
        </section>
      ) : null}
      {showPostOauthHandoff ? (
        <PostOauthHandoff
          connected={status === "connected" || isPendingShopify || isReady}
          scanRunning={isPendingShopify}
          resultsReady={isReady}
        />
      ) : null}

      <section className="vault-panel-shell p-4 sm:p-5">
        <p className="data-mono text-muted-foreground">Primary live source</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Set the URL or domain that represents your live revenue surface. This becomes the primary source context for upcoming URL-first analysis.
        </p>
        <form action={setLiveSourceContext} className="mt-4 space-y-3">
          <div className="space-y-2">
            <label
              htmlFor="source_url"
              className="block font-mono text-[0.68rem] tracking-[0.08em] uppercase text-muted-foreground/60"
            >
              Live source URL
            </label>
            <input
              id="source_url"
              name="source_url"
              defaultValue={normalizedLiveSource?.normalizedUrl ?? sourceUrlParam ?? ""}
              placeholder="https://yourstore.com"
              className="vault-input w-full rounded-lg px-3.5 py-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/40"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              inputMode="url"
            />
          </div>
          <SubmitButton
            label="Set live source context"
            pendingLabel="Saving source..."
            className="rounded-lg border border-border/70 px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          />
        </form>
        {data.liveSourceContext?.url ? (
          <p className="mt-3 text-xs text-emerald-300">
            Saved context: {data.liveSourceContext.url}
          </p>
        ) : null}
        {normalizedLiveSource ? (
          <p className="mt-3 text-xs text-muted-foreground">
            Source domain: {normalizedLiveSource.hostname}
          </p>
        ) : sourceUrlInvalid ? (
          <p className="mt-3 text-xs text-amber-300">
            Enter a valid URL or domain to set source context.
          </p>
        ) : null}
      </section>

      {/* Connected systems */}
      <section className="vault-source-grid">
        {normalizedLiveSource ? (
          <div className="vault-panel-shell p-4 sm:p-5 lg:col-span-2">
            <p className="data-mono text-muted-foreground">Source context in use</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Primary live source: {normalizedLiveSource.normalizedUrl}. Connected systems below enrich findings with checkout and billing depth.
            </p>
          </div>
        ) : null}

        {/* Shopify */}
        <article className="vault-source-cell">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-mono text-[0.68rem] tracking-[0.1em] uppercase text-muted-foreground/60">
                Shopify
              </p>
              <h2 className="mt-1.5 text-base font-semibold tracking-tight">
                Connected system | checkout and activation depth
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
                defaultValue={
                  shopFromParams ??
                  inferredShopDomain ??
                  data.shopifySourceState.shopDomain ??
                  ""
                }
                placeholder="your-store.myshopify.com"
                className="vault-input w-full rounded-lg px-3.5 py-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/40"
                required
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                inputMode="url"
                pattern="[a-z0-9-]+\.myshopify\.com"
                title="Use format: your-store.myshopify.com"
              />
              <p className="text-xs text-muted-foreground/55">
                Exact myshopify domain. If your primary source URL is a myshopify domain, it is inferred automatically.
              </p>
            </div>
            <ShopifyConnectSubmitButton
              disabled={!data.shopifyConfigured}
              label={data.shopifyConfigured ? shopifyButtonLabel : "Shopify setup required"}
            />
          </form>

          {data.shopifySourceState.status !== "not_connected" ? (
            <div className="mt-2">
              <DisconnectButton
                label="Disconnect Shopify"
                action="/api/integrations/shopify/disconnect"
                next="/app/connect?provider=shopify&status=disconnected"
              />
            </div>
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
        <article className="vault-source-cell">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-mono text-[0.68rem] tracking-[0.1em] uppercase text-muted-foreground/60">
                Stripe
              </p>
              <h2 className="mt-1.5 text-base font-semibold tracking-tight">
                Connected system | billing recovery depth
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
              <div className="inline-flex items-center gap-2 rounded-lg border border-border/60 bg-card/50 px-4 py-3 text-sm text-foreground">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-foreground/50" />
                First billing scan running
              </div>
            ) : data.stripeConfigured ? (
              <form method="GET" action="/api/integrations/stripe/connect">
                <input type="hidden" name="orgId" value={data.organization.id} />
                <StripeConnectSubmitButton />
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
      <section className="vault-panel-shell p-4 sm:p-5">
        <p className="text-sm text-muted-foreground">
          Initial scans usually complete in minutes. Workspace states update automatically as soon as first results are ready.
        </p>
        <div className="mt-4 flex flex-wrap gap-2.5">
          <Link
            href="/api/mock/onboarding?state=demo&next=/app"
            className="rounded-lg border border-border/60 px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Continue with demo data
          </Link>
          {state === "demo" ? (
            <Link
              href="/api/mock/onboarding?state=empty&next=/app/connect"
              className="rounded-lg border border-amber-400/35 bg-amber-400/[0.08] px-4 py-2.5 text-sm text-amber-200 transition-colors hover:text-amber-100"
            >
              Return to live setup
            </Link>
          ) : null}
          <Link
            href="/contact#demo"
            className="rounded-lg border border-border/60 px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Request guided setup
          </Link>
          {(isPendingShopify || isPendingStripe || isReady || status === "connected") && (
            <Link
              href="/app"
              className="marketing-primary-cta inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-transform hover:-translate-y-px"
            >
              Open workspace status
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      </section>
    </div>
  )
}

