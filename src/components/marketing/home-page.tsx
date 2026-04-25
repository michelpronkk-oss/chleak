import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { FadeIn } from "@/components/motion/fade-in"
import { HeroSignalRail } from "@/components/marketing/hero-signal-rail"
import { KickerDot } from "@/components/marketing/kicker-dot"
import { RequestAccessForm } from "@/components/marketing/request-access-form"
import { SignalConsole } from "@/components/marketing/signal-console"
import { pricingPlans } from "@/data/mock/pricing"
import type { PublicAccessState } from "@/lib/auth/public-access"

const signals = [
  {
    label: "Activation funnel dropout",
    finding: "New users stall before first value",
    impact: "High priority",
    severity: "high" as const,
  },
  {
    label: "Pricing handoff gap",
    finding: "High-intent visitors reach pricing without a clear next step",
    impact: "Coverage gap",
    severity: "medium" as const,
  },
  {
    label: "Failed renewal recovery",
    finding: "Recoverable renewal failures without smart retries",
    impact: "Recovery gap",
    severity: "medium" as const,
  },
  {
    label: "Monitoring coverage gap",
    finding: "Webhook and scope gaps limit confidence in leak detection",
    impact: "Setup gap",
    severity: "medium" as const,
  },
]

const detectionCategories = [
  {
    index: "01",
    title: "Website leakage",
    body: "Primary surfaces where visitors cannot find the next revenue step.",
  },
  {
    index: "02",
    title: "Signup and pricing leaks",
    body: "SaaS entry paths, pricing handoffs, and activation routes that stall.",
  },
  {
    index: "03",
    title: "Billing recovery leakage",
    body: "Recoverable recurring revenue missed by weak retry and dunning paths.",
  },
  {
    index: "04",
    title: "Setup leakage",
    body: "Coverage and configuration gaps that suppress trustworthy detection.",
  },
]

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="vault-eyebrow mb-4 sm:mb-5">
      {children}
    </p>
  )
}

function SectionRule() {
  return (
    <div className="mx-auto max-w-6xl px-5 sm:px-8">
      <div className="h-px bg-border/85" />
    </div>
  )
}

interface MarketingHomePageProps {
  accessState: PublicAccessState
  isAuthenticated: boolean
}

function getPricingCta(input: { accessState: PublicAccessState; isAuthenticated: boolean; planId: string }) {
  if (input.accessState === "approved") {
    if (!input.isAuthenticated) {
      return {
        label: "Sign in",
        href: "/auth/sign-in",
        primary: true,
      }
    }
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
    label: "Request access",
    href: `/request-access?plan=${input.planId}`,
    primary: true,
  }
}

