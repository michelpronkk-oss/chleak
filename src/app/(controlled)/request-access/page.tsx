import type { Metadata } from "next"

import { FadeIn } from "@/components/motion/fade-in"
import { RequestAccessFullForm } from "@/components/marketing/request-access-full-form"

export const metadata: Metadata = {
  title: "Request Access",
  robots: { index: false, follow: false },
}

export default async function RequestAccessPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const emailRaw = Array.isArray(params.email) ? params.email[0] : params.email
  const defaultEmail = typeof emailRaw === "string" ? emailRaw.trim() : ""

  return (
    <div className="relative" style={{ overflowX: "clip" }}>
      <section className="mx-auto w-full max-w-xl px-5 pb-16 pt-10 sm:px-8 sm:pb-20 sm:pt-14">
        <FadeIn delay={0.04}>
          <div className="mb-7 sm:mb-9">
            <p className="vault-eyebrow mb-3 sm:text-[0.7rem]">
              Private access
            </p>
            <h1 className="text-[1.9rem] font-semibold leading-[1.08] tracking-[-0.035em] text-foreground sm:text-[2.4rem] sm:leading-[1.05]">
              Request access.
            </h1>
            <p className="mt-3 max-w-[40ch] text-[0.88rem] leading-[1.72] text-muted-foreground sm:mt-3.5 sm:text-[0.95rem] sm:leading-[1.8]">
              Tell us about your store and what you are trying to solve. We review every request and reach out directly.
            </p>
          </div>
        </FadeIn>

        <FadeIn delay={0.08}>
          <div className="rounded-lg border border-border bg-card p-5 sm:p-6">
            <RequestAccessFullForm defaultEmail={defaultEmail} />
          </div>
        </FadeIn>
      </section>
    </div>
  )
}
