"use client";

import type { RefObject } from "react";
import { useEffect } from "react";

/**
 * Drives the pixel wipe between two sections, scrubbed to scroll position.
 *
 * Extracted from pixel-circle-section-transition.tsx, which keeps the grid and
 * its markup — the split every animated component here has with its hook. The
 * component says what the wipe IS; this says how it moves.
 *
 * ── The knobs ────────────────────────────────────────────────────────────
 *   per-cell pace   CELL_DURATION
 *   how much it fills  CELL_FILL
 *   the wave's pace ROWS_IN_FLIGHT
 *   its direction   WAVE
 *   when it runs    TRANSITION_START and TRANSITION_END
 * ─────────────────────────────────────────────────────────────────────────
 *
 * **`scrub: true` and nothing else.** The timeline has no life of its own — its
 * playhead is the scroll position, so scrolling up runs it backwards and a
 * still page leaves it still. Nothing autoplays and nothing repeats.
 *
 * **The stagger is a GSAP grid stagger**, given the real column and row counts,
 * so nothing here is random. `axis: "y"`, `from: "end"` orders cells by ROW from
 * the bottom, so a whole row moves together and the wave travels straight up.
 *
 * **Reduced motion builds nothing.** The cells are rendered `opacity-0`, so an
 * absent timeline leaves them invisible and the section beneath untouched. That
 * is also what a failed import and a no-JavaScript visit produce: this element
 * covers content, so its safe state has to be the invisible one.
 */

/**
 * One act per cell: the dot grows, and keeps growing past its own cell.
 *
 * Staggered by ROW from the bottom up, and the pace of that stagger is what
 * makes the wipe read as a wave rather than a fog — see ROWS_IN_FLIGHT.
 *
 * **Two grids, the second on the first's corners.** It lands a circle on every
 * corner intersection, which both doubles the density and moves the deepest
 * uncovered point from a cell CORNER to a cell EDGE — see CELL_FILL. It is one
 * cell larger in each direction, so it has circles on the corners that sit on
 * the layer's own edges too; the component explains why.
 *
 * Its wave runs half a row-step ahead of the primary grid, because its rows sit
 * half a cell lower and a bottom-up wave should reach them first. Its stagger is
 * told its own shape, which is one more row and column than the primary's.
 *
 * **NOTHING TRANSLATES, and that is deliberate.** An earlier version flew the
 * cells up into place, and it went wrong twice over: the layer already scrolls
 * with the page at 1:1, so any `yPercent` of its own made the cells slide
 * against the section beneath — a parallax where the two should be locked — and
 * a cell pushed past the layer's edge got clipped, so the bottom row was never
 * flush.
 *
 * The upward movement is carried by the STAGGER instead. Rows arrive from the
 * bottom up, which reads as a rising wave without a single pixel leaving its
 * cell. Cheaper, and it cannot drift out of register with the section because
 * there is nothing to drift.
 *
 * The act is not placed at an absolute fraction of the scroll any more. The
 * timeline's total is however long the stagger makes it, and `scrub` maps that
 * onto the range — so the constants describe the animation's own proportions and
 * the scroll decides how much of the screen they take.
 */
/** How long ONE cell takes to grow, and then to square off, in timeline units. */
const CELL_DURATION = 0.5;

/**
 * How many rows are mid-animation at any moment.
 *
 * This is the knob that decides whether the wipe reads as a wave or as a fog.
 * The row step is `CELL_DURATION / ROWS_IN_FLIGHT`, so a small number means each
 * row is nearly finished before the next begins, and a large one means the whole
 * grid is growing at once.
 *
 * It was effectively 14 before — a raw 0.035 step against a 0.5 duration — and
 * every row on the screen was part-grown simultaneously, which is why nothing
 * read as travelling. At 4 there is a visible band of activity moving upward
 * with settled rows behind it and untouched rows ahead.
 */
const ROWS_IN_FLIGHT = 4;

/** The step between one row starting and the next. Derived, never set directly. */
const ROW_STEP = CELL_DURATION / ROWS_IN_FLIGHT;

/**
 * How far past its own cell a circle grows.
 *
 * **1.2, and the reason it can be this low is the offset grid.** With one grid
 * alone, four circles inscribed in four cells touch at the edges but leave a
 * gap at the corner between them; closing that needs a scale of `sqrt(2)` —
 * 1.414 — because the corner sits `sqrt(2)/2` of a cell from the centre while
 * an inscribed radius is only `1/2`.
 *
 * The second grid puts a circle ON every one of those corners, so the deepest
 * uncovered point moves to the middle of a cell edge — which the inscribed
 * radius already reaches exactly. Coverage is therefore complete at a scale of
 * 1, and anything above it is overlap rather than necessity.
 *
 * 1.2 is chosen for how it looks, then: enough overlap that the cover is solid
 * with margin, little enough that the leading edge still reads as distinct
 * circles rather than a blur.
 *
 * The circles at the layer's edges overflow it and are clipped, which is what
 * covers the very corners of the layer.
 */
const CELL_FILL = 1.2;

/**
 * Every act staggers by ROW, from the bottom up.
 *
 * `axis: "y"` is the load-bearing part: it makes the stagger depend on a cell's
 * row and nothing else, so a whole row moves together and the wave travels
 * straight up. `from: "end"` starts it at the bottom row — which is the
 * section's own top edge, the boundary this is a transition across.
 *
 * A radial stagger from bottom-centre was tried and looked wrong: the outer
 * columns lagged so far behind the middle that the pattern read as a spreading
 * diamond rather than a rising wave. Radial is right for the showreel's mask,
 * which fills a rectangle from its middle; this one has a direction.
 */
