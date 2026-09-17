"use client";

import type { RefObject } from "react";
import { useEffect } from "react";

import { pixelGrid } from "@/app/_lib/showreel";

/**
 * Draws the pixel wipe between two sections, scrubbed to scroll position.
 *
 * The component says what the wipe IS — its layer, its colour, where it sits;
 * this says how it moves and paints it.
 *
 * ── The knobs ────────────────────────────────────────────────────────────
 *   per-cell pace      CELL_DURATION
 *   how much it fills  CELL_FILL
 *   the wave's pace    ROWS_IN_FLIGHT
 *   when it runs       START_LEAD_VH and SECTION_FILL_VH
 *   how many circles   DEFAULT_DENSITY and COMPACT_DENSITY
 * ─────────────────────────────────────────────────────────────────────────
 *
 * **Drawn on ONE canvas, as of 17 September 2026.** It used to be hundreds of
 * DOM elements — up to 683 circles per wipe on a desktop — each given a new
 * `transform` by GSAP on every scroll frame. The animation maths was trivial;
 * the cost was the browser restyling and repainting that many rounded shapes
 * sixty times a second, and it read as stutter. A canvas turns that into one
 * paint per frame of a single path.
 *
 * It also removes two faults the DOM version had, rather than working around
 * them:
 *
 *   - **The load-time freeze.** Its cleanup cleared every cell's inline style
 *     through GSAP, which re-read each cell's computed transform afterwards —
 *     one forced layout per cell, about six seconds on a phone. There are no
 *     per-cell styles here to clear.
 *   - **The rebuild on resize.** The grid was React state, so settling it
 *     re-rendered hundreds of elements and tore the timeline down to build it
 *     again. Here a resize just re-measures and redraws.
 *
 * **The motion is unchanged, and reproduced exactly rather than approximated.**
 * It was a GSAP timeline of two grid-staggered tweens. GSAP now only reports
 * scroll progress; the per-row scale is computed here with GSAP's own stagger
 * formula — see `rowDelay` — so the wave keeps its pace.
 *
 * **`scrub: true` in effect, still.** Progress IS the scroll position: scrolling
 * up runs it backwards and a still page leaves it still. Nothing autoplays and
 * nothing repeats.
 *
 * **Reduced motion draws nothing, and so does every failure.** The canvas starts
 * transparent, so an absent import, no JavaScript, or reduced motion all leave
 * the section beneath untouched. This element covers content, so its safe state
 * has to be the invisible one.
 */

/**
 * One act per cell: the dot grows, and keeps growing past its own cell.
 *
 * Staggered by ROW from the bottom up, and the pace of that stagger is what
 * makes the wipe read as a wave rather than a fog — see ROWS_IN_FLIGHT.
 *
 * **Two lattices, the second on the first's corners.** It lands a circle on
 * every corner intersection, which both doubles the density and moves the
 * deepest uncovered point from a cell CORNER to a cell EDGE — see CELL_FILL. It
 * is one cell larger in each direction, so it has circles on the corners along
 * the layer's own edges too.
 *
 * Its wave runs half a row-step ahead of the primary lattice, because its rows
 * sit half a cell lower and a bottom-up wave should reach them first.
 *
 * **NOTHING TRANSLATES, and that is deliberate.** An earlier version flew the
 * cells up into place, and it went wrong twice over: the layer already scrolls
 * with the page at 1:1, so any movement of its own made the cells slide against
 * the section beneath, and a cell pushed past the layer's edge got clipped, so
 * the bottom row was never flush. The upward movement is carried by the
 * STAGGER — rows arrive from the bottom up — without a single circle leaving
 * its cell.
 */
/** How long ONE cell takes to grow, in timeline units. */
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

/** The stagger's `each`. Derived, never set directly. */
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
 * When a row of circles starts growing, in timeline units.
 *
 * **This is GSAP's grid stagger reproduced exactly**, not an approximation of
 * it. The DOM version used `stagger: { each: ROW_STEP, grid: [rows, columns],
 * axis: "y", from: "end" }`, and the installed `distribute()` in gsap-core.js
 * resolves that to
 *
 *     delay(row) = each × rowCount × (rowCount − 1 − row) / (rowCount − 1)
 *
 * — the bottom row at 0 and the top at `each × rowCount`. Note that the spread
 * is `each × rowCount`, NOT `each × (rowCount − 1)`: the gap between rows is
 * slightly more than `each`. A hand-written `row × each` would have quietly
 * changed the wave's pace, so this was read from the source rather than
 * assumed.
 *
 * `axis: "y"` means every circle in a row shares one delay, which is why the
 * scale below is worked out per row rather than per circle.
 */
const rowDelay = (row: number, rowCount: number) =>
  rowCount > 1
    ? (ROW_STEP * rowCount * (rowCount - 1 - row)) / (rowCount - 1)
    : 0;

