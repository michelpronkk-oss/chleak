import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { MarketingPageLayout, PageSection } from "@/components/marketing/page-layout"

const categories = [
  {
    title: "Checkout friction detection",
    description:
      "Locate where conversion breaks inside the checkout path, including step-specific drop-off and device-specific behavior shifts.",
  },
  {
    title: "Payment method coverage gaps",
    description:
      "Identify where traffic intent and available payment methods are misaligned, especially across wallets and local market preferences.",
  },
  {
    title: "Failed billing and dunning leakage",
    description:
      "Quantify recoverable subscription revenue lost to retry timing, reminder sequencing, and payment update friction.",
  },
  {
    title: "Ranked revenue recovery actions",
    description:
      "Translate detection into action with a prioritized queue based on estimated monthly impact and operational urgency.",
  },
]

const workflow = [
  "Connect Shopify and Stripe data sources.",
  "Run continuous scans across checkout and billing events.",
  "Review structured issues with root cause and impact estimate.",
  "Execute ranked actions and track leakage reduction over time.",
]

const outputs = [
  "Issue feed with severity, source, and expected revenue impact",
  "Operator-ready next actions tied to each leak pattern",
  "Weekly summaries for leadership and revenue operations",
  "A repeatable workflow that keeps teams focused on highest return fixes",
]

export default function ProductPage() {
  return (
    <MarketingPageLayout
      eyebrow="Product"
      title="Revenue leak intelligence for checkout and billing operators"
      description="CheckoutLeak gives teams a precise operating layer for finding and fixing leakage before it compounds across acquisition and retention."
    >
      <PageSection title="Core system">
        <p>
          CheckoutLeak monitors checkout and billing behavior as one system. It
          detects leakage signals, estimates impact in monthly revenue terms,
          and presents fixes in execution order.
        </p>
      </PageSection>

      <PageSection title="Detection categories">
        <div className="space-y-5">
          {categories.map((category) => (
            <article key={category.title} className="border-l border-border/60 pl-4">
              <h3 className="text-sm font-semibold text-foreground sm:text-base">
                {category.title}
              </h3>
              <p className="mt-1.5">{category.description}</p>
            </article>
          ))}
        </div>
      </PageSection>

      <PageSection title="Operator workflow">
        <ol className="space-y-3">
          {workflow.map((step, index) => (
            <li key={step} className="flex gap-3">
              <span className="mt-0.5 font-mono text-xs text-primary">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </PageSection>

      <PageSection title="What your team receives">
        <ul className="space-y-3">
          {outputs.map((item) => (
            <li key={item} className="border-l border-border/60 pl-4">
              {item}
            </li>
          ))}
        </ul>
      </PageSection>

      <PageSection title="Why it matters">
        <p>
          Most teams can see revenue outcomes but cannot isolate leakage causes
          fast enough to improve them. CheckoutLeak closes that gap with clear
          detection, economic context, and actionability.
        </p>
        <div className="flex flex-col gap-3 pt-2 sm:flex-row">
          <Link
            href="/api/app/access?next=/app/billing&intent=choose-plan&source=product_page"
            className="marketing-primary-cta inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-transform hover:-translate-y-px"
          >
            Start plan setup
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <Link
            href="/#pricing"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            View Pricing
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </PageSection>
    </MarketingPageLayout>
  )
}
