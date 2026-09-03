import type { Metadata } from "next";
import Arrow from "@/app/_components/arrow";
import Button from "@/app/_components/button";
import TextLink from "@/app/_components/text-link";
import { contactHref } from "@/app/_lib/navigation";

export const metadata: Metadata = {
  title: "Designally — Branding & Design Agency in Bangkok",
  description:
    "Designally is a strategy-led branding and design agency in Bangkok, helping businesses create, grow, and transform through strategy, identity, and digital experiences.",
  alternates: {
    canonical: "/",
  },
};

const situations = [
  {
    number: "01",
    name: "Creation",
    question: "Starting something new?",
    description:
      "Turn the idea into a clear brand that people can understand, trust, and choose.",
    action: "Build the right foundation",
  },
  {
    number: "02",
    name: "Growth",
    question: "Growing, but something is not working?",
    description:
      "Find the gap between the business you have built and the way your brand is working for it.",
    action: "Find what is holding the brand back",
  },
  {
    number: "03",
    name: "Transformation",
    question: "Has the business outgrown its brand?",
    description:
      "Build a brand that reflects where the business is going next—and make the case for change.",
    action: "Prepare the brand for change",
  },
] as const;

const projects = [
  {
    name: "Skytower",
    stage: "Transformation",
    services: "Rebranding · Identity · Website",
    background: "bg-primary-300",
    foreground: "text-white",
    mark: "S",
  },
  {
    name: "INN News",
    stage: "Transformation",
    services: "Rebranding · Verbal identity · Website",
    background: "bg-secondary-400",
    foreground: "text-white",
    mark: "INN",
  },
  {
    name: "Laga",
    stage: "Creation",
    services: "Strategy · Identity · Packaging · Website",
    background: "bg-text-primary",
    foreground: "text-white",
    mark: "L",
  },
  {
    name: "Bitazza",
    stage: "Growth",
    services: "Creative partnership · Digital",
    background: "bg-primary-100",
    foreground: "text-text-primary",
    mark: "B",
  },
] as const;

const services = [
  {
    name: "Brand Strategy",
    description:
      "Clarify the market, audience, position, and direction before making visible decisions.",
  },
  {
    name: "Branding & Brand Identity",
    description:
      "Turn strategy into a clear verbal and visual system people can recognise and use.",
  },
  {
    name: "Rebranding",
    description:
      "Help an established business change without losing what already has value.",
  },
  {
    name: "Websites & Digital Experiences",
    description:
      "Create useful digital experiences that express the brand and support the business.",
  },
  {
    name: "Creative Partner",
    description:
      "Provide ongoing strategic and creative support as the brand grows and changes.",
  },
] as const;

const insights = [
  {
    topic: "Rebranding",
    title: "When Is It Time to Rebrand?",
    summary:
      "The signs that a business has moved forward while its brand has stayed behind.",
  },
  {
    topic: "Brand Strategy",
    title: "Brand Strategy vs Brand Identity",
    summary:
      "What each one does, how they work together, and what your business needs first.",
  },
  {
    topic: "Business & Brand",
    title: "Changing a Family Business Without Losing Its Heritage",
    summary:
      "How to protect what matters while preparing the brand for its next generation.",
  },
] as const;

