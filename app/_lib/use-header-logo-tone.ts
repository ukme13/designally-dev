"use client";

import { useBeforePaint } from "@/app/_lib/use-before-paint";

/**
 * Turns the header logo white while it sits over a dark or brand-coloured
 * section, and back to orange everywhere else.
 *
 * **No pixel sampling.** Reading the colour actually behind the logo would mean
 * rendering the page to a canvas, which cannot see cross-origin images and is
 * defeated by every gradient on this site anyway. Sections declare their own
 * needs instead: anything wanting a white logo carries
 * `data-header-tone="light"`, and this compares rectangles.
 *
 * The result is written straight to the DOM as an attribute rather than held in
 * React state. That is deliberate on two counts: the tone can change on any
 * frame of a scroll and re-rendering the whole header that often would be
 * wasteful, and an attribute written before paint cannot cause a hydration
 * mismatch — the server renders no tone at all, which is the correct default.
 *
 * **Only the floating header is touched.** The top bar's wordmark reads well in
 * orange and is left alone by choice; the mobile drawer paints its own light
 * background and is a sibling of both, so neither is in range of the selector
 * this writes to.
 *
 * That choice is what keeps this simple. The floating header is a bare overlay
 * with no background of its own at any width, so whatever is behind it is
 * always the page. The top bar is not: it is `md:bg-transparent`, but below
 * `md` it turns solid `surface-base` the moment the page leaves the top, and
 * bringing it in here would mean tracking that state so its logo went back to
 * orange when it is sitting on the bar's own light background rather than on
 * the section.
 */

/** What a section marks itself with to ask for a white logo. */
const TONE_SELECTOR = '[data-header-tone="light"]';
/** The surface whose logo this controls. Not the top bar, not the drawer. */
const HEADER_SELECTOR = "[data-site-floating]";
/** Written on a header when its logo should be white. Read by globals.css. */
const TONE_ATTRIBUTE = "data-logo-tone";

/** Vertical overlap. Both rectangles are in viewport coordinates. */
const overlaps = (a: DOMRect, b: DOMRect) => a.top < b.bottom && a.bottom > b.top;

export function useHeaderLogoTone({
  /** True while the mobile drawer is open: it owns the screen, so hold off. */
  suspended = false,
}: {
  suspended?: boolean;
} = {}) {
  useBeforePaint(() => {
    const headers = Array.from(
      document.querySelectorAll<HTMLElement>(HEADER_SELECTOR),
    );
    if (headers.length === 0) return;

    const clear = () => {
      for (const header of headers) header.removeAttribute(TONE_ATTRIBUTE);
    };

    /* The drawer is open: every header behind it is irrelevant, and leaving a
       stale tone on one would show through the moment it closes. */
    if (suspended) {
      clear();
      return clear;
    }

    /* Cached rather than queried per frame. A `querySelectorAll` costs a walk
       of the document, and the set of marked sections only changes when the
       page does. */
    let sections = Array.from(
      document.querySelectorAll<HTMLElement>(TONE_SELECTOR),
    );
    let frame = 0;

    const update = () => {
      frame = 0;
      for (const header of headers) {
        const rect = header.getBoundingClientRect();
        const light = sections.some((section) =>
          overlaps(section.getBoundingClientRect(), rect),
        );

        if (light) header.setAttribute(TONE_ATTRIBUTE, "light");
        else header.removeAttribute(TONE_ATTRIBUTE);
      }
    };

    /* Coalesced to one pass per frame. Scroll fires far more often than the
       screen repaints, and every pass here reads rectangles. */
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    /* Resize can add or remove marked sections as well as move them — a
       responsive section that only exists at one width, say — so the list is
       taken again rather than merely re-measured. */
    const onResize = () => {
      sections = Array.from(
        document.querySelectorAll<HTMLElement>(TONE_SELECTOR),
      );
      onScroll();
    };

    /* Before paint, so a reload partway down the page never shows one frame of
       an orange logo on orange. */
    update();

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);

    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      clear();
    };
  }, [suspended]);
}