const WAVE = { axis: "y", from: "end" } as const;

/**
 * When the wipe runs, in ScrollTrigger's "<edge> <viewport position>" syntax.
 *
 * `START_LEAD` pushes the start earlier by that many pixels, so the first rows
 * of dots appear while the boundary is still below the fold. Without it the
 * wave began exactly as the hard edge between the two sections came into view,
 * and you watched it start rather than finding it already under way.
 *
 * Both measured from the layer's BOTTOM, which is exactly the target section's
 * top edge — so the wipe starts as that edge appears at the foot of the screen
 * and finishes as it reaches the MIDDLE of it. Half a screen of scrolling, all
 * of it spent looking at the boundary, and the cover is complete while the
 * section's heading is still below the fold.
 *
 * `top bottom` was wrong for the same reason: the layer sits a full screen above
 * the section, so measuring from its top fired the transition a screen early,
 * before there was anything to transition to.
 */
const START_LEAD = 100;
const TRANSITION_START = `bottom bottom+=${START_LEAD}`;
const TRANSITION_END = "bottom center";

export function usePixelWipe({
  layerRef,
  gridRef,
  offsetGridRef,
  columns,
  rows,
}: {
  /** The stage. Also what ScrollTrigger measures. */
  layerRef: RefObject<HTMLDivElement | null>;
  /** The grid whose children are the pixels. */
  gridRef: RefObject<HTMLDivElement | null>;
  /** The same grid again, shifted half a cell, sitting on the first's corners. */
  offsetGridRef: RefObject<HTMLDivElement | null>;
  /** The grids' real shape, so the staggers can be told about it. */
  columns: number;
  rows: number;
}) {
  useEffect(() => {
    const layer = layerRef.current;
    const grid = gridRef.current;
    const offsetGrid = offsetGridRef.current;
    if (!layer || !grid || !offsetGrid) return;

    const primaryCells = Array.from(grid.children) as HTMLElement[];
    const offsetCells = Array.from(offsetGrid.children) as HTMLElement[];
    const cells = [...primaryCells, ...offsetCells];
    if (cells.length === 0) return;

    /* Read once, here. Nothing below animates under reduced motion, so there is
       nothing to keep watching for — and the cells stay invisible, which is the
       state that leaves the section beneath it alone. */
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let cancelled = false;
    let revert: (() => void) | undefined;

    const run = async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);

      /* The imports resolve on a later tick, by which time this effect may
         already have been cleaned up — Strict Mode guarantees it in
         development. A stale resolution must build no timeline, or the second
         mount runs two of them over the same cells. */
      if (cancelled) return;

      gsap.registerPlugin(ScrollTrigger);

      /*
        Scaled to nothing. Roundness is a class now, not a property GSAP owns —
        nothing animates it any more, so `rounded-full` on the cell is the
        simpler and more honest place for it.

        `opacity: 1` is SET, never animated. The cells are rendered `opacity-0`
        so that an absent timeline leaves them invisible — but nothing here
        fades: a cell is invisible because it has no size. Fading a cover in
        reads as a veil; scaling it reads as material.

        Written by GSAP rather than by a class so GSAP owns every property it
        touches. A Tailwind `scale-0` would be especially wrong: Tailwind v4
        writes the standalone `scale` property while GSAP writes `transform`,
        and the two would multiply.
      */
      gsap.set(cells, { opacity: 1, scale: 0 });

      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: layer,
          start: TRANSITION_START,
          end: TRANSITION_END,
          /* The playhead IS the scroll position. */
          scrub: true,
          invalidateOnRefresh: true,
        },
      });

      /* Each lattice's own shape. The offset one is one larger in both
         directions — see the component — and a stagger told the wrong shape
         computes the wrong row for every cell after the first line. */
      const primaryShape = [rows, columns] as [number, number];
      const offsetShape = [rows + 1, columns + 1] as [number, number];

      /*
        The whole animation, once per grid: dots open bottom row first and
        overgrow their cells until their neighbours meet. The leading edge of
        the wave stays visibly circular while everything behind it is solid.

        Two tweens rather than one, because a grid stagger needs a rectangular
        shape to measure and two interleaved lattices are not one rectangle.
        The offset grid goes FIRST — half a row-step earlier — since its rows
        sit half a cell lower and a wave travelling up should reach them before
        the primary grid's.
      */
      const open = (
        targets: HTMLElement[],
        shape: [number, number],
        position: number,
      ) => {
        timeline.to(
          targets,
          {
            scale: CELL_FILL,
            duration: CELL_DURATION,
            ease: "none",
            stagger: { each: ROW_STEP, grid: shape, ...WAVE },
          },
          position,
        );
      };

      open(offsetCells, offsetShape, 0);
      open(primaryCells, primaryShape, ROW_STEP / 2);

      revert = () => {
        timeline.scrollTrigger?.kill();
        timeline.kill();
        /* Whatever state the wipe was in, the cells go back to invisible — the
           stylesheet's own `opacity-0` governs them again. */
        gsap.set(cells, { clearProps: "all" });
      };
    };

    /* A failed import must leave the section visible, which the cells' own
       `opacity-0` already does — there is simply nothing to undo. */
    void run().catch(() => undefined);

    return () => {
      cancelled = true;
      revert?.();
    };
  }, [layerRef, gridRef, offsetGridRef, columns, rows]);
}
