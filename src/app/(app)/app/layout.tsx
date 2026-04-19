import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { getAccessApprovalState } from "@/lib/auth/access"
import { getServerSession } from "@/lib/auth/session"
import { AppShell } from "@/components/layout/app-shell"

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await getServerSession()
  if (!session) {
    console.info("[auth] app layout auth decision: authenticated=false; redirect=/auth/sign-in")
    redirect("/auth/sign-in?next=/app")
  }

  const approvalState = await getAccessApprovalState(session.user.email)
  if (approvalState !== "approved") {
    console.info(
      `[auth] app layout access gate: user=${session.user.id}; approval=${approvalState}; redirect=/access-review`
    )
    redirect("/access-review")
  }

  console.info(
    `[auth] app layout auth decision: authenticated=true; approved=true; user=${session.user.id}`
  )

  return <AppShell>{children}</AppShell>
}
