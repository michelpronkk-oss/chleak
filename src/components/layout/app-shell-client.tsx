"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Activity,
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
    return pathname === "/app"
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
      <aside className="hidden w-72 flex-col border-r border-border/70 bg-sidebar/80 px-5 py-6 backdrop-blur lg:fixed lg:inset-y-0 lg:flex">
        <CheckoutLeakLogo />
        <div className="mt-10 space-y-2">
          {navigationItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors",
                isNavActive(pathname, item.href)
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </div>

        <div className="mt-10 surface-card p-4">
          <p className="data-mono text-primary">Live Monitors</p>
          {liveMonitors.length ? (
            <ul className="mt-3 space-y-3 text-sm">
              {liveMonitors.map((monitor) => (
                <li key={monitor.storeId}>
                  <Link
                    href={monitor.href}
                    className="block rounded-lg border border-transparent px-2 py-2 transition-colors hover:border-border/70 hover:bg-background/45"
                  >
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <Store className="h-4 w-4 text-primary" />
                        {monitor.name}
                      </span>
                      <span className={cn("text-xs", monitor.statusTone)}>
                        {monitor.statusLabel}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {monitor.activeIssues} open · Last scan {monitor.latestScanLabel}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-xs text-muted-foreground">
              No active monitors yet. Connect your first source to start scan coverage.
            </p>
          )}
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-border/60 bg-background/80 backdrop-blur">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
            <div className="flex items-center gap-3 lg:hidden">
              <CheckoutLeakLogo />
            </div>
            <div className="hidden items-center gap-2 rounded-lg border border-border/60 bg-card/60 px-3 py-2 text-xs text-muted-foreground md:flex">
              <Command className="h-3 w-3" />
              Search issue, scan, or store
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="hidden items-center gap-1 rounded-md border border-border/60 px-2 py-1 sm:flex">
                <Activity className="h-3 w-3 text-primary" />
                Scan running
              </span>
              <span className="flex items-center gap-1 rounded-md border border-border/60 px-2 py-1">
                <AlertTriangle className="h-3 w-3 text-amber-300" />
                {activeIssueCount} active leaks
              </span>

              <DropdownMenu>
                <DropdownMenuTrigger className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
                  <Avatar size="sm" className="border border-border/70">
                    <AvatarFallback>{user.initials}</AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-2">
                    <p className="text-sm font-semibold">{user.fullName}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                    <p className="mt-1 text-xs text-primary">{user.roleLabel}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem render={<Link href="/app/settings#profile" />}>
                    <User className="h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem render={<Link href="/app/settings" />}>
                    <Settings className="h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem render={<Link href="/app/billing" />}>
                    <CreditCard className="h-4 w-4" />
                    Billing
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    render={
                      <Link href="/api/mock/onboarding?state=empty&next=/" />
                    }
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <main className="dashboard-grid min-h-[calc(100vh-4rem)] px-5 py-6 sm:px-8 lg:py-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>

      <nav className="fixed inset-x-4 bottom-4 z-30 overflow-x-auto rounded-2xl border border-border/60 bg-card/95 p-2 backdrop-blur lg:hidden">
        <div className="flex min-w-max items-center gap-2">
          {navigationItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-w-24 items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs",
                isNavActive(pathname, item.href)
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground"
              )}
            >
              <item.icon className="h-3.5 w-3.5" />
              {item.label}
            </Link>
          ))}
          <Link
            href="/"
            className="flex min-w-24 items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs text-muted-foreground"
          >
            <ArrowUpRight className="h-3.5 w-3.5" />
            Site
          </Link>
        </div>
      </nav>
    </div>
  )
}
