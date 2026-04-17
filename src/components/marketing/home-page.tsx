import Link from "next/link"
import { ArrowRight, ArrowUpRight, Check } from "lucide-react"

import { FadeIn } from "@/components/motion/fade-in"
import { pricingPlans } from "@/data/mock/pricing"

const signals = [
  {
    label: "Checkout completion variance",
    finding: "+6.2 pts leakage at shipping step",
    impact: "$28.7k / month",
  },
  {
    label: "Wallet method mismatch",
    finding: "iOS high-intent traffic without Apple Pay",
    impact: "$12.4k / month",
  },
  {
    label: "Failed renewal recovery",
    finding: "No smart retry on soft declines",
    impact: "$17.8k / month",
  },
]

const leakTypes = [
  {
    index: "01",
    title: "Checkout friction",
    body: "Exit points that suppress high-intent conversion, mapped by checkout step and device type.",
  },
  {
    index: "02",
    title: "Payment method coverage",
    body: "Missing wallets and local payment methods, identified against your actual traffic and market mix.",
  },
  {
    index: "03",
    title: "Failed billing recovery",
    body: "Recoverable revenue quantified against your retry cadence and dunning configuration.",
  },
  {
    index: "04",
    title: "Setup gaps",
    body: "Configuration misses that quietly reduce approved payment rates without surfacing in standard reporting.",
  },
]

const howItWorks = [
  {
    title: "Unified signal ingestion",
    body: "Shopify checkout, Stripe payment intents, invoices, and retry outcomes. All scored in one model.",
  },
  {
    title: "Impact quantification",
    body: "Every leak includes root context, expected monthly impact, and the next commercially sensible action.",
  },
  {
    title: "Ranked action queue",
    body: "Prioritization weighted by revenue opportunity so teams always act where return is highest.",
  },
]

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-5 font-mono text-[0.72rem] tracking-[0.12em] uppercase text-primary/70">
      {children}
    </p>
  )
}

function SectionRule() {
  return (
    <div className="mx-auto max-w-6xl px-5 sm:px-8">
      <div className="h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />
    </div>
  )
}

