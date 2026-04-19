import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Vault — CheckoutLeak Design System",
  robots: { index: false, follow: false },
}

const navItems = [
  { label: "Overview", href: "/vault", active: true },
  { label: "Tokens", href: "/vault/tokens" },
  { label: "Typography", href: "/vault/typography" },
  { label: "Components", href: "/vault/components" },
  { label: "States", href: "/vault/states" },
  { label: "Pages", href: "/vault/pages" },
  { label: "Dashboard", href: "/vault/dashboard" },
  { label: "Mobile", href: "/vault/mobile" },
  { label: "Voice", href: "/vault/voice" },
]

const directoryCards = [
  { n: "01 · Foundation", t: "Tokens", d: "Color, neutrals, severity, spacing, radius, border, shadow, motion, focus, layering.", href: "/vault/tokens" },
  { n: "02 · Foundation", t: "Typography", d: "Display, titles, body, support, metadata, and the mono voice for money and logs.", href: "/vault/typography" },
  { n: "03 · Primitives", t: "Components", d: "Buttons, inputs, tabs, pills, panels, tables, banners, nav, status indicators.", href: "/vault/components" },
  { n: "04 · Patterns", t: "States", d: "Ten product states from unauthenticated through mature workspace and degraded billing.", href: "/vault/states" },
  { n: "05 · Patterns", t: "Page Patterns", d: "Marketing, pricing, auth, onboarding, findings, settings, notifications.", href: "/vault/pages" },
  { n: "06 · Patterns", t: "Dashboard Grammar", d: "Impact-first language: revenue at risk, leak queue, source health, next move.", href: "/vault/dashboard" },
  { n: "07 · Surface", t: "Mobile", d: "Not a collapsed desktop. Compression, persistent CTA, density, touch targets.", href: "/vault/mobile" },
  { n: "08 · Voice", t: "Content & UI Language", d: "Precise, premium, commercially grounded. The phrases we say and the ones we never say.", href: "/vault/voice" },
  { n: "09 · Handoff", t: "Implementation", d: "Tokens, CSS variables, naming, theming rules, and review checklist.", href: "#implementation" },
]

const principles = [
  {
    n: "P1",
    t: "Money is the loudest thing on screen.",
    d: "The revenue-at-risk number is always the largest, cleanest type on any view it appears in. Charts, decoration, and chrome bend around it. If another element competes for the eye, it is wrong.",
    do: "set currency in mono, 44\u201372px, tabular.",
    dont: 'dress it with gradients, sparkles, or \u201cdelight.\u201d',
  },
  {
    n: "P2",
    t: "Calm is the default. Urgency is earned.",
    d: "Color and motion are reserved. A screen with no problems is nearly monochrome. When severity rises, the system brightens \u2014 never the reverse. A critical issue is allowed to interrupt; a medium one is not.",
    do: "reserve crimson for critical only.",
    dont: "color-code everything.",
  },
  {
    n: "P3",
    t: "One signal color. One job.",
    d: "Amber signals revenue at risk. Nothing else uses it \u2014 not CTAs, not links, not tooltips, not marketing. A user learns this in the first ten seconds and trusts it for the next three years.",
    do: 'amber = \u201cmoney lives here.\u201d',
    dont: 'amber a \u201csubscribe\u201d button.',
  },
  {
    n: "P4",
    t: "Hairlines over cards.",
    d: "Panels are separated by a 1px hairline or a quiet surface shift \u2014 not elevation, not shadow, not rounded boxes floating on a tinted background. Card-chaos is the visual tell of a dashboard that doesn\u2019t know what matters.",
    do: "separate with line-default.",
    dont: "nest cards inside cards inside cards.",
    doMono: true,
  },
  {
    n: "P5",
    t: "Numbers live in mono.",
    d: "Currency, counts, percentages, timestamps, store IDs, transaction references, webhook payloads \u2014 all tabular monospace. Prose lives in sans. This creates an instant visual taxonomy: the user\u2019s eye finds data without reading.",
    do: "$14,382.40 in mono, tabular.",
    dont: "prose with a number dropped in.",
  },
  {
    n: "P6",
    t: "Every screen answers four questions.",
    d: "Where am I? What has happened? What is the next move? What happens after I take it? If a screen cannot answer one of these in under two seconds of eye-tracking, it is incomplete. This rule governs every state pattern in the system.",
    do: "put the next move within arm\u2019s reach.",
    dont: "end a screen without a verb.",
  },
  {
    n: "P7",
    t: "The product looks the same when it\u2019s working.",
    d: "A healthy workspace is quiet, almost empty. Resist the urge to fill it with charts, streaks, or celebration. An operator tool that congratulates itself is a tool that has lost the plot. The reward for a clean store is silence.",
    do: '\u201cNo issues detected. Last scan 00:14 ago.\u201d',
    dont: 'confetti, trophies, \u201cgreat job!\u201d',
  },
]

