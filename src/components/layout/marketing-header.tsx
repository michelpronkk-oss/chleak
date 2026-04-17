import Link from "next/link"

import { CheckoutLeakLogo } from "@/components/brand/logo"
import { cn } from "@/lib/utils"

const links = [
  { href: "/product", label: "Product" },
  { href: "/#pricing", label: "Pricing" },
  {
    href: "/api/app/access?next=/app&source=header_nav",
    label: "Dashboard",
  },
]

export function MarketingHeader({ className }: { className?: string }) {
  return (
    <header className={cn("sticky top-0 z-30 w-full border-b border-border/50 bg-background/80 backdrop-blur", className)}>
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 sm:h-16 sm:px-6 lg:px-8">
        <CheckoutLeakLogo />
        <nav className="hidden items-center gap-7 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[13px] text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/#pricing"
            className="rounded-lg border border-border px-2.5 py-1.5 text-[11px] text-muted-foreground transition-colors hover:border-primary/60 hover:text-foreground md:hidden"
          >
            Pricing
          </Link>
          <Link
            href="/auth/sign-in"
            className="rounded-lg border border-border px-2.5 py-1.5 text-[11px] text-muted-foreground transition-colors hover:border-primary/60 hover:text-foreground sm:px-3 sm:py-2 sm:text-xs"
          >
            Sign in
          </Link>
          <Link
            href="/api/app/access?next=/app/billing&intent=choose-plan&source=header_primary"
            className="marketing-primary-cta rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition-transform hover:-translate-y-0.5 sm:px-3 sm:py-2 sm:text-xs"
          >
            Start plan setup
          </Link>
        </div>
      </div>
    </header>
  )
}
