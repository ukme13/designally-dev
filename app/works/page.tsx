import type { Metadata } from "next";

import Arrow from "@/app/_components/arrow";
import Button from "@/app/_components/button";
import DraftNotice from "@/app/_components/draft-notice";
import PageIntro from "@/app/_components/page-intro";
import Section from "@/app/_components/section";
import { contactHref } from "@/app/_lib/navigation";
import { projects } from "@/app/_lib/projects";

export const metadata: Metadata = {
  title: "Work",
  description:
    "Selected branding, rebranding and digital projects by Designally, a strategy-led branding and design agency in Bangkok, Thailand.",
  alternates: { canonical: "/works/" },
};


/** Records identified in the audit that still need review before migration. */
const underReview = [
  "Aroma Group",
  "BigC Food Avenue",
  "Unkonscious",
  "MJet Thailand",
  "Thai Gem Centre",
  "ThaiSangThai",
  "Motif Development",
];

export default function WorksPage() {
  return (
    <>
      <PageIntro
        eyebrow="Selected work"
        title="Built for the moment the business was in."
        intro="Different businesses need different kinds of change. The work begins by understanding what matters now—and what needs to last."
      />

      <Section>
        <DraftNotice>
          This index is scaffolded from the existing website audit. Project
          names, services and business stages come from current records. Full
          case studies, imagery and any published results are pending client
          permission and evidence review, so no outcomes are shown yet.
        </DraftNotice>

        <div className="mt-16 grid gap-x-6 gap-y-14 md:grid-cols-2">
          {projects.map((project, index) => (
            <article key={project.name} className={index % 2 === 1 ? "md:mt-20" : ""}>
              <div
                className={`flex aspect-work items-center justify-center overflow-hidden rounded-md ${project.background} ${project.foreground}`}
              >
                <span
                  className="font-display text-[clamp(6rem,18vw,15rem)] leading-none"
                  aria-hidden="true"
                >
                  {project.mark}
                </span>
              </div>
              <div className="mt-5 flex items-start justify-between gap-6 border-t border-border-default pt-4">
                <div>
                  <h2 className="type-h2 text-text-primary">
                    {project.name}
                  </h2>
                  <p className="mt-2 type-small text-text-secondary">
                    {project.services}
                  </p>
                  <p className="mt-1 type-small text-text-secondary">
                    {project.industry}
                  </p>
                </div>
                <span className="shrink-0 text-xs tracking-label text-text-muted uppercase">
                  {project.stage}
                </span>
              </div>
            </article>
          ))}
        </div>
      </Section>

      <Section className="border-t border-border-default bg-surface-raised">
        <div className="grid gap-8 lg:grid-cols-12">
          <p className="type-label text-text-muted lg:col-span-3">
            Also under review
          </p>
          <div className="lg:col-span-9">
            <h2 className="max-w-3xl type-h1-alt text-text-primary text-balance">
              Further records are still being checked.
            </h2>
            <p className="mt-6 max-w-text type-body text-text-body">
              These projects exist in the current website records. Each one needs
              a relevance, evidence, asset quality and permission check before it
              can be published as a case study.
            </p>
            <ul className="mt-8 flex flex-wrap gap-3">
              {underReview.map((name) => (
                <li
                  key={name}
                  className="rounded-pill border border-border-default px-4 py-2 type-small text-text-secondary"
                >
                  {name}
                </li>
              ))}
            </ul>
            <Button href={contactHref} className="mt-10">
              Discuss a similar need <Arrow />
            </Button>
          </div>
        </div>
      </Section>
    </>
  );
}
