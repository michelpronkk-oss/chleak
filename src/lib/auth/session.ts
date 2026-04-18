import { redirect } from "next/navigation"
import { cache } from "react"

import { createSupabaseServerClient } from "@/lib/supabase/server"
import { ensureWorkspaceForUser } from "@/server/services/account-bootstrap-service"
import type { AppSession } from "@/types/auth"

export async function getServerSession(): Promise<AppSession | null> {
  const session = await getServerSessionCached()
  return session
}

const getServerSessionCached = cache(async (): Promise<AppSession | null> => {
  const supabase = await createSupabaseServerClient()
  const getSessionResult = await supabase.auth.getSession()
  let user = getSessionResult.data.session?.user ?? null
  let userSource: "getSession" | "getUser" = "getSession"

  if (!user) {
    const getUserResult = await supabase.auth.getUser()
    user = getUserResult.data.user ?? null
    userSource = "getUser"

    if (!user) {
      console.info(
        `[auth] getServerSession unauthenticated: getSession_error=${getSessionResult.error?.message ?? "none"}; has_session=${Boolean(getSessionResult.data.session)}; getUser_error=${getUserResult.error?.message ?? "none"}; has_user=${Boolean(getUserResult.data.user)}`
      )
      return null
    }
  }

  console.info(
    `[auth] getServerSession authenticated: user_id=${user.id}; source=${userSource}`
  )

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
