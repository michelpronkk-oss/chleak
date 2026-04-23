import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { getPublicAccessState } from "@/lib/auth/public-access"
import { getServerSession } from "@/lib/auth/session"
import { FadeIn } from "@/components/motion/fade-in"
import { InViewReveal } from "@/components/motion/in-view-reveal"
import { LiveIntelligencePanel } from "@/components/marketing/live-intelligence-panel"

export const metadata: Metadata = {
  title: "Revenue Leak Detection for Activation, Checkout, and Billing Recovery",
  description:
    "CheckoutLeak detects revenue leakage across activation, checkout setup, and billing recovery, and ranks each issue by monthly dollar impact. Current live integrations include Shopify and Stripe.",
  openGraph: {
    title: "Revenue Leak Detection for Activation, Checkout, and Billing Recovery | CheckoutLeak",
    description:
      "CheckoutLeak detects revenue leakage across activation, checkout setup, and billing recovery, and ranks each issue by monthly dollar impact. Current live integrations include Shopify and Stripe.",
    url: "/product",
    type: "website",
  },
  twitter: {
    title: "Revenue Leak Detection for Activation, Checkout, and Billing Recovery | CheckoutLeak",
    description:
      "Detect revenue leakage across activation, checkout setup, and billing recovery. Ranked by monthly impact.",
  },
  alternates: {
    canonical: "/product",
  },
}

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://checkoutleak.com" },
    { "@type": "ListItem", position: 2, name: "Product", item: "https://checkoutleak.com/product" },
  ],
}

const softwareSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "CheckoutLeak",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description:
    "Revenue leak detection platform for activation, checkout setup, and billing recovery.",
  url: "https://checkoutleak.com/product",
}

const detectionSurfaces = [
  {
    title: "Activation leakage",
    description:
      "Dropout between first entry and first value surfaced with clear evidence and monthly exposure, so stalled activation is treated as revenue leakage.",
    signal: "First-value activation stall",
  },
  {
    title: "Checkout leakage",
    description:
      "Checkout friction, payment coverage, and setup confidence gaps resolved to the step and segment where intent is lost, then ranked by impact.",
    signal: "Shipping step drop-off variance",
  },
  {
    title: "Billing recovery",
    description:
      "Failed invoices, weak retry recovery, and churn pressure from billing events quantified as recoverable exposure and surfaced as ranked action.",
    signal: "Failed payment recovery gap",
  },
]

const workflow = [
  {
    step: "Connect sources",
    body: "Connect your revenue surfaces to establish activation, checkout, and billing visibility.",
  },
  {
    step: "Scan and quantify",
    body: "Continuously evaluate activation progression, checkout execution, and billing recovery behavior with monthly impact estimates.",
  },
  {
    step: "Prioritize fixes",
    body: "Receive ranked issues with severity, confidence, and the next best action.",
  },
  {
    step: "Execute and verify",
    body: "Run fix plans and monitor the success signals CheckoutLeak tracks after release.",
  },
]

const outcomes = [
  {
    metric: "< 24h",
    title: "Time to first finding",
    body: "Connect sources, run the first scan, receive ranked issues in the same session.",
  },
  {
    metric: "3x",
    title: "Faster root cause",
    body: "Teams move from symptom to verified root cause without cross-tool investigation.",
  },
  {
    metric: "100%",
    title: "Commercial alignment",
    body: "Revenue, product, and lifecycle teams work from the same leak and priority model.",
  },
]

