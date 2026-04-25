@AGENTS.md

# SilentLeak — Operational Continuity File

Product: operator-grade revenue intelligence SaaS. Detects leakage across website surfaces, checkout paths, payment flows, and billing recovery.
Stack: Next.js App Router, TypeScript, Tailwind CSS, Supabase, Shopify OAuth, Stripe, Dodo Payments, Trigger.dev, Resend.
Domain: https://www.silentleak.com
Support email: hello@silentleak.com

Legacy name: CheckoutLeak. Internal DB tables, provider IDs, route paths, and integration identifiers still use "checkoutleak" naming. Do not rename them unless explicitly instructed.

---

## 1. CURRENT PRODUCT TRUTH

**Core flow (working and verified):**
- URL-first primary source flow: save URL, upsert website store + checkoutleak_connector integration, queue scan
- Surface analysis: HTML runner (business type, SEO, GEO, copy quality) + Playwright browser inspector (mobile/desktop, Core Web Vitals, H1 size, screenshots)
- Trigger.dev async scan pipeline: url-source-scan and shopify-activation-scan tasks
- Scheduled weekly monitoring via Trigger.dev cron
- Issue pipeline: findings emitted into issues table, fix plans generated
- Source detail pages: issues vs opportunities split, recommended move, linked opportunities
- Ownership gating: unverified sources see limited preview; verified sources see full evidence
- Plan/paywall logic: plan entitlement enforced, source slot limits respected
- Multi-source support: multiple website sources allowed per plan
- Resend email: transactional emails on scan completion, issue detection, access approvals
- Shopify OAuth: install/callback/disconnect flow works
- Stripe billing signals: connected but less battle-tested than website lane
- Demo workspace: dev-only, gated behind NODE_ENV check in app-shell.tsx

**URL source detection covers:**
- Business type: agency, saas, ecommerce, service_business, mixed, unknown
- Revenue model: lead_generation, self_serve_signup, checkout, hybrid
- 4-path evaluation: activation, pricing, checkout, billing recovery
- SEO: meta title, meta description, H1 count, canonical tag, Open Graph
- GEO: JSON-LD structured data, FAQ schema, Organization schema, geo readiness score
- Core Web Vitals: LCP, CLS from real Chromium via Playwright
- Mobile quality: viewport, ATF CTA, H1 font size, layout overflow
- Copy quality: AI/generic copy token detection

**Scan states:**
- queued: scan row inserted, Trigger.dev task being dispatched
- running: task picked up by worker
- completed: results written to integration metadata + issues table
- failed: Trigger.dev could not start OR processing failed
- queued_stale: queued > 2 minutes (shown as warning, retry encouraged)
- running_stale: running > 10 minutes (shown as warning)

**Demo workspace:**
- Available in development only (NODE_ENV !== "production")
- Hidden in production: isDemoMode is forced false in app-shell.tsx
- No demo CTA visible to real beta users

---

## 2. KEY FILE PATHS

| Purpose | Path |
|---|---|
| Marketing homepage | `src/components/marketing/home-page.tsx` |
| App dashboard (main) | `src/app/(app)/app/page.tsx` |
| Sources page | `src/app/(app)/app/stores/page.tsx` |
| Source detail page | `src/app/(app)/app/stores/[id]/page.tsx` |
| Connect/sources redirect | `src/app/(app)/app/connect/page.tsx` |
| Source actions (save URL, trigger scan) | `src/app/(app)/app/connect/actions.ts` |
| Store detail actions | `src/app/(app)/app/stores/[id]/actions.ts` |
| App service (journey data) | `src/server/services/app-service.ts` |
| Scan processing service | `src/server/services/scan-processing-service.ts` |
| URL source analysis runner | `src/server/services/url-source-analysis-runner.ts` |
| Browser inspector | `src/server/services/url-source-browser-inspector.ts` |
| Scan task service (Trigger.dev dispatch) | `src/server/services/scan-task-service.ts` |
| Browser launch utility | `src/server/services/browser-launch.ts` |
| Opportunity estimate | `src/lib/opportunity-estimate.ts` |
| Scan state helpers | `src/lib/scan-state.ts` |
| Trigger.dev tasks | `src/trigger/url-source-scan.ts`, `src/trigger/shopify-activation-scan.ts` |
| Trigger.dev config | `trigger.config.ts` |
| App shell | `src/components/layout/app-shell.tsx` |
| App shell client | `src/components/layout/app-shell-client.tsx` |
| Fix plan service | `src/server/services/fix-plan-service.ts` |

---

## 3. SCAN PIPELINE ARCHITECTURE

1. User saves primary source URL
2. `setLiveSourceContext` in connect/actions.ts upserts website store + checkoutleak_connector integration
3. `triggerPrimaryUrlSourceAnalysis` creates a scan row (status: queued) and calls `triggerQueuedScanTask`
4. `triggerQueuedScanTask` in scan-task-service.ts dispatches to Trigger.dev
5. If dispatch fails: scan marked failed immediately (do not leave as queued)
6. Trigger.dev worker runs `processQueuedScanV1` which: fetches URL, runs browser inspector, emits findings, writes to integration metadata, inserts issues
7. On completion: `sendScanCompletionNotification` fires via Resend
8. Source detail page shows results; stale detection warns if scan is stuck

**Trigger.dev task IDs:**
- `url-source-scan` for website/checkoutleak_connector sources
- `shopify-activation-scan` for Shopify sources
- `stripe-billing-scan` for Stripe sources

---

## 4. OWNERSHIP GATING

Sources can be verified or unverified:
- Verified: email domain matches source domain, or connected system domain matches
- Unverified: manual context, ownership not confirmed

Unverified sources:
- Show scan state and basic classification
- Do not show full screenshot evidence or detailed findings
- Fix plans link to limited preview

This is enforced in `getStoreDetailData` and the detail page. Do not remove it.

---

## 5. DEMO WORKSPACE — DEV ONLY

Demo mode is gated: `DEMO_ENABLED = process.env.NODE_ENV !== "production"` in app-shell.tsx.

In production: `isDemoMode` is always false. Demo CTA in billing page was removed. No fake monitors visible.

In development: demo can be activated via `/api/mock/onboarding?state=demo&next=/app`. Useful for testing scan states and UI flows without real data.

---

## 6. CORE PRINCIPLES

- Trust over hype: no fake revenue numbers; "Impact pending" > $0
- Deterministic findings: scan results must be evidence-backed, not fabricated
- Semantic state clarity: queued, running, completed, failed, stale states are distinct and truthful
- No internal tool names in UI: "checkoutleak_connector" never shown to operators
- Operator-grade tone: direct, commercial, signal-first; no generic SaaS copy
- No em dashes in UI copy or code comments
- Minimal blast radius: changes should be surgical and scoped

---

## 7. KNOWN OPEN ITEMS

- Stripe scan lane: less tested than website lane; needs validation
- Before/after recovery tracking: not yet implemented
- Change detection between scans: not yet implemented
- Competitive benchmarking: not yet implemented
- scans.error_message column: migration 202604251000_scans_error_message.sql must be run in production
- Multi-page funnel analysis: implemented but needs accuracy validation against diverse sites

---

## 8. WHAT NOT TO DO

- Do not rename DB tables, provider IDs (checkoutleak_connector), or route paths
- Do not remove ownership gating
- Do not expose demo workspace in production
- Do not use em dashes in any output
- Do not broad-rewrite architecture without explicit instruction
- Do not use fake or AI-fabricated evidence in findings