const issueRows = [
  {
    sev: "var(--sev-critical)",
    title: "Stripe webhook signature failing \u00b7 invoice.payment_failed",
    sub: "north-goods.myshopify.com \u00b7 38 events dropped \u00b7 00:02:14 ago",
    amt: "$14,382.40",
    amtColor: "var(--signal)",
  },
  {
    sev: "var(--sev-high)",
    title: "Decline retry disabled on 3DS step-up",
    sub: "EU card cohort \u00b7 412 transactions affected \u00b7 18h",
    amt: "$6,940.00",
    amtColor: "var(--signal)",
  },
  {
    sev: "var(--sev-medium)",
    title: "Abandoned setup intents over 72h",
    sub: "Checkout \u2192 Billing \u00b7 cohort not notified",
    amt: "$2,210.00",
    amtColor: "var(--text-secondary)",
  },
]

const pageStyles = `
  .vault-chrome {
    position: sticky;
    top: 0;
    z-index: var(--z-nav);
    background: color-mix(in oklch, var(--ink-000) 85%, transparent);
    backdrop-filter: blur(16px);
    border-bottom: 1px solid var(--line-default);
  }
  .vault-chrome-inner {
    max-width: 1200px;
    margin: 0 auto;
    padding: 14px 48px;
    display: flex;
    align-items: center;
    gap: 32px;
  }
  .vault-brand {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 14px;
    font-weight: 500;
    letter-spacing: -0.01em;
    white-space: nowrap;
  }
  .vault-brand-mark {
    width: 18px;
    height: 18px;
    position: relative;
    flex-shrink: 0;
  }
  .vault-brand-mark::before,
  .vault-brand-mark::after {
    content: '';
    position: absolute;
    inset: 0;
    border: 1px solid var(--text-primary);
  }
  .vault-brand-mark::before { border-radius: 1px; }
  .vault-brand-mark::after {
    inset: 4px 4px auto auto;
    width: 6px;
    height: 6px;
    background: var(--signal);
    border-color: var(--signal);
    border-radius: 50%;
  }
  .vault-nav {
    display: flex;
    gap: 4px;
    margin-left: auto;
  }
  .vault-nav a {
    font-size: 13px;
    padding: 6px 10px;
    border-radius: var(--r-3);
    color: var(--text-secondary);
    transition: color var(--dur-fast) var(--ease), background var(--dur-fast) var(--ease);
    text-decoration: none;
  }
  .vault-nav a:hover {
    color: var(--text-primary);
    background: var(--ink-200);
  }
  .vault-nav a.active {
    color: var(--text-primary);
    background: var(--ink-200);
  }
  .vault-meta {
    font-family: var(--font-data, var(--font-mono));
    font-size: 11px;
    color: var(--text-tertiary);
    letter-spacing: 0.04em;
    display: flex;
    align-items: center;
    gap: 8px;
    padding-left: 16px;
    border-left: 1px solid var(--line-default);
    white-space: nowrap;
  }
  .vault-meta .live {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--ok);
    box-shadow: 0 0 0 3px var(--ok-bg);
  }
  .vault-doc {
    max-width: 1200px;
    margin: 0 auto;
    padding: 80px 48px 160px;
  }
  .vault-hero {
    padding: 120px 0 80px;
    display: grid;
    grid-template-columns: 1fr 360px;
    gap: 64px;
    align-items: end;
    border-bottom: 1px solid var(--line-default);
  }
  .vault-hero-title {
    font-family: var(--font-display, serif);
    font-style: italic;
    font-weight: 400;
    font-size: 92px;
    line-height: 0.95;
    letter-spacing: -0.035em;
    color: var(--text-primary);
  }
  .vault-hero-title .sans {
    font-family: var(--font-ui, var(--font-sans));
    font-style: normal;
    letter-spacing: -0.02em;
  }
  .vault-hero-title .sig { color: var(--signal); }
  .vault-section {
    padding-top: 56px;
    padding-bottom: 56px;
    border-top: 1px solid var(--line-subtle);
  }
  .vault-section-head {
    display: grid;
    grid-template-columns: 160px 1fr;
    gap: 32px;
    margin-bottom: 32px;
  }
  .vault-directory {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1px;
    background: var(--line-subtle);
    border: 1px solid var(--line-default);
    border-radius: var(--r-4);
    overflow: hidden;
  }
  .vault-dir-card {
    background: var(--ink-100);
    padding: 28px 24px;
    display: grid;
    gap: 12px;
    text-decoration: none;
    transition: background var(--dur-fast) var(--ease);
  }
  .vault-dir-card:hover { background: var(--ink-150); }
  .vault-dir-go {
    font-family: var(--font-data, var(--font-mono));
    font-size: 11px;
    color: var(--signal);
    letter-spacing: 0.04em;
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 12px;
  }
  .vault-dir-go::after {
    content: '\u2192';
    transition: transform var(--dur-fast) var(--ease);
  }
  .vault-dir-card:hover .vault-dir-go::after { transform: translateX(3px); }
  .vault-principle {
    display: grid;
    grid-template-columns: 40px 1fr;
    gap: 24px;
    padding: 24px 0;
    border-top: 1px solid var(--line-subtle);
  }
  .vault-principle:first-child { border-top: 0; padding-top: 0; }
  .vault-principle-c {
    margin-top: 16px;
    padding: 14px 16px;
    background: var(--ink-100);
    border: 1px solid var(--line-default);
    border-radius: var(--r-4);
    font-size: 13px;
    color: var(--text-secondary);
    font-family: var(--font-data, var(--font-mono));
    line-height: 1.6;
  }
  .vault-issue-row {
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap: 14px;
    align-items: center;
    padding: 14px 16px;
    border: 1px solid var(--line-default);
    border-radius: var(--r-3);
    background: var(--ink-050);
  }
  .vault-issue-row + .vault-issue-row { margin-top: 8px; }
  .vault-preview {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1px;
    background: var(--line-subtle);
    border: 1px solid var(--line-default);
    border-radius: var(--r-4);
    overflow: hidden;
  }
  .vault-preview-cell {
    background: var(--ink-100);
    padding: 32px;
  }
  .vault-preview-lbl {
    font-family: var(--font-data, var(--font-mono));
    font-size: 10px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--text-tertiary);
    margin-bottom: 16px;
  }
  .vault-doc-crumb {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 10px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--text-tertiary);
    margin-bottom: 16px;
    font-family: var(--font-data, var(--font-mono));
  }
  .vault-doc-crumb .dot {
    width: 4px;
    height: 4px;
    background: var(--signal);
    border-radius: 50%;
  }
`

