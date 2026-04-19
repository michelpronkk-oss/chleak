import { NextResponse } from "next/server"
import type { EmailOtpType } from "@supabase/supabase-js"

import { sanitizeNextPath } from "@/lib/auth/navigation"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { ensureWorkspaceForUser } from "@/server/services/account-bootstrap-service"

const supportedOtpTypes: EmailOtpType[] = [
  "signup",
  "email",
  "magiclink",
  "recovery",
  "invite",
  "email_change",
]

function parseOtpType(raw: string | null): EmailOtpType | null {
  if (!raw) return null
  return supportedOtpTypes.includes(raw as EmailOtpType) ? (raw as EmailOtpType) : null
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const tokenHash = requestUrl.searchParams.get("token_hash")
  const type = parseOtpType(requestUrl.searchParams.get("type"))
  const next = sanitizeNextPath(requestUrl.searchParams.get("next"), "/app")

  const supabase = await createSupabaseServerClient()

  const toSignIn = (error: "callback_missing" | "callback_failed" | "workspace_setup_failed") => {
    const redirectUrl = new URL("/auth/sign-in", requestUrl.origin)
    redirectUrl.searchParams.set("error", error)
    redirectUrl.searchParams.set("next", next)
    return NextResponse.redirect(redirectUrl)
  }

  try {
    let user:
      | Awaited<ReturnType<typeof supabase.auth.exchangeCodeForSession>>["data"]["user"]
      | null = null

    if (tokenHash && type) {
      const verifyResult = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type,
      })
      if (verifyResult.error || !verifyResult.data.user) {
        return toSignIn("callback_failed")
      }
      user = verifyResult.data.user
    } else if (code) {
      const exchangeResult = await supabase.auth.exchangeCodeForSession(code)
      if (exchangeResult.error || !exchangeResult.data.user) {
        return toSignIn("callback_failed")
      }
      user = exchangeResult.data.user
    } else {
      return toSignIn("callback_missing")
    }

    const metadata = user.user_metadata as Record<string, unknown> | null
    const fullName =
      typeof metadata?.full_name === "string" && metadata.full_name.trim().length > 0
        ? metadata.full_name.trim()
        : null

    await ensureWorkspaceForUser({
      userId: user.id,
      email: user.email ?? null,
      fullName,
    })

    return NextResponse.redirect(new URL(next, requestUrl.origin))
  } catch {
    return toSignIn("workspace_setup_failed")
  }
}
