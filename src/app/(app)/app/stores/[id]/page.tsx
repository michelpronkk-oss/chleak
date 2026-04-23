import type { Metadata } from "next"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { ArrowLeft, ArrowRight } from "lucide-react"

export const metadata: Metadata = {
  title: "Store Detail",
}

import { MetaPill, RankedQueueRow, SeverityPill, VaultPanel } from "@/components/dashboard/vault-primitives"
import { formatCompactCurrency, formatRelativeTimestamp } from "@/lib/format"
import { SubmitButton } from "@/components/ui/submit-button"
import { getStoreDetailData, getStoresIndexData } from "@/server/services/app-service"
import { saveActivationFlowHints, triggerActivationTestRun } from "./actions"

const hintStatusMessage: Record<string, string> = {
  saved: "Activation flow hints saved.",
  invalid: "Hints were not saved. Check URL or selector formatting.",
  no_integration: "No active integration found for this source.",
  save_failed: "Hint save failed. Retry in a moment.",
  unauthorized: "You are not authorized to edit this store.",
  not_found: "Store context was not found for this workspace.",
}

const scanStatusMessage: Record<string, string> = {
  completed: "Test scan completed and evidence is now available in source findings.",
  queue_failed: "Could not queue a test scan. Retry in a moment.",
  unauthorized: "You are not authorized to trigger scans for this store.",
  not_found: "Store context was not found for this workspace.",
  scan_not_queued_or_missing: "Queued test scan could not be processed.",
  scan_not_queued_anymore: "Queued test scan was already picked by another runner.",
  lookup_failed: "Scan processor lookup failed.",
  store_missing: "Scan failed because store record was missing.",
  integration_missing: "Scan failed because integration was missing.",
  running_update_failed: "Scan failed before entering running state.",
  completion_failed: "Scan failed during completion update.",
}

