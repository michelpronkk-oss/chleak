import Link from "next/link"

import { CheckoutLeakLogo } from "@/components/brand/logo"

const footerGroups = [
  {
    title: "Product",
    links: [
      { label: "Pricing", href: "/#pricing" },
      {
        label: "Dashboard",
        href: "/api/app/access?next=/app&source=footer_dashboard",
      },
      { label: "Product", href: "/product" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Contact", href: "/contact" },
      { label: "Book Demo", href: "/contact#demo" },
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
          <div className="max-w-sm space-y-3.5">
            <CheckoutLeakLogo />
            <p className="text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
              Find lost revenue across checkout, payments, and billing.
            </p>
            <a
              href="mailto:support@checkoutleak.com"
              className="inline-flex text-sm text-primary transition-opacity hover:opacity-80"
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

        <div className="mt-7 border-t border-border/60 pt-4">
          <p className="text-xs text-muted-foreground">
            © 2026 CheckoutLeak. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}


