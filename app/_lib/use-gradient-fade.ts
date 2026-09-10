"use client";

import type { RefObject } from "react";

import { useBeforePaint } from "@/app/_lib/use-before-paint";

/**
 * Fades a gradient away as its section scrolls, leaving the solid colour that
 * sits beneath it.
 *
 * Two callers: the hero, whose cream-to-orange gradient dissolves into solid
 * brand orange by the time its sticky stage lets go, and the showcase section,
 * whose orange gradient dissolves into cream by the time its bottom reaches the
 * fold.
 *
 * **It fades rather than repaints.** A solid `action-primary` layer already
 * sits permanently beneath the gradient — it is what the intro reveal uncovers
 * — so taking the gradient's opacity to zero leaves that base showing and the
 * hero is orange with nothing new drawn. Interpolating the gradient's own
 * colour stops would have meant animating a paint property every frame;
 * opacity stays on the compositor.
 *
 * **Where it starts is as load-bearing as where it finishes.**
 * `-top / (height - viewport)` is zero until the element's top reaches the top
 * of the screen, and reaches 1 when its bottom arrives at the fold.
 *
 * Both ends matter. The finish is the moment a full-height `sticky` child stops
 * being pinned — so the hero is fully faded just as its gradient begins to
 * leave. And the START is what keeps a fading gradient from breaking a colour
 * join: these gradients begin at the same value as the section above them, and
 * that join is invisible only while the two match. Holding the fade at zero
 * until the element's top has cleared the top of the screen means the join has
 * gone by the time anything changes.
 *
 * A range that began earlier was tried on the showcase section and left a hard
 * line at exactly that join.
 *
 * Nothing here is a fraction of the element chosen by eye — both ends come from
 * the layout, so adding a section or changing a height moves them with it.
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
  travelViewports,
}: {
  /** The gradient layer. Its opacity is the only thing written. */
  gradientRef: RefObject<HTMLElement | null>;
  /** Attribute marking the scrolling element the gradient belongs to. */
  stageAttribute: string;
  /**
   * How long the fade runs, as a multiple of the viewport height.
   *
   * Omit it and the fade uses the element's own overflow past the screen —
   * right for the hero, whose stage exists to be scrolled through and whose
   * height IS the intended duration.
   *
   * Give it a number and the duration stops depending on the element's height.
   * That is what an ordinary section needs: its padding is a spacing decision,
   * and without this, adding room at the top would silently stretch the fade to
   * match. Two things that have nothing to do with each other should not be the
   * same number.
   *
   * The start is unaffected either way — the fade still holds at full until the
   * element's top has cleared the top of the screen.
   */
  travelViewports?: number;
}) {
  useBeforePaint(() => {
    const gradient = gradientRef.current;
    const stage = gradient?.closest<HTMLElement>(`[${stageAttribute}]`);
    if (!gradient || !stage) return;

    let frame = 0;

    const update = () => {
      frame = 0;
      const rect = stage.getBoundingClientRect();
      const viewport = window.innerHeight;

      /*
        How far there is to fade over.

        Given a `travelViewports`, that distance is simply a slice of the screen
        and never depends on the element. Without one it is the element's own
        overflow past the screen — the scroll between its top reaching the top
        and its bottom reaching the bottom.

        That second measure is zero on an element no taller than the viewport,
        so there is nothing to fade against and nothing fades, leaving the
        gradient whole — the safe way to fail. If a gradient using it is not
        fading, that height is the first thing to check: a section sized
        `min-h-svh` with centred content is exactly one screen tall.
      */
      const travel =
        travelViewports === undefined
          ? rect.height - viewport
          : viewport * travelViewports;
      if (travel <= 0) {
        gradient.style.opacity = String(FROM);
        return;
      }

      const progress = Math.min(1, Math.max(0, -rect.top / travel));
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
  }, [gradientRef, stageAttribute, travelViewports]);
}
