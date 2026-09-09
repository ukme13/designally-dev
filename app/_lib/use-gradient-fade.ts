"use client";

import type { RefObject } from "react";

import { useBeforePaint } from "@/app/_lib/use-before-paint";

/**
 * Fades the hero's cream-to-orange gradient away as the sticky stage scrolls,
 * so the hero has become solid brand orange by the time the stage lets go.
 *
 * **It fades rather than repaints.** A solid `action-primary` layer already
 * sits permanently beneath the gradient — it is what the intro reveal uncovers
 * — so taking the gradient's opacity to zero leaves that base showing and the
 * hero is orange with nothing new drawn. Interpolating the gradient's own
 * colour stops would have meant animating a paint property every frame;
 * opacity stays on the compositor.
 *
 * **Why it finishes where it does.** The measure is the gradient's PIN, not the
 * whole stage: `-top / (height - viewport)` reaches 1 at the exact moment a
 * `sticky` element stops being pinned and starts travelling up with the page.
 * For this stage that instant is the bottom of the statement section arriving
 * at the fold — the point the gradient begins to leave. So it is fully orange
 * just as it starts to go, and hands over to the solid `primary-300` section
 * below with no step in colour.
 *
 * Deriving it from the pin rather than from a fraction of the stage means the
 * finish follows the layout. Add a third section to the stage, or change a
 * section's height, and the fade still completes at the handover instead of
 * somewhere arbitrary.
 *
 * **No reduced-motion branch, deliberately.** Nothing here moves: it is a
 * background changing colour under a scroll the visitor is already making.
 * Disabling it would leave a cream gradient meeting a solid orange section at a
 * hard seam, which is worse for everyone and helps nobody.
 */

/** Opacity at the start of the pin, and at the end of it. */
const FROM = 1;
const TO = 0;

export function useGradientFade({
  gradientRef,
  stageAttribute,
}: {
  /** The gradient layer. Its opacity is the only thing written. */
  gradientRef: RefObject<HTMLElement | null>;
  /** Attribute marking the scrolling stage the gradient is pinned inside. */
  stageAttribute: string;
}) {
  useBeforePaint(() => {
    const gradient = gradientRef.current;
    const stage = gradient?.closest<HTMLElement>(`[${stageAttribute}]`);
    if (!gradient || !stage) return;

    let frame = 0;

    const update = () => {
      frame = 0;
      const rect = stage.getBoundingClientRect();
      /* The pin's own length: how far the stage can scroll while a full-height
         sticky child stays put. Zero or less means there is no pin to measure
         — a stage no taller than the viewport — so there is nothing to fade. */
      const pin = rect.height - window.innerHeight;
      if (pin <= 0) {
        gradient.style.opacity = String(FROM);
        return;
      }
      const progress = Math.min(1, Math.max(0, -rect.top / pin));
      gradient.style.opacity = String(FROM + (TO - FROM) * progress);
    };

    /* Coalesced to one write per frame. Scroll fires far more often than the
       screen repaints, and a rectangle read per event would be wasted work. */
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    /* Once immediately, before paint, so a reload partway down the stage starts
       at the right colour rather than at cream and correcting itself. */
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    /* Resize changes the pin length: both terms of it, in fact. */
    window.addEventListener("resize", onScroll);

    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      gradient.style.opacity = "";
    };
  }, [gradientRef, stageAttribute]);
}
