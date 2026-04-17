import { MarketingPageLayout, PageSection } from "@/components/marketing/page-layout"

export default function TermsPage() {
  return (
    <MarketingPageLayout
      eyebrow="Legal"
      title="Terms of Use"
      description="These terms govern your use of CheckoutLeak. They are designed to be clear and practical for teams using our software in production operations."
    >
      <PageSection title="Overview">
        <p>
          CheckoutLeak provides software to detect revenue leakage across
          checkout, payment setup, and billing workflows. By using our service,
          you agree to these terms.
        </p>
      </PageSection>

      <PageSection title="Eligibility and account use">
        <p>
          You must be authorized to act on behalf of the business account using
          CheckoutLeak. You are responsible for maintaining accurate account
          information and for activity under your credentials.
        </p>
      </PageSection>

      <PageSection title="Acceptable use">
        <p>
          You may not misuse the service, attempt unauthorized access, interfere
          with platform security, or use CheckoutLeak in ways that violate law
          or third-party platform terms.
        </p>
      </PageSection>

      <PageSection title="Billing and subscriptions">
        <p>
          Paid plans renew on the billing cycle selected at purchase. Fees are
          non-refundable except where required by law or explicitly stated in a
          written agreement.
        </p>
        <p>
          If payment fails, we may suspend features until billing is resolved.
        </p>
      </PageSection>

      <PageSection title="Service availability">
        <p>
          We work to provide reliable uptime, but no service can be guaranteed
          uninterrupted at all times. Planned maintenance and unplanned
          incidents may affect availability.
        </p>
      </PageSection>

      <PageSection title="Intellectual property">
        <p>
          CheckoutLeak and its underlying software, models, and content are our
          intellectual property. Your organization retains ownership of your
          business data.
        </p>
      </PageSection>

      <PageSection title="Disclaimers">
        <p>
          CheckoutLeak provides operational insights and recommendations. You
          are responsible for implementation decisions and business outcomes.
        </p>
      </PageSection>

      <PageSection title="Limitation of liability">
        <p>
          To the maximum extent permitted by law, CheckoutLeak is not liable
          for indirect, incidental, special, consequential, or punitive damages
          arising from use of the service.
        </p>
      </PageSection>

      <PageSection title="Termination">
        <p>
          You may stop using the service at any time. We may suspend or
          terminate access for material violations of these terms or misuse of
          the platform.
        </p>
      </PageSection>

      <PageSection title="Changes to these terms">
        <p>
          We may update these terms as the product and legal requirements
          evolve. Material changes will be communicated through the app or
          account email.
        </p>
      </PageSection>

      <PageSection title="Contact">
        <p>
          Questions about these terms can be sent to{" "}
          <a
            href="mailto:legal@checkoutleak.com"
            className="text-primary transition-opacity hover:opacity-80"
          >
            legal@checkoutleak.com
          </a>
          .
        </p>
      </PageSection>
    </MarketingPageLayout>
  )
}
