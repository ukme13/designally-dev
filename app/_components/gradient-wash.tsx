"use client";

import { useRef } from "react";

import { useGradientFade } from "@/app/_lib/use-gradient-fade";

/**
 * A gradient laid over a section, fading away as that section scrolls past.
 *
 * The section keeps a solid colour of its own; this paints the gradient on top
 * and dissolves it, so by the end the solid one is all that is left. Fading a
 * layer rather than interpolating colour stops means the work is opacity, which
 * stays on the compositor — animating the stops themselves would repaint every
 * frame.
 *
 * The section it belongs to is found by walking up from this element, so it
 * must carry `data-gradient-wash` and a stacking context (`isolate`) — without
 * one, a negative z-index child escapes to the nearest ancestor context and
 * falls behind the section's own background instead of sitting over it.
 *
 * Decorative and inert: no pointer events, out of the accessibility tree, and
 * it adds no height.
 */

/** Marks the section this washes over. Read by the hook, not by CSS. */
const WASH_ATTRIBUTE = "data-gradient-wash";

/**
 * How long the fade runs, in screens of scrolling.
 *
 * A fixed distance ON PURPOSE, rather than the section's own height. The
 * section's padding is a spacing decision, and tying the fade to it means every
 * adjustment to the layout silently re-times the animation — add room at the
 * top and the wash takes longer to clear. This number is the only thing that
 * changes how long it takes.
 *
 * The section still has to be taller than the screen, but for a different
 * reason: the fade holds at full until the section's top has cleared the top of
 * the screen, and something has to remain on screen after that for the fade to
 * be seen at all.
 *
 * **The window this has to fit inside is small, and that is why the number is.**
 * The fade cannot begin until the section's top has cleared the top of the
 * screen — the gradient's top stop matches the solid section above, and that
 * join is invisible only while the two agree. And it should be finished by the
 * time the content arrives at the top, which is one top-padding later. So the
 * whole wash has to happen inside roughly the section's own `pt-*`.
 *
 * At 0.6 it was a quarter done by then; at 0.25 about two thirds. 0.12 finishes
 * with room to spare.
 *
 * **The white-logo marker in page.tsx is sized from this.** That marker is what
 * turns the floating logo white while the section is still orange, so it has to
 * span the same moment this does — change one and change the other.
 *
 * **If that feels too quick, the fix is more top padding, not a bigger number
 * here.** Padding widens the window; this only spreads the fade across it, and
 * spreading it past the window's end is what leaves the section looking stuck
 * on orange. The two are independent now precisely so they can be tuned
 * against each other.
 */
const FADE_TRAVEL = 0.12;

export default function GradientWash({
  className,
}: {
  /** The gradient itself, as Tailwind utilities. Nothing else belongs here. */
  className: string;
}) {
  const washRef = useRef<HTMLDivElement>(null);

  /*
    The fade holds at full until the section's top has cleared the top of the
    screen, and completes as its bottom reaches the fold.

    That start is the important half. This gradient begins at the same value as
    the section above it, and the join between them is invisible only while the
    two match — so a fade that began as soon as the section appeared left a hard
    line across that join. Waiting until the join has scrolled away means
    nothing changes while it can be seen.
  */
  useGradientFade({
    gradientRef: washRef,
    stageAttribute: WASH_ATTRIBUTE,
    travelViewports: FADE_TRAVEL,
  });

  return (
    <div
      ref={washRef}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 -z-10 ${className}`}
    />
  );
}
