import Link from "next/link"

import { cn } from "@/lib/utils"

interface CheckoutLeakLogoProps {
  className?: string
  href?: string
}

export function CheckoutLeakLogo({ className, href = "/" }: CheckoutLeakLogoProps) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-3 text-sm font-semibold tracking-[0.04em] text-foreground",
        className
      )}
    >
      <span className="relative inline-flex h-8 w-8 items-center justify-center rounded-lg border border-primary/40 bg-primary/20 shadow-[0_0_30px_rgba(70,225,215,0.35)]">
        <span className="h-2 w-2 rounded-full bg-primary" />
      </span>
      <span>
        Checkout<span className="text-primary">Leak</span>
      </span>
    </Link>
  )
}
