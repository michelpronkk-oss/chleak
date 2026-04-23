export interface NormalizedLiveSourceUrl {
  normalizedUrl: string
  hostname: string
}

export function normalizeLiveSourceUrl(input: string): NormalizedLiveSourceUrl | null {
  const trimmed = input.trim()
  if (!trimmed) {
    return null
  }

  const withProtocol =
    trimmed.startsWith("http://") || trimmed.startsWith("https://")
      ? trimmed
      : `https://${trimmed}`

  try {
    const parsed = new URL(withProtocol)
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null
    }

    parsed.hash = ""
    return {
      normalizedUrl: parsed.toString(),
      hostname: parsed.hostname.toLowerCase(),
    }
  } catch {
    return null
  }
}

export function inferShopifyDomainFromLiveSource(input: string | null) {
  if (!input) {
    return null
  }

  const normalized = normalizeLiveSourceUrl(input)
  if (!normalized) {
    return null
  }

  return /^[a-z0-9-]+\.myshopify\.com$/.test(normalized.hostname)
    ? normalized.hostname
    : null
}
