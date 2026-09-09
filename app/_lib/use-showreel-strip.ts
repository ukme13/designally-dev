"use client";

import type { RefObject } from "react";
import { useEffect } from "react";

/**
 * Keeps the showreel's project breadcrumb centred on the current name.
 *
 * Extracted from showreel.tsx, which was carrying its own entrance timeline,
 * its playback, its observers and this at once. The split follows the one
 * hero-intro.tsx has with use-statement-flight: the component keeps the markup
 * and the state, the imperative scroll work lives here.
 *
 * The strip holds three copies of the four names so the active one can always
 * be centred with real names either side of it. Only the middle copy is real;
 * the outer two exist so there is never a blank where a name should be. What
 * this does is pick whichever copy of the target name is nearest to where the
 * strip already sits, and scroll to that — so a switch never sends the row
 * travelling the length of itself.
 *
 * Returns that function, because the component's own click handler needs to
 * call it: selecting a project both changes the film and moves the strip.
 */
export function useShowreelStrip({
  controlsRef,
  index,
  reduced,
  captionVisible,
}: {
  /** The scrolling strip. */
  controlsRef: RefObject<HTMLDivElement | null>;
  /** Which project is current. */
  index: number;
  /** True under `prefers-reduced-motion`, which makes the scroll instant. */
  reduced: boolean;
  /** The strip is only worth centring once it has arrived. */
  captionVisible: boolean;
}) {
  /**
   * Slide the strip so the middle copy's pill lands where its nearest twin is.
   *
   * Every switch would otherwise send the strip travelling. The pill that
   * becomes active is always the middle copy's, so if the visitor is looking
   * at a different copy — or if the carousel wraps from the last project back
   * to the first — the centring below smooth-scrolls a whole copy-width across
   * the strip. Pressing LAGA on the right, or simply letting BITAZZA advance
   * to LAGA, ran the whole row leftwards.
   *
   * The copies are identical, so the fix is to make the two indistinguishable
   * before the scroll begins. Whichever copy of the incoming pill is nearest
   * the middle of the strip is where the eye already is; moving the strip by
   * the distance between that twin and the real pill puts the real one exactly
   * there. Nothing appears to move, and the smooth scroll that follows has a
   * short distance to travel, in whichever direction is nearest.
   *
   * Called from `selectProject`, so it covers every route a switch can take —
   * a press, `crossfadeAt` advancing, and the stall fallback alike. It ran in
   * the click handler alone at first, which fixed presses and left the
   * automatic advance jumping.
   *
   * `scrollLeft` written directly rather than through `scrollTo`, because this
   * must land in the same frame as the switch. Any easing here would be the
   * jump it exists to hide.
   */
  const alignToNearestCopy = (next: number) => {
    const strip = controlsRef.current;
    if (!strip) return;
    if (getComputedStyle(strip).overflowX === "visible") return;

    const real = strip.querySelector<HTMLElement>(
      `[data-copy="1"][data-entry="${next}"]`,
    );
    if (!real) return;

    const stripBox = strip.getBoundingClientRect();
    const middle = stripBox.left + stripBox.width / 2;
    const centreOf = (element: HTMLElement) => {
      const box = element.getBoundingClientRect();
      return box.left + box.width / 2;
    };

    let nearest = real;
    let shortest = Infinity;
    for (const twin of strip.querySelectorAll<HTMLElement>(
      `[data-entry="${next}"]`,
    )) {
      const distance = Math.abs(centreOf(twin) - middle);
      if (distance < shortest) {
        shortest = distance;
        nearest = twin;
      }
    }
    if (nearest === real) return;

    const shift =
      nearest.getBoundingClientRect().left - real.getBoundingClientRect().left;
    const desired = strip.scrollLeft - shift;
    /* Refuse rather than clamp. A clamped shift would move the strip somewhere
       the eye did not expect, which is the fault this exists to prevent; a long
       smooth scroll is the lesser of the two. */
    if (desired < 0 || desired > strip.scrollWidth - strip.clientWidth) return;
    strip.scrollLeft = desired;
  };

  /*
    Keep the active pill centred in its strip.

    No padding involved any more. The strip carries three copies of the set, so
    the middle copy's active pill always has real pills on both sides of it and
    the scroll position it needs is comfortably inside the scrollable range —
    with four projects the middle copy sits roughly a third of the way in, far
    from either end.

    `getComputedStyle(...).overflowX` decides whether any of this applies,
    rather than a second copy of the `md` breakpoint: the strip is a scroller
    exactly when its own classes have made it one, and asking the element keeps
    the two from drifting apart.
  */
  useEffect(() => {
    const strip = controlsRef.current;
    if (!strip) return;

    const centre = () => {
      if (getComputedStyle(strip).overflowX === "visible") return;
      /* Only the middle copy carries this, so the target is never one of the
         decorative pills. */
      const active = strip.querySelector<HTMLElement>('[data-active="true"]');
      if (!active) return;

      /*
        Measured from rendered rectangles, not `offsetLeft`. That is relative
        to the nearest positioned ancestor, which is not this strip, so the
        arithmetic would be against the wrong origin.

        And `scrollTo` on the strip, never `scrollIntoView` on the pill: the
        latter walks up the ancestor chain and can scroll the page itself,
        which on a phone means the hero jumping every time the showreel
        advances on its own. This touches one element's scroll offset.
      */
      const stripBox = strip.getBoundingClientRect();
      const activeBox = active.getBoundingClientRect();
      const drift =
        activeBox.left +
        activeBox.width / 2 -
        (stripBox.left + stripBox.width / 2);

      strip.scrollTo({
        left: strip.scrollLeft + drift,
        /* An automatic advance every few seconds should not smooth-scroll at
           someone who asked for less motion; it still moves, just without the
           travel. */
        behavior: reduced ? "auto" : "smooth",
      });
    };

    centre();
    /* Re-run on resize, which is also what covers crossing the md breakpoint
       in either direction. */
    const observer = new ResizeObserver(centre);
    observer.observe(strip);
    return () => observer.disconnect();
  }, [controlsRef, index, reduced, captionVisible]);

  return alignToNearestCopy;
}
