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
    <p className="mb-4 font-mono text-[0.72rem] tracking-[0.12em] uppercase text-primary/70 sm:mb-5">
      {children}
    </p>
  )
}

function SectionRule() {
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
      <div className="h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />
    </div>
  )
}

export default function MarketingHomePage() {
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

      <section className="relative mx-auto w-full max-w-6xl px-4 pb-16 pt-10 sm:px-6 sm:pb-20 sm:pt-14 md:pt-18 lg:px-8 lg:pb-24 lg:pt-24">
        <div className="grid gap-10 lg:grid-cols-[1fr_390px] lg:items-start lg:gap-10">
          <div>
            <FadeIn delay={0.04}>
              <Eyebrow>Revenue intelligence | Shopify and Stripe</Eyebrow>
            </FadeIn>

            <FadeIn delay={0.08}>
              <h1 className="max-w-[560px] text-[2.2rem] font-semibold leading-[1.04] tracking-[-0.04em] text-foreground sm:text-5xl lg:text-[4.25rem]">
                Stop losing revenue
                <br />
                at checkout.
              </h1>
            </FadeIn>

            <FadeIn delay={0.12}>
              <p className="mt-5 max-w-[34ch] text-[1rem] leading-[1.75] text-muted-foreground sm:text-[1.05rem] sm:leading-[1.85]">
                CheckoutLeak detects leakage across payment flow, method coverage, and dunning. Fixes are ranked by commercial impact.
              </p>
            </FadeIn>

            <FadeIn delay={0.16}>
              <div className="mt-7 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:items-center">
                <Link
                  href="/api/app/access?next=/app/billing&intent=choose-plan&source=hero_primary"
                  className="marketing-primary-cta inline-flex w-full items-center justify-center gap-2 rounded-lg px-6 py-2.5 text-sm font-semibold transition-all hover:-translate-y-px hover:opacity-90 sm:w-auto"
                >
                  Start plan setup
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

          <FadeIn delay={0.18} className="relative w-full lg:pt-2">
            <div
              aria-hidden
              className="pointer-events-none absolute -inset-8 -z-10 blur-3xl"
              style={{
                background:
                  "radial-gradient(ellipse at 50% 40%, rgba(70,225,215,0.17), transparent 65%)",
              }}
            />

            <div className="rounded-xl border border-border/70 bg-card/45 p-4 sm:p-5">
              <div className="mb-3 flex items-center justify-between">
                <span className="font-mono text-[0.68rem] tracking-[0.1em] uppercase text-primary/60">
                  Live Leak Console
                </span>
                <span className="flex items-center gap-1.5 font-mono text-[0.67rem] text-muted-foreground/55">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary/60" />
                  scanning
                </span>
              </div>

              <div className="h-px bg-gradient-to-r from-primary/45 via-border/35 to-transparent" />

              <div>
                {signals.map((signal, index) => (
                  <div key={signal.label}>
                    <div
                      className="py-3.5 pl-3.5 transition-colors hover:bg-primary/[0.03] sm:py-4 sm:pl-4"
                      style={{
                        borderLeft: `2px solid ${
                          index === 0
                            ? "oklch(0.7899 0.1378 186.74 / 0.5)"
                            : "oklch(0.3776 0.0204 254.66 / 0.5)"
                        }`,
                      }}
                    >
                      <p className="font-mono text-[0.67rem] tracking-[0.09em] uppercase text-muted-foreground/50">
                        {signal.label}
                      </p>
                      <p className="mt-1.5 text-sm font-medium text-foreground/90">{signal.finding}</p>
                      <p className="mt-1.5 font-mono text-[0.79rem] tracking-[0.04em] text-primary">
                        {signal.impact}
                      </p>
                    </div>
                    {index < signals.length - 1 && <div className="ml-4 h-px bg-border/30" />}
                  </div>
                ))}
              </div>

              <div className="mt-4 h-px bg-gradient-to-r from-border/30 via-border/15 to-transparent" />
            </div>
          </FadeIn>
        </div>
      </section>

      <SectionRule />

      <section className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 sm:py-18 lg:px-8 lg:py-22">
        <FadeIn delay={0.06}>
          <div className="grid gap-10 lg:grid-cols-2 lg:items-start lg:gap-20">
            <div>
              <Eyebrow>How it works</Eyebrow>
              <h2 className="text-[1.65rem] font-semibold leading-[1.15] tracking-[-0.03em] sm:text-[2.05rem] lg:text-[2.35rem]">
                Built for decision speed,
                <br />
                not dashboard browsing.
              </h2>
              <p className="mt-4 max-w-[36ch] text-[0.94rem] leading-[1.78] text-muted-foreground sm:text-[0.97rem] sm:leading-[1.85]">
                We ingest payment and billing events, score leakage patterns, and surface a ranked action queue your team can execute in sequence.
              </p>
            </div>

            <div className="space-y-5 lg:pt-10">
              {howItWorks.map((item) => (
                <div key={item.title} className="border-l border-border/55 pl-4">
                  <p className="text-[0.93rem] font-medium text-foreground">{item.title}</p>
                  <p className="mt-1.5 text-sm leading-[1.75] text-muted-foreground">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>
      </section>

      <SectionRule />

      <section className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 sm:py-18 lg:px-8 lg:py-22">
        <FadeIn delay={0.06}>
          <div className="mb-10 sm:mb-12">
            <Eyebrow>Issue intelligence</Eyebrow>
            <h2 className="max-w-lg text-[1.65rem] font-semibold leading-[1.15] tracking-[-0.03em] sm:text-[2.05rem] lg:text-[2.35rem]">
              What gets surfaced in every leak.
            </h2>
            <p className="mt-4 max-w-[40ch] text-[0.94rem] leading-[1.8] text-muted-foreground sm:text-[0.97rem] sm:leading-[1.85]">
              Each issue comes with root cause, financial impact estimate, and a specific next action.
            </p>
          </div>

          <div className="grid gap-0 border-y border-border/50 sm:grid-cols-2">
            {leakTypes.map((item, index) => (
              <article
                key={item.index}
                className={`py-6 sm:py-7 lg:py-8 ${
                  index < 2 ? "border-b border-border/50" : ""
                } ${index % 2 === 0 ? "sm:border-r sm:border-border/50 sm:pr-7" : "sm:pl-7"}`}
              >
                <p className="mb-2.5 font-mono text-[0.68rem] tracking-[0.1em] text-muted-foreground/45">
                  {item.index}
                </p>
                <p className="text-[0.95rem] font-medium text-foreground">{item.title}</p>
                <p className="mt-2 text-sm leading-[1.72] text-muted-foreground">{item.body}</p>
              </article>
            ))}
          </div>
        </FadeIn>
      </section>

      <SectionRule />

      <section id="pricing" className="mx-auto w-full max-w-6xl scroll-mt-24 px-4 py-14 sm:px-6 sm:py-18 lg:px-8 lg:py-22">
        <FadeIn delay={0.06}>
          <div className="mb-10 flex flex-col gap-4 sm:mb-12 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Eyebrow>Pricing</Eyebrow>
              <h2 className="text-[1.65rem] font-semibold leading-[1.15] tracking-[-0.03em] sm:text-[2.05rem] lg:text-[2.35rem]">
                Plans aligned to
                <br className="hidden sm:block" />
                operating maturity.
              </h2>
              <p className="mt-4 max-w-[38ch] text-[0.94rem] leading-[1.8] text-muted-foreground sm:text-[0.97rem] sm:leading-[1.85]">
                Start lean. Scale coverage as your store count and billing complexity grow.
              </p>
            </div>
            <Link
              href="/api/app/access?next=/app/billing&intent=choose-plan&source=pricing_section"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-opacity hover:opacity-70"
            >
              Start plan setup <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid gap-3 lg:grid-cols-3 lg:gap-4">
            {pricingPlans.map((plan) => (
              <div
                key={plan.id}
                className="relative flex flex-col rounded-xl px-5 py-6"
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
                      Most popular
                    </span>
                  )}
                </div>

                <div className="mt-3.5">
                  <span className="font-mono text-[1.9rem] font-semibold leading-none tracking-[-0.02em] text-foreground">
                    ${plan.monthlyPrice}
                  </span>
                  <span className="ml-1.5 text-sm text-muted-foreground">/mo</span>
                </div>

                <p className="mt-2.5 text-sm leading-[1.68] text-muted-foreground">{plan.summary}</p>

                <div
                  className="my-4 h-px"
                  style={{ background: "oklch(0.3776 0.0204 254.66 / 0.35)" }}
                />

                <ul className="flex-1 space-y-2.5">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary/70" />
                      <span className="text-sm text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-6">
                  <Link
                    href={`/api/app/access?next=/app/billing&intent=choose-plan&plan=${plan.id}&source=pricing_${plan.id}`}
                    className={
                      plan.recommended
                        ? "marketing-primary-cta inline-flex w-full items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-all hover:-translate-y-px hover:opacity-90"
                        : "inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border/60 px-5 py-2.5 text-sm font-medium text-foreground/85 transition-colors hover:text-foreground"
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

      <section className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6 sm:pb-20 lg:px-8 lg:pb-24">
        <FadeIn delay={0.06}>
          <div
            className="relative overflow-hidden rounded-xl px-5 py-10 text-center sm:px-10 sm:py-12 lg:px-12 lg:py-14"
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
            <h2 className="mx-auto max-w-md text-[1.65rem] font-semibold leading-[1.15] tracking-[-0.03em] sm:text-[2.05rem] lg:text-[2.35rem]">
              See where your revenue is leaking.
            </h2>
            <p className="mx-auto mt-4 max-w-[36ch] text-[0.94rem] leading-[1.8] text-muted-foreground sm:text-[0.97rem] sm:leading-[1.85]">
              Connect your Shopify or Stripe account and get your first leak report in minutes.
            </p>
            <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/api/app/access?next=/app/billing&intent=choose-plan&source=closing_primary"
                className="marketing-primary-cta inline-flex w-full items-center justify-center gap-2 rounded-lg px-7 py-2.5 text-sm font-semibold transition-all hover:-translate-y-px hover:opacity-90 sm:w-auto"
              >
                Start plan setup
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
