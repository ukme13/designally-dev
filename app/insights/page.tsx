import type { Metadata } from "next";

import DraftNotice from "@/app/_components/draft-notice";
import InsightCard from "@/app/_components/insight-card";
import PageIntro from "@/app/_components/page-intro";
import Section from "@/app/_components/section";
import { getInsights } from "@/app/_lib/insights";

export const metadata: Metadata = {
  title: "Insights",
  description:
    "Practical thinking on brand strategy, rebranding and identity from Designally, a strategy-led branding and design agency in Bangkok.",
  alternates: { canonical: "/insights/" },
};


/** Future topics listed in docs/specs/HOMEPAGE.md. */
const futureTopics = [
  "How Much Does Branding Cost in Thailand?",
  "What Should Happen Before Logo Design?",
  "How to Choose a Branding Agency in Thailand",
  "Why Good Businesses Sometimes Look Smaller Than They Are",
];

export default async function InsightsPage() {
  /* From Sanity when it is configured, from app/_lib/insights.ts when it is
     not. See ADR-007. */
  const insights = await getInsights();

  return (
    <>
      <PageIntro
        eyebrow="Our thinking"
        title="Useful thinking for important brand decisions."
        intro="Articles drawn from real projects and the questions clients ask before choosing an agency."
      />

      <Section>
        <DraftNotice label="Not published yet">
          These articles are planned, not written. They are listed here rather
          than linked so nothing points at a page that does not exist. Nine
          existing articles from the current website are also being reviewed and
          rewritten before they move under this section.
        </DraftNotice>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {insights.map((article) => (
            <InsightCard key={article.title} insight={article} heading="h2" />
          ))}
        </div>
      </Section>

      <Section className="border-t border-border-default bg-surface-raised">
        <div className="grid gap-8 lg:grid-cols-12">
          <p className="type-label text-text-muted lg:col-span-3">
            Under consideration
          </p>
          <div className="lg:col-span-9">
            <h2 className="max-w-3xl type-h1-alt text-text-primary text-balance">
              Topics we may write about next.
            </h2>
            <ul className="mt-8 border-t border-border-default">
              {futureTopics.map((topic) => (
                <li
                  key={topic}
                  className="border-b border-border-default py-4 type-body text-text-body"
                >
                  {topic}
                </li>
              ))}
            </ul>
            <p className="mt-8 max-w-text type-small text-text-secondary">
              Every article must include original Designally experience or
              examples before it is published.
            </p>
          </div>
        </div>
      </Section>
    </>
  );
}
