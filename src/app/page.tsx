import { MarketingFooter } from "@/components/layout/marketing-footer"
import { MarketingHeader } from "@/components/layout/marketing-header"
import MarketingHomePage from "@/components/marketing/home-page"

export default function HomePage() {
  return (
    <div className="relative min-h-screen">
      <MarketingHeader />
      <main>
        <MarketingHomePage />
      </main>
      <MarketingFooter />
    </div>
  )
}
