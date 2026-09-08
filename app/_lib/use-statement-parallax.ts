import type { RefObject } from "react";
import { useEffect } from "react";

import type { ElementSlots } from "@/app/_lib/element-slots";
import { present } from "@/app/_lib/element-slots";

/** How far one line may travel from its resting place, per axis. */
export type ParallaxLimit = { readonly x: number; readonly y: number };

/**
 * Holds a normalised coordinate inside -1..1.
 *
 * Movement is a bounded function of the pointer's position and is never
 * accumulated, so the text cannot drift away however long the mouse moves.
 * The clamp covers the one case the maths does not: a pointer event arriving
 * from a child that overflows the region, which `whitespace-nowrap` allows.
 */
const clampUnit = (value: number) => Math.min(1, Math.max(-1, value));

/**
 * Moves a set of elements with the pointer, each by its own bounded amount.
 *
 * Scoped by a rectangle rather than by the element the event lands on, so
 * anything painted over the region — a fixed header, for instance — cannot
 * interrupt the gesture.
 *
 * Mouse only, and only where a real pointer and no motion preference exist.
 */
export function useStatementParallax({
  enabled,
  heroRef,
  layerRefs,
  limits,
  duration,
  ease,
}: {
  /** Nothing runs until this is true — usually once an entrance has finished. */
  enabled: boolean;
  /** The region the pointer is measured against. */
  heroRef: RefObject<HTMLElement | null>;
  /** The layer each line's parallax is written to. */
  layerRefs: RefObject<ElementSlots<HTMLElement>>;
  /** One entry per line, in the same order as the refs. */
  limits: readonly ParallaxLimit[];
  /** Seconds for a layer to reach a new target. */
  duration: number;
  /** GSAP easing name. */
  ease: string;
}) {
  /*
    Mouse parallax on the three statement lines.

    A second effect on purpose. The entrance effect's generation token,
    `cancelled` flag and microtask-deferred restore exist to survive Strict
    Mode's discarded first pass; keeping parallax out of it means neither has
    to reason about the other.

    It writes to layer 3 of each line and nothing else. The entrance owns
    layer 2, the placement owns layer 1 and the tilt lives on the paragraph, so
    no two things ever share a transform.
  */
  useEffect(() => {
    if (!enabled) return;

    const hero = heroRef.current;
    const layers = present(layerRefs.current);

    // Requiring the full set keeps each layer aligned with its own limit;
    // a short array would silently shift the depths up by one.
    if (!hero || layers.length !== limits.length) return;

    let cancelled = false;
    let context: { revert: () => void } | undefined;

    const run = async () => {
      const { gsap } = await import("gsap");

      // The import resolves on a later tick, by which time this effect may
      // already have been cleaned up — Strict Mode guarantees it in
      // development. The cleanup below has nothing to revert at that point, so
      // a stale resolution must attach no listeners and build no tweens at all
      // rather than leaving either behind.
      if (cancelled) return;

      const media = gsap.matchMedia();

      media.add(
        "(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)",
        () => {
          /*
            One paused tween per property per layer, re-aimed by resetTo on
            each pointer event. Nothing is allocated while the mouse moves, and
            GSAP's ticker runs only while a tween is actually travelling — so
            there is no standing animation loop, and none is needed.
          */
          const setters = layers.map((layer, index) => ({
            x: gsap.quickTo(layer, "x", {
              duration: duration,
              ease: ease,
            }),
            y: gsap.quickTo(layer, "y", {
              duration: duration,
              ease: ease,
            }),
            limit: limits[index],
          }));

          /*
            Whether the cursor was over the hero on the previous event.

            `home()` restarts its tweens, so calling it on every event while
            the pointer is elsewhere on the page would keep the lines
            perpetually 600ms from home instead of letting them arrive. Only
            the crossing matters.
          */
          let wasInside = false;

          /** Ease everything back to its resting place. */
          const home = () => {
            wasInside = false;
            for (const setter of setters) {
              setter.x(0);
              setter.y(0);
            }
          };

          const onPointerMove = (event: PointerEvent) => {
            // A hybrid laptop matches (hover: hover) and (pointer: fine) and
            // can still be touched. Only a mouse should move these.
            if (event.pointerType !== "mouse") return;

            // Read per event rather than cached: browsers coalesce pointermove
            // to roughly one per frame, so this is one layout read per frame,
            // and it stays correct when the page is scrolled or resized
            // without needing listeners for either.
            const rect = hero.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) return;

            const inside =
              event.clientX >= rect.left &&
              event.clientX <= rect.right &&
              event.clientY >= rect.top &&
              event.clientY <= rect.bottom;

            if (!inside) {
              if (wasInside) home();
              return;
            }
            wasInside = true;

            const nx = clampUnit(
              ((event.clientX - rect.left) / rect.width) * 2 - 1,
            );
            const ny = clampUnit(
              ((event.clientY - rect.top) / rect.height) * 2 - 1,
            );

            for (const setter of setters) {
              setter.x(nx * setter.limit.x);
              setter.y(ny * setter.limit.y);
            }
          };

          /*
            Listening on the window, but driven entirely by the hero's own
            rectangle — the test above is what scopes this, not the element the
            event happens to land on.

            It has to work this way because the header is fixed at z-40 across
            the top of the hero and swallows the pointer there whatever its
            background is. Bound to the hero element, moving the cursor into
            that 80-120px strip fired `pointerleave` and sent the lines home
            mid-gesture. The rectangle does not care what is painted on top.

            No extra cost while the pointer is elsewhere: the handler reads one
            rect, fails the bounds test and returns.
          */
          window.addEventListener("pointermove", onPointerMove);
          // Two ways the pointer can stop being over the hero without another
          // move event: the gesture being cancelled by the browser, and the
          // pointer leaving the document or the window losing focus with the
          // cursor still inside. The last matters because nothing follows an
          // alt-tab, so without it the lines would stay held off-centre.
          window.addEventListener("pointercancel", home);
          document.addEventListener("pointerleave", home);
          window.addEventListener("blur", home);

          return () => {
            window.removeEventListener("pointermove", onPointerMove);
            window.removeEventListener("pointercancel", home);
            document.removeEventListener("pointerleave", home);
            window.removeEventListener("blur", home);
          };
        },
      );

      context = media;
    };

    void run();

    return () => {
      cancelled = true;
      // One call does all three: runs the cleanup above, kills the tweens
      // created inside the context, and reverts the inline transforms they
      // wrote — so the lines are left exactly where the stylesheet puts them.
      context?.revert();
    };
  }, [enabled, limits, duration, ease, layerRefs, heroRef]);
}
