import Image from "next/image"
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
      <Image
        src="/logo.png"
        alt=""
        width={20}
        height={20}
        className="shrink-0"
        unoptimized
      />
      <span className="leading-none">CheckoutLeak</span>
    </Link>
  )
}
