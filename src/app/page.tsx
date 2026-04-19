import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { MarketingFooter } from "@/components/layout/marketing-footer"
import { MarketingHeader } from "@/components/layout/marketing-header"
import MarketingHomePage from "@/components/marketing/home-page"
import { getPublicAccessState } from "@/lib/auth/public-access"

export const metadata: Metadata = {
  title: {
    absolute: "CheckoutLeak — Revenue Leak Detection for Shopify and Stripe",
  },
  description:
    "Detect lost revenue in Shopify checkout and Stripe billing flows. CheckoutLeak scans for payment friction, coverage gaps, and billing recovery failures, and delivers ranked actions by monthly impact.",
  openGraph: {
    title: "CheckoutLeak — Revenue Leak Detection for Shopify and Stripe",
    description:
      "Detect lost revenue in Shopify checkout and Stripe billing flows. CheckoutLeak scans for payment friction, coverage gaps, and billing recovery failures, and delivers ranked actions by monthly impact.",
    url: "/",
    type: "website",
  },
  twitter: {
    title: "CheckoutLeak — Revenue Leak Detection for Shopify and Stripe",
    description:
      "Detect lost revenue in Shopify checkout and Stripe billing flows. Ranked recovery actions by monthly impact.",
  },
  alternates: {
    canonical: "/",
  },
}

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "CheckoutLeak",
  url: "https://checkoutleak.com",
  description: "Revenue leak detection for Shopify and Stripe checkout and billing flows.",
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const accessState = await getPublicAccessState()
  const params = await searchParams
  const code = Array.isArray(params.code) ? params.code[0] : params.code
  if (typeof code === "string" && code.length > 0) {
    redirect(`/auth/callback?code=${encodeURIComponent(code)}&next=%2Fapp`)
  }
  const intent = Array.isArray(params.intent) ? params.intent[0] : params.intent
  const showAccessNotice = intent === "app"

  return (
    <div className="relative min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <MarketingHeader accessState={accessState} className="hidden md:block" />
      <main>
        {showAccessNotice ? (
          <div className="mx-auto mt-5 w-full max-w-6xl px-5 sm:px-8">
            <div className="rounded-lg border border-border/70 bg-card/60 px-4 py-3 text-sm text-muted-foreground">
              Select a plan to activate monitoring. After activation, connect Shopify or Stripe to start your first scan.
            </div>
          </div>
        ) : null}
        <MarketingHomePage accessState={accessState} />
      </main>
      <MarketingFooter />
    </div>
  )
}
