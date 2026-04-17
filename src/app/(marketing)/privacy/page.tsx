import { MarketingPageLayout, PageSection } from "@/components/marketing/page-layout"

export default function PrivacyPage() {
  return (
    <MarketingPageLayout
      eyebrow="Legal"
      title="Privacy Policy"
      description="This policy explains how CheckoutLeak handles information when you use our product and website."
    >
      <PageSection title="Overview">
        <p>
          CheckoutLeak is built for high-trust revenue operations. We collect
          and process information needed to provide leak detection, reporting,
          and account management.
        </p>
      </PageSection>

      <PageSection title="Information we collect">
        <p>
          We collect account details such as name, email, and organization
          profile data. We also process operational data required to analyze
          checkout and billing performance.
        </p>
      </PageSection>

      <PageSection title="How we use information">
        <p>
          We use information to operate the service, generate issue detection
          insights, deliver summaries, support customers, and maintain platform
          security.
        </p>
      </PageSection>

      <PageSection title="Billing and payment data">
        <p>
          Subscription billing is handled through our payment providers. We do
          not store full payment card details in CheckoutLeak systems.
        </p>
      </PageSection>

      <PageSection title="Analytics and service improvement">
        <p>
          We use product analytics and performance telemetry to improve feature
          quality, reliability, and user experience across the platform.
        </p>
      </PageSection>

      <PageSection title="Data retention">
        <p>
          We retain customer data while your account is active and for a
          limited period after cancellation as needed for compliance, support,
          and legitimate business records.
        </p>
      </PageSection>

      <PageSection title="Security">
        <p>
          We apply technical and organizational safeguards designed to protect
          customer information from unauthorized access, disclosure, or loss.
        </p>
      </PageSection>

      <PageSection title="Sharing with service providers">
        <p>
          We share data only with trusted providers needed to operate our
          service, such as cloud hosting, email delivery, and payment
          processing vendors.
        </p>
      </PageSection>

      <PageSection title="Your rights">
        <p>
          Depending on your jurisdiction, you may have rights to access,
          correct, or request deletion of personal information. Contact us to
          submit a request.
        </p>
      </PageSection>

      <PageSection title="Policy updates">
        <p>
          We may update this policy as our service evolves. Material updates are
          communicated through the app or account email.
        </p>
      </PageSection>

      <PageSection title="Contact">
        <p>
          Privacy questions can be sent to{" "}
          <a
            href="mailto:privacy@checkoutleak.com"
            className="text-primary transition-opacity hover:opacity-80"
          >
            privacy@checkoutleak.com
          </a>
          .
        </p>
      </PageSection>
    </MarketingPageLayout>
  )
}
