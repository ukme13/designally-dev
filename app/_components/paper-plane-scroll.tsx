"use client";

import { useRef } from "react";

import {
  FLIGHT_PATH,
  PLANE_BODY,
  PLANE_FACETS,
  VIEW_BOX,
} from "@/app/_lib/paper-plane";
import { usePaperPlaneFlight } from "@/app/_lib/use-paper-plane-flight";

/**
 * A paper plane that flies along a fixed path as the section scrolls past.
 *
 * Scroll-linked and nothing else: it has no idle animation, no autoplay and no
 * loop. Scrolling down carries the plane forward along the path, scrolling up
 * carries it back, and it holds still whenever the page does. `scrub: true` is
 * what makes that true — the tween has no life of its own, its playhead is the
 * scroll position.
 *
 * ── The knobs ────────────────────────────────────────────────────────────
 *   when it flies   use-paper-plane-flight.ts
 *   plane size      PLANE_SCALE
 *   how far it flies FLIGHT_REACH and FLIGHT_SPREAD
 *   nose direction  use-paper-plane-flight.ts
 *   visibility      PLANE_OPACITY
 *   front or behind PLANE_LAYER
 *   debugging       SHOW_PATH — draws the route
 * ─────────────────────────────────────────────────────────────────────────
 *
 * **One SVG, one coordinate system, and that is the whole alignment story.**
 * The path and the plane live in the same `viewBox`, so MotionPathPlugin is
 * measuring both in the same units and there is nothing to convert. Two SVGs —
 * a 6798x2393 path beside a 730x490 plane — would have needed the plane's
 * position translated between two spaces on every frame AND on every resize,
 * which is exactly where this kind of thing drifts out of alignment.
 *
 * It also makes the component responsive for free. The `viewBox` scales with
 * the section, and because the plane's position is expressed in those same
 * user units, it lands on the path at any size without being recalculated. The
 * ResizeObserver below is not correcting alignment — it only tells ScrollTrigger
 * that the section's pixel height moved.
 *
 * **Decoration, and treated as such.** `aria-hidden`, `pointer-events-none`,
 * and behind the content on the stacking order — the showcase row, its title
 * and its links all keep their own hit areas, and the hover cursor is
 * untouched.
 *
 * Reduced motion holds the plane still at the start of the path. The tween is
 * built but never given a ScrollTrigger, so there is nothing for the scroll to
 * drive and nothing that can move on its own.
 *
 * Lenis needs no wiring. It animates the browser's real scroll position rather
 * than translating a wrapper, so ScrollTrigger reads the same numbers it always
 * does — the same reason scroll-gradient-text.tsx works untouched.
 */

/**
 * Plane size, as a multiple of its own artwork.
 *
 * Applied inside the path's coordinate system, so it is a fraction of a
 * 6798-unit-wide space rather than of the screen. At 0.5 the plane is 365 of
 * those units, which lands near 75px on a 1400px-wide layer — where 0.18 gave
 * about 27px and read as a speck.
 */
const PLANE_SCALE = 0.5;

/**
 * How far ABOVE its host section the flight layer reaches.
 *
 * `top-0` means it does not: the layer is exactly the section's own box, which
 * is what makes the plane cross the words rather than the space around them.
 *
 * A Tailwind class rather than a number so it can use `svh`, the unit the
 * sections here are measured in. `-top-[100svh]` would start the route a screen
 * higher — but the plane sits at the start of its path until the flight begins,
 * so every screen of reach is another screen over which a motionless plane is
 * on display. Overhang buys a grander route and pays for it in waiting.
 */
const FLIGHT_REACH = "top-0";