export default function VaultOverviewPage() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--ink-050)", color: "var(--text-primary)", fontFamily: "var(--font-ui, var(--font-sans))" }}>
      <style dangerouslySetInnerHTML={{ __html: pageStyles }} />

      {/* Chrome */}
      <header className="vault-chrome">
        <div className="vault-chrome-inner">
          <div className="vault-brand">
            <div className="vault-brand-mark" />
            <span>CheckoutLeak</span>
            <span style={{ color: "var(--text-quaternary)", margin: "0 2px" }}>/</span>
            <span style={{ color: "var(--text-secondary)", fontSize: 13 }}>Vault \u2014 Design System</span>
          </div>
          <nav className="vault-nav">
            {navItems.map((item) => (
              <Link key={item.label} href={item.href} className={item.active ? "active" : ""}>
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="vault-meta">
            <span className="live" />
            <span>v0.1 \u00b7 draft</span>
          </div>
        </div>
      </header>

      {/* Doc */}
      <div className="vault-doc">

        {/* Hero */}
        <section className="vault-hero">
          <div>
            <div className="vault-doc-crumb">
              <span className="dot" />
              Direction \u00b7 Vault
            </div>
            <h1 className="vault-hero-title">
              <em>Quiet instruments</em>
              <br />
              <span className="sans">for loud <span className="sig">money.</span></span>
            </h1>
            <p style={{ marginTop: 24, fontSize: 18, lineHeight: 1.5, color: "var(--text-secondary)", maxWidth: "48ch" }}>
              Vault is the design direction for CheckoutLeak \u2014 a private, operator-grade
              revenue intelligence system. It is built around calm surfaces, tabular
              numbers, and a single signal color reserved for money at risk.
            </p>
          </div>
          <dl style={{ fontFamily: "var(--font-data, var(--font-mono))", fontSize: 11, color: "var(--text-tertiary)", lineHeight: 1.9, letterSpacing: "0.04em" }}>
            {[
              ["System", "Vault \u00b7 v0.1.0"],
              ["Owner", "Product Design"],
              ["Audience", "Operators, Finance, RevOps"],
              ["Surface", "Web \u00b7 iOS \u00b7 Android"],
              ["Updated", "2026 \u00b7 Q2"],
            ].map(([dt, dd]) => (
              <div key={dt}>
                <dt style={{ color: "var(--text-quaternary)", textTransform: "uppercase", fontSize: 10 }}>{dt}</dt>
                <dd style={{ color: "var(--text-secondary)", marginBottom: 10 }}>{dd}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Directory */}
        <section className="vault-section" style={{ paddingTop: 56 }}>
          <div className="vault-section-head">
            <div style={{ fontFamily: "var(--font-data, var(--font-mono))", fontSize: 11, color: "var(--text-tertiary)", letterSpacing: "0.05em" }}>
              00 \u00b7 Directory
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 500, letterSpacing: "-0.01em", color: "var(--text-primary)" }}>
                What\u2019s in the system
              </div>
              <div style={{ marginTop: 6, fontSize: 14, color: "var(--text-secondary)", maxWidth: "56ch" }}>
                Nine documents, read in order. Each one is implementable. No mood boards, no decoration.
              </div>
            </div>
          </div>
          <div className="vault-directory">
            {directoryCards.map((card) => (
              <Link key={card.t} href={card.href} className="vault-dir-card">
                <div style={{ fontFamily: "var(--font-data, var(--font-mono))", fontSize: 11, color: "var(--text-tertiary)", letterSpacing: "0.05em" }}>
                  {card.n}
                </div>
                <div style={{ fontSize: 17, fontWeight: 500, letterSpacing: "-0.01em", color: "var(--text-primary)" }}>
                  {card.t}
                </div>
                <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.55 }}>
                  {card.d}
                </div>
                <div className="vault-dir-go">Open</div>
              </Link>
            ))}
          </div>
        </section>

        {/* Principles */}
        <section className="vault-section">
          <div className="vault-section-head">
            <div style={{ fontFamily: "var(--font-data, var(--font-mono))", fontSize: 11, color: "var(--text-tertiary)", letterSpacing: "0.05em" }}>
              01 \u00b7 Foundation
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 500, letterSpacing: "-0.01em", color: "var(--text-primary)" }}>
                Design principles
              </div>
              <div style={{ marginTop: 6, fontSize: 14, color: "var(--text-secondary)", maxWidth: "56ch" }}>
                Seven rules. Every screen must pass every rule. If a screen breaks one, it ships broken.
              </div>
            </div>
          </div>
          <div>
            {principles.map((p) => (
              <div key={p.n} className="vault-principle">
                <div style={{ fontFamily: "var(--font-data, var(--font-mono))", fontSize: 11, color: "var(--text-tertiary)", paddingTop: 6 }}>
                  {p.n}
                </div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 500, letterSpacing: "-0.01em", color: "var(--text-primary)" }}>
                    {p.t}
                  </div>
                  <div style={{ fontSize: 14, color: "var(--text-secondary)", marginTop: 6, maxWidth: "60ch", lineHeight: 1.55 }}>
                    {p.d}
                  </div>
                  <div className="vault-principle-c">
                    <span style={{ color: "var(--ok)" }}>do</span>
                    {" \u2014 "}
                    {p.doMono ? <code style={{ fontFamily: "inherit" }}>{p.do}</code> : p.do}
                    {"   "}
                    <span style={{ color: "var(--err)" }}>don\u2019t</span>
                    {" \u2014 "}
                    {p.dont}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Visual Direction Preview */}
        <section className="vault-section">
          <div className="vault-section-head">
            <div style={{ fontFamily: "var(--font-data, var(--font-mono))", fontSize: 11, color: "var(--text-tertiary)", letterSpacing: "0.05em" }}>
              02 \u00b7 Direction
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 500, letterSpacing: "-0.01em", color: "var(--text-primary)" }}>
                Visual direction, at a glance
              </div>
              <div style={{ marginTop: 6, fontSize: 14, color: "var(--text-secondary)", maxWidth: "56ch" }}>
                Four specimens \u2014 palette, a metric, an issue row, and a line of voice. Everything else in the system compounds from these.
              </div>
            </div>
          </div>

          <div className="vault-preview">
            {/* Surface ladder */}
            <div className="vault-preview-cell">
              <div className="vault-preview-lbl">Surface ladder</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 1, background: "var(--line-default)", border: "1px solid var(--line-default)", borderRadius: "var(--r-3)", overflow: "hidden" }}>
                {(["var(--ink-050)", "var(--ink-100)", "var(--ink-150)", "var(--ink-200)"] as const).map((bg) => (
                  <div key={bg} style={{ background: bg, height: 80 }} />
                ))}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 1, marginTop: 8, fontFamily: "var(--font-data, var(--font-mono))", fontSize: 10, color: "var(--text-tertiary)", letterSpacing: "0.04em" }}>
                <div>050 \u00b7 canvas</div>
                <div>100 \u00b7 panel</div>
                <div>150 \u00b7 raised</div>
                <div>200 \u00b7 well</div>
              </div>
            </div>

            {/* Signal metric */}
            <div className="vault-preview-cell">
              <div className="vault-preview-lbl">Signal \u2014 Money at risk</div>
              <div style={{ display: "grid", gap: 6 }}>
                <div style={{ fontFamily: "var(--font-data, var(--font-mono))", fontSize: 11, color: "var(--text-tertiary)", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                  Revenue at risk \u00b7 30d
                </div>
                <div style={{ fontFamily: "var(--font-data, var(--font-mono))", fontSize: 44, fontWeight: 500, letterSpacing: "-0.02em", color: "var(--signal)", fontVariantNumeric: "tabular-nums" }}>
                  $84,120<span style={{ color: "var(--text-tertiary)", fontSize: 22, marginLeft: 4 }}>.40</span>
                </div>
                <div style={{ fontFamily: "var(--font-data, var(--font-mono))", fontSize: 12, color: "var(--sev-high)" }}>
                  \u25b2 $12,480 vs prior period \u00b7 14.8%
                </div>
              </div>
            </div>

            {/* Issue rows */}
            <div className="vault-preview-cell">
              <div className="vault-preview-lbl">Severity, in one row</div>
              {issueRows.map((row) => (
                <div key={row.title} className="vault-issue-row">
                  <div style={{ width: 6, height: 28, borderRadius: 2, background: row.sev, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 13, color: "var(--text-primary)" }}>{row.title}</div>
                    <div style={{ fontFamily: "var(--font-data, var(--font-mono))", fontSize: 11, color: "var(--text-tertiary)", marginTop: 2 }}>{row.sub}</div>
                  </div>
                  <div style={{ fontFamily: "var(--font-data, var(--font-mono))", fontSize: 13, color: row.amtColor, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
                    {row.amt}
                  </div>
                </div>
              ))}
            </div>

            {/* Voice */}
            <div className="vault-preview-cell">
              <div className="vault-preview-lbl">Voice</div>
              <div style={{ fontFamily: "var(--font-display, serif)", fontStyle: "italic", fontSize: 34, lineHeight: 1.1, letterSpacing: "-0.02em", color: "var(--text-primary)" }}>
                \u201cCoverage incomplete. Your Stripe account is connected; Shopify is not. Expected leak detection is partial until both are linked.\u201d
              </div>
              <div style={{ marginTop: 16, fontFamily: "var(--font-data, var(--font-mono))", fontSize: 11, color: "var(--text-tertiary)", letterSpacing: "0.04em" }}>
                \u00b7 precise \u00b7 \u00b7 no apology \u00b7 \u00b7 next-move oriented \u00b7
              </div>
            </div>
          </div>
        </section>

        {/* Final note */}
        <section id="implementation" className="vault-section">
          <div className="vault-section-head">
            <div style={{ fontFamily: "var(--font-data, var(--font-mono))", fontSize: 11, color: "var(--text-tertiary)", letterSpacing: "0.05em" }}>
              \u2014
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 500, letterSpacing: "-0.01em", color: "var(--text-primary)" }}>
                A note on scope
              </div>
              <div style={{ marginTop: 6, fontSize: 14, color: "var(--text-secondary)", maxWidth: "56ch" }}>
                Vault is a working system, not a pitch. Every token, component, and pattern in the following pages compiles to CSS. If it can\u2019t be shipped, it isn\u2019t in here.
              </div>
            </div>
          </div>

          <div style={{ fontFamily: "var(--font-data, var(--font-mono))", fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.8, padding: 24, border: "1px solid var(--line-default)", borderRadius: "var(--r-4)", background: "var(--ink-050)" }}>
            <span style={{ color: "var(--text-quaternary)" }}># vault.config</span><br />
            {"system       "}<span style={{ color: "var(--signal)" }}>&quot;vault&quot;</span><br />
            {"version      "}<span style={{ color: "var(--signal)" }}>&quot;0.1.0&quot;</span><br />
            {"audience     operator, finance, revops"}<br />
            {"feel         private, premium, controlled, calm"}<br />
            {"not          marketing-dashboard, startup-saas, ai-consumer"}<br />
            {"signal       oklch(0.78 0.13 75) "}<span style={{ color: "var(--text-quaternary)" }}># amber, revenue-at-risk only</span><br />
            {"severity     low \u2192 medium \u2192 high \u2192 critical"}<br />
            {"numerics     mono, tabular, always"}<br />
            {"motion       120ms, cubic-bezier(.2,0,0,1), never bouncy"}
          </div>
        </section>

      </div>
    </div>
  )
}
