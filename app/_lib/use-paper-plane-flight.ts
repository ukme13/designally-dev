"use client";

import type { RefObject } from "react";
import { useEffect } from "react";

/**
 * Flies the paper plane along its path, driven by the page's scroll.
 *
 * Extracted from paper-plane-scroll.tsx, which is now markup and layout: the
 * same split hero-intro.tsx has with use-statement-flight and showcase-loop.tsx
 * with use-showcase-drift. The component says where the plane is drawn; this
 * says when and how it moves.
 *
 * ── The knobs ────────────────────────────────────────────────────────────
 *   when it flies   SCROLL_START and SCROLL_END
 *   nose direction  PLANE_ROTATION_OFFSET
 * ─────────────────────────────────────────────────────────────────────────
 *
 * Scroll-linked and nothing else: no idle animation, no autoplay, no loop.
 * `scrub: true` is what makes that true — the tween has no life of its own, its
 * playhead IS the scroll position, so scrolling back up runs it backwards and a
 * still page leaves it still.
 *
 * Reduced motion holds the plane at the start of its path. The tween is built
 * but given no ScrollTrigger, so there is nothing to drive it and nothing that
 * could move on its own.
 *
 * Lenis needs no wiring. It animates the browser's real scroll position rather
 * than translating a wrapper, so ScrollTrigger reads the numbers it always
 * does — the same reason scroll-gradient-text.tsx works untouched.
 */

/**
 * When the flight begins and ends, in ScrollTrigger's
 * "<element edge> <viewport position>" syntax.
 *
 * Measured against the HOST SECTION — the element this component is rendered
 * inside — and not against its own layer. That distinction matters as soon as
 * FLIGHT_REACH is anything but `top-0`: the layer then overhangs the section,
 * and timing to the layer would start the flight early by exactly that
 * overhang, which is a bug this component has already had once.
 *
 * The two constants are now independent, and it is worth keeping them that way:
 *
 *   FLIGHT_REACH               WHERE the plane flies
 *   SCROLL_START / SCROLL_END  WHEN it flies
 *
 * The defaults span the section's whole passage: the plane sets off as the
 * section's top reaches the bottom of the screen, and arrives as its bottom
 * leaves the top. To hold it still until the section is properly in view, try
 * "top center"; to have it finish before the section leaves, "bottom center".
 */
const SCROLL_START = "top center";
const SCROLL_END = "bottom center";
/**
 * Degrees added to the tangent rotation, to correct the artwork's own heading.
 *
 * `autoRotate` turns the plane to face along the path, and assumes the artwork
 * points RIGHT at 0°. This one already does, near enough. If it ever flies
 * backwards or sideways, this is the only value to change — try 180, 90 or -90.
 * Never rotate the path to fix the plane.
 */
const PLANE_ROTATION_OFFSET = 30;

export function usePaperPlaneFlight({
  layerRef,
  pathRef,
  planeRef,
}: {
  /**
   * The flight layer. Its DOM PARENT is what the flight is timed against — see
   * the note on `host` below — so this component belongs directly inside the
   * section it should follow.
   */
  layerRef: RefObject<HTMLDivElement | null>;
  /** The route. Measured by MotionPathPlugin, so it must be in the document. */
  pathRef: RefObject<SVGPathElement | null>;
  /** The plane. GSAP owns its transform outright. */
  planeRef: RefObject<SVGGElement | null>;
}) {
  useEffect(() => {
    const layer = layerRef.current;
    const path = pathRef.current;
    const plane = planeRef.current;
    if (!layer || !path || !plane) return;

    /*
      The section this layer was rendered into, which is what the flight is
      timed against. The layer itself is the wrong measure — it deliberately
      overhangs the section, so timing to it starts the flight early by exactly
      that overhang. Its DOM parent IS the section; the component is documented
      as belonging directly inside the one it should follow.
    */
    const host = layer.parentElement ?? layer;

    let cancelled = false;
    let revert: (() => void) | undefined;

    const run = async () => {
      const [{ gsap }, { MotionPathPlugin }, { ScrollTrigger }] =
        await Promise.all([
          import("gsap"),
          import("gsap/MotionPathPlugin"),
          import("gsap/ScrollTrigger"),
        ]);

      /* The imports resolve on a later tick, by which time this effect may
         already have been cleaned up — Strict Mode guarantees it in
         development. A stale resolution must build no tween and register no
         trigger, or the second mount runs two of everything. */
      if (cancelled) return;

      gsap.registerPlugin(MotionPathPlugin, ScrollTrigger);

      const media = gsap.matchMedia();

      /* The flight itself. Identical in both branches — what differs is
         whether anything is allowed to drive it. */
      const flight = {
        motionPath: {
          path,
          align: path,
          alignOrigin: [0.5, 0.5] as [number, number],
          autoRotate: PLANE_ROTATION_OFFSET,
          start: 0,
          end: 1,
        },
        /* No easing. The scrollbar is the easing — anything else would make
           the plane speed up and slow down against a steady scroll. */
        ease: "none",
      };

      media.add("(prefers-reduced-motion: no-preference)", () => {
        const tween = gsap.to(plane, {
          ...flight,
          scrollTrigger: {
            trigger: host,
            start: SCROLL_START,
            end: SCROLL_END,
            /* The playhead IS the scroll position. Nothing plays on its own,
               nothing repeats, and reversing the scroll reverses the flight. */
            scrub: true,
            /* Re-measure on refresh rather than trusting the first read, so a
               font landing late or an image changing the section's height does
               not leave the trigger aimed at where things used to be. */
            invalidateOnRefresh: true,
          },
        });

        /*
          The section's own height can change without the window resizing — the
          showcase row's cards are sized in viewport units, and a CMS will make
          this section's contents variable. ScrollTrigger measures pixels, so it
          needs telling; the SVG needs nothing, because the plane's position is
          in viewBox units that scale on their own.

          Coalesced to one refresh per frame: a resize drag fires this
          continuously, and refreshing recomputes every trigger on the page.
        */
        let frame = 0;
        const observer = new ResizeObserver(() => {
          if (frame) return;
          frame = requestAnimationFrame(() => {
            frame = 0;
            ScrollTrigger.refresh();
          });
        });
        observer.observe(host);

        return () => {
          if (frame) cancelAnimationFrame(frame);
          observer.disconnect();
          tween.scrollTrigger?.kill();
          tween.kill();
        };
      });

      media.add("(prefers-reduced-motion: reduce)", () => {
        /* Placed at the start of the path and left there. A paused tween at
           progress 0 puts the plane exactly where the flight would begin, with
           no trigger attached and so nothing that could ever move it. */
        const held = gsap.to(plane, { ...flight, paused: true });
        held.progress(0);
        return () => held.kill();
      });

      revert = () => media.revert();
    };

    void run();

    return () => {
      cancelled = true;
      revert?.();
    };
  }, [layerRef, pathRef, planeRef]);
}
