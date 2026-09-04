"use client";

import { useEffect, useRef, useState } from "react";

/** Scroll distance before the mobile bar is allowed to hide — its own height. */
const HIDE_AFTER = 80;
/** Ignore direction changes smaller than this so the bar cannot judder. */
const DIRECTION_THRESHOLD = 4;
/**
 * The two edges of "at the top", deliberately different.
 *
 * A single threshold flickers: a touch scroll that comes to rest near the line,
 * or the rubber-band bounce at the top of a mobile page, crosses it repeatedly
 * and the header's background flips with it. Leaving the top takes a real
 * scroll of TOP_EXIT; returning needs the page to come back within TOP_ENTER.
 * The gap between them is the hysteresis, so the boundary can only be crossed
 * once per direction.
 */
const TOP_EXIT = 24;
const TOP_ENTER = 8;

export type ScrollState = {
  /** True once the page has been scrolled past `revealAfter`. */
  revealed: boolean;
  /** True while the reader is moving down the page. */
  barHidden: boolean;
  /** True while the page is resting at, or within a few pixels of, the top. */
  atTop: boolean;
};

/**
 * Reads the page's scroll position once per frame and derives every piece of
 * state the header needs. One listener, one rAF, whatever uses it.
 */
export function useScrollState(revealAfter: number): ScrollState {
  const [revealed, setRevealed] = useState(false);
  const [barHidden, setBarHidden] = useState(false);
  // Starts true so the first server-rendered paint matches a page opened at the
  // top, which is where every load begins. Corrected on mount by the immediate
  // onScroll() below if the browser restored a scroll position.
  const [atTop, setAtTop] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        const y = Math.max(0, window.scrollY);
        const previous = lastScrollY.current;

        setRevealed(y >= revealAfter);

        if (y <= HIDE_AFTER) {
          setBarHidden(false);
        } else if (Math.abs(y - previous) >= DIRECTION_THRESHOLD) {
          setBarHidden(y > previous);
        }

        setAtTop((wasAtTop) => (wasAtTop ? y <= TOP_EXIT : y <= TOP_ENTER));

        lastScrollY.current = y;
        frame = 0;
      });
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [revealAfter]);

  return { revealed, barHidden, atTop };
}
