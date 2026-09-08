import type { RefObject } from "react";

import type { ElementSlots } from "@/app/_lib/element-slots";
import { present } from "@/app/_lib/element-slots";
import { useBeforePaint } from "@/app/_lib/use-before-paint";

/** Where one line sits at a single point in its journey. */
export type FlightFrame = {
  /** Pixels. Positive moves right. */
  readonly x: number;
  /** Pixels. Positive moves down, so lines leave upward on a negative. */
  readonly y: number;
  /** Degrees. */
  readonly rotation: number;
};

/** One line's whole journey across the stage. */
export type FlightKeyframes = {
  readonly start: FlightFrame;
  readonly end: FlightFrame;
};

/** Linear interpolation. No easing: the scrollbar is the easing. */
const lerp = (from: number, to: number, progress: number) =>
  from + (to - from) * progress;

/**
 * How far the sticky stage has travelled, 0 to 1.
 *
 * 0 is the frame its top edge meets the top of the viewport; 1 is the frame
 * its bottom edge passes the top, when the stage has gone entirely. Read from
 * a live rectangle, so it is correct on the first frame after a reload partway
 * down the page.
 *
 * The divisor is the stage's WHOLE height, deliberately. Using
 * `height - innerHeight` instead — the usual figure for how long something
 * stays pinned — finished the journey after one viewport of scrolling, at the
 * moment the pin releases. The stage stays on screen for two, so the lines
 * completed early and then held still for the entire second half, which is the
 * stretch scrolling toward the section below. Dividing by the full height
 * spreads the journey across every frame the stage is visible.
 *
 * A stage with no height reports 0 rather than dividing by zero.
 */
const stageProgress = (stage: HTMLElement) => {
  const rect = stage.getBoundingClientRect();
  if (rect.height <= 0) return 0;
  return Math.min(1, Math.max(0, -rect.top / rect.height));
};

/**
 * Carries a set of lines from their `start` keyframe to their `end` one across
 * a scrolling stage.
 *
 * Translation and rotation are written to DIFFERENT elements, because they
 * belong to different layers of the caller's markup: two animations sharing an
 * element means one folds into the other's matrix and the loser's contribution
 * is lost. `layerRefs` takes the translation, `typeRefs` the rotation.
 *
 * The stage is found from `originRef` by an ancestor lookup on `stageAttribute`
 * rather than by counting parents, so the markup between the two is free to
 * change.
 */
