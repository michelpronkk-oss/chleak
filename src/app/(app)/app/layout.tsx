import { redirect } from "next/navigation"

import { getServerSession } from "@/lib/auth/session"
import { AppShell } from "@/components/layout/app-shell"

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await getServerSession()
  if (!session) {
    console.info("[auth] app layout auth decision: authenticated=false; redirect=/auth/sign-in")
    redirect("/auth/sign-in?next=/app")
  }

  console.info(
    `[auth] app layout auth decision: authenticated=true; user=${session.user.id}`
  )

  return <AppShell>{children}</AppShell>
}
