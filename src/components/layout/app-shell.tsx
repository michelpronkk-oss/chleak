import { getAppShellData } from "@/server/services/app-service"

import { AppShellClient } from "./app-shell-client"

// Demo workspace is only available in non-production environments.
// In production it is fully hidden regardless of cookie state.
const DEMO_ENABLED = process.env.NODE_ENV !== "production"

export async function AppShell({ children }: { children: React.ReactNode }) {
  const shell = await getAppShellData()

  return (
    <AppShellClient
      user={shell.user}
      isDemoMode={DEMO_ENABLED && shell.isDemoMode}
      activeIssueCount={shell.activeIssueCount}
      liveMonitors={shell.liveMonitors}
    >
      {children}
    </AppShellClient>
  )
}
