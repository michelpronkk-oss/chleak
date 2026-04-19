import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { FadeIn } from "@/components/motion/fade-in"
import { RequestAccessForm } from "@/components/marketing/request-access-form"
import { pricingPlans } from "@/data/mock/pricing"
import type { PublicAccessState } from "@/lib/auth/public-access"

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
    <p className="mb-4 font-mono text-[0.72rem] tracking-[0.12em] uppercase text-primary/65 sm:mb-5">
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

interface MarketingHomePageProps {
  accessState: PublicAccessState
}

function getPricingCta(input: { accessState: PublicAccessState; planId: string }) {
  if (input.accessState === "approved") {
    return {
      label: "Open app",
      href: "/api/app/access?next=/app&intent=app&source=pricing_open_app",
      primary: true,
    }
  }

  if (input.accessState === "pending") {
    return {
      label: "Under review",
      href: "/access-review",
      primary: false,
    }
  }

  return {
    label: "Request Access",
    href: `/api/app/access?next=/request-access&intent=choose-plan&plan=${input.planId}`,
    primary: true,
  }
}

export default async function MarketingHomePage({ accessState }: MarketingHomePageProps) {
  const isApproved = accessState === "approved"
  const isPending = accessState === "pending"
  const showRequestForm = accessState === "unknown"
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
            "radial-gradient(ellipse at center, rgba(70,225,215,0.08), transparent 70%)",
        }}
      />

      {/* Hero */}
      <section className="relative mx-auto w-full max-w-6xl px-5 pb-12 pt-10 sm:px-8 sm:pb-20 sm:pt-16 lg:pb-24 lg:pt-20">
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-[-34px] hidden h-[640px] w-[1280px] -translate-x-1/2 blur-[96px] lg:block"
          style={{
            background:
              "radial-gradient(130% 92% at 50% 44%, rgba(70,225,215,0.02) 0%, rgba(70,225,215,0.011) 36%, rgba(70,225,215,0.004) 58%, rgba(70,225,215,0) 82%), radial-gradient(145% 102% at 50% 58%, rgba(56,113,190,0.014) 0%, rgba(56,113,190,0.005) 46%, rgba(56,113,190,0) 78%)",
          }}
        />

        <div className="relative mx-auto max-w-2xl text-center">
          <FadeIn delay={0.04}>
            <p className="mb-4 font-mono text-[0.65rem] tracking-[0.14em] uppercase text-primary/60 sm:mb-5 sm:text-[0.7rem]">
              Private operator intelligence
            </p>
          </FadeIn>

          <FadeIn delay={0.08}>
            <h1 className="text-[2rem] font-semibold leading-[1.06] tracking-[-0.04em] text-foreground sm:text-[3.2rem] sm:leading-[1.02] lg:text-[4.35rem]">
              Detect where revenue
              <br />
              is <span className="text-primary/60">leaking.</span>
            </h1>
          </FadeIn>

          <FadeIn delay={0.12}>
            <p className="mx-auto mt-4 max-w-[32ch] text-[0.92rem] leading-[1.7] text-muted-foreground sm:mt-5 sm:max-w-[44ch] sm:text-[1.04rem] sm:leading-[1.86]">
              Surface the highest-impact checkout and billing issues across Shopify and Stripe. Ranked by monthly recovery. Actioned in order.
            </p>
          </FadeIn>

          <FadeIn delay={0.16}>
            <div className="mx-auto mt-7 sm:mt-8">
              {isApproved ? (
                <Link
                  href="/api/app/access?next=/app&intent=app&source=hero_open_app"
                  className="marketing-primary-cta inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold transition-all hover:-translate-y-px hover:opacity-90"
                >
                  Open app <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              ) : isPending ? (
                <div className="text-center">
                  <p className="text-[0.9rem] text-muted-foreground">
                    Your request is under review.
                  </p>
                  <p className="mt-1.5 font-mono text-[0.62rem] tracking-[0.1em] uppercase text-muted-foreground/38">
                    We will reach out directly if approved
                  </p>
                </div>
              ) : (
                <div className="w-full max-w-sm sm:max-w-md mx-auto">
                  <RequestAccessForm />
                </div>
              )}
            </div>
          </FadeIn>
        </div>
      </section>

      <SectionRule />

      {/* Sample findings */}
      <section
        id="findings"
        className="mx-auto w-full max-w-6xl scroll-mt-24 px-4 py-9 sm:px-8 sm:py-16 lg:py-20"
      >
        <FadeIn delay={0.06}>
          <div className="mb-6 sm:mb-8">
            <Eyebrow>Sample findings</Eyebrow>
            <h2 className="text-[1.45rem] font-semibold leading-[1.13] tracking-[-0.03em] sm:text-[1.85rem] lg:text-[2.15rem]">
              Three material leaks surfaced in one scan.
            </h2>
            <p className="mt-2.5 max-w-[40ch] text-[0.88rem] leading-[1.72] text-muted-foreground sm:mt-3 sm:max-w-[50ch] sm:text-[0.95rem] sm:leading-[1.8]">
              One account. First scan. Total monthly exposure: $58.9k across checkout, wallet coverage, and billing recovery.
            </p>
          </div>

          <div className="hero-console-float rounded-xl border border-border/70 bg-card/45 p-3.5 sm:p-5 lg:p-6">
            <div className="flex items-center justify-between gap-3">
              <p className="font-mono text-[0.68rem] tracking-[0.1em] uppercase text-primary/70">
                Private Leak Console
              </p>
              <p className="flex items-center gap-1.5 font-mono text-[0.67rem] text-muted-foreground/55">
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
                      <p className="truncate font-mono text-[0.62rem] tracking-[0.09em] uppercase text-muted-foreground/50 sm:text-[0.67rem]">
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
                    <div className="h-px bg-border/22" />
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </FadeIn>
      </section>

      <SectionRule />

      {/* Issue intelligence */}
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
              Every issue surfaces with root cause, financial impact, and a specific next action. Ranked by recovery opportunity.
            </p>
          </div>

          {/* Detection categories: 2x2 on mobile, 2-col on sm+ */}
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
                <p className="mb-2 font-mono text-[0.63rem] tracking-[0.1em] text-muted-foreground/38 sm:mb-3 sm:text-[0.68rem]">
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

          <div className="flex flex-col gap-3 lg:grid lg:grid-cols-3 lg:gap-4">
            {mobileOrderedPlans.map((plan) => {
              const cta = getPricingCta({ accessState, planId: plan.id })

              return (
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
                  {plan.recommended ? (
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
                  ) : null}

                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground">{plan.name}</p>
                    {plan.recommended ? (
                      <span className="font-mono text-[0.65rem] tracking-[0.1em] uppercase text-primary/80">
                        Recommended
                      </span>
                    ) : null}
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
                      <li key={feature} className="text-[0.81rem] text-muted-foreground sm:text-sm">
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-4">
                    <Link
                      href={cta.href}
                      className={
                        cta.primary
                          ? "marketing-primary-cta inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all hover:-translate-y-px hover:opacity-90 sm:px-5 sm:py-3"
                          : "inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border/60 bg-card/25 px-4 py-2.5 text-sm font-semibold text-muted-foreground sm:px-5 sm:py-3"
                      }
                    >
                      {cta.label}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        </FadeIn>
      </section>

      <SectionRule />

      {/* Closing access */}
      <section className="mx-auto w-full max-w-6xl px-4 pb-10 sm:px-8 sm:pb-16 lg:pb-20">
        <FadeIn delay={0.06}>
          <div
            className="relative overflow-hidden rounded-xl px-5 py-10 text-center sm:px-10 sm:py-14 lg:px-14 lg:py-16"
            style={{ border: "1px solid oklch(0.3776 0.0204 254.66 / 0.4)" }}
          >
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 -z-10"
              style={{
                background:
                  "radial-gradient(ellipse at 50% 0%, rgba(70,225,215,0.06), transparent 70%)",
              }}
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 -z-10"
              style={{
                background:
                  "radial-gradient(ellipse at 50% 100%, rgba(56,113,190,0.04), transparent 70%)",
              }}
            />

            {isApproved ? (
              <>
                <Eyebrow>Your account</Eyebrow>
                <h2 className="mx-auto max-w-[20ch] text-[1.55rem] font-semibold leading-[1.13] tracking-[-0.03em] sm:max-w-none sm:text-[2.05rem] lg:text-[2.35rem]">
                  Your access is active.
                </h2>
                <p className="mx-auto mt-3 max-w-[28ch] text-[0.88rem] leading-[1.68] text-muted-foreground sm:mt-4 sm:max-w-[36ch] sm:text-[0.97rem] sm:leading-[1.85]">
                  Connect a source and run your first scan.
                </p>
                <div className="mt-7">
                  <Link
                    href="/api/app/access?next=/app&intent=app&source=closing_open_app"
                    className="marketing-primary-cta inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold transition-all hover:-translate-y-px hover:opacity-90"
                  >
                    Open app <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </>
            ) : isPending ? (
              <>
                <Eyebrow>Access Request</Eyebrow>
                <h2 className="mx-auto max-w-[20ch] text-[1.55rem] font-semibold leading-[1.13] tracking-[-0.03em] sm:max-w-none sm:text-[2.05rem] lg:text-[2.35rem]">
                  Your request is under review.
                </h2>
                <p className="mx-auto mt-3 max-w-[28ch] text-[0.88rem] leading-[1.68] text-muted-foreground sm:mt-4 sm:max-w-[36ch] sm:text-[0.97rem] sm:leading-[1.85]">
                  We review every submission and reach out directly when there is a fit.
                </p>
                <p className="mt-6 font-mono text-[0.6rem] tracking-[0.1em] uppercase text-muted-foreground/35">
                  Reviewed manually - No automated response
                </p>
              </>
            ) : showRequestForm ? (
              <>
                <Eyebrow>Request access</Eyebrow>
                <h2 className="mx-auto max-w-[20ch] text-[1.55rem] font-semibold leading-[1.13] tracking-[-0.03em] sm:max-w-none sm:text-[2.05rem] lg:text-[2.35rem]">
                  Built for operators who need signal,
                  <br className="hidden sm:block" /> not another dashboard.
                </h2>
                <p className="mx-auto mt-3 max-w-[28ch] text-[0.88rem] leading-[1.68] text-muted-foreground sm:mt-4 sm:max-w-[36ch] sm:text-[0.97rem] sm:leading-[1.85]">
                  Connect a source. Get your first leak report in minutes.
                </p>
                <div className="mx-auto mt-7 w-full max-w-sm sm:max-w-md">
                  <RequestAccessForm showTrustLine={false} />
                </div>
              </>
            ) : null}
          </div>
        </FadeIn>
      </section>
    </div>
  )
}

