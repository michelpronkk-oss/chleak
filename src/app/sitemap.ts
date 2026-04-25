import type { MetadataRoute } from "next"

import { getPublicSiteUrl } from "@/lib/site-url"

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getPublicSiteUrl()
  const lastModified = new Date()

  return [
    {
      url: siteUrl,
      lastModified,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${siteUrl}/product`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/pricing`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${siteUrl}/contact`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.6,
    },
    {
      url: `${siteUrl}/privacy`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${siteUrl}/terms`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ]
}