export default async function MarketingHomePage({ accessState, isAuthenticated }: MarketingHomePageProps) {
  const isApproved = accessState === "approved"
  const isPending = accessState === "pending"
  const showRequestForm = accessState === "unknown"
  const mobileOrderedPlans = [
    ...pricingPlans.filter((p) => p.recommended),
    ...pricingPlans.filter((p) => !p.recommended),
  ]

  return (
    <div className="relative" style={{ overflowX: "clip" }}>
      {/* Hero dot-grid — full-bleed, fades to bottom */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[calc(100svh+4rem)]"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,1) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          opacity: 0.095,
          maskImage: "linear-gradient(to bottom, black 30%, transparent 88%)",
          WebkitMaskImage: "linear-gradient(to bottom, black 30%, transparent 88%)",
        }}
      />

      {/* Hero */}
      <section className="relative mx-auto flex min-h-[calc(100svh-1rem)] w-full max-w-6xl flex-col px-5 pt-[calc(env(safe-area-inset-top)+2.75rem)] min-[390px]:pt-[calc(env(safe-area-inset-top)+3rem)] sm:block sm:min-h-0 sm:px-8 sm:pb-20 sm:pt-16 lg:pb-24 lg:pt-20">
        {/* Hero bloom */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-0 hidden h-[560px] w-[1100px] -translate-x-1/2 blur-[140px] lg:block"
          style={{
            background:
              "radial-gradient(70% 50% at 50% 0%, oklch(0.78 0.13 75 / 0.072), transparent 100%)",
          }}
        />

        <div className="relative mx-auto flex-1 flex flex-col pt-[10svh] max-w-2xl text-center sm:block sm:pt-0">
          <FadeIn delay={0.02}>
            <div className="mb-6 sm:mb-8">
              <div className="vault-kicker-pill">
                <KickerDot />
                Private / operator-grade
              </div>
            </div>
          </FadeIn>

          <FadeIn delay={0.08}>
            <h1 className="text-[2rem] font-semibold leading-[1.06] tracking-[-0.04em] text-foreground sm:text-[3.2rem] sm:leading-[1.02] lg:text-[4.35rem]">
              <span className="font-display text-[1.04em] font-normal italic">Find what silently</span>
              <br />
              <span className="font-normal">kills </span>
              <span className="font-normal text-signal">revenue.</span>
            </h1>
          </FadeIn>

          <FadeIn delay={0.12}>
            <p className="mx-auto mt-6 max-w-[32ch] text-[0.92rem] leading-[1.7] text-muted-foreground sm:mt-5 sm:max-w-[44ch] sm:text-[1.04rem] sm:leading-[1.86]">
              SilentLeak monitors the revenue paths where leads, signups, pricing handoffs, checkouts, activation, and billing quietly lose money.
            </p>
          </FadeIn>

          <FadeIn delay={0.16}>
            <div className="mx-auto mt-6 sm:mt-8">
              {isApproved ? (
                <Link
                  href={isAuthenticated ? "/api/app/access?next=/app&intent=app&source=hero_open_app" : "/auth/sign-in"}
                  className="marketing-primary-cta inline-flex items-center gap-2 rounded-md px-6 py-3 text-sm font-medium"
                >
                  {isAuthenticated ? "Open app" : "Sign in"} <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              ) : isPending ? (
                <div className="mx-auto w-full max-w-sm">
                  <div
                    className="relative overflow-hidden rounded-xl bg-card/50 px-5 py-5 text-left"
                    style={{
                      border: "1px solid color-mix(in oklab, var(--signal-line) 22%, var(--line-default) 78%)",
                    }}
                  >
                    <div
                      aria-hidden
                      className="absolute inset-x-0 top-0 h-px rounded-t-xl"
                      style={{
                        background:
                          "linear-gradient(to right, transparent, oklch(0.78 0.13 75 / 0.18), transparent)",
                      }}
                    />
                    <p className="font-mono text-[0.62rem] tracking-[0.08em] uppercase text-muted-foreground/55">
                      Access request
                    </p>
                    <p className="mt-3 text-[0.94rem] font-semibold tracking-[-0.01em] text-foreground">
                      Your request is under review.
                    </p>
                    <p className="mt-2 text-[0.82rem] leading-[1.65] text-muted-foreground">
                      We review every submission and reach out directly when there is a fit.
                    </p>
                    <div className="mt-4 h-px bg-border/40" />
                    <p className="mt-3 font-mono text-[0.58rem] tracking-[0.08em] uppercase text-muted-foreground/40">
                      Reviewed manually / no automated response
                    </p>
                  </div>
                </div>
              ) : (
                <div className="mx-auto w-full max-w-sm sm:max-w-md">
                  <RequestAccessForm />
                </div>
              )}
            </div>
          </FadeIn>

          <HeroSignalRail />
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
            <Eyebrow>Sample signal snapshot</Eyebrow>
            <h2 className="text-[1.45rem] font-semibold leading-[1.13] tracking-[-0.03em] sm:text-[1.85rem] lg:text-[2.15rem]">
              Sample ranked signals.
            </h2>
            <p className="mt-2.5 max-w-[40ch] text-[0.88rem] leading-[1.72] text-muted-foreground sm:mt-3 sm:max-w-[50ch] sm:text-[0.95rem] sm:leading-[1.8]">
              Illustrative output showing evidence-backed findings, confidence, and recovery priority for operator action.
            </p>
          </div>
        </FadeIn>

        <SignalConsole signals={signals} />
      </section>

      <SectionRule />

      {/* Issue intelligence */}
      <section
        id="detection"
        className="mx-auto w-full max-w-6xl scroll-mt-24 px-4 py-9 sm:px-8 sm:py-16 lg:py-20"
      >
        <FadeIn delay={0.06}>
          <div className="mb-7 sm:mb-10">
            <Eyebrow>What gets detected</Eyebrow>
            <h2 className="text-[1.55rem] font-semibold leading-[1.13] tracking-[-0.03em] sm:text-[2.05rem] lg:text-[2.35rem]">
              What gets detected first.
            </h2>
            <p className="mt-3 max-w-[34ch] text-[0.9rem] leading-[1.72] text-muted-foreground sm:mt-4 sm:max-w-[40ch] sm:text-[0.97rem] sm:leading-[1.85]">
              Website revenue leaks, SaaS funnel leaks, lead capture gaps, pricing handoff breaks, checkout leaks, activation stalls, and billing recovery gaps with root cause, impact level, and the next action.
            </p>
          </div>

          {/* Detection categories: 1-col on mobile, 2-col on sm+ */}
          <div className="grid grid-cols-1 gap-3 sm:gap-0 sm:border-y sm:border-border/50 sm:grid-cols-2">
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

          <div className="mt-6 sm:mt-8">
            <Link
              href="/product"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
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
              Plans by operating maturity.
            </h2>
            <p className="mt-3 max-w-[32ch] text-[0.9rem] leading-[1.75] text-muted-foreground sm:mt-4 sm:max-w-[38ch] sm:text-[0.97rem] sm:leading-[1.85]">
              Start with core coverage, then scale scheduled monitoring cadence, prioritization, and operator workflow as revenue complexity grows.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-3">
            {mobileOrderedPlans.map((plan) => {
              const cta = getPricingCta({ accessState, isAuthenticated, planId: plan.id })

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
                      ? "1px solid var(--signal-line)"
                      : "1px solid var(--line-default)",
                    background: plan.recommended
                      ? "linear-gradient(180deg, var(--signal-dim), var(--ink-100) 58%)"
                      : "var(--ink-100)",
                  }}
                >
                  {plan.recommended ? (
                    <>
                      <div
                        aria-hidden
                        className="absolute inset-x-0 top-0 h-px rounded-t-xl"
                        style={{
                          background:
                            "linear-gradient(to right, transparent, oklch(0.78 0.13 75 / 0.45), transparent)",
                        }}
                      />
                      <div
                        aria-hidden
                        className="pointer-events-none absolute inset-0 -z-10 rounded-xl"
                        style={{
                          background:
                            "radial-gradient(ellipse at 50% 0%, oklch(0.78 0.13 75 / 0.06), transparent 65%)",
                        }}
                      />
                    </>
                  ) : null}

                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground">{plan.name}</p>
                    {plan.recommended ? (
                      <span className="font-mono text-[0.65rem] tracking-[0.08em] uppercase text-signal">
                        Recommended
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-3 flex items-baseline gap-1.5">
                    <span className="font-mono text-[1.9rem] font-medium leading-none tracking-[-0.02em] text-foreground">
                      ${plan.monthlyPrice}
                    </span>
                    <span className="text-sm text-muted-foreground">/mo</span>
                  </div>

                  <p className="mt-1.5 font-mono text-[0.63rem] tracking-[0.06em] uppercase text-muted-foreground/50">
                    {plan.highlight}
                  </p>

                  <p className="mt-2 min-h-[2.75rem] text-[0.84rem] leading-[1.62] text-muted-foreground sm:min-h-[2.85rem] sm:text-sm">
                    {plan.summary}
                  </p>

                  <div className="my-4 h-px" style={{ background: "var(--line-subtle)" }} />

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
                          ? "marketing-primary-cta inline-flex w-full items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium sm:px-5 sm:py-3"
                          : "vault-secondary-cta w-full gap-2 rounded-md px-4 py-2.5 text-sm font-medium text-muted-foreground sm:px-5 sm:py-3"
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
      <section className="mx-auto w-full max-w-6xl px-4 pb-10 sm:px-8 sm:pb-14 lg:pb-16">
        <FadeIn delay={0.06}>
          <div
            className="relative overflow-hidden rounded-xl px-5 py-8 text-center sm:px-10 sm:py-11 lg:px-12 lg:py-12"
            style={{
              border: isPending
                ? "1px solid var(--line-default)"
                : "1px solid color-mix(in oklab, var(--signal-line) 55%, var(--line-default) 45%)",
              background: isPending
                ? "linear-gradient(180deg, var(--ink-100), var(--ink-050))"
                : "linear-gradient(180deg, color-mix(in oklab, var(--signal) 5%, var(--ink-100) 95%), var(--ink-100) 58%, var(--ink-050))",
              boxShadow: "var(--shadow-inset)",
            }}
          >
            {!isPending ? (
              <>
                <div
                  aria-hidden
                  className="absolute inset-x-0 top-0 h-px rounded-t-xl"
                  style={{
                    background:
                      "linear-gradient(to right, transparent, oklch(0.78 0.13 75 / 0.22), transparent)",
                  }}
                />
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background:
                      "radial-gradient(ellipse at 50% 0%, oklch(0.78 0.13 75 / 0.06), transparent 62%)",
                  }}
                />
              </>
            ) : null}

            {isApproved ? (
              <>
                <Eyebrow>Your account</Eyebrow>
                <h2 className="mx-auto max-w-[20ch] text-[1.55rem] font-semibold leading-[1.13] tracking-[-0.03em] sm:max-w-none sm:text-[2.05rem] lg:text-[2.35rem]">
                  {isAuthenticated ? "Your access is active." : "Your access is approved."}
                </h2>
                <p className="mx-auto mt-3 max-w-[28ch] text-[0.88rem] leading-[1.68] text-muted-foreground sm:mt-4 sm:max-w-[36ch] sm:text-[0.97rem] sm:leading-[1.85]">
                  {isAuthenticated
                    ? "Open the workspace to connect a source and run your first scan."
                    : "Sign in to access your workspace and start monitoring."}
                </p>
                <div className="mt-6">
                  <Link
                    href={isAuthenticated ? "/api/app/access?next=/app&intent=app&source=closing_open_app" : "/auth/sign-in"}
                    className="marketing-primary-cta inline-flex w-full items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium sm:w-auto sm:px-6 sm:py-3"
                  >
                    {isAuthenticated ? "Open app" : "Sign in"} <ArrowRight className="h-3.5 w-3.5" />
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
                  Reviewed manually. We reach out directly when approved.
                </p>
              </>
            ) : showRequestForm ? (
              <>
                <Eyebrow>Request access</Eyebrow>
                <h2 className="mx-auto max-w-[20ch] text-[1.55rem] font-semibold leading-[1.13] tracking-[-0.03em] sm:max-w-none sm:text-[2.05rem] lg:text-[2.35rem]">
                  Request private access.
                </h2>
                <p className="mx-auto mt-3 max-w-[28ch] text-[0.88rem] leading-[1.68] text-muted-foreground sm:mt-4 sm:max-w-[36ch] sm:text-[0.97rem] sm:leading-[1.85]">
                  Reviewed intake for operator teams. Current live integrations include Shopify and Stripe.
                </p>
                <div className="mt-6">
                  <Link
                    href="/request-access"
                    className="marketing-primary-cta inline-flex w-full items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium sm:w-auto sm:px-6 sm:py-3"
                  >
                    Request Access <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </>
            ) : null}
          </div>
        </FadeIn>
      </section>
    </div>
  )
}
