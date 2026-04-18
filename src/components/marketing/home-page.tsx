import Link from "next/link"
import { ArrowRight, ArrowUpRight, Check } from "lucide-react"

import { FadeIn } from "@/components/motion/fade-in"
import { pricingPlans } from "@/data/mock/pricing"

const signals = [
  {
    label: "Checkout completion variance",
    finding: "+6.2 pts leakage at shipping step",
    impact: "$28.7k / mo",
  },
  {
    label: "Wallet method mismatch",
    finding: "iOS high-intent traffic without Apple Pay",
    impact: "$12.4k / mo",
  },
  {
    label: "Failed renewal recovery",
    finding: "No smart retry on soft declines",
    impact: "$17.8k / mo",
  },
]

const detectionCategories = [
  {
    index: "01",
    title: "Checkout friction",
    body: "Exit points by step and device type, ranked by conversion loss.",
  },
  {
    index: "02",
    title: "Payment method gaps",
    body: "Missing wallets and local methods against your actual traffic mix.",
  },
  {
    index: "03",
    title: "Failed billing recovery",
    body: "Recoverable revenue scored against your retry and dunning setup.",
  },
  {
    index: "04",
    title: "Setup gaps",
    body: "Configuration misses reducing approved rates without surfacing in reports.",
  },
]

const mechanismPoints = [
  {
    title: "Unified signal ingestion",
    body: "Shopify checkout, Stripe payment intents, invoices, and retry outcomes scored in one model.",
  },
  {
    title: "Impact quantification",
    body: "Every leak includes root context, monthly impact estimate, and the next commercially sensible action.",
  },
  {
    title: "Ranked action queue",
    body: "Prioritized by recovery opportunity so teams always act where return is highest.",
  },
]

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-4 font-mono text-[0.72rem] tracking-[0.12em] uppercase text-primary/70 sm:mb-5">
      {children}
    </p>
  )
}

function SectionRule() {
  return (
    <div className="mx-auto max-w-6xl px-5 sm:px-8">
      <div className="h-px bg-gradient-to-r from-transparent via-border/45 to-transparent" />
    </div>
  )
}

