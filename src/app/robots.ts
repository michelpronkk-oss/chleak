import type { MetadataRoute } from "next"

import { getPublicSiteUrl } from "@/lib/site-url"

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getPublicSiteUrl()

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/app",
          "/api",
          "/internal",
          "/auth",
          "/vault",
          "/dashboard",
          "/settings",
          "/billing",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  }
}
