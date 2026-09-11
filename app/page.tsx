import type { Metadata } from "next";
import { Fragment } from "react";
import GradientWash from "@/app/_components/gradient-wash";
import HeroIntro from "@/app/_components/hero-intro";
import { BrushUnderline, DoubleChevronIcon } from "@/app/_components/icons";
import MaskedText from "@/app/_components/masked-text";
import PaperPlaneScroll from "@/app/_components/paper-plane-scroll";
import PixelWipe from "@/app/_components/pixel-wipe";
import SituationCards from "@/app/_components/situation-cards";
import SofaFrames from "@/app/_components/sofa-frames";
import ScrollGradientText from "@/app/_components/scroll-gradient-text";
import ClientLogoStrip from "@/app/_components/client-logo-strip";
import CtaRow from "@/app/_components/cta-row";
import CountUp from "@/app/_components/count-up";
import InsightCard from "@/app/_components/insight-card";
import SectionTitle from "@/app/_components/section-title";
import ServiceRows from "@/app/_components/service-rows";
import ShowcaseLoop from "@/app/_components/showcase-loop";
import Showreel from "@/app/_components/showreel";
import { getFeaturedInsights } from "@/app/_lib/insights";
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

/**
 * The homepage's insight cards. From Sanity when it is configured, from
 * app/_lib/insights.ts when it is not. See ADR-007.
 *
 * An async component of its own so that Home stays synchronous. When the whole
 * page awaited the data, React emitted the page's resource hints in a different
 * order, with the footer duck's preload ahead of the showreel poster's. Awaiting
 * here, inside the one section that needs the data, leaves everything above it
 * exactly as it was.
 */
async function FeaturedInsightCards() {
  const featuredInsights = await getFeaturedInsights();

  return featuredInsights.map((insight) => (
    <InsightCard key={insight.title} insight={insight} />
  ));
}

/**
 * "Explore insights", as the compact band "See how we work" uses.
 *
 * Rendered in two places, under the Insights note on desktop and after the
 * cards when the layout stacks, with `hidden lg:block` and `lg:hidden` on
 * their wrappers. Only one is ever displayed, so screen readers and the
 * keyboard meet a single link. One definition, so the two can't drift apart.
 * The visibility classes sit on the wrappers, not the band: its own `block`
 * would fight a `hidden` on the same element.
 */
