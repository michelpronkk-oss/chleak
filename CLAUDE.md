@AGENTS.md

# CheckoutLeak — Operational Continuity File

Product: operator-grade SaaS for detecting revenue leakage across checkout, payments, and billing.
Stack: Next.js App Router, TypeScript, Tailwind CSS, Supabase, Shopify OAuth, Stripe, Dodo Payments.
Domain: checkoutleak.com

---

## 1. CURRENT PRODUCT TRUTH

**Working and verified:**
- Shopify OAuth install/callback flow works end to end
- Store persistence to `stores` table works
- `store_integrations` row persisted correctly on Shopify connect
- Disconnect/reconnect flow works (`/api/integrations/shopify/disconnect`)
- Automatic scan creation fires after Shopify connect completes
- Automatic scan processing runs after creation
- All three scan result state families render correctly:
  - `no_signal` — not enough activity; monitoring active; no issues shown
  - `clean` — enough signal; no material leakage found
  - `findings_present` — real issues; action-needed UX; issue feed + suggested actions visible
- `findings_present` flow verified via internal simulation
- Impact treatment fixed: `$0` replaced with `"Impact pending"` when `estimatedMonthlyRevenueImpact` is 0
- Simulation prefix (`simulation:`) stripped from displayed copy via `cleanPrimaryCopy()`
- Shopify store detail page distinguishes user-facing domain vs internal canonical Shopify domain

**Mobile homepage:**
- Mobile homepage has been audited and partially upgraded
- Current session completed a full mobile refactor of `src/components/marketing/home-page.tsx` and `src/components/layout/marketing-footer.tsx`
- Changes: tighter hero, proof strip always 3-col, console signals compressed to single-row mobile layout, "How it works" + "Issue intelligence" merged into one section, Growth first on mobile in pricing, closing CTA escalated, footer tagline and authority bar improved
- Desktop layout preserved

---

## 2. KEY FILE PATHS

| Purpose | Path |
|---|---|
| Marketing homepage | `src/components/marketing/home-page.tsx` |
| Marketing header | `src/components/layout/marketing-header.tsx` |
| Marketing footer | `src/components/layout/marketing-footer.tsx` |
| App dashboard (main) | `src/app/(app)/app/page.tsx` |
| Store detail page | `src/app/(app)/app/stores/[id]/page.tsx` |
| Connect flow | `src/app/(app)/app/connect/page.tsx` |
| Simulation route | `src/app/api/internal/scans/simulate/route.ts` |
| Manual processor route | `src/app/api/internal/scans/process-next/route.ts` |
| Shopify install | `src/app/api/integrations/shopify/install/route.ts` |
| Shopify callback | `src/app/api/integrations/shopify/callback/route.ts` |
| Shopify disconnect | `src/app/api/integrations/shopify/disconnect/route.ts` |
| App service (journey data) | `src/server/services/app-service.ts` |
| Scan processing service | `src/server/services/scan-processing-service.ts` |
| Pricing data | `src/data/mock/pricing.ts` |

---

## 3. SIMULATION SYSTEM

**Route:** `POST /api/internal/scans/simulate`

**Authorization:**
- In non-production: no key required
- In production: requires header `x-checkoutleak-sim-key` or `x-checkoutleak-manual-key` or `?key=` query param matching env var `INTERNAL_SCAN_SIM_KEY` (falls back to `INTERNAL_SCAN_PROCESS_KEY`)

**Request body:**
```json
{
  "outcome": "findings_present",   // required: no_signal | clean | findings_present
  "organizationId": "org_xxx",     // required if storeId not provided
  "storeId": "store_xxx"           // optional; resolved from org if omitted
}
```

**What each outcome produces:**
- `no_signal` — scan completed, zero issues, no leakage; dashboard shows no-signal UX
- `clean` — scan completed, no material issues found; dashboard shows clean/baseline UX
- `findings_present` — scan completed with seeded issues; dashboard shows action-needed UX with issue feed, suggested actions, decision banner, revenue opportunity panel

