import { MarketingFooter } from "@/components/layout/marketing-footer"
import { MarketingHeader } from "@/components/layout/marketing-header"
import MarketingHomePage from "@/components/marketing/home-page"
import { getPublicAccessState } from "@/lib/auth/public-access"

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const accessState = await getPublicAccessState()
  const params = await searchParams
  const intent = Array.isArray(params.intent) ? params.intent[0] : params.intent
  const showAccessNotice = intent === "app"

  return (
    <div className="relative min-h-screen">
      <MarketingHeader accessState={accessState} />
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
