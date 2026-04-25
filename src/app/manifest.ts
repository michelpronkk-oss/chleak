import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SilentLeak",
    short_name: "SilentLeak",
    description: "Revenue leak monitoring for websites, SaaS funnels, checkout flows, and billing recovery.",
    start_url: "/",
    display: "standalone",
    background_color: "#060708",
    theme_color: "#060708",
    icons: [
      {
        src: "/brand/silentleak/silentleak-favicon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
      {
        src: "/brand/silentleak/silentleak-app-icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/brand/silentleak/silentleak-app-icon-1024.png",
        sizes: "1024x1024",
        type: "image/png",
      },
    ],
  }
}
