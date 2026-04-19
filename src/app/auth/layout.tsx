import Link from "next/link"

import { CheckoutLeakLogo } from "@/components/brand/logo"

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="relative min-h-screen" style={{ overflowX: "clip" }}>
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
