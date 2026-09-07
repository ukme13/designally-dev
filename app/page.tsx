import type { Metadata } from "next";
import Arrow from "@/app/_components/arrow";
import Button from "@/app/_components/button";
import HeroIntro from "@/app/_components/hero-intro";
import Showreel from "@/app/_components/showreel";
import TextLink from "@/app/_components/text-link";
import { featuredInsights } from "@/app/_lib/insights";
import { contactHref } from "@/app/_lib/navigation";
import { featuredProjects } from "@/app/_lib/projects";
import { services } from "@/app/_lib/services";

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




export default function Home() {
  return (
    <>
      {/*
        Sticky stage.

        Everything the pinned gradient sits behind lives in here: the hero and
        the section after it. The gradient is the stage's first child and stays
        fixed to the top of the viewport while the rest scrolls over it.

        The gradient takes its own 100svh of flow, and the content below is
        pulled back over it by exactly that much. A sticky element stays pinned
        for (container height - its own height) of scrolling, so the stage
        measures two viewports and the gradient is pinned for one — the length
        of the hero.

        The negative margin is on the CONTENT, never on the sticky element
        itself. Sticky constrains an element's MARGIN box to its containing
        block, not its border box: a `margin-bottom: -100svh` on the gradient
        zeroes its margin box and lets the visible box overhang the stage by a
        full viewport, so it carries on travelling behind the section below and
        the join lands on a mid-gradient colour instead of the end stop. That
        was the visible seam.

        It then releases and travels up with the section below it, so the two
        leave together. That is deliberate: holding the gradient still while
        the next section rose over it read as two things moving against each
        other rather than one picture leaving.

        The negative top margin lives HERE, not on the hero. The gradient is
        the stage's first child, so the stage's top edge is where it starts —
        and with the offset on the hero instead, the stage began below the
        header and left a band of white page above the gradient on every load.
        Pulling the stage up by exactly the space the header reserves puts the
        gradient back under it.

        See docs/specs/STARTUP-INTRO.md.
      */}
      <div className="relative -mt-20 lg:-mt-section-tablet">
        {/* The pinned gradient and the three statement lines. Contributes no
            height of its own — see -mb-[100svh] above — so the hero below starts at
            the top of the stage and overlays it. */}
        <div aria-hidden="true" className="sticky top-0 h-svh">
          <HeroIntro />
        </div>

        {/* Pulled back over the gradient by exactly its height. This is what
            makes the two share the stage's first viewport — and it is on this
            wrapper rather than on the gradient for the margin-box reason
            above. */}
        <div className="-mt-[100svh]">

        {/* Hero.
            The stage above carries the negative margin now. The top padding
            here puts that space back, so the showreel centres in the area
            BELOW the header rather than in the full viewport box and cannot
            slide under it on a short screen.

            100px of bottom padding below sm, so the block does not sit flush
            against the fold. It is only affordable because it is accounted
            for: `--showreel-reserve` in showreel.tsx includes it, so the
            rectangle shrinks by the same amount rather than the hero
            outgrowing 100svh.

            `min-h-svh` rather than a fixed height: on a short viewport the
            video and its caption are taller than the space available, and the
            section grows instead of overflowing into the one below.

            No background of its own any more — the stage's sticky layer is
            what paints behind it. `relative` is what lifts it above that
            layer, both being positioned.

            The page's <h1> lives in the intro section below. If the hero gets
            its own heading, move or demote that one so the page still has
            exactly one. */}
          <section
            id="hero"
            className="relative flex min-h-svh w-full items-center justify-center pt-20 pb-25 sm:pb-0"
          >
            {/* Selected-work showreel. See docs/specs/SHOWREEL.md.

                Its entrance waits for a cue the hero raises partway through its
                own timeline, at the moment the navbar starts arriving rather
                than when it has finished. The wiring is `subscribeShowreelCue`
                in app/_lib/intro.ts; nothing here sequences it.

                Keeps `id="showreel"` so any existing #showreel link still
                resolves. */}
            <div id="showreel" className="relative z-10 w-full scroll-mt-8">
              <Showreel />
            </div>
          </section>

        {/* PLACEHOLDER — replace with real content.

            In normal flow. Its arrival at the top of the viewport is exactly
            where the gradient's pin ends, so from that point the two move
            together and leave as one picture.

            No background, so the gradient shows through it. */}
          <section className="relative flex min-h-svh w-full items-center justify-center">
            <p className="type-display-sm text-text-on-accent">test</p>
          </section>
        </div>
      </div>

      {/* The section the stage hands over to.

          Ordinary flow, directly after the stage: it rises into frame as the
          section above leaves, and the gradient is travelling up with them by
          then rather than sitting still behind it.

          Solid `primary-300` — the hero gradient's own bottom stop, not a
          colour chosen to look close. At the moment the two meet they are the
          same value and there is no line to see. Holding it solid rather than
          starting to fade here keeps that join reading as one surface; the
          fade back to the page's own background happens in the section below.

          If the hero gradient's end stop changes, this has to change with it.

          PLACEHOLDER: real content goes here, and whatever replaces it has to
          keep this background. */}
      <section className="relative flex min-h-svh w-full items-center justify-center bg-primary-300">
        <p className="type-display-sm text-text-on-accent">next section</p>
      </section>

      {/* Where the brand colour hands back to the page.

          `from-primary-300` matches the solid section above exactly, for the
          same reason that one matches the hero gradient — the join is
          invisible because the two values are identical, not close. It then
          runs to `surface-base`, so the page arrives back at its own
          background rather than stopping dead on brand orange.

          Three joins now depend on `primary-300` being the same value in all
          of them: the hero gradient's end stop, the solid section above, and
          the `from-` here. Change one and all three have to move.

          PLACEHOLDER: real content goes here, and whatever replaces it has to
          keep this background. */}
      <section className="relative flex min-h-svh w-full items-center justify-center bg-linear-to-b from-primary-300 to-surface-base">
        <p className="type-display-sm text-text-primary">last section</p>
      </section>

      <section
        id="intro"
        className="mx-auto grid w-full max-w-page scroll-mt-8 items-center gap-12 px-gutter-mobile py-section-mobile md:px-gutter-tablet md:py-section-tablet lg:grid-cols-12 xl:px-gutter-desktop xl:py-section-desktop"
      >
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
            {featuredProjects.map((project, index) => (
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
                <p className="max-w-lg type-body text-text-body md:col-span-5">{service.shortPromise}</p>
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
            {featuredInsights.map((insight, index) => (
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
