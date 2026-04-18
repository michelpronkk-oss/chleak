import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowRight, CircleDot } from "lucide-react"

import { formatCompactCurrency, formatRelativeTimestamp } from "@/lib/format"
import { getStoresIndexData } from "@/server/services/app-service"

export default async function StoresPage() {
  const data = await getStoresIndexData()
  console.info(
    `[auth] stores page auth decision: has_plan=${data.hasPlan}; org=${data.organization.id}`
  )

  if (!data.hasPlan) {
    redirect("/app/billing?intent=plan_required")
  }

  if (data.onboardingState === "empty") {
    redirect("/app/connect")
  }

  return (
    <div className="space-y-5 pb-24 lg:pb-4">
      <section className="space-y-2">
        <p className="data-mono text-primary">Stores</p>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl lg:text-3xl">
          Connected Revenue Sources
        </h1>
        <p className="max-w-3xl text-sm text-muted-foreground sm:text-base">
          Every source is tracked as a monitored asset with scan status, active issues, and leakage exposure.
        </p>
      </section>

      <section className="surface-card p-4 sm:p-5 lg:p-6">
        {data.stagingSource ? (
          <article className="rounded-xl border border-border/70 bg-background/35 p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold tracking-tight sm:text-lg">
                {data.stagingSource.label} source
              </h2>
              <span className={`text-xs ${data.stagingSource.statusTone}`}>
                {data.stagingSource.statusLabel}
              </span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{data.stagingSource.message}</p>
            <Link
              href="/app/connect"
              className="mt-4 inline-flex items-center gap-1 text-sm text-primary transition-opacity hover:opacity-80"
            >
              Open connection flow <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </article>
        ) : data.stores.length ? (
          <div className="divide-y divide-border/60">
            {data.stores.map((store) => (
              <article
                key={store.id}
                className="grid gap-3 py-4 sm:gap-4 sm:py-5 sm:grid-cols-[1.3fr_1fr_auto] sm:items-center"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-semibold tracking-tight sm:text-lg">{store.name}</h2>
                    <span className="rounded-md border border-border/70 px-2 py-0.5 text-[11px] uppercase text-muted-foreground">
                      {store.platform}
                    </span>
                    <span className={`text-xs ${store.statusTone}`}>{store.statusLabel}</span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {store.platform === "shopify"
                      ? `Shopify domain: ${store.displayDomain ?? "unknown"}`
                      : (store.domain ?? "Internal billing source")} | {store.activeIssueCount} active issues
                  </p>
                  {store.platform === "shopify" &&
                  store.canonicalShopifyDomain &&
                  store.canonicalShopifyDomain !== store.displayDomain ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Internal canonical domain: {store.canonicalShopifyDomain}
                    </p>
                  ) : null}
                  <p className="mt-1 text-xs text-muted-foreground">
                    {store.topIssueTitle ? `Top issue: ${store.topIssueTitle}` : "No critical issue detected."}
                  </p>
                  {store.setupAttentionMessage ? (
                    <p className="mt-1 text-xs text-amber-300">{store.setupAttentionMessage}</p>
                  ) : null}
                </div>

                <div className="grid gap-1 text-sm">
                  <p className="text-muted-foreground">
                    Latest scan: {store.latestScanAt ? formatRelativeTimestamp(store.latestScanAt) : "No scans yet"}
                  </p>
                  <p className="font-semibold text-primary">
                    {formatCompactCurrency(store.estimatedLeakage)} / month
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                  <Link
                    href={store.href}
                    className="inline-flex items-center gap-1 text-sm text-primary transition-opacity hover:opacity-80"
                  >
                    Open store <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                  {store.platform === "shopify" ? (
                    <form method="POST" action="/api/integrations/shopify/disconnect">
                      <input
                        type="hidden"
                        name="next"
                        value="/app/connect?provider=shopify&status=disconnected"
                      />
                      <button
                        type="submit"
                        className="rounded-lg border border-border/70 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
                      >
                        Disconnect
                      </button>
                    </form>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border/70 p-8 text-center text-sm text-muted-foreground">
            No stores connected yet. Connect your first Shopify or Stripe source to start monitoring.
          </div>
        )}
      </section>

      <section className="surface-card p-4 sm:p-5 lg:p-6">
        <p className="data-mono text-primary">Coverage Snapshot</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3 sm:gap-4">
          <div className="rounded-xl border border-border/70 bg-background/35 p-3.5 sm:p-4">
            <p className="text-sm text-muted-foreground">Connected stores</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight">{data.stores.length}</p>
          </div>
          <div className="rounded-xl border border-border/70 bg-background/35 p-3.5 sm:p-4">
            <p className="text-sm text-muted-foreground">Total active issues</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight">
              {data.stores.reduce((count, store) => count + store.activeIssueCount, 0)}
            </p>
          </div>
          <div className="rounded-xl border border-border/70 bg-background/35 p-3.5 sm:p-4">
            <p className="text-sm text-muted-foreground">Combined leakage estimate</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight text-primary">
              {formatCompactCurrency(
                data.stores.reduce((total, store) => total + store.estimatedLeakage, 0)
              )}
            </p>
          </div>
        </div>
        <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
          <CircleDot className="h-3.5 w-3.5 text-primary" />
          Store health updates as scans complete and issue status changes.
        </p>
      </section>
    </div>
  )
}
