"use client"

import { createBrowserClient } from "@supabase/ssr"

import type { Database } from "@/types/database"

import { getSupabasePublicConfig } from "./shared"

export function createSupabaseBrowserClient() {
  const { url, anonKey } = getSupabasePublicConfig()
  return createBrowserClient<Database>(url, anonKey)
}
