import type { ReactNode } from "react";

import { DoubleChevronIcon } from "@/app/_components/icons";

/**
 * A section's title: the "))" mark and a heading on one side, a line of
 * supporting copy on the other.
 *
 * This is the old site's Case Study heading rebuilt on this project's tokens.
 * The structure is the original's — mark, heading, and a right-hand line that
 * drops under the title on narrow screens — but every size comes from the type
 * scale rather than the measured pixel values, which were a smaller scale than
 * this rebuild uses.
 *
 * `title` and `note` are ReactNode rather than strings so a call site can
 * colour part of a line — "Case <span>Study</span>" — without this component
 * having to know which words those are. They are single nodes, not arrays, so
 * there is no list for React to want keys for.
 *
 * The heading is composed from three utilities rather than a `type-*` one,
 * because every `type-*` utility at this size is EB Garamond — that is what
 * `--font-display` resolves to. The original title is Poppins, so the size
 * token is taken on its own (`text-h1-alt` sets font-size and nothing else) and
 * the family and weight are stated beside it. Three utilities, three separate
 * properties, no override fighting a base class for the same one.
 *
 * The mark is sized in `em`, so it tracks the heading through its whole clamp
 * instead of needing a breakpoint of its own. The original is a 40px mark
 * beside 40px type with 24px between them, so 1em and 0.6em hold that
 * proportion at any size the clamp lands on.
 *
 * The two halves share a baseline from `lg` up — the original's breakpoint for
 * this row — and stack below it, where a display-size heading and a sentence
 * will not share a line without one of them wrapping badly.
 *
 * Renders an `h2`. Every section using this sits under the page's own `h1`.
 */
export default function SectionTitle({
  title,
  note,
}: {
  title: ReactNode;
  note?: ReactNode;
}) {
  return (
    <div className="mx-auto flex w-full max-w-page flex-col gap-4 px-gutter-mobile lg:flex-row lg:items-baseline lg:justify-between lg:gap-8 md:px-gutter-tablet xl:px-gutter-desktop">
      <h2 className="flex items-center gap-[0.4em] font-sans text-accent-xl font-medium text-text-primary">
        <DoubleChevronIcon className="h-[1em] w-auto shrink-0" />
        {/* The title is wrapped so it is ONE flex item. A bare text node in a
            flex container becomes an anonymous flex item of its own, so
            "Case <span>Study</span>" would be two of them and the row gap would
            land between the words as well as after the mark. Inside this span
            they are ordinary inline content with an ordinary word space. */}
        <span>{title}</span>
      </h2>
      {/* A `div`, not a `p`, and deliberately so: what goes in here is a block
          of content — a paragraph and a link under it — and one caller passes a
          ScrollGradientText, which renders a `<p>` of its own. A `<p>` inside a
          `<p>` is invalid, and the browser fixes it silently by closing the
          outer one early, which scatters the rest of the block out of the
          wrapper it was meant to be in. This element carries no typography for
          the same reason: the caller sets it on whatever it puts here. */}
      {note ? (
        <div className="flex flex-col items-start gap-6 text-text-primary lg:max-w-5xl">
          {note}
        </div>
      ) : null}
    </div>
  );
}
