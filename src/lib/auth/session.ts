import { redirect } from "next/navigation"
import { cache } from "react"

import { createSupabaseServerClient } from "@/lib/supabase/server"
import { ensureWorkspaceForUser } from "@/server/services/account-bootstrap-service"
import type { AppSession } from "@/types/auth"

export const getServerSession = cache(async (): Promise<AppSession | null> => {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  const metadata = user.user_metadata as Record<string, unknown> | null
  const fullName =
    typeof metadata?.full_name === "string" && metadata.full_name.trim().length > 0
      ? metadata.full_name.trim()
      : null
  const timezone =
    typeof metadata?.timezone === "string" && metadata.timezone.trim().length > 0
      ? metadata.timezone.trim()
      : null

  try {
    const membership = await ensureWorkspaceForUser({
      userId: user.id,
      email: user.email ?? null,
      fullName,
    })

    return {
      user: {
        id: user.id,
        email: user.email ?? null,
        fullName,
        timezone,
      },
      membership,
    }
  } catch {
    console.error(
      `[auth] workspace bootstrap failed for authenticated user: user=${user.id}`
    )
    return {
      user: {
        id: user.id,
        email: user.email ?? null,
        fullName,
        timezone,
      },
      membership: null,
    }
  }
})

export async function requireServerSession() {
  const session = await getServerSession()

  if (!session) {
    redirect("/auth/sign-in")
  }

  return session
}
