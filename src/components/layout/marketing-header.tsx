import Link from "next/link"

import { CheckoutLeakLogo } from "@/components/brand/logo"
import { cn } from "@/lib/utils"

const links = [
  { href: "/product", label: "Product" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/app", label: "Dashboard" },
]

export function MarketingHeader({ className }: { className?: string }) {
  return (
    <header className={cn("sticky top-0 z-30 w-full border-b border-border/50 bg-background/80 backdrop-blur", className)}>
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5 sm:px-8">
        <CheckoutLeakLogo />
        <nav className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Link
            href="/contact#demo"
            className="rounded-lg border border-border px-3 py-2 text-xs text-muted-foreground transition-colors hover:border-primary/60 hover:text-foreground"
          >
            Book Demo
          </Link>
          <Link
            href="/app"
            className="marketing-primary-cta rounded-lg px-3 py-2 text-xs font-semibold transition-transform hover:-translate-y-0.5"
          >
            Open App
          </Link>
        </div>
      </div>
    </header>
  )
}
