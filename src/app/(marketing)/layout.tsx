import { MarketingFooter } from "@/components/layout/marketing-footer"
import { MarketingHeader } from "@/components/layout/marketing-header"

export default function MarketingLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="relative min-h-screen">
      <MarketingHeader />
      <main>{children}</main>
      <MarketingFooter />
    </div>
  )
}