export default function MarketingHomePage() {
  const mobileOrderedPlans = [
    ...pricingPlans.filter((p) => p.recommended),
    ...pricingPlans.filter((p) => !p.recommended),
  ]

  return (
    <div className="relative" style={{ overflowX: "clip" }}>
      <div
        aria-hidden
        className="pointer-events-none absolute right-0 top-0 -z-10 h-[900px] w-[900px]"
        style={{
          transform: "translate(30%, -30%)",
          background:
            "radial-gradient(ellipse at center, rgba(70,225,215,0.1), transparent 70%)",
        }}
      />

      {/* Hero */}
      <section className="relative mx-auto w-full max-w-6xl px-4 pb-8 pt-6 sm:px-8 sm:pb-16 sm:pt-12 lg:pb-20 lg:pt-18">
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-[-34px] hidden h-[640px] w-[1280px] -translate-x-1/2 blur-[96px] lg:block"
          style={{
            background:
              "radial-gradient(130% 92% at 50% 44%, rgba(70,225,215,0.02) 0%, rgba(70,225,215,0.011) 36%, rgba(70,225,215,0.004) 58%, rgba(70,225,215,0) 82%), radial-gradient(145% 102% at 50% 58%, rgba(56,113,190,0.014) 0%, rgba(56,113,190,0.005) 46%, rgba(56,113,190,0) 78%)",
          }}
        />

        <div className="relative mx-auto max-w-3xl text-center">
          <FadeIn delay={0.04}>
            <p className="mb-3 font-mono text-[0.66rem] tracking-[0.14em] uppercase text-primary/65 sm:mb-5 sm:text-[0.7rem]">
              Revenue leak intelligence — Shopify & Stripe
            </p>
          </FadeIn>

          <FadeIn delay={0.08}>
            <h1 className="text-[1.8rem] font-semibold leading-[1.06] tracking-[-0.04em] text-foreground sm:text-[3.15rem] sm:leading-[1.02] lg:text-[4.35rem]">
              Detect where revenue
              <br />
              is leaking.
            </h1>
          </FadeIn>

          <FadeIn delay={0.12}>
            <p className="mx-auto mt-3 max-w-[30ch] text-[0.9rem] leading-[1.65] text-muted-foreground sm:mt-5 sm:max-w-[42ch] sm:text-[1.04rem] sm:leading-[1.86]">
              Checkout friction, wallet gaps, and failed recovery surfaced and ranked by monthly impact.
            </p>
          </FadeIn>

          <FadeIn delay={0.16}>
            <div className="mt-5 flex flex-col items-stretch justify-center gap-2 sm:mt-7 sm:flex-row sm:items-center sm:gap-3">
              <Link
                href="/pricing"
                className="marketing-primary-cta inline-flex w-full items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-all hover:-translate-y-px hover:opacity-90 sm:w-auto sm:px-6 sm:py-3"
              >
                Start monitoring
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                href="/#findings"
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-border/60 bg-card/25 px-5 py-2.5 text-sm text-foreground/82 transition-colors hover:border-border hover:text-foreground sm:w-auto sm:px-6 sm:py-3"
              >
                See sample findings
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </FadeIn>
        </div>

        {/* Proof strip — always 3-col */}
        <FadeIn delay={0.18} className="mx-auto mt-6 max-w-4xl sm:mt-9">
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <div className="rounded-lg border border-border/65 bg-background/35 px-2.5 py-3 text-center sm:px-4 sm:py-3.5">
              <p className="font-mono text-[1.1rem] font-semibold tracking-[-0.02em] text-destructive sm:text-[1.35rem]">
                $58.9k
              </p>
              <p className="mt-1 text-[0.63rem] uppercase tracking-[0.07em] text-muted-foreground/60 sm:text-[0.72rem]">
                Monthly leakage
              </p>
            </div>
            <div className="rounded-lg border border-border/65 bg-background/35 px-2.5 py-3 text-center sm:px-4 sm:py-3.5">
              <p className="font-mono text-[1.1rem] font-semibold tracking-[-0.02em] text-foreground sm:text-[1.35rem]">
                3
              </p>
              <p className="mt-1 text-[0.63rem] uppercase tracking-[0.07em] text-muted-foreground/60 sm:text-[0.72rem]">
                Active leaks
              </p>
            </div>
            <div className="hero-impact-pulse rounded-lg border border-primary/30 bg-primary/[0.08] px-2.5 py-3 text-center sm:px-4 sm:py-3.5">
              <p className="font-mono text-[1.1rem] font-semibold tracking-[-0.02em] text-primary sm:text-[1.35rem]">
                $28.7k
              </p>
              <p className="mt-1 text-[0.63rem] uppercase tracking-[0.07em] text-primary/75 sm:text-[0.72rem]">
                Top signal
              </p>
            </div>
          </div>
        </FadeIn>

        {/* Leak console */}
        <div id="findings" className="scroll-mt-20">
          <FadeIn
            delay={0.22}
            className="hero-console-float relative mx-auto mt-3.5 max-w-4xl sm:mt-7 lg:mt-9"
          >
            <div className="rounded-xl border border-border/70 bg-card/45 p-3 sm:p-5 lg:p-6">
              <div className="flex items-center justify-between gap-3">
                <p className="font-mono text-[0.68rem] tracking-[0.1em] uppercase text-primary/70">
                  Private Leak Console
                </p>
                <p className="flex items-center gap-1.5 font-mono text-[0.67rem] text-muted-foreground/60">
                  <span className="hero-live-indicator h-1.5 w-1.5 rounded-full bg-primary/65" />
                  ranked by impact
                </p>
              </div>

              <div className="mt-3 h-px bg-gradient-to-r from-transparent via-border/45 to-transparent" />

              <div className="mt-1.5">
                {signals.map((signal, index) => (
                  <div key={signal.label}>
                    <div className="flex items-center gap-2 py-2.5 sm:grid sm:grid-cols-[1.2fr_2fr_auto] sm:items-center sm:gap-4 sm:py-3.5">
                      <div className="min-w-0 flex-1 sm:contents">
                        <p className="truncate font-mono text-[0.62rem] tracking-[0.09em] uppercase text-muted-foreground/55 sm:text-[0.67rem]">
                          {signal.label}
                        </p>
                        <p className="mt-0.5 text-[0.82rem] leading-[1.5] text-foreground/90 sm:mt-0 sm:text-sm">
                          {signal.finding}
                        </p>
                      </div>
                      <p className="shrink-0 font-mono text-[0.74rem] tracking-[0.05em] text-primary sm:text-[0.78rem]">
                        {signal.impact}
                      </p>
                    </div>
                    {index < signals.length - 1 ? (
                      <div className="h-px bg-border/25" />
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      <SectionRule />

      {/* Merged: Issue intelligence + How it works */}
      <section
        id="detection"
        className="mx-auto w-full max-w-6xl scroll-mt-24 px-4 py-9 sm:px-8 sm:py-16 lg:py-20"
      >
        <FadeIn delay={0.06}>
          <div className="mb-7 sm:mb-10">
            <Eyebrow>Issue intelligence</Eyebrow>
            <h2 className="text-[1.55rem] font-semibold leading-[1.13] tracking-[-0.03em] sm:text-[2.05rem] lg:text-[2.35rem]">
              What gets detected.
              <br className="sm:hidden" /> What you get back.
            </h2>
            <p className="mt-3 max-w-[34ch] text-[0.9rem] leading-[1.72] text-muted-foreground sm:mt-4 sm:max-w-[40ch] sm:text-[0.97rem] sm:leading-[1.85]">
              Every issue surfaces with root cause, financial impact, and a specific next action — ranked by recovery opportunity.
            </p>
          </div>

          {/* Detection categories: 2×2 on mobile, 2-col on sm+ */}
          <div className="grid grid-cols-2 gap-3 sm:gap-0 sm:border-y sm:border-border/50">
            {detectionCategories.map((item, index) => (
              <article
                key={item.index}
                className={[
                  "rounded-lg border border-border/45 bg-card/15 p-3.5",
                  "sm:rounded-none sm:border-0 sm:bg-transparent sm:py-8 sm:border-b sm:border-border/50 lg:py-9",
                  index >= 2 ? "sm:border-b-0" : "",
                  index % 2 === 0
                    ? "sm:border-r sm:border-border/50 sm:pr-8"
                    : "sm:pl-8",
                ].join(" ")}
              >
                <p className="mb-2 font-mono text-[0.63rem] tracking-[0.1em] text-muted-foreground/40 sm:mb-3 sm:text-[0.68rem]">
                  {item.index}
                </p>
                <p className="text-[0.86rem] font-medium text-foreground sm:text-[0.95rem]">
                  {item.title}
                </p>
                <p className="mt-1.5 text-[0.76rem] leading-[1.62] text-muted-foreground sm:mt-2 sm:text-sm sm:leading-[1.72]">
                  {item.body}
                </p>
              </article>
            ))}
          </div>

          {/* Mechanism points */}
          <div className="mt-6 grid gap-3.5 sm:mt-10 sm:grid-cols-3 sm:gap-6">
            {mechanismPoints.map((item) => (
              <div key={item.title} className="border-l border-border/50 pl-4 sm:pl-5">
                <p className="text-[0.88rem] font-medium text-foreground sm:text-[0.93rem]">
                  {item.title}
                </p>
                <p className="mt-1 text-[0.78rem] leading-[1.65] text-muted-foreground sm:mt-1.5 sm:text-sm sm:leading-[1.75]">
                  {item.body}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-6 sm:mt-8">
            <Link
              href="/product"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-opacity hover:opacity-70"
            >
              Review what gets detected <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </FadeIn>
      </section>

      <SectionRule />

      {/* Pricing */}
      <section
        id="pricing"
        className="mx-auto w-full max-w-6xl scroll-mt-20 px-4 py-9 sm:px-8 sm:py-16 lg:py-20"
      >
        <FadeIn delay={0.06}>
          <div className="mb-7 sm:mb-10">
            <Eyebrow>Pricing</Eyebrow>
            <h2 className="text-[1.55rem] font-semibold leading-[1.13] tracking-[-0.03em] sm:text-[2.05rem] lg:text-[2.35rem]">
              Plans aligned to
              <br className="hidden sm:block" />
              operating maturity.
            </h2>
            <p className="mt-3 max-w-[32ch] text-[0.9rem] leading-[1.75] text-muted-foreground sm:mt-4 sm:max-w-[38ch] sm:text-[0.97rem] sm:leading-[1.85]">
              Start lean. Scale coverage as your store count and billing complexity grow.
            </p>
          </div>

          {/* Growth first on mobile via JSX order; desktop reorders via lg:order-* */}
          <div className="flex flex-col gap-3 lg:grid lg:grid-cols-3 lg:gap-4">
            {mobileOrderedPlans.map((plan) => (
              <div
                key={plan.id}
                className={[
                  "relative flex flex-col rounded-xl px-4 py-5 sm:px-5 sm:py-6",
                  plan.recommended
                    ? "lg:order-2"
                    : plan.id === "starter"
                      ? "lg:order-1"
                      : "lg:order-3",
                ].join(" ")}
                style={{
                  border: plan.recommended
                    ? "1px solid oklch(0.7899 0.1378 186.74 / 0.28)"
                    : "1px solid oklch(0.3776 0.0204 254.66 / 0.35)",
                  background: plan.recommended
                    ? "oklch(0.2329 0.0161 259.92 / 0.65)"
                    : "oklch(0.2329 0.0161 259.92 / 0.28)",
                }}
              >
                {plan.recommended && (
                  <>
                    <div
                      aria-hidden
                      className="absolute inset-x-0 top-0 h-px rounded-t-xl"
                      style={{
                        background:
                          "linear-gradient(to right, transparent, oklch(0.7899 0.1378 186.74 / 0.55), transparent)",
                      }}
                    />
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

                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">{plan.name}</p>
                  {plan.recommended && (
                    <span className="font-mono text-[0.65rem] tracking-[0.1em] uppercase text-primary/80">
                      Recommended
                    </span>
                  )}
                </div>

                <div className="mt-3">
                  <span className="font-mono text-[1.9rem] font-semibold leading-none tracking-[-0.02em] text-foreground">
                    ${plan.monthlyPrice}
                  </span>
                  <span className="ml-1.5 text-sm text-muted-foreground">/mo</span>
                </div>

                <p className="mt-2 text-[0.84rem] leading-[1.62] text-muted-foreground sm:text-sm">
                  {plan.summary}
                </p>

                <div
                  className="my-3.5 h-px"
                  style={{ background: "oklch(0.3776 0.0204 254.66 / 0.35)" }}
                />

                <ul className="flex-1 space-y-2">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary/70" />
                      <span className="text-[0.81rem] text-muted-foreground sm:text-sm">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="mt-4">
                  <Link
                    href={`/api/app/access?next=/app/billing&intent=choose-plan&plan=${plan.id}&source=pricing_${plan.id}`}
                    className={
                      plan.recommended
                        ? "marketing-primary-cta inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all hover:-translate-y-px hover:opacity-90 sm:px-5 sm:py-3"
                        : "inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border/60 px-4 py-2.5 text-sm font-medium text-foreground/80 transition-colors hover:border-border hover:text-foreground sm:px-5 sm:py-3"
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

      {/* Closing CTA */}
      <section className="mx-auto w-full max-w-6xl px-4 pb-10 sm:px-8 sm:pb-16 lg:pb-20">
        <FadeIn delay={0.06}>
          <div
            className="relative overflow-hidden rounded-xl px-5 py-8 text-center sm:px-10 sm:py-14 lg:px-14 lg:py-16"
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
                  "radial-gradient(ellipse at 50% 100%, rgba(56,113,190,0.05), transparent 70%)",
              }}
            />

            <Eyebrow>Start now</Eyebrow>
            <h2 className="mx-auto max-w-[14ch] text-[1.55rem] font-semibold leading-[1.13] tracking-[-0.03em] sm:max-w-md sm:text-[2.05rem] lg:text-[2.35rem]">
              Start with your first scan.
            </h2>
            <p className="mx-auto mt-3 max-w-[26ch] text-[0.88rem] leading-[1.68] text-muted-foreground sm:mt-4 sm:max-w-[34ch] sm:text-[0.97rem] sm:leading-[1.85]">
              Connect a source. Get your first leak report in minutes. Built for operators who need signal, not more dashboards.
            </p>
            <div className="mt-5 flex flex-col items-center gap-2.5 sm:mt-7 sm:flex-row sm:justify-center sm:gap-3">
              <Link
                href="/pricing"
                className="marketing-primary-cta inline-flex w-full items-center justify-center gap-2 rounded-lg px-6 py-2.5 text-sm font-semibold transition-all hover:-translate-y-px hover:opacity-90 sm:w-auto sm:px-7 sm:py-3"
              >
                Start with your first scan
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                href="/contact#demo"
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Book a demo
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </FadeIn>
      </section>
    </div>
  )
}
