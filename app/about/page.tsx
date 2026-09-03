import type { Metadata } from "next";

import Arrow from "@/app/_components/arrow";
import Button from "@/app/_components/button";
import DraftNotice from "@/app/_components/draft-notice";
import PageIntro from "@/app/_components/page-intro";
import Section from "@/app/_components/section";
import { contactHref } from "@/app/_lib/navigation";

export const metadata: Metadata = {
  title: "About",
  description:
    "Designally is a strategy-led branding and design agency in Bangkok, Thailand, working in Thai and English across Southeast Asia and international markets.",
  alternates: { canonical: "/about/" },
};

const principles = [
  {
    number: "01",
    title: "Understand what matters.",
    description:
      "Start with the business, the people behind it, and what actually needs to change.",
  },
  {
    number: "02",
    title: "Make the direction clear.",
    description:
      "Agree the position and the story before making visible design decisions.",
  },
  {
    number: "03",
    title: "Build what can grow.",
    description:
      "Deliver a system the business can use, extend and keep consistent over time.",
  },
];

/** Proof points from the 2026 brand strategy. Not yet confirmed for publication. */
const proofPoints = [
  { value: "150+", label: "Brands supported*" },
  { value: "Six years", label: "Of work*" },
  { value: "Bangkok", label: "Thailand · Working across markets" },
  { value: "Thai & English", label: "Bilingual collaboration" },
];

export default function AboutPage() {
  return (
    <>
      <PageIntro
        eyebrow="About Designally"
        title="More Than Creative. We Build What Matters."
        intro="Designally is a strategy-led branding and design agency in Bangkok, Thailand. We help businesses create, grow, and transform through brand strategy, identity, digital experiences, and creative execution."
      />

      <Section>
        <div className="grid gap-8 lg:grid-cols-12">
          <p className="type-label text-text-muted lg:col-span-3">
            What we believe
          </p>
          <div className="lg:col-span-9">
            <h2 className="max-w-4xl type-display-sm text-text-primary text-balance">
              Foundation Before Output.
            </h2>
            <p className="mt-8 max-w-text type-body-lg text-text-body">
              A logo before a direction. A website before a clear story. The
              visible problem often starts somewhere earlier.
            </p>
            <p className="mt-6 max-w-text type-body text-text-body">
              The strongest creative work begins with a clear understanding of
              the business, its audience, and what needs to change. Once that is
              agreed, strategy and creative work can move in the same direction.
            </p>
          </div>
        </div>

        <div className="mt-16 grid border-t border-border-default lg:grid-cols-3">
          {principles.map((principle) => (
            <article
              key={principle.number}
              className="flex flex-col border-b border-border-default py-8 lg:border-r lg:px-8 lg:first:pl-0 lg:last:border-r-0 lg:last:pr-0"
            >
              <span className="type-small text-text-muted">{principle.number}</span>
              <h3 className="mt-8 type-h1 text-text-primary">
                {principle.title}
              </h3>
              <p className="mt-4 type-body text-text-body">
                {principle.description}
              </p>
            </article>
          ))}
        </div>
      </Section>

      <Section className="border-t border-border-default bg-surface-raised">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <p className="type-label text-text-muted">
              Proof
            </p>
            <h2 className="mt-8 max-w-xl type-display-sm text-text-primary">
              Built with care. Proven through the work.
            </h2>
          </div>
          <div className="lg:col-span-7">
            <dl className="grid gap-4 sm:grid-cols-2">
              {proofPoints.map((point) => (
                <div
                  key={point.value}
                  className="flex min-h-40 flex-col justify-between rounded-md border border-border-default p-6"
                >
                  <dt className="font-display text-4xl font-medium text-text-primary">
                    {point.value}
                  </dt>
                  <dd className="type-small text-text-secondary">{point.label}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 text-xs text-text-secondary">
              *These proof points come from the 2026 brand strategy and must be
              confirmed before publication.
            </p>
          </div>
        </div>
      </Section>

      <Section>
        <div className="grid gap-8 lg:grid-cols-12">
          <p className="type-label text-text-muted lg:col-span-3">
            Still to come
          </p>
          <div className="lg:col-span-9">
            <h2 className="max-w-3xl type-h1-alt text-text-primary text-balance">
              The people behind the work.
            </h2>
            <div className="mt-8">
              <DraftNotice>
                Team members, roles, portraits and the full company record are
                not published yet. Current team information, approved portraits,
                the office address and verified client details are being
                gathered, and will be added once they are confirmed.
              </DraftNotice>
            </div>
            <Button href={contactHref} className="mt-10">
              Meet Designally <Arrow />
            </Button>
          </div>
        </div>
      </Section>
    </>
  );
}