export function useStatementFlight({
  enabled,
  originRef,
  stageAttribute,
  layerRefs,
  typeRefs,
  keyframes,
}: {
  /** Nothing runs until this is true — usually once an entrance has finished. */
  enabled: boolean;
  /** Any element inside the stage. Used only to find it. */
  originRef: RefObject<HTMLElement | null>;
  /** The attribute marking the stage, without brackets. */
  stageAttribute: string;
  /** The layer each line's translation is written to. */
  layerRefs: RefObject<ElementSlots<HTMLElement>>;
  /** The element each line's rotation is written to. */
  typeRefs: RefObject<ElementSlots<HTMLElement>>;
  /** One entry per line, in the same order as the refs. */
  keyframes: readonly FlightKeyframes[];
}) {
  /*
    Scroll flight: the lines travel from their `start` keyframe to their `end`
    one across the sticky stage.

    A third effect for the same reason parallax is a second one — the entrance
    owns a generation token and a microtask-deferred restore that exist to
    survive Strict Mode, and nothing else should have to reason about them.

    It writes to two layers and no others: `x`/`y` to layer 2, `rotation` to
    layer 5. The entrance owns layer 3, parallax owns layer 4, and placement
    owns layer 1. That separation is the whole reason the markup is five deep —
    two animations sharing one element means one folds into the other's matrix
    and the loser's contribution is lost.

    No GSAP here, deliberately, and this is the one effect in the file without
    it. The value is a straight function of a rectangle with no easing,
    timeline or tween involved, so a `style.transform` assignment does the same
    work. That also makes the effect synchronous, which is what lets it run
    before paint and settle the lines with no jump on a reload partway down the
    page — a dynamic import cannot, because the first frame would be gone
    before it resolved.

    Gated on `enabled`, so scrolling during the first four seconds cannot
    have the lines falling in and flying out at once.
  */
  useBeforePaint(() => {
    if (!enabled) return;

    const layers = present(layerRefs.current);
    const types = present(typeRefs.current);
    /* The stage is an ancestor in page.tsx, found by contract rather than by
       walking a fixed number of parents — the markup between the two is free
       to change without silently breaking the maths. */
    const stage = originRef.current?.closest<HTMLElement>(
      `[${stageAttribute}]`,
    );

    /* Requiring the full set keeps each line aligned with its own keyframe; a
       short array would silently shift every journey up by one. */
    if (
      !stage ||
      layers.length !== keyframes.length ||
      types.length !== keyframes.length
    ) {
      return;
    }

    const write = (progress: number) => {
      keyframes.forEach((keyframe, index) => {
        const x = lerp(keyframe.start.x, keyframe.end.x, progress);
        const y = lerp(keyframe.start.y, keyframe.end.y, progress);
        const rotation = lerp(
          keyframe.start.rotation,
          keyframe.end.rotation,
          progress,
        );
        /* translate3d rather than translate: it gives each line its own
           compositor layer, so scrolling repaints nothing. */
        layers[index].style.transform = `translate3d(${x}px, ${y}px, 0)`;
        types[index].style.transform = `rotate(${rotation}deg)`;
      });
    };

    const motion = window.matchMedia("(prefers-reduced-motion: no-preference)");
    let frame = 0;

    const update = () => {
      frame = 0;
      write(stageProgress(stage));
    };

    /* Coalesced to one write per frame. Scroll fires far more often than the
       screen repaints, and a rectangle read per event would be wasted work. */
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    const start = () => {
      if (!motion.matches) {
        /* Reduced motion: hold the start keyframe and listen to nothing. The
           lines are still placed, still readable, and never move. */
        write(0);
        return;
      }
      /* Once immediately, before paint, so a reload deep in the range starts
         correct rather than at zero and jumping. */
      update();
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onScroll);
    };

    const stop = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };

    start();
    /* Read live, so changing the system setting does not need a reload. */
    const onMotionChange = () => {
      stop();
      start();
    };
    motion.addEventListener("change", onMotionChange);

    return () => {
      stop();
      motion.removeEventListener("change", onMotionChange);
    };
  }, [enabled, keyframes, stageAttribute, layerRefs, typeRefs, originRef]);  /*
    Scroll flight: the lines travel from their `start` keyframe to their `end`
    one across the sticky stage.

    A third effect for the same reason parallax is a second one — the entrance
    owns a generation token and a microtask-deferred restore that exist to
    survive Strict Mode, and nothing else should have to reason about them.

    It writes to two layers and no others: `x`/`y` to layer 2, `rotation` to
    layer 5. The entrance owns layer 3, parallax owns layer 4, and placement
    owns layer 1. That separation is the whole reason the markup is five deep —
    two animations sharing one element means one folds into the other's matrix
    and the loser's contribution is lost.

    No GSAP here, deliberately, and this is the one effect in the file without
    it. The value is a straight function of a rectangle with no easing,
    timeline or tween involved, so a `style.transform` assignment does the same
    work. That also makes the effect synchronous, which is what lets it run
    before paint and settle the lines with no jump on a reload partway down the
    page — a dynamic import cannot, because the first frame would be gone
    before it resolved.

    Gated on `enabled`, so scrolling during the first four seconds cannot
    have the lines falling in and flying out at once.
  */
  useBeforePaint(() => {
    if (!enabled) return;

    const layers = present(layerRefs.current);
    const types = present(typeRefs.current);
    /* The stage is an ancestor in page.tsx, found by contract rather than by
       walking a fixed number of parents — the markup between the two is free
       to change without silently breaking the maths. */
    const stage = originRef.current?.closest<HTMLElement>(
      `[${stageAttribute}]`,
    );

    /* Requiring the full set keeps each line aligned with its own keyframe; a
       short array would silently shift every journey up by one. */
    if (
      !stage ||
      layers.length !== keyframes.length ||
      types.length !== keyframes.length
    ) {
      return;
    }

    const write = (progress: number) => {
      keyframes.forEach((keyframe, index) => {
        const x = lerp(keyframe.start.x, keyframe.end.x, progress);
        const y = lerp(keyframe.start.y, keyframe.end.y, progress);
        const rotation = lerp(
          keyframe.start.rotation,
          keyframe.end.rotation,
          progress,
        );
        /* translate3d rather than translate: it gives each line its own
           compositor layer, so scrolling repaints nothing. */
        layers[index].style.transform = `translate3d(${x}px, ${y}px, 0)`;
        types[index].style.transform = `rotate(${rotation}deg)`;
      });
    };

    const motion = window.matchMedia("(prefers-reduced-motion: no-preference)");
    let frame = 0;

    const update = () => {
      frame = 0;
      write(stageProgress(stage));
    };

    /* Coalesced to one write per frame. Scroll fires far more often than the
       screen repaints, and a rectangle read per event would be wasted work. */
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    const start = () => {
      if (!motion.matches) {
        /* Reduced motion: hold the start keyframe and listen to nothing. The
           lines are still placed, still readable, and never move. */
        write(0);
        return;
      }
      /* Once immediately, before paint, so a reload deep in the range starts
         correct rather than at zero and jumping. */
      update();
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onScroll);
    };

    const stop = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };

    start();
    /* Read live, so changing the system setting does not need a reload. */
    const onMotionChange = () => {
      stop();
      start();
    };
    motion.addEventListener("change", onMotionChange);

    return () => {
      stop();
      motion.removeEventListener("change", onMotionChange);
    };
  }, [enabled, keyframes, stageAttribute, layerRefs, typeRefs, originRef]);
}
