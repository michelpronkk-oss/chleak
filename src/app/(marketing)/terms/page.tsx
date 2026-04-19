import { MarketingPageLayout, PageSection } from "@/components/marketing/page-layout"

export default function TermsPage() {
  return (
    <MarketingPageLayout
      eyebrow="Legal"
      title="Terms of Use"
      description="These terms govern access to CheckoutLeak. They are written for commercial teams using the platform in live revenue operations."
    >
      <PageSection title="Acceptance of terms">
        <p>
          By creating an account, purchasing a subscription, or otherwise using
          CheckoutLeak, you agree to these Terms of Use and our Privacy Policy.
          If you do not agree, do not use the service.
        </p>
        <p>
          If you use CheckoutLeak on behalf of an organization, you confirm you
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
          <li>Use CheckoutLeak for unlawful, fraudulent, or abusive activity.</li>
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
          CheckoutLeak may connect to third-party services such as Shopify,
          Stripe, Supabase, Dodo Payments, and Resend. Your use of those
          services is governed by their own terms and policies.
        </p>
        <p>
          We are not responsible for outages, API changes, policy changes, or
          failures originating from third-party providers.
        </p>
      </PageSection>

      <PageSection title="Service availability and disclaimer">
        <p>
          CheckoutLeak is provided on an as-is and as-available basis. We work
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
          CheckoutLeak, including software, design, content, models, and
          platform marks, is owned by CheckoutLeak and protected by applicable
          intellectual property laws.
        </p>
        <p>Your organization retains ownership of its data and business records.</p>
      </PageSection>

      <PageSection title="Limitation of liability">
        <p>
          To the maximum extent permitted by law, CheckoutLeak is not liable
          for indirect, incidental, consequential, special, punitive, or
          exemplary damages.
        </p>
        <p>
          Our aggregate liability for claims relating to the service will not
          exceed the amount paid by your organization to CheckoutLeak during the
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
          CheckoutLeak is operated, without regard to conflict of law rules,
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
