import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { getPublicAccessState } from "@/lib/auth/public-access"
import { getServerSession } from "@/lib/auth/session"
import { FadeIn } from "@/components/motion/fade-in"
import { InViewReveal } from "@/components/motion/in-view-reveal"
import { LiveIntelligencePanel } from "@/components/marketing/live-intelligence-panel"

export const metadata: Metadata = {
  title: "Revenue Intelligence for Checkout and Billing Operators",
  description:
    "CheckoutLeak connects to Shopify and Stripe, detects revenue leakage across checkout steps, payment methods, and billing recovery, and ranks each issue by monthly dollar impact.",
  openGraph: {
    title: "Revenue Intelligence for Checkout and Billing Operators | CheckoutLeak",
    description:
      "CheckoutLeak connects to Shopify and Stripe, detects revenue leakage across checkout steps, payment methods, and billing recovery, and ranks each issue by monthly dollar impact.",
    url: "/product",
    type: "website",
  },
  twitter: {
    title: "Revenue Intelligence for Checkout and Billing Operators | CheckoutLeak",
    description:
      "Detect revenue leakage across checkout steps, payment methods, and billing recovery. Ranked by monthly impact.",
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
    "Revenue intelligence platform for checkout and billing operators. Detects and quantifies lost revenue in Shopify and Stripe flows.",
  url: "https://checkoutleak.com/product",
}

const detectionSurfaces = [
  {
    title: "Checkout leakage",
    description:
      "Step-level conversion breaks by device, market, and session quality so operators can isolate where intent is lost.",
    signal: "Shipping step drop-off variance",
  },
  {
    title: "Payment coverage mismatch",
    description:
      "Wallet and local method gaps where high-intent traffic is not matched with the right payment options.",
    signal: "iOS wallet coverage gap",
  },
  {
    title: "Billing recovery leakage",
    description:
      "Failed renewal and dunning inefficiencies quantified as recoverable monthly revenue exposure.",
    signal: "Retry cadence underperforming",
  },
]

const workflow = [
  {
    step: "Connect sources",
    body: "Connect Shopify and Stripe to establish full checkout and billing visibility.",
  },
  {
    step: "Scan and quantify",
    body: "Continuously evaluate event flow, method coverage, and retry behavior with monthly impact estimates.",
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
    title: "Faster issue isolation",
    body: "Teams move from symptom spotting to root cause in one workspace.",
  },
  {
    title: "Higher recovery confidence",
    body: "Every fix is paired with expected impact and post-change success signals.",
  },
  {
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

      <div className="mx-auto w-full max-w-5xl px-4 pb-12 pt-8 sm:px-6 sm:pb-20 sm:pt-14 lg:px-8 lg:pb-24 lg:pt-18">

        {/* Hero */}
        <div className="grid gap-8 lg:grid-cols-[1fr_400px] lg:items-start lg:gap-14">
          <div>
            <FadeIn delay={0}>
              <p className="vault-kicker-pill">Product</p>
            </FadeIn>
            <FadeIn delay={0.07}>
              <h1 className="mt-4 text-balance text-[1.72rem] font-semibold leading-[1.08] tracking-[-0.03em] sm:text-4xl sm:leading-[1.03] lg:text-5xl">
                Revenue intelligence for checkout and billing operators
              </h1>
            </FadeIn>
            <FadeIn delay={0.13}>
              <p className="mt-4 max-w-[44ch] text-sm leading-6 text-muted-foreground sm:text-base sm:leading-8">
                CheckoutLeak converts fragmented commerce signals into ranked revenue recovery
                decisions for Shopify and Stripe teams.
              </p>
            </FadeIn>
            <FadeIn delay={0.19}>
              <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:gap-3">
                <Link
                  href={primaryCta.href}
                  className={
                    primaryCta.primary
                      ? "marketing-primary-cta inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-transform hover:-translate-y-px"
                      : "inline-flex items-center justify-center rounded-lg border border-border/60 px-5 py-2.5 text-sm text-muted-foreground/60"
                  }
                >
                  {primaryCta.label}
                  {primaryCta.primary && <ArrowRight className="h-3.5 w-3.5" />}
                </Link>
                <Link
                  href="/#pricing"
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  View pricing
                </Link>
              </div>
            </FadeIn>
          </div>

          <FadeIn delay={0.24}>
            <LiveIntelligencePanel />
          </FadeIn>
        </div>

        {/* Below-fold */}
        <div className="mt-14 space-y-12 sm:mt-18 sm:space-y-14 lg:mt-20 lg:space-y-16">

          {/* Detection surfaces */}
          <InViewReveal>
            <div>
              <div className="h-px bg-border/70" />
              <h2 className="mt-6 text-[1.03rem] font-semibold tracking-tight sm:text-xl lg:text-2xl">
                Detection surfaces
              </h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {detectionSurfaces.map((surface) => (
                  <article key={surface.title} className="vault-panel-shell p-4 sm:p-5">
                    <p
                      className="font-mono text-[0.62rem] uppercase tracking-[0.09em]"
                      style={{ color: "var(--signal)" }}
                    >
                      {surface.signal}
                    </p>
                    <h3 className="mt-2 text-sm font-semibold text-foreground sm:text-base">
                      {surface.title}
                    </h3>
                    <p className="mt-1.5 text-sm leading-6 text-muted-foreground sm:mt-2">
                      {surface.description}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </InViewReveal>

          {/* Operator workflow */}
          <InViewReveal>
            <div>
              <div className="h-px bg-border/70" />
              <h2 className="mt-6 text-[1.03rem] font-semibold tracking-tight sm:text-xl lg:text-2xl">
                Operator workflow
              </h2>
              <div className="mt-4 vault-panel-shell overflow-hidden">
                {workflow.map((item, index) => (
                  <div
                    key={item.step}
                    className="flex items-start gap-4 px-4 py-3.5 sm:px-5 sm:py-4"
                    style={{
                      borderBottom:
                        index < workflow.length - 1 ? "1px solid var(--line-subtle)" : undefined,
                    }}
                  >
                    <span
                      className="mt-0.5 shrink-0 font-mono text-[0.7rem] tabular-nums"
                      style={{ color: "var(--signal)" }}
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-foreground sm:text-base">
                        {item.step}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </InViewReveal>

          {/* Outcomes */}
          <InViewReveal>
            <div>
              <div className="h-px bg-border/70" />
              <h2 className="mt-6 text-[1.03rem] font-semibold tracking-tight sm:text-xl lg:text-2xl">
                What changes after adoption
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
                Most teams can see topline outcomes but not the specific leakage mechanics that
                drive them. CheckoutLeak gives operators a repeatable recovery loop grounded in
                impact and execution order.
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {outcomes.map((outcome) => (
                  <article
                    key={outcome.title}
                    className="rounded-xl border bg-card/30 p-4 sm:p-5"
                    style={{ borderColor: "var(--line-default)" }}
                  >
                    <h3 className="text-sm font-semibold text-foreground">{outcome.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{outcome.body}</p>
                  </article>
                ))}
              </div>
            </div>
          </InViewReveal>

          {/* CTA panel */}
          <InViewReveal>
            <div
              className="rounded-2xl border p-6 sm:p-8 lg:p-10"
              style={{
                borderColor:
                  "color-mix(in oklab, var(--signal-line) 30%, var(--line-default) 70%)",
                background:
                  "linear-gradient(135deg, oklch(0.78 0.13 75 / 0.06) 0%, transparent 60%), var(--ink-100)",
              }}
            >
              <p
                className="font-mono text-[0.65rem] tracking-[0.12em] uppercase"
                style={{ color: "var(--signal)" }}
              >
                Get started
              </p>
              <h2 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">
                Turn leakage insight into a recovery system.
              </h2>
              <p className="mt-2.5 max-w-[44ch] text-sm leading-6 text-muted-foreground sm:mt-3 sm:text-base sm:leading-7">
                Activate a plan, connect sources, and let CheckoutLeak rank where your next dollar
                of recovery should come from.
              </p>
              <div className="mt-5 flex flex-col gap-2.5 sm:flex-row sm:gap-3">
                <Link
                  href={primaryCta.href}
                  className={
                    primaryCta.primary
                      ? "marketing-primary-cta inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-transform hover:-translate-y-px"
                      : "inline-flex items-center justify-center rounded-lg border border-border/60 px-5 py-2.5 text-sm text-muted-foreground/60"
                  }
                >
                  {primaryCta.label}
                  {primaryCta.primary && <ArrowRight className="h-3.5 w-3.5" />}
                </Link>
                <Link
                  href="/#pricing"
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  View pricing
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </InViewReveal>

        </div>
      </div>
    </>
  )
}
