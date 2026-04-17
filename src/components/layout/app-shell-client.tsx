"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  AlertTriangle,
  ArrowUpRight,
  Command,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Settings,
  Store,
  User,
} from "lucide-react"

import { CheckoutLeakLogo } from "@/components/brand/logo"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

interface AppShellClientProps {
  children: React.ReactNode
  user: {
    fullName: string
    email: string
    roleLabel: string
    initials: string
  }
  activeIssueCount: number
  liveMonitors: Array<{
    storeId: string
    name: string
    href: string
    statusLabel: string
    statusTone: string
    activeIssues: number
    latestScanLabel: string
  }>
}

const navigationItems = [
  { href: "/app", label: "Overview", icon: LayoutDashboard },
  { href: "/app/stores", label: "Stores", icon: Store },
  { href: "/app/billing", label: "Billing", icon: CreditCard },
  { href: "/app/settings", label: "Settings", icon: Settings },
]

function isNavActive(pathname: string, href: string) {
  if (href === "/app") {
    return pathname === "/app" || pathname === "/app/connect"
  }

  return pathname === href || pathname.startsWith(`${href}/`)
}

export function AppShellClient({
  children,
  user,
  activeIssueCount,
  liveMonitors,
}: AppShellClientProps) {
  const pathname = usePathname()

  return (
    <div className="relative min-h-screen">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 flex-col border-r border-border/60 bg-sidebar/75 px-4 py-5 backdrop-blur lg:fixed lg:inset-y-0 lg:flex xl:w-72">
        <div className="px-1">
          <CheckoutLeakLogo />
        </div>

        <nav className="mt-7 space-y-0.5">
          {navigationItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] transition-colors",
                isNavActive(pathname, item.href)
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-muted-foreground hover:bg-sidebar-accent/40 hover:text-foreground"
              )}
            >
              <item.icon className="h-[1.0625rem] w-[1.0625rem] shrink-0" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="mt-6 space-y-1 rounded-xl border border-border/55 bg-background/25 p-3">
          <p className="px-1 font-mono text-[0.65rem] tracking-[0.1em] uppercase text-primary/55">
            Live Monitors
          </p>
          {liveMonitors.length ? (
            <ul className="mt-2 space-y-0.5 text-sm">
              {liveMonitors.map((monitor) => (
                <li key={monitor.storeId}>
                  <Link
                    href={monitor.href}
                    className="block rounded-lg px-2 py-2 transition-colors hover:bg-sidebar-accent/40"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-2 truncate text-[13px] text-muted-foreground">
                        <Store className="h-3.5 w-3.5 shrink-0 text-primary/70" />
                        <span className="truncate">{monitor.name}</span>
                      </span>
                      <span className={cn("shrink-0 text-xs", monitor.statusTone)}>
                        {monitor.statusLabel}
                      </span>
                    </div>
                    <p className="mt-0.5 pl-5 text-xs text-muted-foreground/55">
                      {monitor.activeIssues} open
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 px-1 text-xs text-muted-foreground/55">
              No monitors yet. Connect a source to begin.
            </p>
          )}
        </div>
      </aside>

      <div className="lg:pl-64 xl:pl-72">
        {/* Top bar */}
        <header className="sticky top-0 z-20 border-b border-border/60 bg-background/80 backdrop-blur">
          <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:h-16 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 lg:hidden">
              <CheckoutLeakLogo />
            </div>

            <div className="hidden items-center gap-2 rounded-lg border border-border/55 bg-card/55 px-3 py-2 text-xs text-muted-foreground md:flex">
              <Command className="h-3 w-3" />
              Search issue, scan, or store
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground sm:gap-2.5">
              {activeIssueCount > 0 && (
                <span className="hidden items-center gap-1.5 rounded-md border border-border/55 px-2.5 py-1.5 sm:flex">
                  <AlertTriangle className="h-3 w-3 text-amber-300" />
                  {activeIssueCount} active
                </span>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger className="rounded-xl border border-border/60 bg-card/60 p-1.5 outline-none transition-colors hover:border-primary/30 focus-visible:ring-2 focus-visible:ring-primary/35 sm:px-2.5">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6 border border-border/60 sm:h-7 sm:w-7">
                      <AvatarFallback className="text-xs">{user.initials}</AvatarFallback>
                    </Avatar>
                    <div className="hidden min-w-0 text-left sm:block">
                      <p className="max-w-36 truncate text-xs font-medium text-foreground">
                        {user.fullName}
                      </p>
                      <p className="max-w-36 truncate text-[11px] text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </div>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  align="end"
                  className="w-60 rounded-xl border border-border/70 bg-popover/95 p-1 backdrop-blur"
                >
                  <div className="px-2 py-2.5">
                    <p className="text-sm font-semibold">{user.fullName}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                    <p className="mt-1 text-xs text-primary">{user.roleLabel}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="py-2" render={<Link href="/app/settings#profile" />}>
                    <User className="h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem className="py-2" render={<Link href="/app/settings" />}>
                    <Settings className="h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem className="py-2" render={<Link href="/app/billing" />}>
                    <CreditCard className="h-4 w-4" />
                    Billing
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="py-2"
                    variant="destructive"
                    render={<Link href="/api/auth/sign-out?next=/" />}
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <main className="dashboard-grid min-h-[calc(100vh-3.5rem)] px-4 py-5 pb-24 sm:min-h-[calc(100vh-4rem)] sm:px-6 sm:py-6 lg:px-8 lg:py-7 lg:pb-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-3 bottom-3 z-30 rounded-xl border border-border/60 bg-card/95 p-1.5 backdrop-blur lg:hidden">
        <div className="flex items-center">
          {navigationItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 rounded-lg px-2 py-2 text-[10px] font-medium transition-colors",
                isNavActive(pathname, item.href)
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
          <Link
            href="/"
            className="flex flex-1 flex-col items-center gap-1 rounded-lg px-2 py-2 text-[10px] font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowUpRight className="h-4 w-4" />
            Site
          </Link>
        </div>
      </nav>
    </div>
  )
}
