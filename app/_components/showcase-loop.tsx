"use client";

import Image from "next/image";
import { useRef } from "react";

import HoverCursor from "@/app/_components/hover-cursor";
import { SHOWREEL } from "@/app/_lib/showreel";
import { useShowcaseDrift } from "@/app/_lib/use-showcase-drift";

/**
 * A row of work images drifting leftward, draggable, with the scroll wheel
 * pushing it.
 *
 * The motion lives in use-showcase-drift.ts — speed, scroll coupling and throw
 * are its constants. What is left here is the markup, the shape of a card, and
 * the arithmetic that makes the loop seamless.
 *
 * ── The knobs ────────────────────────────────────────────────────────────
 *   card height  HEIGHT below — widths follow each image's own ratio
 *   gap          GAP below, and its `pe-*` half, which must match
 *   speed etc.   use-showcase-drift.ts
 * ─────────────────────────────────────────────────────────────────────────
 *
 * **Height is the fixed dimension, not width.** Each card is sized by height
 * and lets its width fall out of the image's intrinsic ratio, so a 16:9 poster
 * and a 4:5 portrait can sit in the same row without either being cropped or
 * letterboxed. That is deliberate groundwork: these images come from a CMS
 * later, and nothing there guarantees a shared aspect ratio.
 *
 * **Why there are two identical sequences.** The offset wraps at one
 * sequence's width, so the second copy is always sitting exactly where the
 * first began and the wrap has nothing to show. One copy would snap back.
 *
 * **The trailing padding is part of that arithmetic, not decoration.** The gap
 * between the last card of one sequence and the first of the next has to equal
 * the gap inside a sequence, or the seam stutters once a pass. A gap on the
 * track would not do it — the wrap distance is measured from the sequence, so
 * the spacing that follows a sequence has to belong to it. GAP and its `pe-*`
 * counterpart therefore move together; change one alone and the loop limps.
 *
 * The images are the approved posters already used by the showreel. Nothing
 * here states a fact about a project beyond its name.
 */

/**
 * How many copies of the set the track holds.
 *
 * The row wraps after ONE sequence, so the track has to be wide enough that a
 * full viewport is still covered at that moment. Blank space appears past the
 * last card once the viewport is wider than `(SEQUENCES - 1) x sequence`.
 *
 * Two was not enough. A sequence at `xl` is about 2144px — four 16:9 cards at
 * 288px tall, plus gaps — so any display wider than that ran out of track and
 * showed emptiness before the jump. Three covers viewports to roughly 4288px
 * at `xl` and 2404px at mobile, which is past any real display.
 *
 * Re-check this if HEIGHT changes: taller cards are wider cards, which help,
 * but shorter ones shrink the sequence and bring the limit down with it.
 */
const SEQUENCES = 3;

/** Card height. Widths follow each image. */
const HEIGHT = "h-80 md:h-140 xl:h-170";
/* Gap between cards. The `pe-*` values MUST match the `gap-*` ones — see the
   note on the seam above. */
const GAP = "gap-4 pe-4 md:gap-6 md:pe-6";

/**
 * The posters' real pixel dimensions.
 *
 * `next/image` needs a width and height for a string `src`, and uses them only
 * as a ratio — the rendered size comes from `h-full w-auto`. All four posters
 * are 1280x720; the encode is documented in docs/specs/SHOWREEL.md.
 *
 * When these images come from a CMS, its asset record carries each image's own
 * dimensions and they replace this constant. Nothing else here needs to change
 * for that: the card is already sized by height alone.
 */
const POSTER = { width: 1280, height: 720 };

/** One pass of every project, in the order the showreel holds them. */
function Sequence({
  duplicate = false,
  ref,
}: {
  duplicate?: boolean;
  ref?: React.Ref<HTMLUListElement>;
}) {
  return (
    <ul
      ref={ref}
      className={`flex shrink-0 items-center ${GAP}`}
      /* The second pass is the same pictures again. It exists for the maths,
         not the reader, so it is kept out of the accessibility tree entirely
         rather than repeating four names to a screen reader. */
      aria-hidden={duplicate || undefined}
    >
      {SHOWREEL.map((project) => (
        <li
          key={project.slug}
          className={`${HEIGHT} shrink-0 overflow-hidden rounded-lg`}
        >
          <Image
            src={project.poster}
            /* The project's own name, and nothing more. There is no approved
               description for any of this work — see the permission note in
               app/_lib/showreel.ts. */
            alt={duplicate ? "" : project.name}
            width={POSTER.width}
            height={POSTER.height}
            sizes="(min-width: 1280px) 32rem, (min-width: 768px) 25rem, 18rem"
            /* Height from the card, width from the picture. No `object-cover`:
               nothing is being fitted to a box, so there is nothing to crop. */
            className="h-full w-auto"
            /* Otherwise the browser's own image drag starts on mousedown and
               the row's drag never gets a second event. */
            draggable={false}
          />
        </li>
      ))}
    </ul>
  );
}

export default function ShowcaseLoop() {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const sequenceRef = useRef<HTMLUListElement>(null);

  useShowcaseDrift({ containerRef, trackRef, sequenceRef });

  return (
    /*
      A positioning wrapper whose only job is to hold the hover cursor.

      The circle straddles an edge when the pointer is on one, so it cannot live
      inside the row below — that row is `overflow-hidden`, which is what makes
      the loop seamless, and it would cut the circle in half along the top and
      bottom. Out here it is positioned against a box of the same bounds that
      clips nothing. The row itself still owns the pointer events.
    */
    <div className="relative w-full">
      <div
        ref={containerRef}
        /* `touch-pan-y` is the load-bearing one: it leaves vertical panning
           with the browser so the page still scrolls under a finger, while
           handing horizontal movement to the pointer handlers. Without it a
           phone claims the whole gesture and the row never moves. Under reduced
           motion the container is a real scroller and needs its default touch
           behaviour back, so both it and the grab cursor are `motion-safe`
           only. */
        className="w-full select-none motion-safe:cursor-grab motion-safe:touch-pan-y motion-safe:overflow-hidden motion-safe:active:cursor-grabbing motion-reduce:overflow-x-auto"
      >
        <div ref={trackRef} className="flex w-max">
          {Array.from({ length: SEQUENCES }, (_, copy) => (
            <Sequence
              key={copy}
              /* Only the first is measured, and only the first is read: every
                 copy after it is the same pictures again. */
              ref={copy === 0 ? sequenceRef : undefined}
              duplicate={copy > 0}
            />
          ))}
        </div>
      </div>

      {/* The grab cursors above stay as the fallback: they are what a visitor
          sees if the custom cursor never activates. While it is active it wins
          by inline style rather than by specificity — see hover-cursor.tsx. */}
      <HoverCursor areaRef={containerRef} />
    </div>
  );
}