**Simulation is the fastest path to validate all state families without real Shopify activity.**
Issues created by simulation use `"Simulation"` as source value — stripped from display copy by `cleanPrimaryCopy()`.

---

## 4. DASHBOARD JOURNEY MODES

The dashboard at `/app` resolves via `getDashboardJourneyData()` into one of these modes:

| Mode | Trigger | UX |
|---|---|---|
| `plan_required` | No active plan | Redirect to `/app/billing?intent=plan_required` |
| `empty` | No connected source | Redirect to `/app/connect` |
| `connecting` | Integration row exists but not confirmed | Prompt to complete setup |
| `integration_error` | Integration in error state | Show error + reconnect CTA |
| `pending_scan` | Scan queued/running, no result yet | Animated scan-in-progress screen |
| `first_results` | First scan with findings complete | First-time findings handoff screen |
| `no_signal` | Latest scan returned no signal | No-signal monitoring-active screen |
| `ready` (clean) | Latest scan is clean | Clean baseline screen |
| `ready` (findings_present) | Issues exist | Full action-needed dashboard |

---

## 5. STATE FAMILY SEMANTICS — DO NOT BLUR THESE

- `no_signal`: Not enough commercial activity or data depth for meaningful analysis. Monitoring is active. Nothing wrong with the setup.
- `clean`: Enough signal, baseline analysis complete, no material leakage issues found at this time. Not the same as no_signal.
- `findings_present`: Real issues exist, ranked by revenue impact, action-needed UX must appear.

These three states are semantically distinct and must remain that way. Do not collapse them.

---

## 6. UX BASELINES (DO NOT REGRESS)

- Impact label: `> 0` → formatted currency; `= 0` → `"Impact pending"` (not `$0`)
- Action CTA language: `"Review action brief"` (not "fix plan" or fake execution language)
- Simulation prefix stripped from all user-facing copy
- Store detail: user-facing domain shown as primary; internal Shopify canonical domain shown only when different
- Marketing header CTA adapts dynamically: unauthenticated → "Start monitoring", has plan but no source → "Connect source", fully active → "Open app"
- Pricing plan order on marketing page: Growth first on mobile (JSX order), Starter | Growth | Pro on desktop via `lg:order-*`

---

## 7. KNOWN OPEN PROBLEMS

- **Auth/session persistence across `/app` route switching** — may still be unreliable depending on Supabase session hydration on server components. If `/app` redirects to `/auth` unexpectedly after navigating between app routes, this is the culprit. Not confirmed fully resolved.
- **Real-store baseline metrics** — `estimatedMonthlyRevenueImpact` values for simulation-seeded issues are hardcoded; real impact logic is not yet implemented
- **Webhook registration** — Shopify webhook setup on install has not been deeply verified for all event types in production
- **Stripe integration** — connect flow exists but less battle-tested than Shopify; Stripe-side scans not yet verified end to end

---

## 8. PRIORITY ORDER (from this point)

1. Stabilize auth/session across `/app` route switching if still unreliable
2. Continue mobile homepage quality — verify the recent refactor renders correctly, then assess if any remaining sections need tightening
3. Deepen findings-to-action product quality (real issue detail, fix plan richness)
4. Move from simulated findings toward trustworthy real-store baseline impact logic
5. Harden Stripe integration scan flow to match Shopify baseline
6. Only then: advanced recovery modeling, deeper webhook reliability, multi-store scenarios

---

## 9. CORE PRINCIPLES

- **Trust over hype** — no fake revenue numbers when not warranted; "Impact pending" > `$0`
- **Deterministic findings** — scan results must be defensible, not AI-fabricated summaries
- **Semantic state clarity** — no_signal, clean, and findings_present must remain distinct and truthful
- **Simulation is internal only** — never surface simulation language or artifacts to real users
- **Operator-grade tone** — direct, commercial, signal-first; no generic SaaS copy
- **Mobile-first homepage** — premium hierarchy, tight rhythm, proof before explanation, CTA progression not CTA repetition