function ExploreInsights() {
  return (
    <CtaRow
      href="/insights/"
      label="Explore insights"
      size="compact"
      className="w-full"
    />
  );
}

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
                className="max-w-text text-text-on-accent font-body text-intro text-center"
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
      <section
        data-gradient-wash
        /* Solid cream underneath, with the orange gradient painted over it by
           GradientWash and dissolved as the section passes — so this ends up
           entirely cream by the time its bottom reaches the fold.

           `isolate` is what keeps that layer above this background instead of
           dropping behind it. The gradient itself moved off this element for
           the same reason it exists: a background cannot be faded independently
           of the box that carries it.

           The padding is spacing, and now only spacing. The fade needs this
           section to be taller than the screen — it holds at full until the top
           edge has cleared, because that edge has to keep matching the solid
           orange above it while both are visible — but HOW LONG it takes is
           `FADE_TRAVEL` in gradient-wash.tsx, not this. Change the room at the
           top freely; the wash is not listening.

           `pt-*` and `pb-*` rather than `py-*` with a `pt-*` beside it. Both
           set padding-top, and between two utilities on one property it is
           stylesheet order that decides, never the order they are written. */
        className="relative isolate flex min-h-svh w-full flex-col items-center justify-center gap-10 bg-surface-base pt-32 pb-section-mobile md:gap-14 md:pt-48 md:pb-section-tablet xl:pt-96 xl:pb-section-desktop"
      >
        <GradientWash className="bg-linear-to-b from-primary-300 to-surface-base" />
        {/* The white-logo marker, sized to the FADE and not to the section.

            This section is only orange for as long as the wash takes to clear —
            `FADE_TRAVEL` in gradient-wash.tsx, currently 0.12 of a screen. A
            marker covering a third of the section left the logo white long
            after the background had gone cream, which is the wrong way round
            and the more visible mistake of the two.

            15svh rather than 12: the header has height of its own, so it is
            still overlapping this band for a moment after the section's top
            passes it. A little margin costs nothing; being short leaves the
            logo orange on orange.

            KEEP THESE IN STEP. If `FADE_TRAVEL` changes, this changes with it —
            they describe the same moment from two different files. The element
            paints nothing and takes no space. */}
        <span
          aria-hidden="true"
          data-header-tone="light"
          className="pointer-events-none absolute inset-x-0 top-0 h-[15svh]"
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
              {/* The compact band: 64px between two rules, inside this
                  column. `w-full` because the note is a flex column that
                  starts its items rather than stretching them. */}
              <CtaRow
                href="/works/"
                label="View selected work"
                size="compact"
                className="w-full"
              />
            </>
          }
        />
      </section>

      {/* Cream, not brand orange. `data-header-tone="light"` came off with the
          colour: that marker asks the floating logo to turn white, which is
          right over orange and wrong over this. */}
      <section className="bg-surface-base text-text-body">
        <div className="mx-auto grid w-full max-w-page gap-6 px-gutter-mobile py-section-mobile md:px-gutter-tablet md:py-section-tablet lg:grid-cols-12 lg:gap-8 xl:px-gutter-desktop xl:pt-section-desktop xl:pb-120">
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
            {/* Two frames of one drawing: the sofa, then the sofa with its lamp
                on. It turns once this section's top has passed the middle of
                the screen, and turns back below it. The component finds this
                `<section>` by walking up from itself, so it has to stay inside
                it. See sofa-frames.tsx. */}
            <SofaFrames />
            <h2 className="mt-8 max-w-4xl type-display-sm text-text-primary text-balance">
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
            {/* The same compact band as "View selected work": 64px between
                two rules, across this column, with orange wiping through on
                hover or keyboard focus. */}
            <CtaRow
              href="/about/"
              label="See how we work"
              size="compact"
              className="mt-10 w-full"
            />
          </div>
        </div>
      </section>

      {/* "What we build".

          `relative isolate` is for the wipe below: it gives that layer a
          positioning parent and confines its z-index to this section, so a
          transition meant to cover this content cannot also cover the header.

          Brand orange, and the wipe below is the same orange — so the pixels
          rising away reveal the colour they were already painted in, and the
          section arrives rather than being uncovered. That is also why the wipe
          reaches UP past this section's top: over orange it would be invisible,
          and the cream section above is the only place it can be seen.

          Every ink in here is an on-accent one for the same reason the
          situations section's are. It adds no height: the wipe is an absolute
          layer, so nothing below it moves. */}
      <section
        id="services"
        data-header-tone="light"
        className="relative isolate scroll-mt-8 bg-primary-300"
      >
        {/* `surface` matches this section's own background on purpose — the
            finished cover is then indistinguishable from the section arriving.
            See pixel-wipe.tsx. */}
        <PixelWipe surface="bg-primary-300" />
        {/* The vertical rhythm lives out here and the horizontal gutters on
            the blocks inside it, so the service list can run edge to edge
            between two blocks that stay on the page grid. A full-bleed child
            of a padded parent would need negative margins that come undone at
            every breakpoint. See service-rows.tsx.

            The section's usual bottom padding sits under the CTA band, so the
            band reads as the list's last row rather than as the section's
            edge. */}
        <div className="pt-6 pb-section-mobile md:pb-section-tablet xl:pb-section-desktop">
          <div className="mx-auto w-full max-w-page px-gutter-mobile md:px-gutter-tablet xl:px-gutter-desktop">
            {/* The same treatment as "Where are you now?" and "How we think":
                the "))" mark beside a large Poppins line, revealed by MaskedText.
                `tone="current"` so the mark inherits the white above it — its
                brand oranges would vanish into this section's background.

                The grid matches those sections too: title on columns 1-4, content
                on 7-12, stated as start and end LINES because `col-span-*`
                compiles to a shorthand that overrides a neighbouring `col-end-*`.

                The statement keeps the `h2`. This title is a paragraph, as the
                other two are — one heading per section. */}
            <div className="grid gap-6 lg:grid-cols-12 lg:gap-8">
              <div className="flex gap-[0.4em] font-sans text-accent-xl font-medium text-text-on-accent lg:col-start-1 lg:col-end-5">
                <DoubleChevronIcon
                  tone="current"
                  className="h-[1em] w-auto shrink-0"
                />
                <MaskedText lines={["What we build"]} />
              </div>
              {/* `as="h2"` because this is the section's heading and has to stay
                  one — MaskedText renders a paragraph otherwise, and a `<p>`
                  inside an `<h2>` is invalid HTML that browsers "fix" by closing
                  the heading early. Same arrangement as the situations section. */}
              <MaskedText
                as="h2"
                lines={[
                <Fragment key="right-question">
                  {/* One italic letter, as in "Cre<i>a</i>tive" and
                      "Fou<i>n</i>dation": the same EB Garamond, so the mask
                      is already measured for it. */}
                  The <span className="font-accent">right</span> work starts with the <span className="font-accent">right</span> question.
                </Fragment>,
              ]}
                className="max-w-4xl type-display-sm text-text-on-accent text-balance lg:col-start-7 lg:col-end-13"
              />
            </div>
          </div>

          {/* The five services. Same five, same order, same numbering — the
              row layout, the sticky stack and the focus animation all live in
              service-rows.tsx, and the copy in app/_lib/services.ts.

              Deliberately OUTSIDE the inset above: every row is full-bleed so
              its rule crosses the whole screen, and repeats the same gutters
              internally so the words stay on the grid. `surface` is this
              section's background, which a stacked row has to be opaque in to
              cover the row beneath it.

              The decorative `↗` that used to sit at the right edge of each row
              is gone: the reserved media rectangle occupies that place now. It
              was `aria-hidden`, so nothing announced changed. */}
          <div className="mt-16">
            <ServiceRows services={services} surface="bg-primary-300" />
          </div>

          {/* Flush under the list, so it reads as the row that leaves for the
              services page. Full-bleed for the same reason the rows are, and
              rendered outside the inset for the same reason too. */}
          <CtaRow
            href="/services/"
            label="Explore our services"
            tone="inverse"
          />
        </div>
      </section>

      {/* `relative isolate` for the wipe: a positioning parent, and a confined
          z-index so a layer meant to cover the orange above cannot also cover
          the header. `surface` is this section's own background — the whole
          trick is that the finished cover is indistinguishable from the section
          arriving, which is also why the layer reaches UP past the section
          rather than sitting over it. See pixel-wipe.tsx. */}
      <section className="relative isolate border-y border-border-default bg-surface-raised min-h-screen">
        <PixelWipe surface="bg-surface-raised" />
        <div className="mx-auto grid w-full max-w-page gap-x-12 gap-y-32 px-gutter-mobile pt-4 pb-section-mobile md:px-gutter-tablet md:pb-section-tablet lg:grid-cols-12 xl:px-gutter-desktop">
          {/* The proof point, then the section's heading. The DOM order is
              the visual order, so a screen reader meets them in the sequence
              they are seen.

              The number counts up when it scrolls into view, and again after
              the reader scrolls back up past it. The server sends the finished
              figure, which is what visitors without JavaScript or with reduced
              motion keep. See count-up.tsx.

              "+" because the source claim is "150+ brands", from the 2026
              brand strategy. A bare "150" would be a different claim, and
              nothing records it. */}
          <div className="text-center lg:col-start-1 lg:col-end-13">
            <p>
              <CountUp
                to={150}
                suffix="+"
                className="block font-display font-medium text-display-xl text-text-primary"
              />
              <span className="mt-3 block text-accent-lg text-text-secondary">
                Brands supported
              </span>
            </p>
            <h2 className="mx-auto mt-10 max-w-4xl type-h1-alt text-text-primary text-balance">
              Built with c<i>a</i>re. Proven through the work.
            </h2>
          </div>
          {/* Client logos, across the full grid under the proof point. Renders
              nothing without an approved client; see app/_lib/clients.ts. */}
          <ClientLogoStrip className="lg:col-start-1 lg:col-end-13" />
        </div>
      </section>

      <section
        id="insights"
        className="scroll-mt-8 py-section-mobile md:py-section-tablet xl:py-section-desktop"
      >
        {/* The Case Study title's treatment: the "))" mark and a two-tone
            Poppins heading on the left, the supporting line on the right, at
            the Case Study note's size. See section-title.tsx.

            SectionTitle brings its own page inset, so it sits outside the
            padded container below rather than inside it, where the gutters
            would double. The vertical padding moved up to the section for the
            same reason.

            The note names the subjects of the three launch articles in
            docs/specs/HOMEPAGE.md, Section 7, so it describes the cards
            beneath it. "Drawn from our own work" is the spec's rule for every
            article, so it holds only while the articles meet it. */}
        <SectionTitle
          title={
            <Fragment>
              Our <span className="text-action-primary">thinking</span>
            </Fragment>
          }
          note={
            <>
              <p className="text-accent-lg">
                Useful thinking for important brand decisions: when it is time
                to rebrand, whether strategy or identity comes first, and how
                to change without losing what people already trust. Plain
                answers, drawn from our own work.
              </p>
              {/* Desktop: the link sits under this note, as "View selected
                  work" does under the Case Study's. */}
              <div className="hidden w-full lg:block">
                <ExploreInsights />
              </div>
            </>
          }
        />
        <div className="mx-auto w-full max-w-page px-gutter-mobile md:px-gutter-tablet xl:px-gutter-desktop">
          <div className="mt-16 grid gap-6 md:grid-cols-3">
            <FeaturedInsightCards />
          </div>
          {/* Stacked layouts: the same link, after the cards instead. */}
          <div className="mt-10 lg:hidden">
            <ExploreInsights />
          </div>
        </div>
      </section>
    </>
  );
}
