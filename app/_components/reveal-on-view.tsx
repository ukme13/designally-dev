"use client";

import type { ReactNode } from "react";
import { useRef } from "react";

import { useBeforePaint } from "@/app/_lib/use-before-paint";

/**
 * Reveals whatever it wraps the first time that element reaches the viewport.
 *
 * For content whose own component cannot hold the observer — `insight-card.tsx`
 * is an async Server Component, so it can neither carry `"use client"` nor run
 * an effect. Passing a server-rendered child into a client wrapper is the way
 * round that, and it keeps the card itself free of animation concerns.
 *
 * **The finished state is what the server sends.** Nothing is rendered hidden:
 * the start state is written here, before paint, and removed again on cleanup.
 * So no JavaScript, a failed hydration, or reduced motion all leave the content
 * exactly as the HTML has it — visible, in place, at full opacity. Hiding in
 * CSS and revealing in JS fails the other way, which is the way that loses
 * content.
 *
 * `useBeforePaint`, not `useEffect`: the attribute has to be on the element in
 * the same frame it first paints, or the child appears and is then hidden.
 *
 * Once shown it stays shown — the observer disconnects. Scrolling back up and
 * down again does not replay it, which is right for content rather than for
 * decoration.
 *
 * ── The knobs ────────────────────────────────────────────────────────────
 *   when it fires   TRIGGER_MARGIN
 *   how it moves    the `[data-appear]` rules in globals.css
 *
 * **`data-appear`, NOT `data-reveal`.** `masked-text.tsx` already owns
 * `dataset.reveal`, with the values `hidden` and `in`, and drives its lines
 * from it through `group-data-[reveal=...]` variants. This began on that same
 * name: the values never collided, so nothing broke on screen, but a bare
 * `[data-reveal]` rule in globals.css was attaching a transition to every
 * MaskedText root in the site. Two components must not share an attribute.
 * ─────────────────────────────────────────────────────────────────────────
 */

/**
 * How far into the viewport the element must come before it reveals.
 *
 * `-12%` off the bottom, so a card starts once it is properly on screen rather
 * than the instant its first pixel appears — at 0 the movement begins at the
 * very edge and is mostly over before it is being looked at.
 */
const TRIGGER_MARGIN = "0px 0px -12% 0px";

export default function RevealOnView({
  children,
  className,
}: {
  children: ReactNode;
  /** Applied to the wrapper. It becomes the grid or flex item in the child's
   *  place, so any sizing the child relied on belongs here. */
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useBeforePaint(() => {
    const element = ref.current;
    if (!element) return;

    /* Read once. Nothing here animates under reduced motion, so there is
       nothing to keep watching for — and leaving the attribute off is what
       makes the content simply present. */
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    element.dataset.appear = "pending";

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        element.dataset.appear = "shown";
        observer.disconnect();
      },
      { rootMargin: TRIGGER_MARGIN, threshold: 0 },
    );
    observer.observe(element);

    return () => {
      observer.disconnect();
      delete element.dataset.appear;
    };
  }, []);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
