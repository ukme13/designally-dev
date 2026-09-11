"use client";

import type { RefObject } from "react";

import { cssEase } from "@/app/_lib/css-ease";
import { useBeforePaint } from "@/app/_lib/use-before-paint";

/**
 * Counts a number up from zero when it scrolls into view, and again each time
 * the reader scrolls back up past it and returns.
 *
 * ── The knobs ────────────────────────────────────────────────────────────
 *   how long it takes   COUNT_DURATION
 *   when it starts      COUNT_START
 *   when it re-arms     RESET_AT
 *   easing              COUNT_EASE_TOKEN
 * ─────────────────────────────────────────────────────────────────────────
 *
 * **The finished number is what the server sends.** The zero is written here,
 * before paint, and the count runs when the number arrives. So no JavaScript,
 * a failed import and reduced motion all leave the real figure on the page,
 * never a zero.
 *
 * **Written to the text node, not React state.** A count re-renders sixty times
 * a second, which is wasted work for one number. Writing the text directly
 * also keeps the resting DOM identical to the server's HTML.
 *
 * **Replays after the reader scrolls back up past it.** Two triggers. One
 * counts from zero whenever the number arrives from below (`COUNT_START`). The
 * other puts it back to zero once it has gone off the BOTTOM of the screen
 * (`RESET_AT`), so the next arrival counts again. The reset is kept out of
 * sight on purpose: resetting at `COUNT_START` would drop the figure to zero
 * while it was still on screen.
 *
 * Only from below. Scrolling down past the number and back up to it leaves it
 * at the finished figure, because it never left through the bottom.
 *
 * Easing comes from the design tokens, read at runtime (see
 * app/_lib/css-ease.ts). `--ease-out` rushes through the low numbers and
 * settles into the last few, so the final figure is what the eye lands on.
 */

/** Seconds from zero to the final number. */
const COUNT_DURATION = 2;

/** When it starts, in ScrollTrigger's "<edge> <viewport position>" syntax. */
const COUNT_START = "top 85%";

/**
 * When it re-arms: its top edge back below the bottom of the screen, the moment
 * it has fully left the view on the way up.
 */
const RESET_AT = "top bottom";

const COUNT_EASE_TOKEN = "--ease-out";
const COUNT_EASE_ID = "count-up-out";
const COUNT_EASE_FALLBACK = "power2.out";

/**
 * The number as displayed. One definition for the server's text and for every
 * frame of the count, so the two can never disagree on format: a thousands
 * separator added here reaches both.
 */
export function formatCount(value: number, suffix: string) {
  return `${value}${suffix}`;
}

export function useCountUp({
  ref,
  to,
  suffix,
}: {
  /** The element whose text is the number. */
  ref: RefObject<HTMLElement | null>;
  /** The final number. */
  to: number;
  /** Written after the number throughout, e.g. "+". */
  suffix: string;
}) {
  useBeforePaint(() => {
    const node = ref.current;
    if (!node) return;

    /* Read once. Nothing below runs under reduced motion, so the number stays
       as rendered. */
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const show = (value: number) => {
      node.textContent = formatCount(value, suffix);
    };
    /* Every route out ends here, including a failed import and an unmount
       mid-count: the page is never left showing a partial figure. */
    const finish = () => show(to);

    show(0);

    let cancelled = false;
    let stop: (() => void) | undefined;

    const run = async () => {
      const [{ gsap }, { CustomEase }, { ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/CustomEase"),
        import("gsap/ScrollTrigger"),
      ]);

      /* The imports resolve on a later tick, by which time this effect may
         already have been cleaned up; Strict Mode guarantees it in
         development. A stale resolution must build nothing. */
      if (cancelled) return;

      gsap.registerPlugin(CustomEase, ScrollTrigger);
      const ease = cssEase(
        (id, data) => CustomEase.create(id, data),
        COUNT_EASE_TOKEN,
        COUNT_EASE_ID,
        COUNT_EASE_FALLBACK,
      );

      const counter = { value: 0 };
      const tween = gsap.to(counter, {
        value: to,
        duration: COUNT_DURATION,
        ease,
        paused: true,
        onUpdate: () => show(Math.round(counter.value)),
        onComplete: finish,
      });

      /* Counts from zero each time the number arrives from below. */
      const play = ScrollTrigger.create({
        trigger: node,
        start: COUNT_START,
        onEnter: () => tween.restart(),
      });

      /* Back to zero once it has gone off the bottom of the screen, so the
         next arrival counts again. `pause(0)` does not necessarily fire
         `onUpdate`, so the zero is written directly as well. */
      const rearm = ScrollTrigger.create({
        trigger: node,
        start: RESET_AT,
        onLeaveBack: () => {
          tween.pause(0);
          show(0);
        },
      });

      stop = () => {
        play.kill();
        rearm.kill();
        tween.kill();
      };
    };

    void run().catch(finish);

    return () => {
      cancelled = true;
      stop?.();
      finish();
    };
  }, [ref, to, suffix]);
}
