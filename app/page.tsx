import type { Metadata } from "next";
import { Fragment } from "react";
import HeroIntro from "@/app/_components/hero-intro";
import { BrushUnderline, DoubleChevronIcon } from "@/app/_components/icons";
import MaskedText from "@/app/_components/masked-text";
import PaperPlaneScroll from "@/app/_components/paper-plane-scroll";
import SituationCards from "@/app/_components/situation-cards";
import ScrollGradientText from "@/app/_components/scroll-gradient-text";
import SectionTitle from "@/app/_components/section-title";
import ShowcaseLoop from "@/app/_components/showcase-loop";
import Showreel from "@/app/_components/showreel";
import TextLink from "@/app/_components/text-link";
import { featuredInsights } from "@/app/_lib/insights";
import { services } from "@/app/_lib/services";
import { situations } from "@/app/_lib/situations";

export const metadata: Metadata = {
  title: "Designally — Branding & Design Agency in Bangkok",
  description:
    "Designally is a strategy-led branding and design agency in Bangkok, helping businesses create, grow, and transform through strategy, identity, and digital experiences.",
  alternates: {
    canonical: "/",
  },
};

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

        `data-scroll-stage` is the hook hero-intro.tsx measures its scroll
        animation against — the statement lines run from their start keyframe
        to their end one across exactly this element. It reads the attribute
        from an ancestor lookup rather than counting parents, so the markup
        between the two can change; the attribute itself cannot go.

        See docs/specs/STARTUP-INTRO.md.
      */}
      <div
        data-scroll-stage
        /* Orange from top to bottom: the sticky gradient behind it is what the
           header sits over for this whole stage, hero and statement lines
           alike. */
        data-header-tone="light"
        className="relative -mt-20 lg:-mt-section-tablet"
      >
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
        <div className="mt-[-100svh]">
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

            THE PAGE HAS NO <h1>. The intro section that carried it was
            removed on 9 September 2026 along with the selected-work section,
            and nothing was promoted in its place. The statement here is a <p>,
            and the section titles below are <h2>s under a heading that no
            longer exists. Whatever replaces these sections should take the
            <h1> — or one of the existing headings should be promoted. */}
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
          {/* `isolate` is for the paper plane below: it confines the plane's
              z-index to this section, so a layer meant to sit over the
              statement cannot also sit over the header. */}
          <section className="relative isolate flex min-h-svh w-full items-center justify-center">
            {/* The paper plane, flying across this section as it scrolls past.
                Decorative and scroll-linked; it adds no height, taking its box
                from the section around it. It passes OVER the statement —
                `PLANE_LAYER` in paper-plane-scroll.tsx is the side it flies on. */}
            <PaperPlaneScroll />

            {/* Edit the words here — one array entry per line. The reveal's
                timing lives in masked-text.tsx and its easing in tokens.css.

                `<Fragment key=…>` rather than `<>`: this is a server component
                handing an array of elements to a client one, and React asks
                for keys on it. A bare fragment takes no key, so each line is
                spelled out. The keys are never rendered — any stable string
                will do. */}
            <div className="flex w-full max-w-5xl flex-col items-center gap-8 px-gutter-mobile md:gap-10 md:px-gutter-tablet">
              <MaskedText
                lines={[
                  <Fragment key="creative">
                    Strategy-led branding & design agency · Bangkok
                  </Fragment>,
                ]}
                className="type-label text-text-on-accent/70 text-center"
              />
              <MaskedText
                lines={[
                  <Fragment key="creative">
                    More Than{" "}
                    {/* `relative` so the stroke can be placed against this word
                        alone; `inline-block` so it keeps a box to measure. The
                        full stop stays outside — the underline is under the
                        word, not the punctuation. */}
                    <span className="relative inline-block">
                      Cre<i>a</i>tive
                      {/*
                        NUDGE THE UNDERLINE HERE. `top-[0.85em]` sits it just
                        below the baseline of a `line-height: 1` line, and it
                        overlaps the letters' feet a little on purpose — a brush
                        stroke that clears the type entirely reads as a border.

                        There is a ceiling on how far down it can go. The mask
                        in masked-text.tsx clips at `py-[0.25em]`, and this
                        stroke is about 0.17em tall at this word's width, so
                        past roughly `top-[1.05em]` its tail starts being cut
                        off rather than drawn.
                      */}
                      <BrushUnderline className="absolute inset-x-0 top-[0.95em] w-full" />
                    </span>
                    .
                  </Fragment>,
                  <Fragment key="matters">
                    We Build What <span className="font-accent">Matters.</span>
                  </Fragment>,
                ]}
                className="type-display text-text-on-accent text-center"
              />
              <ScrollGradientText
                text="Good businesses are not always seen for what they truly are. We help businesses create, grow, and transform through brand strategy, identity, digital experiences, and creative execution."
                className="max-w-text text-text-on-accent font-body text-5xl text-center"
              />
            </div>
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

          The situations block lives here now. It keeps the background, as the
          note above requires — which is why every colour in it is an on-accent
          one: this is brand orange, not the page's own surface. */}
      <section
        id="situations"
        data-header-tone="light"
        className="relative w-full scroll-mt-8 bg-primary-300"
      >
        <div className="mx-auto w-full max-w-page px-gutter-mobile py-section-mobile md:px-gutter-tablet md:py-section-tablet xl:px-gutter-desktop xl:py-section-desktop">
          {/* Both halves of the heading are revealed by MaskedText, which
              re-arms only from below — see masked-text.tsx. The second is an
              `h2` rather than the component's default paragraph: this is the
              section's heading and has to stay one. */}
          {/* gap-6 / lg:gap-8, the same as the Case Study title and the "how
              we think" section below. At `lg` the gap is also the width of the
              gutter between the title and the content, so a section using a
              different one sits on a visibly different grid. */}
          <div className="grid gap-6 lg:grid-cols-12 lg:gap-8">
            {/* The Case Study treatment — the "))" mark beside a large Poppins
                line — reproduced here rather than reusing SectionTitle, because
                that component brings its own page container and this heading
                already sits inside one.

                The mark takes `tone="current"` so it inherits the white above
                it: its brand oranges would disappear into this section's
                background. Sized in `em` so it tracks the type, exactly as it
                does in section-title.tsx.

                It sits OUTSIDE the MaskedText, so it is present while the words
                rise out of the mask rather than rising with them. Moving it
                inside the `lines` array would mask it too. */}
            <div className="flex gap-[0.4em] font-sans text-accent-xl font-medium text-text-on-accent lg:col-start-1 lg:col-end-5">
              <DoubleChevronIcon
                tone="current"
                className="h-[1em] w-auto shrink-0"
              />
              <MaskedText lines={["Where are you now?"]} />
            </div>
            <MaskedText
              as="h2"
              lines={["Every important moment needs the right foundation."]}
              /* `col-start` and `col-end` rather than a span: `col-span-6`
                 compiles to the SHORTHAND `grid-column: span 6 / span 6`, which
                 rewrites both ends of the placement — so it wipes out any
                 `col-end-*` sitting beside it, whichever order they are written
                 in. Stating both lines leaves nothing to overwrite. */
              className="max-w-4xl type-display-sm text-text-on-accent text-balance lg:col-start-7 lg:col-end-13"
            />
          </div>

          {/* The cards' words live in the `situations` array above, so they are
              written once and passed down rather than restated in the client
              component. Its animation constants are at the top of
              situation-cards.tsx. */}
          <SituationCards situations={situations} />
        </div>
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

          The showcase inside it is the approved work posters, drifting, with
          the scroll wheel pushing them. Its speed and its coupling to the
          scroll are both constants at the top of showcase-loop.tsx.

          The showcase runs edge to edge and the title under it does not: the
          title sits on the page grid, so it lines up with the navbar and every
          other section, while the row it labels deliberately breaks out of it.

          The title is placed AFTER the row on purpose — it reads as a caption
          to the work rather than a lid on it. Swapping the two lines below is
          all it takes to put it back on top. */}
      <section className="relative flex min-h-svh w-full flex-col items-center justify-center gap-10 bg-linear-to-b from-primary-300 to-surface-base md:gap-14">
        {/* Only the TOP of this section is orange — it fades to the page
            background by the bottom — so the marker covers a third of it
            rather than the whole thing. Marking the section would leave the
            logo white over the pale end of the fade; marking nothing would
            leave it orange over the brand-orange start, which is the problem
            this whole system exists to fix.

            A third is a judgement about where the fade stops being dark enough
            to carry white; move it if it reads wrong. The element paints
            nothing and takes no space. */}
        <span
          aria-hidden="true"
          data-header-tone="light"
          className="pointer-events-none absolute inset-x-0 top-0 h-1/3"
        />
        <ShowcaseLoop />
        <SectionTitle
          title={
            <Fragment>
              Case <span className="text-action-primary">Study</span>
            </Fragment>
          }
          note={
            <>
              <ScrollGradientText
                text="We help businesses create, grow, and transform through strategy, identity, rebranding, and digital design. We work alongside the people shaping the business to find the right direction, build a brand system that holds together, and create the experiences it needs next. No design for decoration—just clear thinking and work built to matter."
                className="text-accent-lg"
              />
              <TextLink href="/works/" label="View selected work" sweep />
            </>
          }
        />
      </section>

      {/* Cream, not brand orange. `data-header-tone="light"` came off with the
          colour: that marker asks the floating logo to turn white, which is
          right over orange and wrong over this. */}
      <section className="bg-surface-base text-text-body">
        <div className="mx-auto grid w-full max-w-page gap-6 px-gutter-mobile py-section-mobile md:px-gutter-tablet md:py-section-tablet lg:grid-cols-12 lg:gap-8 xl:px-gutter-desktop xl:py-section-desktop">
          {/* The same treatment as "Where are you now?" — the "))" mark beside
              a large Poppins line. `tone="brand"` is the default and the right
              one here: this sits on cream, where the mark's own oranges read,
              unlike on the orange section above. */}
          <div className="flex gap-[0.4em] font-sans text-accent-xl font-medium text-text-primary lg:col-start-1 lg:col-end-5">
            <DoubleChevronIcon className="h-[1em] w-auto shrink-0" />
            {/* A `span`, not a Fragment. A Fragment renders no element, so its
                children become direct children of this flex row — "How we" as
                an anonymous flex item and the coloured span as another — and
                `gap-[0.4em]` would land BETWEEN the two words as well as after
                the mark. Inside a real element they are ordinary inline content
                with an ordinary word space. section-title.tsx carries the same
                note for the same reason. */}
            <span>
              How we <span className="text-action-primary">think</span>
            </span>
          </div>
          {/* Columns 7-12, matching the statement in the situations section
              above — the two sections now share one layout: title on the left
              four, content on the right six, a two-column gutter between.

              Stated as start and end lines, never a span. `col-span-*` compiles
              to the shorthand `grid-column: span N / span N`, which rewrites
              both ends of the placement and silently overrides any `col-end-*`
              beside it, whichever order they are written in. */}
          <div className="lg:col-start-7 lg:col-end-13">
            <h2 className="max-w-4xl type-display-sm text-text-primary text-balance">
              Fou<i>n</i>dation Before{" "}
              <span className="font-accent">
                {/* `relative inline-block` so the stroke has this word's box to
                    span, and the full stop sits outside it — the mark goes
                    under the word, not the punctuation. */}
                <span className="relative inline-block">
                  Output
                  {/*
                    `text-action-primary` because the icon fills with
                    `currentColor`, and this heading is dark ink on cream. The
                    hero's copy of this mark inherits white instead; the colour
                    is set per use rather than baked into the icon.

                    `top-[0.95em]` matches the hero's placement. Unlike there,
                    nothing here clips: this heading has no mask around it, so
                    the stroke can be pushed further down if it reads tight
                    against the Caveat baseline, which sits differently from
                    Poppins'.
                  */}
                  <BrushUnderline className="absolute inset-x-0 top-[0.95em] w-full text-action-primary" />
                </span>
                .
              </span>
            </h2>
            {/* `text-accent-sm md:text-accent-lg` on both paragraphs: at `md`
                and up they are 2rem, the size the Case Study note runs at, so
                the two sections read as one voice. Below that they drop to
                1.25rem — 2rem is a heading size on a phone, not body copy.

                The pair is a size only. The accent family is Caveat, but a bare
                `text-*` utility carries the measurement and nothing else, which
                is how section-title.tsx uses `text-accent-xl` too. */}
            <div className="mt-12 grid gap-10 border-t border-border-default pt-8 md:grid-cols-2">
              <p className="max-w-lg text-accent-sm">
                A logo before a direction. A website before a clear story. The
                visible problem often starts somewhere earlier.
              </p>
              <p className="max-w-lg text-accent-sm">
                We begin by understanding the business, the people behind it,
                and what really needs to change. Then strategy and creative work
                can move in the same direction.
              </p>
            </div>

            {/* The steps, lifted OUT of the two-column row above so they run
                the full six columns of this block rather than half of them.
                They are a sequence, and a sequence reads better across a wide
                measure than stacked in a narrow one. */}
            <ol className="mt-12 space-y-4 border-t border-border-default pt-6 type-body-lg font-medium md:text-accent-lg">
              <li className="flex justify-between">
                <span>Understand what matters.</span>
                <span>01</span>
              </li>
              <li className="flex justify-between">
                <span>Make the direction clear.</span>
                <span>02</span>
              </li>
              <li className="flex justify-between">
                <span>Build what can grow.</span>
                <span>03</span>
              </li>
            </ol>
            <TextLink
              href="/about/"
              label="See how we work"
              size="md"
              className="mt-10 underline underline-offset-4"
            />
          </div>
        </div>
      </section>

      <section id="services" className="scroll-mt-8">
        <div className="mx-auto w-full max-w-page px-gutter-mobile py-section-mobile md:px-gutter-tablet md:py-section-tablet xl:px-gutter-desktop xl:py-section-desktop">
          <div className="grid gap-8 lg:grid-cols-12">
            <p className="type-label text-text-muted lg:col-span-3">
              04 / What we build
            </p>
            <h2 className="max-w-4xl type-display-sm text-text-primary text-balance lg:col-span-9">
              The right work starts with the right question.
            </h2>
          </div>

          <div className="mt-16 border-t border-border-strong">
            {services.map((service, index) => (
              <article
                key={service.name}
                className="grid gap-5 border-b border-border-default py-8 md:grid-cols-12 md:items-start"
              >
                <span className="type-small text-text-muted md:col-span-1">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="type-h1 text-text-primary md:col-span-5">
                  {service.name}
                </h3>
                <p className="max-w-lg type-body text-text-body md:col-span-5">
                  {service.shortPromise}
                </p>
                <span
                  className="hidden justify-self-end text-text-primary md:block"
                  aria-hidden="true"
                >
                  ↗
                </span>
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
            <h2 className="mt-8 max-w-xl type-display-sm text-text-primary">
              Built with care. Proven through the work.
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:col-span-6">
            <div className="flex min-h-52 flex-col justify-between rounded-md bg-text-primary p-7 text-white">
              <strong className="font-display text-6xl font-medium">
                150+
              </strong>
              <span className="type-small text-neutral-200">
                Brands supported*
              </span>
            </div>
            <div className="flex min-h-52 flex-col justify-between rounded-md bg-secondary-400 p-7 text-white">
              <strong className="font-display text-5xl font-medium">
                Bangkok
              </strong>
              <span className="type-small text-secondary-50">
                Thailand · Working across markets
              </span>
            </div>
            <p className="text-xs text-text-secondary sm:col-span-2">
              *This proof point comes from the 2026 brand strategy and must be
              confirmed before launch.
            </p>
          </div>
        </div>
      </section>

      <section id="insights" className="scroll-mt-8">
        <div className="mx-auto w-full max-w-page px-gutter-mobile py-section-mobile md:px-gutter-tablet md:py-section-tablet xl:px-gutter-desktop xl:py-section-desktop">
          <div className="grid gap-8 lg:grid-cols-12">
            <p className="type-label text-text-muted lg:col-span-3">
              06 / Our thinking
            </p>
            <h2 className="max-w-4xl type-display-sm text-text-primary lg:col-span-9">
              Useful thinking for important brand decisions.
            </h2>
          </div>

          <div className="mt-16 grid gap-6 md:grid-cols-3">
            {featuredInsights.map((insight, index) => (
              <article
                key={insight.title}
                className="flex min-h-96 flex-col rounded-md border border-border-default p-7"
              >
                <div className="flex items-center justify-between text-xs tracking-label text-text-muted uppercase">
                  <span>{insight.topic}</span>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                </div>
                <h3 className="mt-14 type-h1-alt text-text-primary">
                  {insight.title}
                </h3>
                <p className="mt-auto pt-8 type-small text-text-secondary">
                  {insight.summary}
                </p>
              </article>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-between gap-6">
            <p className="max-w-text type-small text-text-secondary">
              These are recommended article drafts. Links will be added when
              reviewed articles are ready.
            </p>
            <TextLink href="/insights/" label="Explore insights" />
          </div>
        </div>
      </section>
    </>
  );
}
