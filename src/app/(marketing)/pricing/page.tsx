import type { Metadata } from "next"
import { permanentRedirect } from "next/navigation"

const pricingDescription =
  "Choose the SilentLeak monitoring plan for your revenue surfaces, from weekly source checks to high-frequency monitoring."
const ogImage = "/brand/silentleak/silentleak-og-1200x630.png"

export const metadata: Metadata = {
  title: "Pricing",
  description: pricingDescription,
  openGraph: {
    title: "Pricing | SilentLeak",
    description: pricingDescription,
    url: "/pricing",
    type: "website",
    siteName: "SilentLeak",
    images: [ogImage],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pricing | SilentLeak",
    description: pricingDescription,
    images: [ogImage],
  },
  alternates: {
    canonical: "/pricing",
  },
}

export default function PricingPage() {
  permanentRedirect("/#pricing")
}
