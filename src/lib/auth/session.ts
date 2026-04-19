import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { cache } from "react"

import { createSupabaseServerClient } from "@/lib/supabase/server"
import { ensureWorkspaceForUser } from "@/server/services/account-bootstrap-service"
import type { AppSession } from "@/types/auth"

function isSupabaseAuthCookie(name: string) {
  return name.startsWith("sb-") && name.includes("auth-token")
}

function isStaleRefreshError(message: string) {
  return (
    message.includes("Refresh Token Not Found") ||
    message.includes("Invalid Refresh Token")
  )
}

export async function getServerSession(): Promise<AppSession | null> {
  const session = await getServerSessionCached()
  return session
}

const getServerSessionCached = cache(async (): Promise<AppSession | null> => {
  const cookieStore = await cookies()
  const authCookies = cookieStore
    .getAll()
    .filter((cookie) => isSupabaseAuthCookie(cookie.name))

  if (!authCookies.length) {
    console.info("[auth] getServerSession unauthenticated: reason=no_auth_cookies")
    return null
  }

  const supabase = await createSupabaseServerClient()
  const getUserResult = await supabase.auth.getUser()
  const user = getUserResult.data.user ?? null

  if (!user) {
    const errMsg = getUserResult.error?.message ?? "none"
    const reason = isStaleRefreshError(errMsg)
      ? "stale_refresh_token"
      : "getUser_no_user"
    console.info(
      `[auth] getServerSession unauthenticated: reason=${reason}; getUser_error=${errMsg}; has_user=${Boolean(getUserResult.data.user)}`
    )
    return null
  }

  console.info(
    `[auth] getServerSession authenticated: user_id=${user.id}; source=getUser`
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
