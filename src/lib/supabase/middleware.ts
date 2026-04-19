import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

import type { Database } from "@/types/database"

import { getOptionalSupabasePublicConfig } from "./shared"

function isSupabaseAuthCookie(name: string) {
  return name.startsWith("sb-") && name.includes("auth-token")
}

function isStaleRefreshError(message: string) {
  return (
    message.includes("Refresh Token Not Found") ||
    message.includes("Invalid Refresh Token")
  )
}

export async function updateSupabaseSession(request: NextRequest) {
  const config = getOptionalSupabasePublicConfig()

  if (!config) {
    return NextResponse.next({ request })
  }

  const authCookies = request.cookies
    .getAll()
    .filter((cookie) => isSupabaseAuthCookie(cookie.name))

  if (!authCookies.length) {
    console.info(
      `[auth] middleware no_auth_cookies: path=${request.nextUrl.pathname}; action=skip_getUser`
    )
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
  const errMsg = getUserResult.error?.message ?? "none"
  const isStaleToken = isStaleRefreshError(errMsg)

  if (isStaleToken) {
    authCookies.forEach(({ name }) => {
      request.cookies.delete(name)
      response.cookies.set(name, "", {
        path: "/",
        maxAge: 0,
      })
    })
    console.info(
      `[auth] middleware stale_refresh_cleared: path=${request.nextUrl.pathname}; cookies=${authCookies.length}; error=${errMsg}`
    )
  } else {
    console.info(
      `[auth] middleware auth_probe: path=${request.nextUrl.pathname}; auth_cookies=${authCookies.length}; authenticated=${Boolean(user)}; user_id=${user?.id ?? "none"}; error=${errMsg}`
    )
  }

  return response
}
