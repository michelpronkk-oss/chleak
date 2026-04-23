import type { Metadata } from "next"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
  title: "Source Setup",
}

function toQueryString(params: Record<string, string | string[] | undefined>) {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        query.append(key, item)
      }
      continue
    }
    if (typeof value === "string") {
      query.set(key, value)
    }
  }
  const encoded = query.toString()
  return encoded.length ? `?${encoded}` : ""
}

export default async function ConnectCompatibilityPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  redirect(`/app/stores${toQueryString(params)}`)
}
