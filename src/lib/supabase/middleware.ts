import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

import type { Database } from "@/types/database"

import { getOptionalSupabasePublicConfig } from "./shared"

export async function updateSupabaseSession(request: NextRequest) {
  const config = getOptionalSupabasePublicConfig()

  if (!config) {
    return NextResponse.next({ request })
  }

  const response = NextResponse.next({ request })

  const supabase = createServerClient<Database>(config.url, config.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(nextCookies) {
        nextCookies.forEach(({ name, value, options }) => {
          request.cookies.set(name, value)
          response.cookies.set(name, value, options)
        })
      },
    },
  })

  const getUserResult = await supabase.auth.getUser()
  const user = getUserResult.data.user
  console.info(
    `[auth] middleware auth decision: path=${request.nextUrl.pathname}; authenticated=${Boolean(user)}; user_id=${user?.id ?? "none"}; getUser_error=${getUserResult.error?.message ?? "none"}`
  )

  return response
}
