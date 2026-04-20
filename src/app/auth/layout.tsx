import type { Metadata } from "next"
import Link from "next/link"

import { CheckoutLeakLogo } from "@/components/brand/logo"

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="relative min-h-screen" style={{ overflowX: "clip" }}>
      {/* Ambient dot-grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,1) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          opacity: 0.088,
          maskImage: "radial-gradient(ellipse 90% 70% at 50% 30%, black 20%, transparent 80%)",
          WebkitMaskImage: "radial-gradient(ellipse 90% 70% at 50% 30%, black 20%, transparent 80%)",
        }}
      />
      {/* Amber dot layer — top-center glow via dots, no blur */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: "radial-gradient(circle, oklch(0.78 0.13 75 / 0.9) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          opacity: 0.15,
          maskImage: "radial-gradient(ellipse 75% 55% at 50% 0%, black 0%, transparent 72%)",
          WebkitMaskImage: "radial-gradient(ellipse 75% 55% at 50% 0%, black 0%, transparent 72%)",
        }}
      />
      <header className="relative z-10 border-b border-border/40">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-5 sm:h-16 sm:px-8">
          <CheckoutLeakLogo />
          <Link
            href="/"
            className="text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            Back
          </Link>
        </div>
      </header>

      <main className="relative z-10 flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4 py-10 sm:min-h-[calc(100vh-4rem)] sm:py-14">
        {children}
      </main>
    </div>
  )
}
