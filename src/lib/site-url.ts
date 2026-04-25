const fallbackSiteUrl = "https://checkoutleak.com"

export function getPublicSiteUrl() {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL
  return explicit?.replace(/\/+$/, "") || fallbackSiteUrl
}

