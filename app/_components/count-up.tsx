"use client";

import { useRef } from "react";

import { formatCount, useCountUp } from "@/app/_lib/use-count-up";

/**
 * A number that counts up from zero when it scrolls into view, and again after
 * the reader scrolls back up past it.
 * Markup here; the motion, and when it runs, in app/_lib/use-count-up.ts.
 *
 * **Read out once, at its final value.** The counting digits are `aria-hidden`
 * and a visually hidden copy carries the finished number, so a screen reader
 * never lands on "37+" halfway through the count.
 *
 * **The number never moves as it counts.** An invisible copy of the final
 * figure sets the box's width, and the counting digits sit against its right
 * edge. So the suffix stays put while the digits fill in to its left. Without
 * that, a centred number would re-centre every frame and visibly jump at 10
 * and again at 100, and a left-aligned one would push its suffix along.
 * `tabular-nums` asks the font for equal-width digits where it has them, so
 * the number doesn't shimmer as it changes.
 */
export default function CountUp({
  to,
  suffix = "",
  className,
}: {
  /** The final number. The server renders this, so it is also the fallback. */
  to: number;
  /** Written after the number throughout, e.g. "+". */
  suffix?: string;
  /** Type and layout, from the caller. */
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  useCountUp({ ref, to, suffix });
  const label = formatCount(to, suffix);

  return (
    <span className={className}>
      <span
        aria-hidden="true"
        className="relative inline-block whitespace-nowrap tabular-nums"
      >
        {/* Sizes the box at the final figure, and is never seen. */}
        <span className="invisible">{label}</span>
        <span ref={ref} className="absolute inset-y-0 right-0">
          {label}
        </span>
      </span>
      <span className="sr-only">{label}</span>
    </span>
  );
}