/**
 * When the wipe runs, in ScrollTrigger's "<edge> <viewport position>" syntax.
 *
 * Both are measured from the layer's BOTTOM, which is exactly the target
 * section's top edge, and both are a PERCENTAGE OF THE VIEWPORT — so the
 * transition occupies the same fraction of a screen on every device.
 *
 * **Percentages rather than pixels, changed 16 September 2026.** The lead used
 * to be a flat `100px`: about a ninth of a short laptop screen and a
 * twentieth of a tall desktop one, so the wave began at a different point in
 * the scroll at every size. ScrollTrigger resolves a `%` in this position
 * against the scroller's own size (`_parsePosition` in the installed
 * ScrollTrigger.js), and its `_keywords` map `center` to exactly 0.5 — so the
 * previous `bottom center` was `bottom 50%`, and the two figures below are
 * directly comparable to what they replaced.
 *
 * `START_LEAD_VH` begins the wave while the boundary is still below the fold,
 * so it is already under way when it comes into view rather than starting in
 * front of the reader. At 20 the transition spans 95% of a screen, so the
 * stagger is scrubbed across nearly a full viewport of scrolling.
 *
 * `SECTION_FILL_VH` is how much of the screen the arriving section fills when
 * the cover is complete. **At 75 the transition spans 85% of a screen, against
 * roughly 60% before**, so the same stagger is scrubbed across noticeably more
 * scrolling and the wave reads slower. That is the knob for this: lower it
 * toward 50 to finish earlier and move faster, raise it to draw the boundary
 * out further.
 *
 * The cover now completes with the section's heading likely on screen rather
 * than below the fold, which is the visible consequence of finishing later.
 *
 * `top bottom` is wrong for a different reason: the layer sits a full screen
 * above the section, so measuring from its top fires the transition a screen
 * early, before there is anything to transition to.
 */
/** How far below the fold the wave begins, as a percentage of the viewport. */
const START_LEAD_VH = 20;
/** How much of the screen the arriving section fills when the cover is done. */
const SECTION_FILL_VH = 75;

const TRANSITION_START = `bottom ${100 + START_LEAD_VH}%`;
const TRANSITION_END = `bottom ${100 - SECTION_FILL_VH}%`;

/**
 * Roughly how many cells the wipe aims for, whatever shape it has to fill.
 *
 * Double the showreel mask's 144. The mask covers a video rectangle and its
 * cells want to read as visible pixels; this covers a band of the screen, where
 * the same count gives circles big enough to look like a polka dot. Denser
 * reads as a wipe rather than a pattern.
 *
 * Passed to `pixelGrid` rather than changed at its source, because that
 * constant is the showreel's and this is not the showreel.
 */
const DEFAULT_DENSITY = 288;

/**
 * The count used when the layer is narrow, which in practice means a phone.
 *
 * Fewer, bigger circles, for the reason the showreel has
 * `PIXEL_TARGET_CELLS_COMPACT`: a count tuned for a monitor puts the same
 * number of cells across a 390px screen, so each lands at roughly 24px and the
 * wave reads as grain. At 120 a phone resolves to about 11x12, nearer 35px.
 *
 * Chosen from the layer's measured width rather than a breakpoint, because
 * this layer's shape comes from the viewport, not from a container query.
 */
const COMPACT_DENSITY = 120;

/** Layer widths below this use the compact count, in CSS pixels. */
const COMPACT_MAX_PX = 480;

