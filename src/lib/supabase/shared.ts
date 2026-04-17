import { createClient } from "@supabase/supabase-js"

import type { Database } from "@/types/database"

export interface SupabasePublicConfig {
  url: string
  anonKey: string
}

export function getOptionalSupabasePublicConfig(): SupabasePublicConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    return null
  }

  return { url, anonKey }
}

export function getSupabasePublicConfig(): SupabasePublicConfig {
  const config = getOptionalSupabasePublicConfig()

  if (!config) {
    throw new Error(
      "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
    )
  }

  return config
}

export function createSupabaseAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const { url } = getSupabasePublicConfig()

  if (!serviceRoleKey) {
    throw new Error(
      "Supabase service role is not configured. Add SUPABASE_SERVICE_ROLE_KEY."
    )
  }

  return createClient<Database>(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
