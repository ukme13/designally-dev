"use client";

import { useRef } from "react";

import { usePixelWipe } from "@/app/_lib/use-pixel-wipe";

/**
 * A pixel wipe across the boundary between two sections.
 *
 * Written to be used more than once. What changes per boundary is the COLOUR,
 * because the wipe has to match the section it hands over to — everything
 * about the motion is fixed in use-pixel-wipe.ts, so two boundaries using this
 * behave identically and only look different.
 *
 * ── Using it ─────────────────────────────────────────────────────────────
 *
 *   <section className="relative isolate bg-primary-300">
 *     <PixelWipe surface="bg-primary-300" />
 *     …
 *   </section>
 *
 * Three things the host section must do, none of which this can do for itself:
 *
 *   `relative`  gives the layer a positioning parent
 *   `isolate`   confines the layer's z-index, so a transition meant to cover
 *               this section cannot also cover the header
 *   the colour  `surface` should match the section's own background, so the
 *               finished cover is indistinguishable from the section arriving
 *
 * That last one is the whole trick, and it is why the wipe reaches UP past the
 * section rather than sitting over it: over a matching background it would be
 * invisible, and the section above is the only place it can be seen.
 *
 * Dots grow along the boundary between the two sections, row by row from the
 * bottom up, in two interleaved lattices that fill each other's gaps until the
 * cover is solid — which the page's own scroll then carries away as the
 * section arrives underneath. Scrubbed directly to scroll position, so
 * scrolling back up runs it backwards and a still page leaves it still. No
 * autoplay, no loop.
 *
 * **Painted on one canvas, not built from elements.** Until 17 September 2026
 * every circle was a DOM element — up to 683 per wipe on a desktop — and
 * repainting that many on each scroll frame read as stutter. The canvas draws
 * all of them as one path. The markup below is therefore just a stage, a
 * canvas and a colour sample; everything that moves is in use-pixel-wipe.ts.
 *
 * **The pixels never move, and nothing here is revealed.** Two earlier versions
 * got this wrong in opposite directions. Rising up and OUT to uncover the
 * section could not help showing what was behind the layer — which is the
 * section above, not the one arriving. Flying up and IN put the cells on a
 * translation of their own while the layer was already scrolling with the page,
 * so they slid against the section beneath. Growing in place has neither
 * problem: the upward movement is the stagger, not a transform.
 *
 * **Nothing fades.** A circle is invisible because it has no size and gone
 * because it has left the canvas. Scaling a cover reads as material; fading it
 * reads as a veil.
 *
 * **An offset lattice is what covers.** A single grid of circles inscribed in
 * their cells touches at the edges but leaves a gap at every corner. A second
 * grid shifted half a cell puts a circle ON each of those corners — twice the
 * density, and the deepest uncovered point moves to a cell edge, which an
 * inscribed radius already reaches. So the cover is solid without the circles
 * having to become squares, which is what an earlier version did.
 *
 * **Nothing is drawn until JavaScript draws it**, which is the only safe way
 * round for an element that covers content. A visitor with no JavaScript, a
 * failed import, or reduced motion all get a transparent canvas rather than a
 * permanent block of colour over the section.
 *
 * ── The knobs ────────────────────────────────────────────────────────────
 *   per boundary    the `surface`, `lift` and `density` props
 *   everything else use-pixel-wipe.ts
 * ─────────────────────────────────────────────────────────────────────────
 *
 * Lenis needs no wiring — it animates the browser's real scroll position, so
 * ScrollTrigger reads the numbers it always does.
 */

