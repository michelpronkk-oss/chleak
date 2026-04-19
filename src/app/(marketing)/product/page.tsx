import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { MarketingPageLayout, PageSection } from "@/components/marketing/page-layout"

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

export default function ProductPage() {
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
      <MarketingPageLayout
      eyebrow="Product"
      title="A revenue intelligence system for checkout and billing operators"
      description="CheckoutLeak converts fragmented commerce signals into ranked revenue recovery decisions for Shopify and Stripe teams."
    >
      <section className="surface-card-strong overflow-hidden p-4 sm:p-6 lg:p-8">
        <div className="grid gap-4 sm:gap-5 lg:grid-cols-[1.25fr_1fr] lg:items-start">
          <div>
            <p className="font-mono text-[0.7rem] tracking-[0.1em] uppercase text-primary/70">
              Core System
            </p>
            <h2 className="mt-1.5 text-lg font-semibold tracking-tight sm:mt-2 sm:text-2xl lg:text-[1.9rem]">
              Detect the leak, quantify the impact, execute the fix.
            </h2>
            <p className="mt-2.5 max-w-[48ch] text-sm leading-6 text-muted-foreground sm:mt-3 sm:text-base sm:leading-7">
              CheckoutLeak unifies checkout and billing telemetry into one
              operator model. Each finding is tied to financial consequence and
              an execution path your team can run immediately.
            </p>
          </div>

          <div className="rounded-xl border border-border/65 bg-background/35 p-3.5 sm:p-5">
            <p className="font-mono text-[0.67rem] uppercase tracking-[0.09em] text-primary/75">
              Live intelligence frame
            </p>
            <div className="mt-2.5 space-y-2.5 sm:mt-3 sm:space-y-3">
              <div className="rounded-lg border border-border/65 bg-background/40 px-3 py-2.5">
                <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground/70">
                  Estimated monthly leakage
                </p>
                <p className="mt-1 font-mono text-xl font-semibold text-destructive">
                  $58.9k
                </p>
              </div>
              <div className="rounded-lg border border-primary/30 bg-primary/[0.08] px-3 py-2.5">
                <p className="text-xs uppercase tracking-[0.08em] text-primary/75">
                  Top priority
                </p>
                <p className="mt-1 text-sm text-foreground">
                  Shipping step conversion leak
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <PageSection title="Detection surfaces">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {detectionSurfaces.map((surface) => (
            <article
              key={surface.title}
              className="rounded-xl border border-border/65 bg-card/40 p-3.5 sm:p-5"
            >
              <p className="font-mono text-[0.66rem] uppercase tracking-[0.09em] text-primary/70">
                {surface.signal}
              </p>
              <h3 className="mt-2 text-sm font-semibold text-foreground sm:text-base">
                {surface.title}
              </h3>
              <p className="mt-1.5 text-sm leading-6 sm:mt-2">{surface.description}</p>
            </article>
          ))}
        </div>
      </PageSection>

      <PageSection title="Operator workflow">
        <ol className="space-y-3">
          {workflow.map((item, index) => (
            <li
              key={item.step}
              className="rounded-xl border border-border/60 bg-background/35 px-3.5 py-3 sm:px-5 sm:py-3.5"
            >
              <div className="flex items-start gap-3">
                <span className="mt-0.5 font-mono text-xs text-primary">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground sm:text-base">
                    {item.step}
                  </p>
                  <p className="mt-1 text-sm leading-6 sm:mt-1.5">{item.body}</p>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </PageSection>

      <PageSection title="What changes after adoption">
        <p>
          Most teams can see topline outcomes but not the specific leakage
          mechanics that drive them. CheckoutLeak gives operators a repeatable
          recovery loop grounded in impact and execution order.
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          {outcomes.map((outcome) => (
            <article
              key={outcome.title}
              className="rounded-xl border border-border/65 bg-card/35 p-3.5 sm:p-4"
            >
              <h3 className="text-sm font-semibold text-foreground">{outcome.title}</h3>
              <p className="mt-2 text-sm leading-6">{outcome.body}</p>
            </article>
          ))}
        </div>
      </PageSection>

      <section className="surface-card-strong p-4 sm:p-6 lg:p-8">
        <p className="font-mono text-[0.7rem] tracking-[0.1em] uppercase text-primary/70">
          Get started
        </p>
        <h2 className="mt-1.5 text-lg font-semibold tracking-tight sm:mt-2 sm:text-2xl">
          Turn leakage insight into a recovery system.
        </h2>
        <p className="mt-2.5 max-w-[48ch] text-sm leading-6 text-muted-foreground sm:mt-3 sm:text-base sm:leading-7">
          Activate a plan, connect sources, and let CheckoutLeak rank where
          your next dollar of recovery should come from.
        </p>
        <div className="mt-4 flex flex-col gap-2.5 sm:mt-5 sm:flex-row sm:gap-3">
          <Link
            href="/api/app/access?next=/app/billing&intent=choose-plan&source=product_page"
            className="marketing-primary-cta inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-transform hover:-translate-y-px"
          >
            Start monitoring
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <Link
            href="/pricing"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            View pricing
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>
    </MarketingPageLayout>
    </>
  )
}
