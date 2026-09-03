import type { Metadata } from "next";

import DraftNotice from "@/app/_components/draft-notice";
import PageIntro from "@/app/_components/page-intro";
import Section from "@/app/_components/section";
import { contactEmail } from "@/app/_lib/navigation";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description:
    "Cookie policy for designally.co. This page is being prepared and is not published yet.",
  alternates: { canonical: "/cookie-policy/" },
  // Placeholder page with no policy text. Remove once the reviewed text is in.
  robots: { index: false, follow: true },
};

/** Outline only. No policy text is written until it has been reviewed. */
const plannedSections = [
  "What cookies and similar technologies are",
  "Which cookies this website sets",
  "Why each cookie is used",
  "Cookies set by third parties",
  "How long cookies remain",
  "How to change your choices",
  "How consent is recorded",
  "Changes to this policy",
];

export default function CookiePolicyPage() {
  return (
    <>
      <PageIntro
        eyebrow="Legal"
        title="Cookie Policy"
        intro="This policy is being prepared. It will explain which cookies designally.co uses, why they are used, and how to change your choices."
      />

      <Section>
        <div className="max-w-text">
          <DraftNotice label="Not published yet">
            No policy text is published on this page. Analytics and cookie
            behaviour are not configured yet, and the legal text is under review.
            Until then, this page is excluded from search engine indexing. For
            any question in the meantime, contact {contactEmail}.
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
