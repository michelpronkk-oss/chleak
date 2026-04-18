import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

import type { Database } from "@/types/database"

import { getSupabasePublicConfig } from "./shared"

export async function createSupabaseServerClient() {
  const cookieStore = await cookies()
  const { url, anonKey } = getSupabasePublicConfig()

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(nextCookies) {
        try {
          nextCookies.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        } catch {
          // Server Components cannot write cookies; the read above already succeeded.
          // Route Handlers and Server Actions will not hit this branch.
        }
      },
    },
  })
}