export function usePixelWipe({
  layerRef,
  canvasRef,
  colourRef,
  surface,
  density,
}: {
  /** The stage. What is measured, and what ScrollTrigger watches. */
  layerRef: RefObject<HTMLDivElement | null>;
  /** Where the circles are drawn. Fills the stage exactly. */
  canvasRef: RefObject<HTMLCanvasElement | null>;
  /**
   * A hidden element carrying the `surface` class, read once for its colour.
   *
   * A canvas needs a real colour and `surface` is a Tailwind utility, so the
   * browser resolves the token for us. One read per setup, never per frame.
   */
  colourRef: RefObject<HTMLElement | null>;
  /** The `surface` class itself — here so a change re-reads the colour. */
  surface: string;
  /** Roughly how many cells; unset, it is chosen from the measured width. */
  density?: number;
}) {
  useEffect(() => {
    const layer = layerRef.current;
    const canvas = canvasRef.current;
    const probe = colourRef.current;
    if (!layer || !canvas || !probe) return;

    /* Read once. Nothing animates under reduced motion, so there is nothing to
       keep watching for — and an untouched canvas is transparent. */
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    /* Resolved from the token by the browser. The wipes use plain hex tokens,
       so this comes back as `rgb(...)`, which every canvas accepts. */
    const colour = getComputedStyle(probe).backgroundColor;

    let width = 0;
    let height = 0;
    let columns = 0;
    let rows = 0;
    let progress = 0;
    /* What the canvas currently shows. A scroll event that does not move the
       progress repaints nothing. `NaN` never equals anything, so the next draw
       always happens after a measure. */
    let painted = Number.NaN;

    /*
      The layer's size, the grid that fits it, and a backing store to match.

      Assigning `canvas.width` clears the canvas and resets its transform, so
      both are re-established here and `painted` is invalidated.

      Returns whether there was anything to measure — a layer with no size
      (still laying out, or hidden) is simply not drawn.
    */
    const measure = () => {
      const w = layer.clientWidth;
      const h = layer.clientHeight;
      if (!w || !h) return false;

      /* Capped at 2, as the showreel's canvas is: a 3x backing store costs
         more than it shows at this scale. */
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * ratio);
      canvas.height = Math.round(h * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);

      width = w;
      height = h;
      /* An explicit prop wins at every size; otherwise a phone gets fewer and
         bigger circles than a monitor. */
      const target =
        density ?? (w < COMPACT_MAX_PX ? COMPACT_DENSITY : DEFAULT_DENSITY);
      ({ columns, rows } = pixelGrid(w / h, target));
      painted = Number.NaN;
      return true;
    };

    /*
      One frame of the wipe, at progress `p` through the scroll range.

      Every circle goes into ONE path and is filled once. They are all the same
      colour, and overlapping ellipses traced in the same direction fill as
      their union under the default non-zero rule, so batching changes nothing
      that can be seen and saves hundreds of fills.
    */
    const draw = (p: number) => {
      if (p === painted || !columns || !rows) return;
      painted = p;

      context.clearRect(0, 0, width, height);
      if (p <= 0) return;

      /* The timeline's length, as GSAP computed it: the offset lattice is the
         longer tween, starting at 0 with its top row delayed by
         `ROW_STEP × (rows + 1)`. */
      const total = ROW_STEP * (rows + 1) + CELL_DURATION;
      const time = p * total;

      const cellWidth = width / columns;
      const cellHeight = height / rows;
      /* Inscribed in the cell, as `rounded-full` on a `size-full` box was. The
         grid is chosen to keep cells square, so these are circles; if a shape
         ever defeats the search they stay ellipses, exactly as before. */
      const radiusX = cellWidth / 2;
      const radiusY = cellHeight / 2;

      context.fillStyle = colour;
      context.beginPath();

      /*
        A lattice of `across` × `down` circles whose first centre sits at
        (`left`, `top`), starting `start` into the timeline.
      */
      const lattice = (
        across: number,
        down: number,
        left: number,
        top: number,
        start: number,
      ) => {
        for (let row = 0; row < down; row++) {
          const local = time - start - rowDelay(row, down);
          if (local <= 0) continue;
          /* `ease: "none"` — linear from nothing to CELL_FILL. */
          const scale = CELL_FILL * Math.min(1, local / CELL_DURATION);
          const rx = radiusX * scale;
          const ry = radiusY * scale;
          const y = top + row * cellHeight;
          for (let column = 0; column < across; column++) {
            const x = left + column * cellWidth;
            /* Without the moveTo, each ellipse would be joined to the last by a
               straight line, and the fill would include the joins. */
            context.moveTo(x + rx, y);
            context.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
          }
        }
      };

      /*
        The offset lattice first — one larger each way, its centres on the
        primary's corners, so its first centre is the layer's own top-left
        corner. It starts at 0.
      */
      lattice(columns + 1, rows + 1, 0, 0, 0);
      /* The primary lattice: centres half a cell in, half a row-step later. */
      lattice(columns, rows, cellWidth / 2, cellHeight / 2, ROW_STEP / 2);

      /* The canvas's own bounds are the clip, so circles overhanging the edges
         are cut exactly as the old `overflow-hidden` cut them. */
      context.fill();
    };

    let cancelled = false;
    let teardown: (() => void) | undefined;

    const run = async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);

      /* The imports resolve on a later tick, by which time this effect may
         already have been cleaned up — Strict Mode guarantees it in
         development. A stale resolution must build nothing. */
      if (cancelled) return;

      gsap.registerPlugin(ScrollTrigger);
      measure();

      /*
        GSAP's only job now: report where the scroll is between START and END.
        With no animation attached there is nothing to scrub, so `onUpdate`
        hands the raw progress straight to `draw` — the same mapping
        `scrub: true` gave the timeline.
      */
      const trigger = ScrollTrigger.create({
        trigger: layer,
        start: TRANSITION_START,
        end: TRANSITION_END,
        onUpdate: (self) => {
          progress = self.progress;
          draw(progress);
        },
        onRefresh: (self) => {
          progress = self.progress;
          draw(progress);
        },
      });
      progress = trigger.progress;
      draw(progress);

      /*
        A resize re-measures and redraws — nothing is rebuilt. ScrollTrigger
        recalculates its own start and end on resize, and reports the new
        progress through `onRefresh`.
      */
      const observer = new ResizeObserver(() => {
        if (measure()) draw(progress);
      });
      observer.observe(layer);

      teardown = () => {
        observer.disconnect();
        trigger.kill();
        /* A pure write: nothing here is read back. */
        context.clearRect(0, 0, width, height);
      };
    };

    /* A failed import leaves the canvas transparent, which is already the safe
       state — there is simply nothing to undo. */
    void run().catch(() => undefined);

    return () => {
      cancelled = true;
      teardown?.();
    };
  }, [layerRef, canvasRef, colourRef, surface, density]);
}
