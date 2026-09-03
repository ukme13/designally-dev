"use client";

import { useEffect, useRef, useState } from "react";

/** Scroll distance before the mobile bar is allowed to hide — its own height. */
const HIDE_AFTER = 80;
/** Ignore direction changes smaller than this so the bar cannot judder. */
const DIRECTION_THRESHOLD = 4;

export type ScrollState = {
  /** True once the page has been scrolled past `revealAfter`. */
  revealed: boolean;
  /** True while the reader is moving down the page. */
  barHidden: boolean;
};

/**
 * Reads the page's scroll position once per frame and derives both pieces of
 * state the header needs. One listener, one rAF, whatever uses it.
 */
export function useScrollState(revealAfter: number): ScrollState {
  const [revealed, setRevealed] = useState(false);
  const [barHidden, setBarHidden] = useState(false);
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

  return { revealed, barHidden };
}