export default function MarketingHomePage() {
  return (
    <div className="relative" style={{ overflowX: "clip" }}>

      {/*
        Hero ambient glow - lives outside the max-w section so it is never
        clipped. Center is pushed ~30% above and right of the wrapper;
        only the soft gradient tail is visible in the hero.
        overflow-x:clip avoids creating a BFC scroll container that would
        clip this element on the y axis.
      */}
      <div
        aria-hidden
        className="pointer-events-none absolute right-0 top-0 -z-10 h-[900px] w-[900px]"
        style={{
          transform: "translate(30%, -30%)",
          background:
            "radial-gradient(ellipse at center, rgba(70,225,215,0.1), transparent 70%)",
        }}
      />

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="relative mx-auto w-full max-w-6xl px-5 pb-24 pt-16 sm:px-8 md:pt-24 lg:pb-28">

        <div className="grid gap-16 lg:grid-cols-[1fr_400px] lg:items-start lg:gap-12">

          {/* - Left: headline + cta - */}
          <div>
            <FadeIn delay={0.04}>
              <Eyebrow>Revenue intelligence · Shopify &amp; Stripe</Eyebrow>
            </FadeIn>

            <FadeIn delay={0.08}>
              <h1 className="max-w-[560px] text-[2.65rem] font-semibold leading-[1.06] tracking-[-0.038em] text-foreground sm:text-5xl lg:text-[4.375rem] lg:leading-[1.04]">
                Stop losing revenue
                <br />
                at checkout.
              </h1>
            </FadeIn>

            <FadeIn delay={0.12}>
              <p className="mt-6 max-w-[36ch] text-[1.0625rem] leading-[1.85] text-muted-foreground">
                CheckoutLeak detects leakage across payment flow, method coverage, and dunning. Fixes are ranked by commercial impact.
              </p>
            </FadeIn>

            <FadeIn delay={0.16}>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link
                  href="/app"
                  className="marketing-primary-cta inline-flex w-full items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold shadow-[0_0_22px_rgba(70,225,215,0.22)] transition-all hover:-translate-y-px hover:opacity-90 sm:w-auto"
                >
                  Open live product
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                <Link
                  href="/#pricing"
                  className="inline-flex items-center justify-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground sm:justify-start"
                >
                  See pricing
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </FadeIn>
          </div>

          {/* - Right: intelligence terminal - */}
          <FadeIn delay={0.18} className="relative w-full lg:pt-2">

            {/* ambient glow behind terminal */}
            <div
              aria-hidden
              className="pointer-events-none absolute -inset-8 -z-10 blur-3xl"
              style={{
                background:
                  "radial-gradient(ellipse at 50% 40%, rgba(70,225,215,0.17), transparent 65%)",
              }}
            />

            <div>
              {/* terminal header */}
              <div className="mb-4 flex items-center justify-between">
                <span className="font-mono text-[0.7rem] tracking-[0.1em] uppercase text-primary/60">
                  Live Leak Console
                </span>
                <span className="flex items-center gap-1.5 font-mono text-[0.68rem] text-muted-foreground/50">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary/60" />
                  scanning
                </span>
              </div>

              {/* gradient top rule */}
              <div className="h-px bg-gradient-to-r from-primary/45 via-border/35 to-transparent" />

              {/* signal rows */}
              <div>
                {signals.map((s, i) => (
                  <div key={s.label}>
                    <div
                      className="py-4 pl-4 transition-colors hover:bg-primary/[0.03]"
                      style={{
                        borderLeft: `2px solid ${
                          i === 0
                            ? "oklch(0.7899 0.1378 186.74 / 0.5)"
                            : "oklch(0.3776 0.0204 254.66 / 0.5)"
                        }`,
                      }}
                    >
                      <p className="font-mono text-[0.67rem] tracking-[0.09em] uppercase text-muted-foreground/50">
                        {s.label}
                      </p>
                      <p className="mt-1.5 text-sm font-medium text-foreground/90">{s.finding}</p>
                      <p className="mt-1.5 font-mono text-[0.8rem] tracking-[0.04em] text-primary">
                        {s.impact}
                      </p>
                    </div>
                    {i < signals.length - 1 && (
                      <div className="ml-4 h-px bg-border/30" />
                    )}
                  </div>
                ))}
              </div>

              {/* gradient bottom rule */}
              <div className="mt-4 h-px bg-gradient-to-r from-border/30 via-border/15 to-transparent" />
            </div>
          </FadeIn>

        </div>
      </section>

      <SectionRule />

      {/* ── How it works ───────────────────────────────────────── */}
      <section
        id="pricing"
        className="mx-auto w-full max-w-6xl scroll-mt-24 px-5 py-20 sm:px-8 md:py-24"
      >
        <FadeIn delay={0.06}>
          <div className="grid gap-12 lg:grid-cols-2 lg:items-start lg:gap-24">

            <div>
              <Eyebrow>How it works</Eyebrow>
              <h2 className="text-[1.875rem] font-semibold leading-[1.2] tracking-[-0.03em] sm:text-[2.375rem]">
                Built for decision speed,
                <br />
                not dashboard browsing.
              </h2>
              <p className="mt-5 max-w-[36ch] text-[0.9375rem] leading-[1.85] text-muted-foreground">
                We ingest payment and billing events, score leakage patterns, and surface a ranked action queue your team can execute in sequence.
              </p>
            </div>

            <div className="space-y-6 lg:pt-14">
              {howItWorks.map((item) => (
                <div key={item.title}>
                  <p className="text-[0.9375rem] font-medium text-foreground">{item.title}</p>
                  <p className="mt-1.5 text-sm leading-[1.75] text-muted-foreground">{item.body}</p>
                </div>
              ))}
            </div>

          </div>
        </FadeIn>
      </section>

      <SectionRule />

      {/* ── Issue intelligence ─────────────────────────────────── */}
      <section className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-8 md:py-24">
        <FadeIn delay={0.06}>

          <div className="mb-14">
            <Eyebrow>Issue intelligence</Eyebrow>
            <h2 className="max-w-lg text-[1.875rem] font-semibold leading-[1.2] tracking-[-0.03em] sm:text-[2.375rem]">
              What gets surfaced in every leak.
            </h2>
            <p className="mt-5 max-w-[40ch] text-[0.9375rem] leading-[1.85] text-muted-foreground">
              Each issue comes with a root cause, a financial impact estimate, and a specific next action.
            </p>
          </div>

          {/* 2x2 grid with ruled dividers */}
          <div>
            <div
              className="grid gap-0 sm:grid-cols-2"
              style={{ borderTop: "1px solid oklch(0.3776 0.0204 254.66 / 0.5)" }}
            >
              {leakTypes.slice(0, 2).map((item, i) => (
                <div
                  key={item.index}
                  className="py-8"
                  style={{
                    borderBottom: "1px solid oklch(0.3776 0.0204 254.66 / 0.5)",
                    ...(i === 0
                      ? {
                          paddingRight: "3rem",
                          borderRight: "1px solid oklch(0.3776 0.0204 254.66 / 0.5)",
                        }
                      : { paddingLeft: "3rem" }),
                  }}
                >
                  <p className="mb-3 font-mono text-[0.68rem] tracking-[0.1em] text-muted-foreground/45">
                    {item.index}
                  </p>
                  <p className="text-[0.9375rem] font-medium text-foreground">{item.title}</p>
                  <p className="mt-2 text-sm leading-[1.7] text-muted-foreground">{item.body}</p>
                </div>
              ))}
            </div>
            <div className="grid gap-0 sm:grid-cols-2">
              {leakTypes.slice(2, 4).map((item, i) => (
                <div
                  key={item.index}
                  className="py-8"
                  style={
                    i === 0
                      ? {
                          paddingRight: "3rem",
                          borderRight: "1px solid oklch(0.3776 0.0204 254.66 / 0.5)",
                        }
                      : { paddingLeft: "3rem" }
                  }
                >
                  <p className="mb-3 font-mono text-[0.68rem] tracking-[0.1em] text-muted-foreground/45">
                    {item.index}
                  </p>
                  <p className="text-[0.9375rem] font-medium text-foreground">{item.title}</p>
                  <p className="mt-2 text-sm leading-[1.7] text-muted-foreground">{item.body}</p>
                </div>
              ))}
            </div>
          </div>

        </FadeIn>
      </section>

      <SectionRule />

      {/* ── Pricing ────────────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-8 md:py-24">
        <FadeIn delay={0.06}>

          <div className="mb-12 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Eyebrow>Pricing</Eyebrow>
              <h2 className="text-[1.875rem] font-semibold leading-[1.2] tracking-[-0.03em] sm:text-[2.375rem]">
                Plans aligned to
                <br className="hidden sm:block" />
                operating maturity.
              </h2>
              <p className="mt-4 max-w-[38ch] text-[0.9375rem] leading-[1.85] text-muted-foreground">
                Start lean. Scale coverage as your store count and billing complexity grow.
              </p>
            </div>
            <Link
              href="/#pricing"
              className="shrink-0 inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-opacity hover:opacity-70"
            >
              Full plan details <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {pricingPlans.map((plan) => (
              <div
                key={plan.id}
                className="relative flex flex-col rounded-xl px-6 py-7"
                style={{
                  border: plan.recommended
                    ? "1px solid oklch(0.7899 0.1378 186.74 / 0.28)"
                    : "1px solid oklch(0.3776 0.0204 254.66 / 0.35)",
                  background: plan.recommended
                    ? "oklch(0.2329 0.0161 259.92 / 0.65)"
                    : "oklch(0.2329 0.0161 259.92 / 0.3)",
                }}
              >
                {plan.recommended && (
                  <>
                    {/* top accent line */}
                    <div
                      aria-hidden
                      className="absolute inset-x-0 top-0 h-px rounded-t-xl"
                      style={{
                        background:
                          "linear-gradient(to right, transparent, oklch(0.7899 0.1378 186.74 / 0.55), transparent)",
                      }}
                    />
                    {/* ambient glow */}
                    <div
                      aria-hidden
                      className="pointer-events-none absolute inset-0 -z-10 rounded-xl"
                      style={{
                        background:
                          "radial-gradient(ellipse at 50% 0%, rgba(70,225,215,0.07), transparent 65%)",
                      }}
                    />
                  </>
                )}

                {/* Plan name + badge */}
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">{plan.name}</p>
                  {plan.recommended && (
                    <span className="font-mono text-[0.65rem] tracking-[0.1em] uppercase text-primary/80">
                      Most popular
                    </span>
                  )}
                </div>

                {/* Price */}
                <div className="mt-4">
                  <span className="font-mono text-[2rem] font-semibold leading-none tracking-[-0.02em] text-foreground">
                    ${plan.monthlyPrice}
                  </span>
                  <span className="ml-1.5 text-sm text-muted-foreground">/mo</span>
                </div>

                {/* Summary */}
                <p className="mt-3 text-sm leading-[1.65] text-muted-foreground">{plan.summary}</p>

                {/* Divider */}
                <div
                  className="my-5 h-px"
                  style={{ background: "oklch(0.3776 0.0204 254.66 / 0.35)" }}
                />

                {/* Features */}
                <ul className="flex-1 space-y-2.5">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary/70" />
                      <span className="text-sm text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <div className="mt-8">
                  <Link
                    href="/app"
                    className={
                      plan.recommended
                        ? "marketing-primary-cta inline-flex w-full items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold shadow-[0_0_18px_rgba(70,225,215,0.18)] transition-all hover:-translate-y-px hover:opacity-90"
                        : "inline-flex w-full items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium text-foreground/80 transition-colors hover:text-foreground"
                    }
                    style={
                      !plan.recommended
                        ? { border: "1px solid oklch(0.3776 0.0204 254.66 / 0.5)" }
                        : undefined
                    }
                  >
                    {plan.callToAction}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>

        </FadeIn>
      </section>

      {/* ── Closing CTA ────────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-6xl px-5 pb-28 sm:px-8">
        <FadeIn delay={0.06}>
          <div
            className="relative overflow-hidden rounded-2xl px-8 py-14 text-center sm:px-12 sm:py-16"
            style={{ border: "1px solid oklch(0.3776 0.0204 254.66 / 0.4)" }}
          >
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 -z-10"
              style={{
                background:
                  "radial-gradient(ellipse at 50% 0%, rgba(70,225,215,0.07), transparent 70%)",
              }}
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 -z-10"
              style={{
                background:
                  "radial-gradient(ellipse at 50% 100%, rgba(56,113,190,0.06), transparent 70%)",
              }}
            />

            <Eyebrow>Get started</Eyebrow>
            <h2 className="mx-auto max-w-md text-[1.875rem] font-semibold leading-[1.2] tracking-[-0.03em] sm:text-[2.375rem]">
              See where your revenue is leaking.
            </h2>
            <p className="mx-auto mt-5 max-w-[36ch] text-[0.9375rem] leading-[1.85] text-muted-foreground">
              Connect your Shopify or Stripe account and get your first leak report in minutes.
            </p>
            <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/app"
                className="marketing-primary-cta inline-flex w-full items-center justify-center gap-2 rounded-lg px-7 py-3 text-sm font-semibold shadow-[0_0_24px_rgba(70,225,215,0.2)] transition-all hover:-translate-y-px hover:opacity-90 sm:w-auto"
              >
                Open live product
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                href="/#pricing"
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                See pricing
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </FadeIn>
      </section>

    </div>
  )
}

