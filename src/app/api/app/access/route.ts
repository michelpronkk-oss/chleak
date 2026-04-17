import { NextResponse } from "next/server"

import { sanitizeNextPath } from "@/lib/auth/navigation"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const next = sanitizeNextPath(url.searchParams.get("next"), "/app/billing")
  const plan = url.searchParams.get("plan")
  const intent = url.searchParams.get("intent")

  const nextUrl = new URL(next, url.origin)
  if (intent) {
    nextUrl.searchParams.set("intent", intent)
  }
  if (plan) {
    nextUrl.searchParams.set("plan", plan)
  }

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    const authRedirect = new URL("/auth/sign-up", url.origin)
    authRedirect.searchParams.set("next", `${nextUrl.pathname}${nextUrl.search}`)
    if (plan) {
      authRedirect.searchParams.set("plan", plan)
    }
    return NextResponse.redirect(authRedirect)
  }

  return NextResponse.redirect(nextUrl)
}
