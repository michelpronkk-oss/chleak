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
  const getUserResult = await supabase.auth.getUser()
  let user = getUserResult.data.user

  if (getUserResult.error || !user) {
    const getSessionResult = await supabase.auth.getSession()
    const fallbackUser = getSessionResult.data.session?.user ?? null

    if (fallbackUser) {
      user = fallbackUser
      console.warn(
        `[auth] getServerSession fallback: getUser_failed=true; user_id=${fallbackUser.id}; getUser_error=${getUserResult.error?.message ?? "none"}`
      )
    } else {
      console.info(
        `[auth] getServerSession unauthenticated: getUser_error=${getUserResult.error?.message ?? "none"}; has_user=${Boolean(getUserResult.data.user)}; has_session=${Boolean(getSessionResult.data.session)}`
      )
      return null
    }
  } else {
    console.info(`[auth] getServerSession authenticated: user_id=${user.id}; source=getUser`)
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