/**
 * How far the wipe reaches ABOVE the section it belongs to, by default.
 *
 * **THIS MUST EQUAL THE LAYER'S HEIGHT**, which is the real rule behind the
 * old note that "at half a screen it covered the heading". That failure was a
 * 100svh layer lifted only 50svh: the excess hung over the section and hid its
 * heading, which is the one thing a transition must not do. Matched to the
 * height, the layer's bottom edge lands exactly on the section's top edge and
 * none of it overlaps.
 *
 * **50svh, reduced from 100svh on 16 September 2026, and the reason is
 * geometry rather than taste.** The layer is `absolute` inside the section, so
 * it scrolls with the page at 1:1 while the wave also travels up through it.
 * Those speeds ADD, and the wave's leading edge climbs the screen at roughly
 * twice the scroll:
 *
 *     front = boundary − (wave fraction × layer height)
 *
 * At a full screen that was `1.2 − 1.95p`, so the edge left the top of the
 * viewport at p ≈ 0.62 — the cover looked finished while the arriving section
 * was barely past half the screen, and the last 38% of the scroll range
 * animated above the fold where nobody could see it. Widening the trigger
 * range made it marginally worse, not better: the exit moved from 69% down the
 * screen to 62%.
 *
 * At 50svh the same expression is `1.2 − 1.45p`, so the edge survives to
 * p ≈ 0.83 with the boundary 41% down — the wave is visible for about 69% of
 * the range instead of half of it.
 *
 * **30svh was tried first and produced ELLIPSES, which is why it is not 30.**
 * The grid is measured from this layer, and `pixelGrid` clamps at 32 columns.
 * A band that short is wide enough (aspect ~5.9 at 1920x1080) that no
 * arrangement inside the clamp fits the cell budget, so the search falls
 * through to its fallback formula — which tiles the box but does not keep
 * cells square. Measured: 32x9 cells of 60x36, a ratio of 1.67, and the dots
 * are drawn with `rounded-full`, so they rendered as flat ovals. At 50svh the
 * same arithmetic lands on 32x9 cells of 60x60, ratio 1.00, on every viewport
 * checked (1920x1080, 1440x900, 2560x1440). **Shortening this further brings
 * the ovals back** — if a shorter band is ever wanted, the density has to come
 * down with it so the search stays inside its clamp.
 *
 * The cost, accepted: the cover band is half a screen rather than a whole one,
 * so the arriving section appears to turn up 50svh early instead of a full
 * screen early, and the outgoing colour stays visible above the wave for
 * longer.
 *
 * A Tailwind class rather than a number so it can use `svh`, the unit sections
 * are measured in. Override it where a boundary needs a different reach — and
 * change `h-[50svh]` on the stage to match when you do.
 */
const DEFAULT_LIFT = "-top-[50svh]";

type PixelWipeProps = {
  /**
   * The wipe's colour, as a Tailwind background utility.
   *
   * Should match the host section's own background — see the note above. A
   * token, like every other colour on the site; no raw values here. It is
   * applied to a hidden element and read back, because a canvas needs the
   * resolved colour rather than a class.
   */
  surface: string;
  /** How far it reaches above the section. Must match the stage's height. */
  lift?: string;
  /**
   * Roughly how many cells. Higher is denser and smaller.
   *
   * Left unset it is chosen from the layer's measured width — fewer and bigger
   * on a phone. Passing a number overrides that at every size. See
   * use-pixel-wipe.ts.
   */
  density?: number;
};

export default function PixelWipe({
  surface,
  lift = DEFAULT_LIFT,
  density,
}: PixelWipeProps) {
  const layerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colourRef = useRef<HTMLSpanElement>(null);

  usePixelWipe({ layerRef, canvasRef, colourRef, surface, density });

  return (
    <div
      ref={layerRef}
      aria-hidden="true"
      /*
        The stage. `h-[50svh]` is the band the wipe covers, and it must stay in
        step with DEFAULT_LIFT above — the lift is what puts this box's BOTTOM
        on the section's top edge, so a height that disagrees with it either
        overlaps the section's heading or leaves a gap at the boundary.

        `overflow-hidden` is no longer what clips the circles — the canvas's
        own bounds do that — but it is kept so nothing inside can ever widen
        the page.
      */
      className={`pointer-events-none absolute inset-x-0 z-10 h-[50svh] overflow-hidden ${lift}`}
    >
      {/* Transparent until drawn on. Its backing store is sized to the stage,
          at the device's pixel ratio, by the hook. */}
      <canvas ref={canvasRef} className="absolute inset-0 size-full" />

      {/*
        The colour sample. Never displayed; it exists so the browser resolves
        `surface` to a real colour the canvas can use. `hidden` does not stop
        `getComputedStyle` reporting its background.
      */}
      <span ref={colourRef} className={`hidden ${surface}`} />
    </div>
  );
}
