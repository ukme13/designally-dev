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
 * this row — and stack into one column below it, where a display-size heading
 * and a sentence will not share a line without one of them wrapping badly.
 *
 * `lg:max-w-*` on the note is gone: the grid decides its width now, so a max
 * width would only be a second, quieter answer to the same question.
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
    /*
      The page's section grid: twelve columns, title on the left four, content
      on the right six, a two-column gutter between. The situations and "how we
      think" sections lay out the same way, so a reader crossing them sees one
      column structure rather than three.

      A grid rather than the `justify-between` flex row this used to be. That
      row sized both halves from their contents, so the gap between them moved
      with the length of the heading; the grid pins both edges instead.

      Placement is stated as start and end LINES, never a span. `col-span-*`
      compiles to the shorthand `grid-column: span N / span N`, which rewrites
      both ends and silently overrides any `col-end-*` beside it, whichever
      order they are written in.
    */
    <div className="mx-auto grid w-full max-w-page gap-6 px-gutter-mobile md:px-gutter-tablet lg:grid-cols-12 lg:items-baseline lg:gap-8 xl:px-gutter-desktop">
      <h2 className="flex items-center gap-[0.4em] font-sans text-accent-xl font-medium text-text-primary lg:col-start-1 lg:col-end-5">
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
        <div className="flex flex-col items-start gap-6 text-text-primary lg:col-start-7 lg:col-end-13">
          {note}
        </div>
      ) : null}
    </div>
  );
}
