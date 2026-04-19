import { MarketingPageLayout, PageSection } from "@/components/marketing/page-layout"

export default function ContactPage() {
  return (
    <MarketingPageLayout
      eyebrow="Contact"
      title="Contact CheckoutLeak"
      description="Reach us for support, product questions, or a focused demo tailored to your checkout and billing stack."
    >
      <PageSection title="Support">
        <p>
          For product support, integration guidance, or account help, email{" "}
          <a
            href="mailto:support@checkoutleak.com"
            className="vault-link"
          >
            support@checkoutleak.com
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
          We can tailor demos around Shopify checkout behavior, Stripe billing
          recovery, and your current revenue operations process.
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
  )
}