export default async function StoreDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { id } = await params
  const query = await searchParams
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

  const hintStatusRaw = query.hint_status
  const hintStatus = Array.isArray(hintStatusRaw) ? hintStatusRaw[0] : hintStatusRaw
  const scanStatusRaw = query.scan_status
  const scanStatus = Array.isArray(scanStatusRaw) ? scanStatusRaw[0] : scanStatusRaw
  const activeHintStatus = hintStatus ? hintStatusMessage[hintStatus] ?? null : null
  const activeScanStatus = scanStatus ? scanStatusMessage[scanStatus] ?? null : null
  const saveHintsAction = saveActivationFlowHints.bind(null, data.store.id)
  const runTestScanAction = triggerActivationTestRun.bind(null, data.store.id)
  const hintDefaults = data.integration?.activationFlowHints ?? {
    preferredEntryUrl: null,
    onboardingPathUrl: null,
    preferredPrimaryCtaSelector: null,
    preferredNextActionSelector: null,
    firstValueAreaSelector: null,
    authExpected: null,
    pageIntentHint: null,
  }

  const rankedIssues = [...data.issues].sort(
    (a, b) => b.estimatedMonthlyRevenueImpact - a.estimatedMonthlyRevenueImpact
  )

  return (
    <div className="space-y-5 pb-24 lg:pb-4">
      <section className="vault-page-intro space-y-3">
        <Link
          href="/app/stores"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to stores
        </Link>
        <p className="data-mono text-muted-foreground">Source Detail</p>
        <h1 className="vault-page-intro-title">{data.store.name}</h1>
        <p className="vault-page-intro-copy">
          {data.context?.operationalArea ?? "Revenue monitoring source"} | {data.status.label}
        </p>
        {data.onboardingState === "demo" ? (
          <p className="text-sm text-amber-300">
            Demo mode active. Source details and findings are simulated.
          </p>
        ) : null}
      </section>

      <section className="vault-metric-grid">
        <article className="vault-metric-cell vault-metric-cell-primary">
          <p className="vault-metric-key">Estimated leakage</p>
          <p className="vault-metric-value vault-metric-value-primary">
            {formatCompactCurrency(data.estimatedLeakage)}
          </p>
          <p className="vault-metric-delta">Per month from this source</p>
        </article>
        <article className="vault-metric-cell">
          <p className="vault-metric-key">Open issues</p>
          <p className="vault-metric-value">{data.issues.length}</p>
          <p className="vault-metric-delta">Ranked by exposure</p>
        </article>
        <article className="vault-metric-cell">
          <p className="vault-metric-key">Latest scan</p>
          <p className="vault-metric-value text-2xl sm:text-3xl">
            {data.latestScan ? formatRelativeTimestamp(data.latestScan.scannedAt) : "Pending"}
          </p>
          <p className="vault-metric-delta">
            {data.latestScan ? `${data.latestScan.detectedIssuesCount} findings` : "Awaiting initial pass"}
          </p>
        </article>
        <article className="vault-metric-cell">
          <p className="vault-metric-key">Status</p>
          <p className={`vault-metric-value text-2xl sm:text-3xl ${data.status.tone}`}>{data.status.label}</p>
          <p className="vault-metric-delta">{data.store.platform}</p>
        </article>
      </section>

      <section className="vault-dashboard-grid">
        <div className="space-y-5">
          <VaultPanel title={`Issue queue | ${rankedIssues.length} open`} meta="Sorted by exposure">
            {rankedIssues.length ? (
              rankedIssues.map((issue) => (
                <RankedQueueRow
                  key={issue.id}
                  severity={issue.severity}
                  title={issue.title}
                  meta={issue.summary}
                  amount={formatCompactCurrency(issue.estimatedMonthlyRevenueImpact)}
                  age={formatRelativeTimestamp(issue.detectedAt)}
                />
              ))
            ) : (
              <div className="px-5 py-8 text-sm text-muted-foreground">No open issues for this source.</div>
            )}
          </VaultPanel>

          <VaultPanel title="Source profile" meta="Configuration and ownership">
            <dl className="grid gap-4 px-4 py-4 text-sm sm:grid-cols-2 sm:px-5">
              <div>
                <dt className="data-mono text-muted-foreground">Platform</dt>
                <dd className="mt-1">{data.store.platform}</dd>
              </div>
              <div>
                <dt className="data-mono text-muted-foreground">
                  {data.store.platform === "shopify" ? "Shopify domain" : "Domain"}
                </dt>
                <dd className="mt-1">{data.storeDisplayDomain ?? "Unknown"}</dd>
              </div>
              {data.store.platform === "shopify" &&
              data.canonicalShopifyDomain &&
              data.canonicalShopifyDomain !== data.storeDisplayDomain ? (
                <div>
                  <dt className="data-mono text-muted-foreground">Canonical domain</dt>
                  <dd className="mt-1">{data.canonicalShopifyDomain}</dd>
                </div>
              ) : null}
              <div>
                <dt className="data-mono text-muted-foreground">Status</dt>
                <dd className={`mt-1 ${data.status.tone}`}>{data.status.label}</dd>
              </div>
            </dl>
            {data.context ? (
              <div className="border-t border-border/60 px-4 py-3 text-sm text-muted-foreground sm:px-5">
                <p>Owner team: {data.context.ownerTeam}</p>
                <p className="mt-1">Primary objective: {data.context.primaryObjective}</p>
              </div>
            ) : null}
          </VaultPanel>

          <VaultPanel title="Activation flow hints" meta="Runner targeting controls">
            {data.store.platform === "shopify" ? (
              <form action={saveHintsAction}>
                <div className="vault-settings-table">
                <div className="vault-settings-row">
                  <div>
                    <label htmlFor="preferred_entry_url" className="vault-settings-key">Preferred entry URL</label>
                    <p className="vault-settings-desc">Absolute URL for activation entry. Leave blank for default integration domain.</p>
                  </div>
                  <input
                    id="preferred_entry_url"
                    name="preferred_entry_url"
                    defaultValue={hintDefaults.preferredEntryUrl ?? ""}
                    placeholder="https://your-store.myshopify.com"
                    className="vault-input rounded-md px-3 py-2 text-sm outline-none w-full max-w-xs"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                  />
                </div>

                <div className="vault-settings-row">
                  <div>
                    <label htmlFor="onboarding_path_url" className="vault-settings-key">Onboarding path URL</label>
                    <p className="vault-settings-desc">Optional path or URL to start the first activation surface.</p>
                  </div>
                  <input
                    id="onboarding_path_url"
                    name="onboarding_path_url"
                    defaultValue={hintDefaults.onboardingPathUrl ?? ""}
                    placeholder="/onboarding"
                    className="vault-input rounded-md px-3 py-2 text-sm outline-none w-full max-w-xs"
                  />
                </div>

                <div className="vault-settings-row">
                  <div>
                    <label htmlFor="preferred_primary_cta_selector" className="vault-settings-key">Primary CTA selector</label>
                    <p className="vault-settings-desc">CSS selector for the expected primary forward action.</p>
                  </div>
                  <input
                    id="preferred_primary_cta_selector"
                    name="preferred_primary_cta_selector"
                    defaultValue={hintDefaults.preferredPrimaryCtaSelector ?? ""}
                    placeholder='button[data-test="start"]'
                    className="vault-input rounded-md px-3 py-2 text-sm outline-none w-full max-w-xs"
                  />
                </div>

                <div className="vault-settings-row">
                  <div>
                    <label htmlFor="preferred_next_action_selector" className="vault-settings-key">Next action selector</label>
                    <p className="vault-settings-desc">CSS selector for the first visible progression after entry.</p>
                  </div>
                  <input
                    id="preferred_next_action_selector"
                    name="preferred_next_action_selector"
                    defaultValue={hintDefaults.preferredNextActionSelector ?? ""}
                    placeholder='a[href*="next-step"]'
                    className="vault-input rounded-md px-3 py-2 text-sm outline-none w-full max-w-xs"
                  />
                </div>

                <div className="vault-settings-row">
                  <div>
                    <label htmlFor="first_value_area_selector" className="vault-settings-key">First value area selector</label>
                    <p className="vault-settings-desc">CSS selector marking first-value content presence.</p>
                  </div>
                  <input
                    id="first_value_area_selector"
                    name="first_value_area_selector"
                    defaultValue={hintDefaults.firstValueAreaSelector ?? ""}
                    placeholder='section[data-test="dashboard-main"]'
                    className="vault-input rounded-md px-3 py-2 text-sm outline-none w-full max-w-xs"
                  />
                </div>

                <div className="vault-settings-row">
                  <div>
                    <label htmlFor="auth_expected" className="vault-settings-key">Auth expected</label>
                    <p className="vault-settings-desc">Set when this surface is expected to show an auth gate before progression.</p>
                  </div>
                  <select
                    id="auth_expected"
                    name="auth_expected"
                    defaultValue={
                      hintDefaults.authExpected === true
                        ? "true"
                        : hintDefaults.authExpected === false
                          ? "false"
                          : ""
                    }
                    className="vault-input rounded-md px-3 py-2 text-sm outline-none w-full max-w-xs"
                  >
                    <option value="">Auto</option>
                    <option value="true">Expected</option>
                    <option value="false">Not expected</option>
                  </select>
                </div>

                <div className="vault-settings-row">
                  <div>
                    <label htmlFor="page_intent_hint" className="vault-settings-key">Page intent hint</label>
                    <p className="vault-settings-desc">Optional intent guidance for deterministic page classification.</p>
                  </div>
                  <select
                    id="page_intent_hint"
                    name="page_intent_hint"
                    defaultValue={hintDefaults.pageIntentHint ?? ""}
                    className="vault-input rounded-md px-3 py-2 text-sm outline-none w-full max-w-xs"
                  >
                    <option value="">Auto</option>
                    <option value="onboarding">Onboarding</option>
                    <option value="activation">Activation</option>
                    <option value="first_value">First value</option>
                    <option value="checkout_handoff">Checkout handoff</option>
                  </select>
                </div>
              </div>

                <div className="border-t border-border/60 px-4 py-3 sm:px-5">
                  <SubmitButton label="Save activation hints" />
                  {activeHintStatus ? (
                    <p className="mt-2 text-xs text-muted-foreground">{activeHintStatus}</p>
                  ) : null}
                </div>
              </form>
            ) : (
              <p className="px-5 py-6 text-sm text-muted-foreground">
                Activation flow hints are currently used for Shopify activation scans.
              </p>
            )}
          </VaultPanel>
        </div>

        <div className="space-y-5">
          <section className="vault-panel-shell border-[color:var(--signal-line)] bg-[linear-gradient(180deg,var(--signal-dim),var(--ink-100)_60%)] p-5 sm:p-6">
            <p className="vault-metric-key text-[color:var(--signal)]">Recommended move</p>
            <h2 className="mt-2 text-lg font-semibold tracking-tight text-foreground">
              {rankedIssues[0]?.title ?? "No active intervention required"}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {rankedIssues[0]?.summary ?? "Source is stable. Continue monitoring."}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {rankedIssues[0] ? <SeverityPill severity={rankedIssues[0].severity} /> : null}
              <MetaPill>{formatCompactCurrency(rankedIssues[0]?.estimatedMonthlyRevenueImpact ?? 0)}</MetaPill>
            </div>
            <Link
              href={data.fixPlanLinks[0]?.href ?? "/app"}
              className="marketing-primary-cta mt-5 inline-flex w-full items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold transition-transform hover:-translate-y-px"
            >
              Open fix plan
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            {data.setupAttentionMessage ? (
              <p className="mt-3 text-xs text-amber-300">{data.setupAttentionMessage}</p>
            ) : null}
          </section>

          <VaultPanel title="Recent activity" meta="Latest scans">
            {data.scans.length ? (
              <ul className="space-y-2.5 px-4 py-3 text-sm text-muted-foreground sm:px-5">
                {data.scans.slice(0, 4).map((scan) => (
                  <li key={scan.id} className="rounded-md border border-border/60 bg-background/30 px-3 py-2.5">
                    <p>
                      Scan {scan.id.slice(-4)} | {scan.status}
                    </p>
                    <p className="mt-1 text-xs">
                      {formatRelativeTimestamp(scan.scannedAt)} | {scan.detectedIssuesCount} issues
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-5 py-6 text-sm text-muted-foreground">
                Scan history will appear after initial pass completes.
              </p>
            )}
          </VaultPanel>

          <VaultPanel title="Linked opportunities" meta={`${data.fixPlanLinks.length} fix plans`}>
            <ul className="space-y-2.5 px-4 py-3 sm:px-5">
              {data.fixPlanLinks.length ? (
                data.fixPlanLinks.map((plan) => (
                  <li key={plan.issueId} className="rounded-md border border-border/60 bg-background/30 px-3 py-2.5">
                    <p className="text-sm font-medium">{plan.title}</p>
                    <p className="mt-1 text-xs text-primary">
                      {formatCompactCurrency(plan.estimatedMonthlyRevenueImpact)} / month
                    </p>
                    <Link
                      href={plan.href}
                      className="vault-link mt-2 inline-flex items-center gap-1 text-xs"
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
          </VaultPanel>

          <VaultPanel
            title="Activation test-run"
            meta={data.store.platform === "shopify" ? "Queue and process a store activation scan" : "Queue and process a source scan"}
          >
            <div className="px-4 py-4 sm:px-5">
              <p className="text-sm text-muted-foreground">
                Runs through the native queued scan path and refreshes issue evidence for this source.
              </p>
              <form action={runTestScanAction} className="mt-4">
                <SubmitButton
                  label={
                    data.store.platform === "shopify"
                      ? "Run activation test scan"
                      : "Run test scan"
                  }
                  pendingLabel="Running scan..."
                />
              </form>
              {activeScanStatus ? (
                <p className="mt-2 text-xs text-muted-foreground">{activeScanStatus}</p>
              ) : null}
            </div>
          </VaultPanel>
        </div>
      </section>

      {data.store.platform === "shopify" ? (
        <form method="POST" action="/api/integrations/shopify/disconnect">
          <input type="hidden" name="next" value="/app/connect?provider=shopify&status=disconnected" />
          <button
            type="submit"
            className="inline-flex items-center rounded-md border border-border/70 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            Disconnect Shopify
          </button>
        </form>
      ) : null}
    </div>
  )
}
