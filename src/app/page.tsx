import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { MarketingFooter } from "@/components/layout/marketing-footer"
import { MarketingHeader } from "@/components/layout/marketing-header"
import MarketingHomePage from "@/components/marketing/home-page"
import { getPublicAccessState } from "@/lib/auth/public-access"
import { getServerSession } from "@/lib/auth/session"

export const metadata: Metadata = {
  title: {
    absolute: "CheckoutLeak - Revenue Leak Detection for Activation, Checkout, and Billing",
  },
  description:
    "Detect revenue leaks across activation, checkout setup, and billing recovery. CheckoutLeak ranks findings by monthly impact and next action.",
  openGraph: {
    title: "CheckoutLeak - Revenue Leak Detection for Activation, Checkout, and Billing",
    description:
      "Detect revenue leaks across activation, checkout setup, and billing recovery. CheckoutLeak ranks findings by monthly impact and next action.",
    url: "/",
    type: "website",
  },
  twitter: {
    title: "CheckoutLeak - Revenue Leak Detection for Activation, Checkout, and Billing",
    description:
      "Detect activation, checkout setup, and billing recovery leaks. Ranked recovery actions by monthly impact.",
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
  description: "Revenue leak detection across activation, checkout setup, and billing recovery.",
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const [accessState, session] = await Promise.all([
    getPublicAccessState(),
    getServerSession(),
  ])
  const isAuthenticated = session !== null
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
        <MarketingHomePage accessState={accessState} isAuthenticated={isAuthenticated} />
      </main>
      <MarketingFooter />
    </div>
  )
}
