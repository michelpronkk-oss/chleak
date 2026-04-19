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
        "inline-flex items-center gap-2 text-sm font-medium tracking-[-0.01em] text-foreground",
        className
      )}
    >
      <span className="relative h-4 w-4 shrink-0 border border-foreground/95">
        <span className="absolute right-[2px] top-[2px] h-1.5 w-1.5 rounded-full bg-signal" />
      </span>
      <span className="leading-none">
        CheckoutLeak
      </span>
    </Link>
  )
}
