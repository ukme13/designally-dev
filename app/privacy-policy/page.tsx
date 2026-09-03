import type { Metadata } from "next";

import DraftNotice from "@/app/_components/draft-notice";
import PageIntro from "@/app/_components/page-intro";
import Section from "@/app/_components/section";
import { contactEmail } from "@/app/_lib/navigation";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Privacy policy for designally.co. This page is being prepared and is not published yet.",
  alternates: { canonical: "/privacy-policy/" },
  // Placeholder page with no policy text. Remove once the reviewed text is in.
  robots: { index: false, follow: true },
};

/** Outline only. No policy text is written until it has been reviewed. */
const plannedSections = [
  "Who we are and how to contact us",
  "What personal information we collect",
  "How we use that information",
  "Legal basis for processing",
  "How long we keep information",
  "Who we share information with",
  "International transfers",
  "Your rights and how to exercise them",
  "How to make a complaint",
  "Changes to this policy",
];

export default function PrivacyPolicyPage() {
  return (
    <>
      <PageIntro
        eyebrow="Legal"
        title="Privacy Policy"
        intro="This policy is being prepared. It will explain what personal information designally.co collects, how it is used, and the choices available to you."
      />

      <Section>
        <div className="max-w-text">
          <DraftNotice label="Not published yet">
            No policy text is published on this page. The current legal text is
            under review and must be checked before it goes live. Until then,
            this page is excluded from search engine indexing. For any privacy
            question in the meantime, contact {contactEmail}.
          </DraftNotice>

          <h2 className="mt-16 type-h1 text-text-primary">
            What this page will cover
          </h2>
          <ul className="mt-8 border-t border-border-default">
            {plannedSections.map((section) => (
              <li
                key={section}
                className="border-b border-border-default py-4 type-body text-text-body"
              >
                {section}
              </li>
            ))}
          </ul>
        </div>
      </Section>
    </>
  );
}
