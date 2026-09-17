"use client";

import type { CSSProperties, ReactNode } from "react";
import { useRef } from "react";

import { CARD_STAGGER_MS } from "@/app/_lib/motion";
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
 * **It re-arms when the element goes back BELOW the viewport**, so scrolling up
 * past it and returning plays the arrival again. Leaving upward — scrolling
 * down past it — is ignored and it stays as it landed.
 *
 * That asymmetry is deliberate and is the same one `use-situation-cards.ts`
 * makes with `onEnter` and `onLeaveBack`: coming back *down* to something you
 * have already read should not rewind it, but coming back *up* to something
 * should find it fresh. The two directions are told apart by the sign of
 * `boundingClientRect.top` at the moment it stops intersecting.
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
  index = 0,
}: {
  children: ReactNode;
  /** Applied to the wrapper. It becomes the grid or flex item in the child's
   *  place, so any sizing the child relied on belongs here. */
  className?: string;
  /** Position in the row, which is what the stagger is spent on. */
  index?: number;
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
        if (entry.isIntersecting) {
          element.dataset.appear = "shown";
          return;
        }

        /* Gone, but which way? A positive `top` means the element sits BELOW
           the viewport, so the reader has scrolled up off it and should meet
           the arrival again on the way back down. A negative one means it has
           passed off the top, already seen — leave it as it landed. */
        if (entry.boundingClientRect.top > 0) {
          element.dataset.appear = "pending";
        }
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
    /* The delay is a custom property rather than a class, the same way
       masked-text.tsx carries `--reveal-delay`: the value is per item and a
       class cannot be assembled at runtime without Tailwind failing to see it. */
    <div
      ref={ref}
      className={className}
      style={{ "--appear-delay": `${index * CARD_STAGGER_MS}ms` } as CSSProperties}
    >
      {children}
    </div>
  );
}
