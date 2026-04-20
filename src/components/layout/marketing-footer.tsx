import Link from "next/link"

import { CheckoutLeakLogo } from "@/components/brand/logo"
import { getServerSession } from "@/lib/auth/session"

const productLinks = [
  { label: "Product", href: "/product" },
  { label: "Pricing", href: "/pricing" },
]

const openAppLink = {
  label: "Open app",
  href: "/api/app/access?next=/app&source=footer_open_app",
}

const companyLinks = [
  { label: "Contact", href: "/contact" },
  { label: "Request Access", href: "/request-access" },
]

const legalLinks = [
  { label: "Terms of Use", href: "/terms" },
  { label: "Privacy Policy", href: "/privacy" },
]

export async function MarketingFooter() {
  const session = await getServerSession()
  const isAuthenticated = session !== null

  const resolvedProductLinks = isAuthenticated
    ? [...productLinks, openAppLink]
    : productLinks

  const footerGroups = [
    { title: "Product", links: resolvedProductLinks },
    { title: "Company", links: companyLinks },
    { title: "Legal", links: legalLinks },
  ]

  return (
    <footer className="border-t border-border py-8 sm:py-10">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:gap-10 lg:grid-cols-[1.15fr_1.85fr]">
          <div className="max-w-sm space-y-3.5">
            <CheckoutLeakLogo />
            <p className="text-[0.86rem] leading-[1.65] text-muted-foreground sm:text-sm sm:leading-[1.72]">
              Revenue leak intelligence for Shopify and Stripe operators.
            </p>
            <p className="text-[0.8rem] leading-[1.6] text-muted-foreground/70 sm:text-[0.83rem]">
              Checkout friction, payment gaps, and failed billing recovery. Ranked by monthly impact.
            </p>
            <a
              href="mailto:support@checkoutleak.com"
              className="vault-link inline-flex font-mono text-[0.7rem] tracking-[0.05em] uppercase sm:text-[0.72rem]"
            >
              support@checkoutleak.com
            </a>
          </div>

          <div className="grid gap-6 sm:grid-cols-3 sm:gap-8">
            {footerGroups.map((group) => (
              <div key={group.title}>
                <h3 className="font-mono text-[0.65rem] tracking-[0.1em] uppercase text-muted-foreground/80">
                  {group.title}
                </h3>
                <ul className="mt-3 space-y-2.5">
                  {group.links.map((link) => (
                    <li key={link.label}>
                      <Link href={link.href} className="vault-link text-sm">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-2 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground/70">
            (c) 2026 CheckoutLeak. All rights reserved.
          </p>
          <p className="font-mono text-[0.62rem] tracking-[0.08em] uppercase text-muted-foreground/50">
            Operator-grade / Private by design
          </p>
        </div>
      </div>
    </footer>
  )
}
