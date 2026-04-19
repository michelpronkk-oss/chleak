import { cache } from "react"
import { cookies } from "next/headers"

import { createSupabaseServerClient } from "@/lib/supabase/server"
import { getAccessApprovalState } from "@/lib/auth/access"

export type PublicAccessState = "approved" | "pending" | "unknown"
export const PUBLIC_ACCESS_EMAIL_COOKIE = "checkoutleak_public_access_email"

function isSupabaseAuthCookie(name: string) {
  return name.startsWith("sb-") && name.includes("auth-token")
}

function normalizeEmail(value: string | null | undefined) {
  if (!value) {
    return null
  }

  const normalized = value.trim().toLowerCase()
  if (!normalized || !normalized.includes("@")) {
    return null
  }

  return normalized
}

async function resolveAccessStateForEmail(email: string | null) {
  const normalizedEmail = normalizeEmail(email)
  if (!normalizedEmail) {
    return "unknown" as const
  }

  const approval = await getAccessApprovalState(normalizedEmail)
  if (approval === "approved") {
    return "approved" as const
  }
  if (approval === "pending") {
    return "pending" as const
  }

  return "unknown" as const
}

export const getPublicAccessState = cache(async (): Promise<PublicAccessState> => {
  const cookieStore = await cookies()
  const publicIdentityEmail = cookieStore.get(PUBLIC_ACCESS_EMAIL_COOKIE)?.value ?? null
  const hasAuthCookies = cookieStore.getAll().some((cookie) => isSupabaseAuthCookie(cookie.name))

  if (!hasAuthCookies) {
    return resolveAccessStateForEmail(publicIdentityEmail)
  }

  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error || !user?.email) {
      return resolveAccessStateForEmail(publicIdentityEmail)
    }

    return resolveAccessStateForEmail(user.email)
  } catch {
    return resolveAccessStateForEmail(publicIdentityEmail)
  }
})
