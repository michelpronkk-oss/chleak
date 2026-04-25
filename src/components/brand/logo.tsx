import Link from "next/link"

import { cn } from "@/lib/utils"

interface SilentLeakLogoProps {
  className?: string
  href?: string
}

export function SilentLeakLogo({ className, href = "/" }: SilentLeakLogoProps) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-2 text-sm font-medium tracking-[-0.01em]",
        className
      )}
      aria-label="SilentLeak"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 400 96"
        className="h-7 w-auto shrink-0"
        role="img"
      >
        <g transform="translate(0, 8)">
          <svg x="0" y="0" width="80" height="80" viewBox="0 0 240 240">
            <path
              d="M 68 68 L 132 68 L 132 88 L 98 88 C 82 88 74 96 74 108 C 74 120 82 128 98 128 L 142 128 C 162 128 174 140 174 160 C 174 180 162 192 142 192 L 58 192 L 58 172 L 138 172 C 150 172 156 168 156 160 C 156 152 150 148 138 148 L 96 148 C 72 148 56 132 56 108 C 56 84 72 68 96 68 Z"
              fill="#D99235"
            />
            <path d="M 148 44 L 176 44 L 176 64 L 148 64 Z" fill="#F2B45A" />
          </svg>
        </g>
        <text
          x="96"
          y="66"
          fontFamily="Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
          fontSize="42"
          fontWeight="600"
          letterSpacing="-0.02em"
        >
          <tspan fill="#F5F2EA">Silent</tspan>
          <tspan fill="#8B949E">Leak</tspan>
        </text>
      </svg>
    </Link>
  )
}
