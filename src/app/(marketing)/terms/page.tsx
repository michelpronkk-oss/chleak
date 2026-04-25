import type { Metadata } from "next"

import { MarketingPageLayout, PageSection } from "@/components/marketing/page-layout"

const termsDescription =
  "Terms of use governing access to SilentLeak, including subscriptions, billing, acceptable use, integrations, and service conditions."
const ogImage = "/brand/silentleak/silentleak-og-1200x630.png"

export const metadata: Metadata = {
  title: "Terms of Use",
  description: termsDescription,
  openGraph: {
    title: "Terms of Use | SilentLeak",
    description: termsDescription,
    url: "/terms",
    type: "website",
    siteName: "SilentLeak",
    images: [ogImage],
  },
  twitter: {
    card: "summary_large_image",
    title: "Terms of Use | SilentLeak",
    description: termsDescription,
    images: [ogImage],
  },
  alternates: {
    canonical: "/terms",
  },
}

export default function TermsPage() {
  return (
    <MarketingPageLayout
      eyebrow="Legal"
      title="Terms of Use"
      description="These terms govern access to SilentLeak for teams running operator-grade revenue leak monitoring across websites, SaaS funnels, checkout paths, and billing recovery workflows."
    >
      <PageSection title="Acceptance of terms">
        <p>
          By creating an account, purchasing a subscription, or otherwise using
          SilentLeak, you agree to these Terms of Use, Privacy Policy, and
          {" "}
          <a
            href="/cookies"
            className="vault-link"
          >
            Cookie Policy
          </a>
          . If you do not agree, do not use the service.
        </p>
        <p>
          If you use SilentLeak on behalf of an organization, you confirm you
          are authorized to bind that organization to these terms.
        </p>
      </PageSection>

      <PageSection title="Eligibility and accounts">
        <p>
          You must be at least the age of majority in your jurisdiction and
          legally able to enter into a contract.
        </p>
        <p>
          You are responsible for account security, credential management, and
          all activity that occurs under your account. You must keep account
          information accurate and current.
        </p>
      </PageSection>

      <PageSection title="Subscription, billing, renewal, and cancellation">
        <p>
          Paid plans are billed on the subscription cycle selected at checkout.
          Subscriptions renew automatically unless canceled before renewal.
        </p>
        <p>
          You authorize us and our billing providers to charge applicable fees,
          taxes, and recurring charges for your subscription.
        </p>
        <p>
          If payment fails or your billing status becomes past due, we may
          suspend or limit access until billing is brought current.
        </p>
        <p>
          You may cancel renewal at any time through billing settings or by
          contacting support. Except where required by law, fees already paid
          are non-refundable.
        </p>
      </PageSection>

      <PageSection title="Acceptable use">
        <p>You agree not to:</p>
        <ul className="ml-5 list-disc space-y-2">
          <li>Use SilentLeak for unlawful, fraudulent, or abusive activity.</li>
          <li>
            Attempt unauthorized access, reverse engineer protected systems, or
            bypass security controls.
          </li>
          <li>
            Interfere with service performance, integrity, or availability.
          </li>
          <li>
            Upload or transmit malicious code, harmful automation, or content
            that violates applicable law.
          </li>
        </ul>
      </PageSection>

      <PageSection title="Integrations and third-party services">
        <p>
          SilentLeak may connect to third-party services used in revenue
          operations, including commerce, payments, billing, authentication,
          messaging, and infrastructure providers such as Shopify, Stripe,
          Supabase, Dodo Payments, and Resend. Your use of those services is
          governed by their own terms and policies.
        </p>
        <p>
          We are not responsible for outages, API changes, policy changes, or
          failures originating from third-party providers.
        </p>
      </PageSection>

      <PageSection title="Product outputs and operator responsibility">
        <p>
          SilentLeak produces evidence-backed findings, impact estimates, and
          recommended next actions across websites, signup paths, pricing
          handoffs, checkout paths, and billing recovery surfaces.
        </p>
        <p>
          These outputs are decision-support signals. They do not constitute
          legal, tax, accounting, or financial advice, and they do not
          guarantee commercial outcomes.
        </p>
        <p>
          Your organization is responsible for operational decisions and for
          validating changes before release.
        </p>
      </PageSection>

      <PageSection title="Service availability and disclaimer">
        <p>
          SilentLeak is provided on an as-is and as-available basis. We work
          to maintain reliable service, but do not guarantee uninterrupted
          availability or error-free operation.
        </p>
        <p>
          Planned maintenance, third-party dependency issues, and unexpected
          incidents may affect performance.
        </p>
      </PageSection>

      <PageSection title="Intellectual property">
        <p>
          SilentLeak, including software, design, content, models, and
          platform marks, is owned by SilentLeak and protected by applicable
          intellectual property laws.
        </p>
        <p>Your organization retains ownership of its data and business records.</p>
      </PageSection>

      <PageSection title="Limitation of liability">
        <p>
          To the maximum extent permitted by law, SilentLeak is not liable
          for indirect, incidental, consequential, special, punitive, or
          exemplary damages.
        </p>
        <p>
          Our aggregate liability for claims relating to the service will not
          exceed the amount paid by your organization to SilentLeak during the
          twelve months preceding the event giving rise to the claim.
        </p>
      </PageSection>

      <PageSection title="Termination">
        <p>
          You may stop using the service at any time. We may suspend or
          terminate access for material breach of these terms, unlawful use, or
          misuse of the platform.
        </p>
        <p>
          Upon termination, your access rights end. We may retain limited
          records as required for legal, security, and accounting obligations.
        </p>
      </PageSection>

      <PageSection title="Governing law">
        <p>
          These terms are governed by the laws of the jurisdiction in which
          SilentLeak is operated, without regard to conflict of law rules,
          unless otherwise required by applicable consumer law.
        </p>
      </PageSection>

      <PageSection title="Changes and contact">
        <p>
          We may update these terms as the product and legal requirements
          evolve. Material updates will be communicated through the app or
          account email.
        </p>
        <p>
          Cookie practices are described in our{" "}
          <a
            href="/cookies"
            className="vault-link"
          >
            Cookie Policy
          </a>
          .
        </p>
        <p>
          Questions about these terms can be sent to{" "}
          <a
            href="mailto:legal@checkoutleak.com"
            className="vault-link"
          >
            legal@checkoutleak.com
          </a>
          . For support questions, contact{" "}
          <a
            href="mailto:support@checkoutleak.com"
            className="vault-link"
          >
            support@checkoutleak.com
          </a>
          .
        </p>
      </PageSection>
    </MarketingPageLayout>
  )
}
