"use client";

import { useLenis } from "lenis/react";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * Sends a forward navigation to the top of the document.
 *
 * Next scrolls to the top of the first *page* element, not the document. The
 * site header sits in normal flow above <main> from 1024px up, so that lands
 * the viewport just below the header and the bar is never seen on the new
 * page. See node_modules/next/dist/docs — api-reference/components/link, the
 * `scroll` prop.
 *
 * Back and forward navigation is left alone so the browser can restore the
 * previous scroll position, and the first render is skipped so a refresh or a
 * deep link keeps its position.
 *
 * The reset goes through Lenis when it is running. A bare `window.scrollTo`
 * moves the document while Lenis is still holding its own animated position,
 * and the two disagree until the next input — the page appears to spring back.
 * `immediate` keeps this a jump rather than a smooth ride, which is the point:
 * arriving on a new page should not look like scrolling.
 */
export default function ScrollToTop() {
  const pathname = usePathname();
  /* Undefined until Lenis has mounted, and on any route where it has not. */
  const lenis = useLenis();
  const isPopNavigation = useRef(false);
  const isFirstRender = useRef(true);

  useEffect(() => {
    const onPopState = () => {
      isPopNavigation.current = true;
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (isPopNavigation.current) {
      isPopNavigation.current = false;
      return;
    }
    if (lenis) {
      lenis.scrollTo(0, { immediate: true });
    } else {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }
  }, [pathname, lenis]);

  return null;
}
