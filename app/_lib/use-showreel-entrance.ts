"use client";

import type { RefObject } from "react";
import { useEffect } from "react";

import {
  ENTRANCE_MS,
  PIXEL_CELL_SCALE,
  PIXEL_DOT_HOLD_MS,
  PIXEL_FADE_MS,
  PIXEL_MORPH_MS,
  PIXEL_REVEAL_MS,
  pixelOrder,
  type PixelGrid,
} from "@/app/_lib/showreel";

/**
 * The showreel's pixel entrance: the timeline that resolves the mask.
 *
 * Extracted from showreel.tsx, which was the largest file in the project and
 * was carrying this, the playback, the observers and the breadcrumb at once.
 * It is the same split hero-intro.tsx has with use-statement-flight — the
 * component keeps the markup and the state, the imperative animation lives
 * here — and nothing about the animation itself changed in the move.
 *
 * The full specification is docs/specs/SHOWREEL.md; the mechanics are
 * described in the comment below, which came across with the code.
 *
 * `onRevealed` replaces what was a direct `setRevealDone(true)`. Every one of
 * the routes out of the entrance called it with the same value, so the hook
 * does not need the setter — only a way to say "the mask is gone", which the
 * component turns back into state.
 */
export function useShowreelEntrance({
  gridRef,
  boxRef,
  canReveal,
  grid,
  onRevealed,
}: {
  /** The `<mask>` whose `<rect>` children are the animation targets. */
  gridRef: RefObject<SVGMaskElement | null>;
  /** The rectangle, measured so cells can be sized in pixels. */
  boxRef: RefObject<HTMLDivElement | null>;
  /** True once everything the entrance waits on has arrived. */
  canReveal: boolean;
  /** The mask arrangement, chosen from the rectangle's real shape. */
  grid: PixelGrid;
  /**
   * Called when the mask is finished with, by ANY route — the timeline
   * completing, a failed import, either watchdog, or this being cleaned up
   * mid-flight. Every one of them must leave the whole video showing.
   */
  onRevealed: () => void;
}) {
  /*
    The entrance.

      0 - 1300ms   cells fade in, centre outward, each as a CIRCLE and
                   nothing more
        then       each cell holds as a dot for 200ms
        then       each cell morphs from circle to square over 550ms, eased

    Per cell, not per grid: a cell's morph is timed from its own arrival, so
    the wave of dots and the wave of squares chase each other across the
    rectangle. Total 2050ms.

    That is the whole thing. A circle hold and a circle-to-rectangle morph of
    the container used to follow; both were removed on 7 September 2026, and
    with them the clip-path measurement and the Chrome two-value-inset
    workaround that the morph required.

    The video's container is masked, not covered. Cells begin at opacity 0, so
    the rectangle is transparent and the hero's gradient shows through it; they
    fade in and the film materialises out of the page. Nothing is painted over
    the video at any point, which is why there is no longer a cover colour to
    choose.

    Cells are driven straight on the DOM nodes: one tween over 144 elements
    with a per-element delay, so there is no React update per pixel and no
    animation frame loop of our own.

    The mask can never be left half-applied. Six routes end it — the timeline
    completing, a failed import, either watchdog, a project switch, and this
    effect being cleaned up mid-flight — and every one of them leaves the whole
    video showing.
  */
  useEffect(() => {
    if (!canReveal) return;
    const mask = gridRef.current;
    if (!mask) return;

    let cancelled = false;
    let running: { kill: () => void } | undefined;
    /* If the timeline never reports back, the video still arrives. */
    const watchdog = setTimeout(() => onRevealed(), ENTRANCE_MS + 1500);

    const cells = Array.from(mask.children) as SVGRectElement[];

    /*
      Cell geometry in objectBoundingBox units — fractions of the masked
      element, so none of this needs measuring and none of it changes on
      resize. Read back from the rendered attributes rather than recomputed, so
      there is exactly one definition of where a cell sits and it lives in
      showreel-pixels.tsx.
    */
    const slot = (cell: SVGRectElement) => ({
      x: cell.x.baseVal.value,
      y: cell.y.baseVal.value,
      width: cell.width.baseVal.value,
      height: cell.height.baseVal.value,
    });
    const finished = cells.map(slot);

    /*
      The start state: a true circle, centred in the cell.

      Sized in PIXELS and converted back, rather than taking half of each
      cell's own side. objectBoundingBox units are fractions of a box that is
      not square, so equal fractions are not equal lengths — and `pixelGrid`
      rounds its columns and rows to integers, which leaves cells up to about
      11% off square. Deriving `rx` and `ry` from the cell's own width and
      height fed that error straight into the shape: at 75-100px cells it read
      as a visible ellipse, taller or wider than round depending on the
      viewport.

      A circle needs equal PIXEL radii, so the diameter is taken from the
      shorter side of the cell and both axes are given that same length,
      converted back through the box's own dimensions. The rect is then square
      on screen whatever shape its cell is, and `rx`/`ry` at half of each side
      round it fully.

      `finished` still fills the cell exactly — the morph ends on a grid that
      tiles, and only the start is a circle.

      Grown rather than transformed. A `scale()` on an SVG element inside an
      objectBoundingBox mask has to reason about a non-uniform user space and a
      transform origin; animating the four geometry attributes has neither
      problem and is the same number of values GSAP would write anyway.
    */
    const box = boxRef.current?.getBoundingClientRect();
    const started = finished.map((slot) => {
      /* Without a measurable box there is nothing to correct against, so fall
         back to the cell's own proportions rather than dividing by zero. */
      const diameter =
        box && box.width > 0 && box.height > 0
          ? Math.min(slot.width * box.width, slot.height * box.height) *
            PIXEL_CELL_SCALE
          : 0;
      const width = diameter && box ? diameter / box.width : slot.width * PIXEL_CELL_SCALE;
      const height = diameter && box ? diameter / box.height : slot.height * PIXEL_CELL_SCALE;
      return {
        x: slot.x + (slot.width - width) / 2,
        y: slot.y + (slot.height - height) / 2,
        width,
        height,
        rx: width / 2,
        ry: height / 2,
      };
    });

    /**
     * Every cell at its finished state: square, exactly filling its slot, fully
     * opaque. The mask is then solid white and hides nothing, so the video is
     * whole whether or not the mask is still applied.
     *
     * This is what makes an interrupted run safe. The old cover had to be
     * removed from the DOM to stop hiding things; a mask only has to be
     * completed.
     */
    const finish = () => {
      cells.forEach((cell, index) => {
        const slot = finished[index];
        cell.setAttribute("x", String(slot.x));
        cell.setAttribute("y", String(slot.y));
        cell.setAttribute("width", String(slot.width));
        cell.setAttribute("height", String(slot.height));
        cell.setAttribute("rx", "0");
        cell.setAttribute("ry", "0");
        cell.setAttribute("opacity", "1");
        cell.style.removeProperty("will-change");
      });
    };

    const run = async () => {
      try {
        const { gsap } = await import("gsap");
        /* The import resolves on a later tick, by which time this effect may
           already have been cleaned up — Strict Mode guarantees it in
           development. Building the timeline then would animate nodes nothing
           is watching. */
        if (cancelled) return;

        gsap.set(cells, {
          opacity: 0,
          willChange: "opacity",
          attr: {
            x: (index: number) => started[index].x,
            y: (index: number) => started[index].y,
            width: (index: number) => started[index].width,
            height: (index: number) => started[index].height,
            rx: (index: number) => started[index].rx,
            ry: (index: number) => started[index].ry,
          },
        });

        const timeline = gsap.timeline({
          onComplete: () => {
            finish();
            onRevealed();
          },
        });

        /*
          Each cell's own delay, from its precomputed place in the order.
          Function-based, so the value is per element rather than a single
          distributed step. Both phases use it, which is what keeps a cell's
          morph tied to its own arrival rather than to the grid's.
        */
        const order = pixelOrder(grid.columns, grid.rows);
        const stagger = (cellIndex: number) =>
          (order[cellIndex] * (PIXEL_REVEAL_MS - PIXEL_FADE_MS)) / 1000;

        timeline
          /* Phase 1 — appear, as a circle. Shape is deliberately untouched
             here: the cell has to exist on screen as a circle before it is
             allowed to become anything else. */
          .to(
            cells,
            {
              opacity: 1,
              duration: PIXEL_FADE_MS / 1000,
              ease: "none",
              stagger,
            },
            0,
          )
          /*
            Phase 3 — circle to square. Radius and size move together, so the
            cell shrinks into its slot exactly as it loses its corners.

            Placed at an absolute time and given the SAME stagger, so every
            cell's morph begins exactly PIXEL_DOT_HOLD_MS after its own fade
            ends — phase 2 is that gap, and it exists rather than being
            animated. Eased rather than linear: this is the part worth
            watching.
          */
          .to(
            cells,
            {
              attr: {
                x: (index: number) => finished[index].x,
                y: (index: number) => finished[index].y,
                width: (index: number) => finished[index].width,
                height: (index: number) => finished[index].height,
                rx: 0,
                ry: 0,
              },
              duration: PIXEL_MORPH_MS / 1000,
              ease: "power2.inOut",
              stagger,
            },
            (PIXEL_FADE_MS + PIXEL_DOT_HOLD_MS) / 1000,
          );

        running = timeline;
      } catch {
        /* GSAP unavailable. Show the video rather than animating to it. */
        finish();
        onRevealed();
      }
    };

    void run();

    return () => {
      cancelled = true;
      clearTimeout(watchdog);
      /* kill(), not revert(): reverting would put the cells back to opacity 0
         and hide a video the visitor is already looking at. */
      running?.kill();
      /* Completed rather than removed. `revealDone` may still be false here —
         a scroll away mid-entrance — so the mask can outlive this effect, and
         a mask left part-applied would leave holes in the video. */
      finish();
    };
    /* `grid` belongs here: a change remounts the mask on its key, so these
       cells are gone and the entrance has to be built against the new ones. */
  }, [canReveal, grid, gridRef, boxRef, onRevealed]);
}
