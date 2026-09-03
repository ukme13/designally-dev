import type { Metadata } from "next";
import Link from "next/link";

import Arrow from "@/app/_components/arrow";
import Button from "@/app/_components/button";
import PageIntro from "@/app/_components/page-intro";
import Section from "@/app/_components/section";
import { contactHref } from "@/app/_lib/navigation";
import { servicePath, services } from "@/app/_lib/services";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Brand strategy, branding and identity, rebranding, websites and digital experiences, and ongoing creative partnership from Designally in Bangkok.",
  alternates: { canonical: "/services/" },
};

export default function ServicesPage() {
  return (
    <>
      <PageIntro
        eyebrow="What we build"
        title="The right work starts with the right question."
        intro="Designally works across strategy, identity, rebranding and digital. Most engagements combine more than one, because the visible problem often starts somewhere earlier."
      />

      <Section>
        <div className="border-t border-border-strong">
          {services.map((service, index) => (
            <article key={service.slug}>
              <Link
                href={servicePath(service.slug)}
                className="group grid gap-5 border-b border-border-default py-8 transition-colors duration-300 ease-standard hover:bg-surface-raised md:grid-cols-12 md:items-start"
              >
                <span className="type-small text-text-muted md:col-span-1">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h2 className="type-h1 text-text-primary transition-colors duration-300 ease-standard group-hover:text-action-primary md:col-span-5">
                  {service.name}
                </h2>
                <div className="md:col-span-5">
                  <p className="max-w-lg type-body text-text-body">
                    {service.shortPromise}
                  </p>
                  <p className="mt-3 max-w-lg type-small text-text-secondary">
                    {service.situations[0]}
                  </p>
                </div>
                <span
                  className="hidden justify-self-end text-text-primary transition-colors duration-300 ease-standard group-hover:text-action-primary md:block"
                  aria-hidden="true"
                >
                  ↗
                </span>
              </Link>
            </article>
          ))}
        </div>
      </Section>

      <Section className="border-t border-border-default bg-surface-raised">
        <div className="grid gap-8 lg:grid-cols-12">
          <p className="type-label text-text-muted lg:col-span-3">
            Not sure which one
          </p>
          <div className="lg:col-span-9">
            <h2 className="max-w-3xl type-h1-alt text-text-primary text-balance">
              Most businesses do not arrive knowing the answer.
            </h2>
            <p className="mt-6 max-w-text type-body text-text-body">
              If you can describe what is changing, or what is not working, that
              is enough to start. Working out which service fits is part of the
              first conversation, not something you need to decide beforehand.
            </p>
            <Button href={contactHref} className="mt-10">
              Tell us what&apos;s changing <Arrow />
            </Button>
          </div>
        </div>
      </Section>
    </>
  );
}
