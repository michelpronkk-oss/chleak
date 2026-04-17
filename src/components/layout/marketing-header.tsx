import Link from "next/link"

import { CheckoutLeakLogo } from "@/components/brand/logo"
import { cn } from "@/lib/utils"

const navLinks = [
  { href: "/product", label: "Product" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/api/app/access?next=/app&source=header_nav", label: "Dashboard" },
]

export function MarketingHeader({ className }: { className?: string }) {
  return (
    <header
      className={cn(
        "sticky top-0 z-30 w-full border-b border-border/50 bg-background/80 backdrop-blur",
        className
      )}
    >
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-5 sm:h-16 sm:px-8">
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

        <div className="flex items-center gap-3">
          <Link
            href="/auth/sign-in"
            className="text-[0.8125rem] text-muted-foreground transition-colors hover:text-foreground sm:rounded-lg sm:border sm:border-border/60 sm:px-3 sm:py-1.5 sm:text-xs"
          >
            Sign in
          </Link>
          <Link
            href="/api/app/access?next=/app/billing&intent=choose-plan&source=header_primary"
            className="marketing-primary-cta rounded-lg px-3 py-1.5 text-xs font-semibold transition-transform hover:-translate-y-0.5 sm:px-3.5"
          >
            Start monitoring
          </Link>
        </div>
      </div>
    </header>
  )
}