export default async function ProductPage() {
  const [accessState, session] = await Promise.all([
    getPublicAccessState(),
    getServerSession(),
  ])

  const isApproved = accessState === "approved"
  const isPending = accessState === "pending"
  const isAuthenticated = session !== null

  const primaryCta = isApproved
    ? {
        label: isAuthenticated ? "Open app" : "Sign in",
        href: isAuthenticated
          ? "/api/app/access?next=/app&intent=app&source=product_page"
          : "/auth/sign-in",
        primary: true,
      }
    : isPending
    ? { label: "Under review", href: "/access-review", primary: false }
    : { label: "Request access", href: "/request-access", primary: true }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
      />

      <div className="relative" style={{ overflowX: "clip" }}>

        {/* Hero ambient dot-grid */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-[calc(100vh-2rem)]"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(255,255,255,1) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
            opacity: 0.035,
            maskImage: "linear-gradient(to bottom, black 25%, transparent 75%)",
            WebkitMaskImage: "linear-gradient(to bottom, black 25%, transparent 75%)",
          }}
        />
        {/* Amber bloom */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-0 hidden h-[500px] w-[1000px] -translate-x-1/2 blur-[130px] lg:block"
          style={{ background: "radial-gradient(60% 50% at 50% 0%, oklch(0.78 0.13 75 / 0.055), transparent 100%)" }}
        />

        {/* Hero */}
        <section className="relative mx-auto w-full max-w-6xl px-4 pb-14 pt-10 sm:px-8 sm:pb-20 sm:pt-16 lg:pb-24 lg:pt-20">
          <div className="grid gap-10 lg:grid-cols-[1fr_420px] lg:items-start lg:gap-14">
            <div>
              <FadeIn delay={0}>
                <div className="vault-kicker-pill">Product</div>
              </FadeIn>
              <FadeIn delay={0.07}>
                <h1 className="mt-5 text-[2rem] font-semibold leading-[1.06] tracking-[-0.04em] sm:text-[2.8rem] sm:leading-[1.03] lg:text-[3.4rem] lg:leading-[1.02]">
                  Revenue leak detection for activation, checkout, and billing.
                </h1>
              </FadeIn>
              <FadeIn delay={0.12}>
                <p className="mt-5 max-w-[40ch] text-[0.92rem] leading-[1.78] text-muted-foreground sm:text-[1rem] sm:leading-[1.86]">
                  CheckoutLeak detects revenue leakage across activation, checkout setup, and billing recovery, then ranks each issue by monthly dollar impact with clear operator-grade next actions.
                </p>
              </FadeIn>
              <FadeIn delay={0.17}>
                <div className="mt-7 flex flex-col gap-2.5 sm:flex-row sm:gap-3">
                  <Link
                    href={primaryCta.href}
                    className={
                      primaryCta.primary
                        ? "marketing-primary-cta inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold"
                        : "inline-flex items-center justify-center rounded-lg border border-border/60 px-5 py-3 text-sm text-muted-foreground/60"
                    }
                  >
                    {primaryCta.label}
                    {primaryCta.primary && <ArrowRight className="h-3.5 w-3.5" />}
                  </Link>
                  <Link
                    href="/#pricing"
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-border/60 px-5 py-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    View pricing
                  </Link>
                </div>
              </FadeIn>
            </div>

            <FadeIn delay={0.22}>
              <LiveIntelligencePanel />
            </FadeIn>
          </div>
        </section>

        {/* Section rule */}
        <div className="mx-auto max-w-6xl px-4 sm:px-8">
          <div className="h-px bg-border/60" />
        </div>

        {/* Detection surfaces */}
        <section className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-8 sm:py-16 lg:py-20">
          <InViewReveal>
            <p className="vault-eyebrow mb-3">Recovery signal families</p>
            <h2 className="text-[1.55rem] font-semibold leading-[1.13] tracking-[-0.03em] sm:text-[2.05rem] lg:text-[2.35rem]">
              Activation, checkout, and billing recovery. Every finding ranked by exposure.
            </h2>
            <p className="mt-3 max-w-[44ch] text-[0.9rem] leading-[1.75] text-muted-foreground sm:mt-4 sm:text-[0.97rem]">
              CheckoutLeak analyzes activation progression, checkout execution, and billing recovery as one money-first system. Each finding carries a monthly impact estimate and a next action.
            </p>
          </InViewReveal>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {detectionSurfaces.map((surface, i) => (
              <InViewReveal key={surface.title} delay={i * 0.09}>
                <article className="vault-panel-shell h-full p-5 sm:p-6">
                  <p className="font-mono text-[0.62rem] uppercase tracking-[0.09em] text-signal">
                    {surface.signal}
                  </p>
                  <h3 className="mt-3 text-[0.92rem] font-semibold text-foreground sm:text-[0.97rem]">
                    {surface.title}
                  </h3>
                  <p className="mt-2 text-[0.84rem] leading-[1.68] text-muted-foreground">
                    {surface.description}
                  </p>
                </article>
              </InViewReveal>
            ))}
          </div>
        </section>

        {/* Section rule */}
        <div className="mx-auto max-w-6xl px-4 sm:px-8">
          <div className="h-px bg-border/60" />
        </div>

        {/* Operator workflow */}
        <section className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-8 sm:py-16 lg:py-20">
          <InViewReveal>
            <div className="lg:grid lg:grid-cols-[5fr_7fr] lg:items-start lg:gap-14">
              <div>
                <p className="vault-eyebrow mb-3">Operator workflow</p>
                <h2 className="text-[1.55rem] font-semibold leading-[1.13] tracking-[-0.03em] sm:text-[2.05rem] lg:text-[2.35rem]">
                  From source to fix.
                </h2>
                <p className="mt-3 max-w-[34ch] text-[0.9rem] leading-[1.75] text-muted-foreground sm:mt-4 sm:text-[0.97rem]">
                  Four steps from initial connection to verified recovery.
                </p>
              </div>
              <div className="mt-8 overflow-hidden rounded-xl border border-border/55 lg:mt-0">
                {workflow.map((item, index) => (
                  <div
                    key={item.step}
                    className={[
                      "flex items-start gap-5 px-5 py-5 sm:px-6",
                      index < workflow.length - 1 ? "border-b border-border/40" : "",
                    ].join(" ")}
                  >
                    <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-signal/35 bg-signal/8">
                      <span className="font-mono text-[0.55rem] font-semibold tabular-nums text-signal">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                    </div>
                    <div>
                      <p className="text-[0.875rem] font-semibold text-foreground sm:text-sm">
                        {item.step}
                      </p>
                      <p className="mt-1 text-[0.84rem] leading-[1.65] text-muted-foreground">
                        {item.body}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </InViewReveal>
        </section>

        {/* Section rule */}
        <div className="mx-auto max-w-6xl px-4 sm:px-8">
          <div className="h-px bg-border/60" />
        </div>

        {/* Outcomes */}
        <section className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-8 sm:py-16 lg:py-20">
          <InViewReveal>
            <p className="vault-eyebrow mb-3">What changes</p>
            <h2 className="text-[1.55rem] font-semibold leading-[1.13] tracking-[-0.03em] sm:text-[2.05rem] lg:text-[2.35rem]">
              After adoption.
            </h2>
            <p className="mt-3 max-w-[42ch] text-[0.9rem] leading-[1.75] text-muted-foreground sm:mt-4 sm:text-[0.97rem]">
              Teams move from symptom spotting to a repeatable recovery loop grounded in impact and execution order.
            </p>
          </InViewReveal>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {outcomes.map((outcome, i) => (
              <InViewReveal key={outcome.title} delay={i * 0.09}>
                <article className="flex h-full flex-col rounded-xl border border-border/55 bg-card/20 p-5 sm:p-6">
                  <p className="font-mono text-[2rem] font-semibold leading-none tracking-[-0.03em] text-signal">
                    {outcome.metric}
                  </p>
                  <h3 className="mt-4 text-[0.875rem] font-semibold text-foreground sm:text-sm">
                    {outcome.title}
                  </h3>
                  <p className="mt-1.5 text-[0.84rem] leading-[1.65] text-muted-foreground">
                    {outcome.body}
                  </p>
                </article>
              </InViewReveal>
            ))}
          </div>
        </section>

        {/* Section rule */}
        <div className="mx-auto max-w-6xl px-4 sm:px-8">
          <div className="h-px bg-border/60" />
        </div>

        {/* CTA panel */}
        <section className="mx-auto w-full max-w-6xl px-4 pb-14 pt-10 sm:px-8 sm:pb-20 sm:pt-14 lg:pb-24 lg:pt-16">
          <InViewReveal>
            <div
              className="relative overflow-hidden rounded-xl px-6 py-10 text-center sm:px-10 sm:py-12 lg:px-12 lg:py-14"
              style={{
                border: isPending
                  ? "1px solid var(--line-default)"
                  : "1px solid color-mix(in oklab, var(--signal-line) 55%, var(--line-default) 45%)",
              }}
            >
              {!isPending && (
                <>
                  <div
                    aria-hidden
                    className="absolute inset-x-0 top-0 h-px rounded-t-xl"
                    style={{ background: "linear-gradient(to right, transparent, oklch(0.78 0.13 75 / 0.22), transparent)" }}
                  />
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 -z-10"
                    style={{ background: "radial-gradient(ellipse at 50% 0%, oklch(0.78 0.13 75 / 0.045), transparent 65%)" }}
                  />
                </>
              )}
              <p className="vault-eyebrow mb-4">Get started</p>
              <h2 className="mx-auto max-w-[22ch] text-[1.55rem] font-semibold leading-[1.13] tracking-[-0.03em] sm:text-[2.05rem] lg:text-[2.35rem]">
                Turn leakage into recovery.
              </h2>
              <p className="mx-auto mt-4 max-w-[36ch] text-[0.9rem] leading-[1.75] text-muted-foreground sm:text-[0.97rem]">
                Activate a plan, connect sources, and let CheckoutLeak rank where your next dollar of recovery should come from.
              </p>
              <div className="mt-7 flex flex-col items-center gap-2.5 sm:flex-row sm:justify-center sm:gap-3">
                <Link
                  href={primaryCta.href}
                  className={
                    primaryCta.primary
                      ? "marketing-primary-cta inline-flex w-full items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold sm:w-auto"
                      : "inline-flex items-center justify-center rounded-lg border border-border/60 px-6 py-3 text-sm text-muted-foreground/60"
                  }
                >
                  {primaryCta.label}
                  {primaryCta.primary && <ArrowRight className="h-3.5 w-3.5" />}
                </Link>
                <Link
                  href="/#pricing"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border/60 px-6 py-3 text-sm text-muted-foreground transition-colors hover:text-foreground sm:w-auto"
                >
                  View pricing
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </InViewReveal>
        </section>

      </div>
    </>
  )
}
