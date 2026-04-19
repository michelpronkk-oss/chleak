import Link from "next/link"

import { CheckoutLeakLogo } from "@/components/brand/logo"
import { getPublicAccessState, type PublicAccessState } from "@/lib/auth/public-access"
import { cn } from "@/lib/utils"

const navLinks = [
  { href: "/product", label: "Product" },
  { href: "/pricing", label: "Pricing" },
]

interface MarketingHeaderProps {
  className?: string
  accessState?: PublicAccessState
}

export async function MarketingHeader({ className, accessState }: MarketingHeaderProps) {
  const resolvedAccessState = accessState ?? (await getPublicAccessState())

  const cta =
    resolvedAccessState === "approved"
      ? {
          label: "Open app",
          href: "/api/app/access?next=/app&intent=app&source=header_open_app",
          tone: "marketing-primary-cta",
        }
      : resolvedAccessState === "pending"
        ? {
            label: "Under review",
            href: "/access-review",
            tone: "border border-border/70 bg-card/30 text-muted-foreground",
          }
        : null

  return (
    <header
      className={cn(
        "sticky top-0 z-30 w-full border-b border-border/50 bg-background/80 backdrop-blur",
        className
      )}
    >
      <div className="mx-auto flex h-[3.25rem] w-full max-w-6xl items-center justify-between px-4 sm:h-16 sm:px-8">
        <CheckoutLeakLogo />

        <nav className="hidden items-center gap-7 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[0.8125rem] text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {cta ? (
          <Link
            href={cta.href}
            className={cn(
              "rounded-lg px-2.5 py-1.5 text-[0.69rem] font-semibold transition-transform hover:-translate-y-0.5 sm:px-3.5 sm:text-xs",
              cta.tone
            )}
          >
            {cta.label}
          </Link>
        ) : null}
      </div>
    </header>
  )
}
