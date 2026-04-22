export function getAppOriginFromEnv() {
  const explicit = process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL
  if (explicit) {
    return explicit
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }

  return null
}

export function sanitizeNextPath(input: string | null | undefined, fallback = "/app") {
  if (!input) {
    return fallback
  }

  if (!input.startsWith("/")) {
    return fallback
  }

  if (input.startsWith("//")) {
    return fallback
  }

  return input
}
