import Link from "next/link"

import { SilentLeakLogo } from "@/components/brand/logo"
import { getPublicAccessState, type PublicAccessState } from "@/lib/auth/public-access"
import { getServerSession } from "@/lib/auth/session"
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
  const [resolvedAccessState, session] = await Promise.all([
    accessState ? Promise.resolve(accessState) : getPublicAccessState(),
    getServerSession(),
  ])
  const isAuthenticated = session !== null

  const cta =
    resolvedAccessState === "approved"
      ? isAuthenticated
        ? {
            label: "Open app",
            href: "/api/app/access?next=/app&intent=app&source=header_open_app",
            tone: "marketing-primary-cta",
          }
        : {
            label: "Sign in",
            href: "/auth/sign-in",
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
        "sticky top-0 z-30 w-full border-b border-border bg-background/85 backdrop-blur-xl",
        className
      )}
    >
      <div className="mx-auto flex h-[3.35rem] w-full max-w-6xl items-center justify-between px-4 sm:h-14 sm:px-8">
        <SilentLeakLogo />

        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="vault-link rounded-md px-2.5 py-1 text-[0.79rem]"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {cta ? (
          <Link
            href={cta.href}
            className={cn(
              "rounded-md px-3 py-1.5 text-[0.68rem] font-medium tracking-[0.04em] uppercase sm:text-[0.7rem]",
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
