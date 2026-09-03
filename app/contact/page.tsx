import type { Metadata } from "next";

import Arrow from "@/app/_components/arrow";
import Button from "@/app/_components/button";
import DraftNotice from "@/app/_components/draft-notice";
import PageIntro from "@/app/_components/page-intro";
import Section from "@/app/_components/section";
import { contactEmail } from "@/app/_lib/navigation";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Tell Designally what is changing in your business. A strategy-led branding and design agency based in Bangkok, Thailand.",
  alternates: { canonical: "/contact/" },
};

/** Mirrors the first-contact fields in docs/product/WEBSITE-BRIEF.md. */
const helpfulDetails = [
  "Your name and company",
  "What is changing, or what is not working",
  "The service you think you need, if you already know",
  "Expected timing",
];

export default function ContactPage() {
  return (
    <>
      <PageIntro
        eyebrow="Start a conversation"
        title="Something's changing?"
        intro="Tell us what is happening in your business. We will listen first and help you understand the most useful next step."
      >
        <Button href={`mailto:${contactEmail}`}>
          Email {contactEmail} <Arrow />
        </Button>
      </PageIntro>

      <Section>
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <h2 className="max-w-xl type-h1-alt text-text-primary text-balance">
              What is useful to include.
            </h2>
            <p className="mt-6 max-w-text type-body text-text-body">
              A first message does not need to be a brief. A few sentences about
              the situation is enough to start.
            </p>
            <ul className="mt-8 border-t border-border-default">
              {helpfulDetails.map((detail) => (
                <li
                  key={detail}
                  className="border-b border-border-default py-4 type-body text-text-body"
                >
                  {detail}
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-6">
            <h2 className="max-w-xl type-h1-alt text-text-primary text-balance">
              How we work with new enquiries.
            </h2>
            <p className="mt-6 max-w-text type-body text-text-body">
              We read every enquiry ourselves. If the work looks like a fit, we
              will suggest a first conversation to understand the business
              situation before discussing scope.
            </p>
            <div className="mt-8">
              <DraftNotice>
                An enquiry form, the published response time and the full office
                contact details are not in place yet. Email is the working
                contact route until a form with real delivery and failure
                handling is connected, and the contact details are confirmed.
              </DraftNotice>
            </div>
          </div>
        </div>
      </Section>

      <Section className="border-t border-border-default bg-surface-raised">
        <div className="grid gap-8 lg:grid-cols-12">
          <p className="type-label text-text-muted lg:col-span-3">
            Where we are
          </p>
          <div className="lg:col-span-9">
            <h2 className="max-w-3xl type-h1-alt text-text-primary text-balance">
              Based in Bangkok, working across markets.
            </h2>
            <p className="mt-6 max-w-text type-body text-text-body">
              Designally works in Thai and English with clients in Thailand,
              across Southeast Asia, and internationally.
            </p>
            <a
              href={`mailto:${contactEmail}`}
              className="mt-8 inline-block type-body-lg text-text-primary underline underline-offset-4 transition-colors duration-300 ease-standard hover:text-action-primary"
            >
              {contactEmail}
            </a>
          </div>
        </div>
      </Section>
    </>
  );
}
