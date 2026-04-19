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
        "inline-flex items-center gap-2.5 text-sm font-semibold tracking-[0.03em] text-foreground",
        className
      )}
    >
      <Image
        src="/logo.png"
        alt="CheckoutLeak"
        width={28}
        height={28}
        className="shrink-0 rounded-md object-contain"
        priority
      />
      <span>
        Checkout<span className="text-primary/80">Leak</span>
      </span>
    </Link>
  )
}
