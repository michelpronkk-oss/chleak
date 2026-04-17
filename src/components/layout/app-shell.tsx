import { getAppShellData } from "@/server/services/app-service"

import { AppShellClient } from "./app-shell-client"

export async function AppShell({ children }: { children: React.ReactNode }) {
  const shell = await getAppShellData()

  return (
    <AppShellClient
      user={shell.user}
      activeIssueCount={shell.activeIssueCount}
      liveMonitors={shell.liveMonitors}
    >
      {children}
    </AppShellClient>
  )
}