/**
 * How far past the screen's left and right edges the route extends.
 *
 * Without this the layer is exactly as wide as the section, so the path's two
 * ends land ON the left and right edges — the plane appears already at the edge
 * and finishes parked at the other one, never entering or leaving. Widening the
 * layer beyond the section puts both ends of the route off-screen, so the plane
 * flies in from nothing and out into nothing.
 *
 * The figure is a percentage of the SECTION's width, applied to each side, so
 * 15% makes the layer 130% as wide. Two consequences worth knowing:
 *
 *   - It costs scroll range. Roughly the first and last 15% of the flight
 *     happen out of sight. Raise it and the entrances are cleaner but more of
 *     the scroll is spent watching nothing; lower it and the plane starts to
 *     pop in at the edge.
 *   - It scales the whole SVG, plane included — a wider box means more pixels
 *     per unit. PLANE_SCALE is the counterweight if the plane grows too much.
 */
const FLIGHT_SPREAD = "-inset-x-[15%]";

/**
 * Whether the plane flies in front of the section's content or behind it.
 *
 * `z-10` puts it over the words; `-z-10` puts it under them. Either works, and
 * neither blocks anything — the layer takes no pointer events.
 *
 * Both depend on the host section carrying `isolate`. Behind, because a
 * negative z-index child otherwise escapes to the nearest ancestor stacking
 * context and drops through the section's own background. In front, because
 * without it a positive z-index competes with every other positioned element on
 * the page rather than staying inside the section it belongs to.
 */
const PLANE_LAYER = "z-10";

/**
 * Draws the route, for positioning work. Off in anything anyone sees.
 *
 * Every number in FLIGHT_PATH is a position inside a 6798x2393 box, which is
 * hard to reason about in the abstract — turning this on and scrolling is
 * quicker than doing the arithmetic. 24 units is about 5px at a usual width;
 * the hairline a smaller figure gives is not worth drawing.
 */
const SHOW_PATH = false;
const PATH_STROKE_WIDTH = 24;

/** How present the plane is against the section behind it. */
const PLANE_OPACITY = 1;

export default function PaperPlaneScroll() {
  const layerRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const planeRef = useRef<SVGGElement>(null);

  /* Everything about the movement — when it starts, when it ends, which way
     the nose points — is in use-paper-plane-flight.ts. */
  usePaperPlaneFlight({ layerRef, pathRef, planeRef });

  return (
    <div
      ref={layerRef}
      /*
        Layered against the host section's own content by PLANE_LAYER, and out
        of reach of the pointer either way. `isolate` on that section is what
        keeps this layer's z-index a matter between it and its siblings rather
        than between it and the whole page.

        The box is taller than the section — see FLIGHT_REACH — so the trigger
        below measures the whole span the plane crosses, not just the section
        it is anchored to.
      */
      className={`pointer-events-none absolute bottom-0 ${PLANE_LAYER} ${FLIGHT_SPREAD} ${FLIGHT_REACH}`}
      aria-hidden="true"
    >
      <svg
        viewBox={VIEW_BOX}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="size-full"
        style={{ opacity: PLANE_OPACITY }}
      >
        {/*
          The route. Always in the DOM even when invisible — MotionPathPlugin
          reads this element's geometry, so hiding it with `display: none`
          would leave the plane with nowhere to fly. `strokeWidth` at 0 draws
          nothing while keeping it measurable.
        */}
        <path
          ref={pathRef}
          d={FLIGHT_PATH}
          fill="none"
          strokeWidth={SHOW_PATH ? PATH_STROKE_WIDTH : 0}
          className={SHOW_PATH ? "stroke-action-primary" : undefined}
        />

        {/*
          The plane. TWO nested groups, and the nesting is load-bearing: GSAP
          writes a transform to the outer one on every frame, so the artwork's
          own scaling has to live on a different element or the two would
          overwrite each other.
        */}
        <g ref={planeRef}>
          <g transform={`scale(${PLANE_SCALE})`}>
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d={PLANE_BODY}
              className="fill-text-primary"
            />
            {PLANE_FACETS.map((facet) => (
              <path
                key={facet.slice(0, 24)}
                fillRule="evenodd"
                clipRule="evenodd"
                d={facet}
                className="fill-surface-base"
              />
            ))}
          </g>
        </g>
      </svg>
    </div>
  );
}
