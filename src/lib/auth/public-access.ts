import { cache } from "react"
import { cookies } from "next/headers"

import { createSupabaseServerClient } from "@/lib/supabase/server"
import { getAccessApprovalState } from "@/lib/auth/access"

export type PublicAccessState = "approved" | "pending" | "unknown"

function isSupabaseAuthCookie(name: string) {
  return name.startsWith("sb-") && name.includes("auth-token")
}

export const getPublicAccessState = cache(async (): Promise<PublicAccessState> => {
  const cookieStore = await cookies()
  const hasAuthCookies = cookieStore.getAll().some((cookie) => isSupabaseAuthCookie(cookie.name))

  if (!hasAuthCookies) {
    return "unknown"
  }

  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error || !user?.email) {
      return "unknown"
    }

    const approval = await getAccessApprovalState(user.email)
    if (approval === "approved") {
      return "approved"
    }
    if (approval === "pending") {
      return "pending"
    }

    return "unknown"
  } catch {
    return "unknown"
  }
})

