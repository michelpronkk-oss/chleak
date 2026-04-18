import Link from "next/link"

import { CheckoutLeakLogo } from "@/components/brand/logo"
import { getServerSession } from "@/lib/auth/session"
import { cn } from "@/lib/utils"
import { createSupabaseAdminClient } from "@/lib/supabase/shared"
import {
  getPlanEntitlement,
  getPlanStateForOrganization,
} from "@/server/services/plan-state-service"

const navLinks = [
  { href: "/product", label: "Product" },
  { href: "/pricing", label: "Pricing" },
]

interface HeaderCta {
  label: string
  href: string
}

async function hasConnectedSource(organizationId: string) {
  const admin = createSupabaseAdminClient()
  const result = await admin
    .from("store_integrations")
    .select("id", { head: true, count: "exact" })
    .eq("organization_id", organizationId)
    .in("provider", ["shopify", "stripe"])
    .in("status", ["connected", "syncing"])

  if (result.error) {
    return false
  }

  return (result.count ?? 0) > 0
}

async function getMarketingHeaderCta(): Promise<HeaderCta> {
  try {
    const session = await getServerSession()

    if (!session?.membership) {
      return {
        label: "Start monitoring",
        href: "/pricing",
      }
    }

    const planState = await getPlanStateForOrganization(session.membership.organizationId)
    const entitlement = getPlanEntitlement(planState)

    if (!entitlement.hasActiveAccess) {
      return {
        label: "Continue setup",
        href: "/app/billing?intent=plan_required",
      }
    }

    const connected = await hasConnectedSource(session.membership.organizationId)

    if (!connected) {
      return {
        label: "Connect source",
        href: "/app/connect",
      }
    }

    return {
      label: "Open app",
      href: "/app",
    }
  } catch {
    return {
      label: "Start monitoring",
      href: "/pricing",
    }
  }
}

export async function MarketingHeader({ className }: { className?: string }) {
  const cta = await getMarketingHeaderCta()

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

        <Link
          href={cta.href}
          className="marketing-primary-cta rounded-lg px-2.5 py-1.5 text-[0.69rem] font-semibold transition-transform hover:-translate-y-0.5 sm:px-3.5 sm:text-xs"
        >
          {cta.label}
        </Link>
      </div>
    </header>
  )
}
