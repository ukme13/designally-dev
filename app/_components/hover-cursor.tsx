"use client";

import type { RefObject } from "react";
import { useRef } from "react";

import { ArrowUpRightIcon } from "@/app/_components/icons";
import { useHoverCursor } from "@/app/_lib/use-hover-cursor";

/**
 * A circle that replaces the mouse pointer while it is over a given area.
 *
 * Used by the homepage showreel and by the work showcase. Both wanted the same
 * thing, so it is one component rather than two: the look, the timing and the
 * device rules are stated once, and a third caller gets them for free.
 *
 * **It is a circle and an arrow, and nothing else.** No image, no rectangle, no
 * modal, and it never touches what is behind it — the showreel's playback and
 * entrance, the showcase's drift and drag, all carry on unaware this exists.
 * The arrow reads as "there is more here"; it is not a preview of anything and
 * must not grow into one.
 *
 * The element is always rendered, at `opacity-0`, so the server and the first
 * client render agree and there is nothing to reconcile. GSAP takes over from
 * there, and a visitor with no JavaScript keeps their ordinary pointer over an
 * invisible div.
 *
 * ── The knobs ────────────────────────────────────────────────────────────
 *   size          SIZE
 *   colour        SURFACE and ICON_COLOUR
 *   icon size     ICON_SIZE
 *   the following   use-hover-cursor.ts
 * ─────────────────────────────────────────────────────────────────────────
 *
 * ── How it is positioned ──────────────────────────────────────────────────
 *
 * **One owner for `transform`, and it is GSAP.** `x`, `y`, `xPercent`,
 * `yPercent` and `scale` are all GSAP's, composed by it into a single
 * transform. No Tailwind translate or scale utility appears on this element.
 * That is the whole rule — a Tailwind `translate` alongside a GSAP `transform`
 * is two CSS properties placing one element, and that is what makes a follower
 * jitter. Several GSAP properties in one transform is not the same thing.
 *
 * `xPercent: -50` is what centres the circle on the pointer. It is applied in
 * the translate step, before `scale`, and `transform-origin` is the element's
 * own centre — so the centre stays on the pointer at every scale the zoom
 * passes through.
 *
 * Transform rather than `left`/`top` on purpose. The circle is re-aimed every
 * animation frame, and `left`/`top` force a layout on each one — over a playing
 * video that is exactly the sort of per-frame work that shows up as a stutter.
 * A transform stays off the layout path entirely.
 *
 * **Coordinates are viewport-relative, converted once per frame.**
 * `clientX - rect.left` and `clientY - rect.top`, never `pageX`/`pageY` — those
 * include the scroll offset while `getBoundingClientRect()` does not, and
 * mixing the two puts the circle a page-scroll away from the pointer.
 *
 * **The rectangle is read every frame, not every pointer move.** With Lenis the
 * page can scroll while the pointer is perfectly still: no `pointermove` fires,
 * the showreel slides under the cursor, and a position computed at the last
 * move is stale by however far the page has travelled. So `pointermove` only
 * records the raw viewport coordinate, and a frame loop — running only while
 * the pointer is actually inside — does the conversion against a fresh rect.
 *
 * **Not clamped, deliberately.** The circle is centred on the pointer wherever
 * the pointer is, so along an edge it hangs half outside the area. It was
 * clamped to the rectangle at first, and that looked broken: entering from the
 * left, the circle came to rest a full radius inside the edge while the pointer
 * sat on it, reading as a misalignment rather than as a boundary. A follower
 * that stops following is worse than one that overhangs.
 *
 * Which means **whatever contains this element must not clip**, or the overhang
 * is cut off instead. The showreel's position wrapper says so in its own
 * comment; the showcase row DOES clip, which is why it renders this one rung
 * further out, in a wrapper beside the clipping box rather than inside it.
 *
 * That separation is why the area and the containing block are read as two
 * different elements below. Events come from `areaRef`; coordinates are
 * measured against whatever actually contains the circle — its `offsetParent`.
 * Where they are the same element, as in the showreel, both readings agree.
 * ─────────────────────────────────────────────────────────────────────────
 *
 * **Who gets it.** Only a fine, hovering pointer — `(hover: hover) and
 * (pointer: fine)`. Touch is excluded by the query rather than by sniffing a
 * device, and nothing touch-only is added. A hybrid laptop passes that query
 * and can still be touched, so the handlers also ignore any pointer event that
 * is not a mouse — which is also what guarantees no phone or tablet ever has
 * its system cursor hidden, since `cursor-none` is only ever applied from
 * inside a mouse `pointerenter`.
 *
 * **Reduced motion keeps the cursor and drops the motion.** Every duration
 * falls to zero, so the circle appears and tracks the pointer exactly, with no
 * lag to chase and nothing easing. Hiding it entirely would be the easier
 * option and a worse one — the affordance is not the animation.
 *
 * The listeners are on the area passed in and nothing else. There is no
 * document-level `mousemove` anywhere in this file, and no React state is
 * written on pointer movement — a `setState` per mouse move would re-render the
 * host component a hundred times a second.
 */

/**
 * Diameter of the circle. The only place its size is stated, and the only
 * place it needs to be.
 *
 * Nothing in this file converts it to a number. Centring is GSAP's
 * `xPercent`/`yPercent`, which are percentages of the element's own rendered
 * size — so the maths follows this class wherever it goes, at any root font
 * size, with nothing to keep in step. An earlier version measured
 * `offsetWidth` and subtracted a radius; a measurement that comes back 0 puts
 * the circle's CORNER on the pointer instead of its centre, which looks exactly
 * like a circle refusing to cross an edge.
 */
const SIZE = "size-28";

/** Circle fill. */
const SURFACE = "bg-action-primary";
/** Arrow colour, on that fill. */
const ICON_COLOUR = "text-text-on-accent";
/** Arrow size inside the circle. A little over a third of it. */
const ICON_SIZE = "size-11";

export default function HoverCursor({
  areaRef,
}: {
  /**
   * The element the pointer hovers. Owns the listeners.
   *
   * Render this component inside a NON-CLIPPING positioned ancestor. Usually
   * that is this same element; where it clips, put the component in a wrapper
   * beside it instead.
   */
  areaRef: RefObject<HTMLElement | null>;
}) {
  const cursorRef = useRef<HTMLDivElement>(null);

  /* The following itself — the pointer maths, the GSAP, the device rules — is
     in use-hover-cursor.ts. */
  useHoverCursor({ areaRef, cursorRef });

  return (
    <div
      ref={cursorRef}
      /* Decoration over a film that is already described in the caption. */
      aria-hidden="true"
      /*
        `pointer-events-none` is not optional. The circle sits inside the very
        element whose enter and leave events drive it, and a circle that could
        take a pointer event would fight the thing that positions it.
      */
      className={`pointer-events-none absolute top-0 left-0 z-20 flex items-center justify-center rounded-full opacity-0 ${SIZE} ${SURFACE} ${ICON_COLOUR}`}
    >
      <ArrowUpRightIcon className={ICON_SIZE} />
    </div>
  );
}
