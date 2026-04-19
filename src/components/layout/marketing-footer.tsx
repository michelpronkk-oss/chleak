import Link from "next/link"

import { CheckoutLeakLogo } from "@/components/brand/logo"

const footerGroups = [
  {
    title: "Product",
    links: [
      { label: "Product", href: "/product" },
      { label: "Pricing", href: "/pricing" },
      {
        label: "Open app",
        href: "/api/app/access?next=/app&source=footer_open_app",
      },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Contact", href: "/contact" },
      { label: "Request Access", href: "/request-access" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms of Use", href: "/terms" },
      { label: "Privacy Policy", href: "/privacy" },
    ],
  },
]

export function MarketingFooter() {
  return (
    <footer className="border-t border-border/60 py-8 sm:py-12">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:gap-12 lg:grid-cols-[1.2fr_1.8fr]">
          <div className="max-w-sm space-y-3">
            <CheckoutLeakLogo />
            <p className="text-[0.88rem] leading-[1.68] text-muted-foreground sm:text-sm sm:leading-[1.75]">
              Revenue leak intelligence for Shopify and Stripe operators.
            </p>
            <p className="text-[0.8rem] leading-[1.6] text-muted-foreground/50 sm:text-[0.83rem]">
              Checkout friction, payment gaps, and failed billing recovery. Ranked by monthly impact.
            </p>
            <a
              href="mailto:support@checkoutleak.com"
              className="inline-flex text-[0.85rem] text-primary transition-opacity hover:opacity-80 sm:text-sm"
            >
              support@checkoutleak.com
            </a>
          </div>

          <div className="grid gap-6 sm:grid-cols-3 sm:gap-8">
            {footerGroups.map((group) => (
              <div key={group.title}>
                <h3 className="font-mono text-[0.7rem] tracking-[0.12em] uppercase text-primary/70">
                  {group.title}
                </h3>
                <ul className="mt-3.5 space-y-2.5">
                  {group.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-7 flex flex-col gap-2 border-t border-border/60 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground/70">
            (c) 2026 CheckoutLeak. All rights reserved.
          </p>
          <p className="font-mono text-[0.63rem] tracking-[0.1em] uppercase text-muted-foreground/35">
            Operator-grade | Private by design
          </p>
        </div>
      </div>
    </footer>
  )
}
