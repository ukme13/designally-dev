import type { Metadata } from "next";
import { notFound } from "next/navigation";

import Arrow from "@/app/_components/arrow";
import Button from "@/app/_components/button";
import DraftNotice from "@/app/_components/draft-notice";
import PageIntro from "@/app/_components/page-intro";
import Section from "@/app/_components/section";
import TextLink from "@/app/_components/text-link";
import { contactHref } from "@/app/_lib/navigation";
import { getService, servicePath, services } from "@/app/_lib/services";

/** Only the five known services exist; anything else is a 404, not a build. */
export const dynamicParams = false;

export function generateStaticParams() {
  return services.map((service) => ({ slug: service.slug }));
}

export async function generateMetadata(
  props: PageProps<"/services/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const service = getService(slug);

  if (!service) {
    return {};
  }

  return {
    title: service.seo.title,
    description: service.seo.description,
    alternates: { canonical: servicePath(service.slug) },
  };
}

export default async function ServicePage(props: PageProps<"/services/[slug]">) {
  const { slug } = await props.params;
  const service = getService(slug);

  if (!service) {
    notFound();
  }

  const otherServices = services.filter((item) => item.slug !== service.slug);

  return (
    <>
      <PageIntro
        eyebrow="Services"
        title={service.name}
        intro={service.intro}
      >
        <Button href={contactHref}>
          Discuss a project <Arrow />
        </Button>
        <Button href="/services/" variant="secondary">
          All services
        </Button>
      </PageIntro>

      <Section>
        <div className="grid gap-8 lg:grid-cols-12">
          <p className="type-label text-text-muted lg:col-span-3">
            01 / When this helps
          </p>
          <div className="lg:col-span-9">
            <h2 className="max-w-3xl type-display-sm text-text-primary text-balance">
              {service.shortPromise}
            </h2>
            <ul className="mt-12 border-t border-border-default">
              {service.situations.map((situation) => (
                <li
                  key={situation}
                  className="border-b border-border-default py-5 type-body-lg text-text-body"
                >
                  {situation}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      <Section className="border-t border-border-default bg-surface-raised">
        <div className="grid gap-8 lg:grid-cols-12">
          <p className="type-label text-text-muted lg:col-span-3">
            02 / What you decide
          </p>
          <div className="lg:col-span-9">
            <h2 className="max-w-3xl type-h1-alt text-text-primary text-balance">
              The decisions this work is meant to settle.
            </h2>
            <ol className="mt-12 grid gap-x-10 gap-y-6 md:grid-cols-2">
              {service.decisions.map((decision, index) => (
                <li
                  key={decision}
                  className="flex gap-4 border-t border-border-default pt-5"
                >
                  <span className="type-small text-text-muted">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="type-body text-text-body">{decision}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </Section>

      <Section>
        <div className="grid gap-8 lg:grid-cols-12">
          <p className="type-label text-text-muted lg:col-span-3">
            03 / What it may include
          </p>
          <div className="lg:col-span-9">
            <h2 className="max-w-3xl type-h1-alt text-text-primary text-balance">
              Scope is set per engagement.
            </h2>
            <p className="mt-6 max-w-text type-body text-text-body">
              Not every engagement needs everything below. The scope is agreed
              after the first conversation, once the situation is clear.
            </p>
            <ul className="mt-10 grid gap-3 md:grid-cols-2">
              {service.includes.map((item) => (
                <li
                  key={item}
                  className="border-t border-border-default pt-3 type-body text-text-body"
                >
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-10">
              <DraftNotice label="Not published yet">
                Typical engagement duration and indicative scope are not
                published. They will be added once Designally confirms figures
                it is willing to stand behind.
              </DraftNotice>
            </div>
          </div>
        </div>
      </Section>

      <Section className="bg-surface-inverse text-white">
        <div className="grid gap-8 lg:grid-cols-12">
          <p className="type-label text-secondary-200 lg:col-span-3">
            04 / How the work happens
          </p>
          <div className="lg:col-span-9">
            <h2 className="max-w-3xl type-display-sm text-white text-balance">
              Foundation before output.
            </h2>
            <div className="mt-12 grid border-t border-neutral-700 md:grid-cols-3">
              {service.process.map((step) => (
                <article
                  key={step.number}
                  className="flex flex-col border-b border-neutral-700 py-8 md:border-r md:px-8 md:first:pl-0 md:last:border-r-0 md:last:pr-0"
                >
                  <span className="type-small text-secondary-200">
                    {step.number}
                  </span>
                  <h3 className="mt-8 type-h1 text-white">
                    {step.title}
                  </h3>
                  <p className="mt-4 type-body text-neutral-150">
                    {step.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </Section>

      <Section className="border-t border-border-default">
        <div className="grid gap-8 lg:grid-cols-12">
          <p className="type-label text-text-muted lg:col-span-3">
            05 / Proof
          </p>
          <div className="lg:col-span-9">
            <h2 className="max-w-3xl type-h1-alt text-text-primary text-balance">
              Relevant work for this service.
            </h2>
            <div className="mt-8">
              <DraftNotice>
                Case studies for this service are not published yet. Project
                stories, imagery and any results are pending client permission
                and evidence review, so nothing is claimed here in the meantime.
              </DraftNotice>
            </div>
            <TextLink
              href="/works/"
              label="See the work index"
              className="mt-8"
            />
          </div>
        </div>
      </Section>

      <Section className="border-t border-border-default bg-surface-raised">
        <div className="grid gap-8 lg:grid-cols-12">
          <p className="type-label text-text-muted lg:col-span-3">
            06 / Common questions
          </p>
          <div className="lg:col-span-9">
            <dl className="border-t border-border-default">
              {service.faqs.map((faq) => (
                <div key={faq.question} className="border-b border-border-default py-8">
                  <dt className="max-w-3xl type-h1 text-text-primary">
                    {faq.question}
                  </dt>
                  <dd className="mt-4 max-w-text type-body text-text-body">
                    {faq.answer}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </Section>

      <Section className="border-t border-border-default">
        <div className="grid gap-8 lg:grid-cols-12">
          <p className="type-label text-text-muted lg:col-span-3">
            07 / Other services
          </p>
          <div className="lg:col-span-9">
            <ul className="border-t border-border-strong">
              {otherServices.map((item) => (
                <li key={item.slug}>
                  <TextLink
                    href={servicePath(item.slug)}
                    label={item.name}
                    className="w-full justify-between border-b border-border-default py-6 type-h2"
                  />
                </li>
              ))}
            </ul>
            <Button href={contactHref} className="mt-12">
              Tell us what&apos;s changing <Arrow />
            </Button>
          </div>
        </div>
      </Section>
    </>
  );
}