export default function Home() {
  return (
    <>
      <section className="mx-auto grid min-h-[calc(100svh-5rem)] lg:min-h-[calc(100svh-7.5rem)] w-full max-w-page items-center gap-12 px-gutter-mobile py-section-mobile md:px-gutter-tablet lg:grid-cols-12 xl:px-gutter-desktop">
        <div className="lg:col-span-7">
          <p className="mb-8 type-label text-text-muted">
            Strategy-led branding & design agency · Bangkok
          </p>
          <h1 className="max-w-5xl type-display text-text-primary text-balance">
            More Than Creative.
            <span className="block text-action-primary">We Build What Matters.</span>
          </h1>
          <p className="mt-8 max-w-text type-body-lg text-text-body md:text-[1.25rem] md:leading-normal">
            Good businesses are not always seen for what they truly are. We help businesses create, grow, and transform through brand strategy, identity, digital experiences, and creative execution.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Button href={contactHref}>
              Tell us what&apos;s changing <Arrow />
            </Button>
            <Button href="/works/" variant="secondary">
              View selected work
            </Button>
          </div>
        </div>

        <div className="relative min-h-80 overflow-hidden rounded-lg bg-primary-300 p-7 text-white sm:min-h-112 lg:col-span-5" aria-hidden="true">
          <div className="absolute -right-16 -top-16 size-56 rounded-full border-40 border-primary-100/80" />
          <div className="absolute -bottom-24 -left-20 size-72 rounded-full bg-secondary-400" />
          <div className="relative flex h-full min-h-72 flex-col justify-between sm:min-h-98">
            <p className="text-sm font-medium tracking-label uppercase">Creation / Growth / Transformation</p>
            <p className="self-end font-display text-[clamp(7rem,18vw,13rem)] leading-[0.7]">D</p>
            <p className="max-w-60 text-sm font-medium">Foundation before output. Understanding before answers.</p>
          </div>
        </div>
      </section>

      <section id="situations" className="scroll-mt-8 border-t border-border-default">
        <div className="mx-auto w-full max-w-page px-gutter-mobile py-section-mobile md:px-gutter-tablet md:py-section-tablet xl:px-gutter-desktop xl:py-section-desktop">
          <div className="grid gap-8 lg:grid-cols-12">
            <p className="type-label text-text-muted lg:col-span-3">01 / Where are you now?</p>
            <h2 className="max-w-4xl type-display-sm text-text-primary text-balance lg:col-span-9">
              Every important moment needs the right foundation.
            </h2>
          </div>

          <div className="mt-16 grid border-t border-border-default lg:grid-cols-3">
            {situations.map((situation) => (
              <article key={situation.name} className="group flex min-h-96 flex-col border-b border-border-default py-8 lg:border-r lg:px-8 lg:first:pl-0 lg:last:border-r-0 lg:last:pr-0">
                <div className="flex items-center justify-between type-small text-text-muted">
                  <span>{situation.number}</span>
                  <span>{situation.name}</span>
                </div>
                <h3 className="mt-14 max-w-sm type-h1-alt text-text-primary">{situation.question}</h3>
                <p className="mt-6 max-w-sm type-body text-text-body">{situation.description}</p>
                <TextLink
                  href="/services/"
                  label={situation.action}
                  className="mt-auto w-full justify-between pt-10"
                />
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="work" className="scroll-mt-8 bg-surface-inverse text-white">
        <div className="mx-auto w-full max-w-page px-gutter-mobile py-section-mobile md:px-gutter-tablet md:py-section-tablet xl:px-gutter-desktop xl:py-section-desktop">
          <div className="grid gap-8 lg:grid-cols-12">
            <p className="type-label text-secondary-200 lg:col-span-3">02 / Selected work</p>
            <div className="lg:col-span-9">
              <h2 className="max-w-4xl type-display-sm text-white text-balance">Built for the moment the business was in.</h2>
              <p className="mt-6 max-w-text type-body-lg text-neutral-150">Different businesses need different kinds of change. The work begins by understanding what matters now—and what needs to last.</p>
            </div>
          </div>

          <div className="mt-16 grid gap-x-6 gap-y-14 md:grid-cols-2">
            {projects.map((project, index) => (
              <article key={project.name} className={index % 2 === 1 ? "md:mt-20" : ""}>
                <div className={`flex aspect-work items-center justify-center overflow-hidden rounded-md ${project.background} ${project.foreground}`}>
                  <span className="font-display text-[clamp(6rem,18vw,15rem)] leading-none" aria-hidden="true">{project.mark}</span>
                </div>
                <div className="mt-5 flex items-start justify-between gap-6 border-t border-neutral-700 pt-4">
                  <div>
                    <h3 className="type-h2 text-white">{project.name}</h3>
                    <p className="mt-2 type-small text-neutral-300">{project.services}</p>
                  </div>
                  <span className="shrink-0 text-xs tracking-label text-secondary-200 uppercase">{project.stage}</span>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-16 flex flex-wrap items-center justify-between gap-6">
            <p className="max-w-text type-small text-neutral-300">Case studies are draft candidates. Final stories and images will be added after evidence and client permission are checked.</p>
            <TextLink href="/works/" label="View all work" tone="inverse" />
          </div>
        </div>
      </section>

      <section className="bg-primary-300 text-white">
        <div className="mx-auto grid w-full max-w-page gap-14 px-gutter-mobile py-section-mobile md:px-gutter-tablet md:py-section-tablet lg:grid-cols-12 xl:px-gutter-desktop xl:py-section-desktop">
          <p className="type-label lg:col-span-3">03 / How we think</p>
          <div className="lg:col-span-9">
            <h2 className="max-w-4xl type-display-sm text-white text-balance">Foundation Before Output.</h2>
            <div className="mt-12 grid gap-10 border-t border-white/40 pt-8 md:grid-cols-2">
              <p className="max-w-lg type-body-lg">A logo before a direction. A website before a clear story. The visible problem often starts somewhere earlier.</p>
              <div>
                <p className="max-w-lg type-body-lg">We begin by understanding the business, the people behind it, and what really needs to change. Then strategy and creative work can move in the same direction.</p>
                <ol className="mt-10 space-y-4 border-t border-white/40 pt-6 text-sm font-medium">
                  <li className="flex justify-between"><span>Understand what matters.</span><span>01</span></li>
                  <li className="flex justify-between"><span>Make the direction clear.</span><span>02</span></li>
                  <li className="flex justify-between"><span>Build what can grow.</span><span>03</span></li>
                </ol>
                <TextLink
                  href="/about/"
                  label="See how we work"
                  tone="inverse"
                  className="mt-10 underline underline-offset-4"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="services" className="scroll-mt-8">
        <div className="mx-auto w-full max-w-page px-gutter-mobile py-section-mobile md:px-gutter-tablet md:py-section-tablet xl:px-gutter-desktop xl:py-section-desktop">
          <div className="grid gap-8 lg:grid-cols-12">
            <p className="type-label text-text-muted lg:col-span-3">04 / What we build</p>
            <h2 className="max-w-4xl type-display-sm text-text-primary text-balance lg:col-span-9">The right work starts with the right question.</h2>
          </div>

          <div className="mt-16 border-t border-border-strong">
            {services.map((service, index) => (
              <article key={service.name} className="grid gap-5 border-b border-border-default py-8 md:grid-cols-12 md:items-start">
                <span className="type-small text-text-muted md:col-span-1">{String(index + 1).padStart(2, "0")}</span>
                <h3 className="type-h1 text-text-primary md:col-span-5">{service.name}</h3>
                <p className="max-w-lg type-body text-text-body md:col-span-5">{service.description}</p>
                <span className="hidden justify-self-end text-text-primary md:block" aria-hidden="true">↗</span>
              </article>
            ))}
          </div>

          <TextLink
            href="/services/"
            label="Explore our services"
            className="mt-10"
          />
        </div>
      </section>

      <section className="border-y border-border-default bg-surface-raised">
        <div className="mx-auto grid w-full max-w-page gap-12 px-gutter-mobile py-section-mobile md:px-gutter-tablet md:py-section-tablet lg:grid-cols-12 xl:px-gutter-desktop">
          <div className="lg:col-span-6">
            <p className="type-label text-text-muted">05 / Proof</p>
            <h2 className="mt-8 max-w-xl type-display-sm text-text-primary">Built with care. Proven through the work.</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:col-span-6">
            <div className="flex min-h-52 flex-col justify-between rounded-md bg-text-primary p-7 text-white">
              <strong className="font-display text-6xl font-medium">150+</strong>
              <span className="type-small text-neutral-200">Brands supported*</span>
            </div>
            <div className="flex min-h-52 flex-col justify-between rounded-md bg-secondary-400 p-7 text-white">
              <strong className="font-display text-5xl font-medium">Bangkok</strong>
              <span className="type-small text-secondary-50">Thailand · Working across markets</span>
            </div>
            <p className="text-xs text-text-secondary sm:col-span-2">*This proof point comes from the 2026 brand strategy and must be confirmed before launch.</p>
          </div>
        </div>
      </section>

      <section id="insights" className="scroll-mt-8">
        <div className="mx-auto w-full max-w-page px-gutter-mobile py-section-mobile md:px-gutter-tablet md:py-section-tablet xl:px-gutter-desktop xl:py-section-desktop">
          <div className="grid gap-8 lg:grid-cols-12">
            <p className="type-label text-text-muted lg:col-span-3">06 / Our thinking</p>
            <h2 className="max-w-4xl type-display-sm text-text-primary lg:col-span-9">Useful thinking for important brand decisions.</h2>
          </div>

          <div className="mt-16 grid gap-6 md:grid-cols-3">
            {insights.map((insight, index) => (
              <article key={insight.title} className="flex min-h-96 flex-col rounded-md border border-border-default p-7">
                <div className="flex items-center justify-between text-xs tracking-label text-text-muted uppercase">
                  <span>{insight.topic}</span>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                </div>
                <h3 className="mt-14 type-h1-alt text-text-primary">{insight.title}</h3>
                <p className="mt-auto pt-8 type-small text-text-secondary">{insight.summary}</p>
              </article>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-between gap-6">
            <p className="max-w-text type-small text-text-secondary">These are recommended article drafts. Links will be added when reviewed articles are ready.</p>
            <TextLink href="/insights/" label="Explore insights" />
          </div>
        </div>
      </section>

    </>
  );
}
