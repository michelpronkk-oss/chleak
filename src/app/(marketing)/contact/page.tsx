import type { Metadata } from "next"

import { MarketingPageLayout, PageSection } from "@/components/marketing/page-layout"
import { getPublicSiteUrl } from "@/lib/site-url"

const siteUrl = getPublicSiteUrl()
const contactDescription =
  "Contact SilentLeak for support, implementation guidance, or a focused demo of revenue leak monitoring."
const ogImage = "/brand/silentleak/silentleak-og-1200x630.png"

export const metadata: Metadata = {
  title: "Contact",
  description: contactDescription,
  openGraph: {
    title: "Contact | SilentLeak",
    description: contactDescription,
    url: "/contact",
    type: "website",
    siteName: "SilentLeak",
    images: [ogImage],
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact | SilentLeak",
    description: contactDescription,
    images: [ogImage],
  },
  alternates: {
    canonical: "/contact",
  },
}

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
    { "@type": "ListItem", position: 2, name: "Contact", item: `${siteUrl}/contact` },
  ],
}

export default function ContactPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <MarketingPageLayout
        eyebrow="Contact"
        title="Contact SilentLeak"
        description="Reach us for support, product questions, or a focused demo tailored to websites, SaaS funnels, checkout paths, and billing recovery workflows."
      >
        <PageSection title="Support">
          <p>
            For product support, integration guidance, or account help, email{" "}
            <a
              href="mailto:hello@silentleak.com"
              className="vault-link"
            >
              hello@silentleak.com
            </a>
            .
          </p>
          <p>
            Include your organization name and a short summary of the issue so we
            can route your request quickly.
          </p>
        </PageSection>

        <PageSection id="demo" title="Sales and demos" className="scroll-mt-24">
          <p>
            For pricing guidance, implementation planning, or a live walkthrough,
            contact{" "}
            <a
              href="mailto:sales@checkoutleak.com"
              className="vault-link"
            >
              sales@checkoutleak.com
            </a>
            .
          </p>
          <p>
            We can tailor demos around activation leakage, checkout and setup
            leakage, lead capture leaks, pricing handoff gaps, billing recovery
            leakage, and your current revenue operations process.
          </p>
        </PageSection>

        <PageSection title="Response expectations">
          <p>
            Support requests are reviewed Monday through Friday. Most requests
            receive an initial response within one business day.
          </p>
          <p>
            Demo and sales inquiries usually receive a reply within one business
            day, with scheduling options included in the first response.
          </p>
        </PageSection>
      </MarketingPageLayout>
    </>
  )
}
