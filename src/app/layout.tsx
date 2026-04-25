import type { Metadata, Viewport } from "next";
import { Instrument_Serif, Inter_Tight, JetBrains_Mono } from "next/font/google";
import { getPublicSiteUrl } from "@/lib/site-url";
import "./globals.css";

const interTight = Inter_Tight({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const jetbrainsMonoData = JetBrains_Mono({
  variable: "--font-data",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
});

const siteUrl = getPublicSiteUrl();
const defaultDescription =
  "Revenue leak monitoring for websites, SaaS funnels, checkout flows, and billing recovery.";
const socialDescription = "Revenue leak monitoring for websites, SaaS funnels, and conversion flows.";
const ogImage = "/brand/silentleak/silentleak-og-1200x630.png";

export const viewport: Viewport = {
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "SilentLeak",
    template: "%s | SilentLeak",
  },
  description: defaultDescription,
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/brand/silentleak/silentleak-favicon.svg", type: "image/svg+xml" },
      { url: "/brand/silentleak/silentleak-favicon-32.png", sizes: "32x32", type: "image/png" },
    ],
    shortcut: "/brand/silentleak/silentleak-favicon.svg",
    apple: "/brand/silentleak/silentleak-app-icon-512.png",
  },
  openGraph: {
    title: "SilentLeak",
    description: socialDescription,
    siteName: "SilentLeak",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: ogImage,
        width: 1200,
        height: 630,
        alt: "SilentLeak",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SilentLeak",
    description: socialDescription,
    images: [ogImage],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};

const webApplicationSchema = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "SilentLeak",
  url: siteUrl,
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  image: `${siteUrl}${ogImage}`,
  logo: `${siteUrl}/brand/silentleak/silentleak-app-icon-512.png`,
  description: defaultDescription,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${interTight.variable} ${jetbrainsMono.variable} ${jetbrainsMonoData.variable} ${instrumentSerif.variable} dark`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-background text-foreground antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webApplicationSchema) }}
        />
        {children}
      </body>
    </html>
  );
}
