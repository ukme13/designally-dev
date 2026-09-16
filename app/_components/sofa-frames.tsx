"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

/**
 * A two-frame illustration that changes as its section arrives.
 *
 * Frame one is the sofa; frame two is the same sofa with its lamp on. The swap
 * is a CUT, not a crossfade — two drawings of one thing, so it reads as an
 * animation rather than a dissolve. That is also why both frames stay mounted:
 * swapping the `src` on one element would show a blank while the second file
 * loaded, and the first swap is the one that matters.
 *
 * **Mounting both is necessary and NOT sufficient** — see the note on
 * `loading` below. It was mounted and still blanked, because a hidden element
 * is invisible to the lazy-loading heuristic.
 *
 * ── The knobs ────────────────────────────────────────────────────────────
 *   size          FRAME_SIZE
 *   when it turns TRIGGER_MARGIN
 * ─────────────────────────────────────────────────────────────────────────
 *
 * **The lit frame shows once the section's top has passed the middle of the
 * screen**, and reverts below it, so scrolling back up plays it in reverse.
 * An IntersectionObserver does that rather than a scroll listener: shrinking
 * the root to the top half of the viewport turns "is the section's top above
 * the centre line" into an intersection test the browser answers itself, with
 * no work per frame.
 *
 * The section is found by walking up from this element, so this belongs inside
 * the `<section>` whose arrival should drive it.
 *
 * `next/image` with `unoptimized`. The installed docs are explicit that an SVG
 * source is blocked unless either `unoptimized` or `dangerouslyAllowSVG` is
 * set — and the second is a project-wide door opened in next.config for one
 * illustration. `unoptimized` serves the file directly instead, which is right
 * anyway: these are 25KB and 40KB of vector, and the optimiser has nothing to
 * improve on.
 *
 * Decorative: the section says everything in words, so both frames are
 * `alt=""` and the wrapper is out of the accessibility tree. Nothing here is
 * announced and nothing is lost.
 */

/** The illustration's size. Square, matching the artwork's own 1024 x 1024. */
const FRAME_SIZE = "w-56 md:w-72 xl:w-100";

/**
 * Where the turn happens, as an IntersectionObserver root margin.
 *
 * `0px 0px -50% 0px` shrinks the root to the TOP HALF of the viewport, so the
 * section only intersects it once its top edge has risen past the centre line.
 * Take the -50% toward 0 to turn later, past it to turn earlier.
 */
const TRIGGER_MARGIN = "0px 0px -50% 0px";

/** The artwork's own pixel size, so the browser can reserve the space. */
const FRAME_INTRINSIC = 1024;

const FRAMES = [
  "/how-we-think/sofa-frame-1.svg",
  "/how-we-think/sofa-frame-2.svg",
] as const;

export default function SofaFrames() {
  const rootRef = useRef<HTMLDivElement>(null);
  /*
    Which frame is showing. State rather than a DOM write because it changes
    twice in a whole page, not once a frame — and a re-render of two `<img>`
    elements is cheaper to reason about than a class toggled from an effect.
  */
  const [lit, setLit] = useState(false);

  useEffect(() => {
    const root = rootRef.current;
    const section = root?.closest("section");
    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => setLit(entry.isIntersecting),
      { rootMargin: TRIGGER_MARGIN, threshold: 0 },
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      /* `relative` so the frames can stack; the aspect ratio holds the space so
         nothing moves when the second frame first paints. */
      className={`relative aspect-square ${FRAME_SIZE}`}
    >
      {FRAMES.map((src, frame) => (
        <Image
          key={src}
          src={src}
          alt=""
          width={FRAME_INTRINSIC}
          height={FRAME_INTRINSIC}
          unoptimized
          /*
            `eager`, and it is load-bearing.

            `next/image` defaults to `loading="lazy"`, which defers the fetch
            until the element nears the viewport. The waiting frame is `hidden`
            — `display: none` — so it has no box, never approaches anything,
            and was therefore not fetched until the swap revealed it. The first
            turn showed a blank while 40KB downloaded: exactly the fault that
            mounting both frames was meant to prevent.

            `eager` rather than `preload`. The installed Next 16 docs describe
            `preload` as inserting a `<link>` in the `<head>` for the LCP
            element, and say to use `loading="eager"` in most other cases; this
            page's resource-hint order is already delicate, see the note on
            FeaturedInsightCards in page.tsx. `priority` is deprecated in 16.

            On BOTH frames, not just the hidden one: which frame is hidden
            follows `lit`'s initial state, so pinning this to frame two would
            move the bug the first time that default changed. The cost is 25KB
            and 40KB of vector fetched early, below the fold, on a page whose
            hero loads a video.
          */
          loading="eager"
          /* Both mounted, one hidden. `hidden` rather than `opacity-0` so the
             hidden frame is genuinely not painted — there is no transition to
             be seen through. */
          className={`absolute inset-0 size-full ${
            (frame === 1) === lit ? "" : "hidden"
          }`}
        />
      ))}
    </div>
  );
}
