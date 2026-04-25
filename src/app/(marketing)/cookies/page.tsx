import type { Metadata } from "next"

import { MarketingPageLayout, PageSection } from "@/components/marketing/page-layout"

const cookiesDescription =
  "Cookie policy for SilentLeak: how cookies are used for authentication, onboarding state, integrations, and service security."
const ogImage = "/brand/silentleak/silentleak-og-1200x630.png"

export const metadata: Metadata = {
  title: "Cookie Policy",
  description: cookiesDescription,
  openGraph: {
    title: "Cookie Policy | SilentLeak",
    description: cookiesDescription,
    url: "/cookies",
    type: "website",
    siteName: "SilentLeak",
    images: [ogImage],
  },
  twitter: {
    card: "summary_large_image",
    title: "Cookie Policy | SilentLeak",
    description: cookiesDescription,
    images: [ogImage],
  },
  alternates: {
    canonical: "/cookies",
  },
}

export default function CookiePolicyPage() {
  return (
    <MarketingPageLayout
      eyebrow="Legal"
      title="Cookie Policy"
      description="This policy explains what cookies SilentLeak uses, why they are used, and how you can manage cookie behavior."
    >
      <PageSection title="Overview">
        <p>
          SilentLeak uses cookies and similar browser storage to run core
          account, onboarding, and security workflows.
        </p>
        <p>
          We currently use cookies for product operations, not for third-party
          advertising personalization.
        </p>
      </PageSection>

      <PageSection title="Cookie categories we use">
        <p>Current categories include:</p>
        <ul className="ml-5 list-disc space-y-2">
          <li>
            Essential authentication and session cookies used to keep users
            signed in and protect account access.
          </li>
          <li>
            Onboarding and source-state cookies used to track connection status,
            onboarding progress, and demo or live workspace state.
          </li>
          <li>
            Security and anti-abuse cookies used for controls such as sign-in
            request cooldowns.
          </li>
          <li>
            Access workflow cookies used to preserve request-access identity
            state between steps.
          </li>
        </ul>
      </PageSection>

      <PageSection title="Examples of functional cookies">
        <p>Examples of first-party cookies used by SilentLeak include:</p>
        <ul className="ml-5 list-disc space-y-2">
          <li>
            <code>checkoutleak_onboarding_state</code> for onboarding and
            demo-mode flow state.
          </li>
          <li>
            <code>checkoutleak_shopify_source_state</code> and{" "}
            <code>checkoutleak_stripe_source_state</code> for source connection
            status state.
          </li>
          <li>
            <code>checkoutleak_public_access_email</code> for access-review
            continuity.
          </li>
          <li>
            <code>checkoutleak_magic_link_cooldown</code> for short sign-in
            request rate limiting.
          </li>
        </ul>
        <p>
          Authentication providers may also set additional session cookies
          required for secure login and account continuity.
        </p>
      </PageSection>

      <PageSection title="Retention and expiration">
        <p>
          Cookie retention varies by purpose. Some cookies are short-lived for
          security controls, while others persist longer for onboarding and
          account workflows.
        </p>
        <p>
          Certain demo-mode state may be stored as session cookies that clear
          when the browser session ends, unless replaced by a new state.
        </p>
      </PageSection>

      <PageSection title="Your choices">
        <p>
          You can control cookies through browser settings and by signing out of
          the product.
        </p>
        <p>
          Disabling essential cookies may prevent authentication, onboarding, or
          core app flows from functioning correctly.
        </p>
      </PageSection>

      <PageSection title="Updates and contact">
        <p>
          We may update this policy as product behavior or legal requirements
          evolve. Material changes are communicated through the app or account
          email.
        </p>
        <p>
          Cookie and privacy questions can be sent to{" "}
          <a
            href="mailto:hello@silentleak.com"
            className="vault-link"
          >
            hello@silentleak.com
          </a>
          .
        </p>
      </PageSection>
    </MarketingPageLayout>
  )
}
