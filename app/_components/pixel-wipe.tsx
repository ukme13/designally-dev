"use client";

import { useEffect, useRef, useState } from "react";

import { pixelGrid, type PixelGrid } from "@/app/_lib/showreel";
import { usePixelWipe } from "@/app/_lib/use-pixel-wipe";

/**
 * A pixel wipe across the boundary between two sections.
 *
 * Written to be used more than once. What changes per boundary is the COLOUR,
 * because the wipe has to match the section it hands over to — everything
 * about the motion is fixed in use-pixel-wipe.ts, so two boundaries using this
 * behave identically and only look different.
 *
 * ── Using it ─────────────────────────────────────────────────────────────
 *
 *   <section className="relative isolate bg-primary-300">
 *     <PixelWipe surface="bg-primary-300" />
 *     …
 *   </section>
 *
 * Three things the host section must do, none of which this can do for itself:
 *
 *   `relative`  gives the layer a positioning parent
 *   `isolate`   confines the layer's z-index, so a transition meant to cover
 *               this section cannot also cover the header
 *   the colour  `surface` should match the section's own background, so the
 *               finished cover is indistinguishable from the section arriving
 *
 * That last one is the whole trick, and it is why the wipe reaches UP past the
 * section rather than sitting over it: over a matching background it would be
 * invisible, and the section above is the only place it can be seen.
 *
 * Dots grow along the boundary between the two sections, row by row from the
 * bottom up, in two interleaved lattices that fill each other's gaps until the
 * cover is solid — which the page's own scroll then carries away as the orange
 * section arrives underneath. Scrubbed directly to scroll position, so
 * scrolling back up runs it backwards and a still page leaves it still. No
 * autoplay, no loop.
 *
 * **The pixels never move, and nothing here is revealed.** Two earlier versions
 * got this wrong in opposite directions. Rising up and OUT to uncover the
 * section could not help showing what was behind the layer — which is the cream
 * section, not the orange one. Flying up and IN put the cells on a translation
 * of their own while the layer was already scrolling with the page, so they
 * slid against the section beneath and the bottom row clipped on the layer's
 * edge. Growing in place has neither problem: the upward movement is the
 * stagger, not a transform. See use-pixel-wipe.ts.
 *
 * **Nothing fades.** A cell is invisible because it has no size and gone
 * because it has left the clipped box — opacity is set once and never animated.
 * Scaling and moving a cover reads as material; fading it reads as a veil.
 *
 * ── The knobs ────────────────────────────────────────────────────────────
 *   per boundary    the `surface`, `lift` and `density` props
 *   grid            measured; PIXEL_COLUMNS/ROWS are only the fallback
 *   everything else use-pixel-wipe.ts
 * ─────────────────────────────────────────────────────────────────────────
 *
 * **One grid does both halves, and that is deliberate.** The circle is not a
 * separate element that cross-fades into pixels — it is the same cells, grown
 * from the centre outward while still round. So there is no seam between the
 * two phases, and the language matches the hero's video reveal, which is also
 * cells that begin as circles.
 *
 * **An offset lattice is what covers.** A single grid of circles inscribed in
 * their cells touches at the edges but leaves a gap at every corner. A second
 * grid shifted half a cell puts a circle ON each of those corners — twice the
 * density, and the deepest uncovered point moves to a cell edge, which an
 * inscribed radius already reaches. So the cover is solid without the circles
 * having to become squares, which is what an earlier version did.
 *
 * **Nothing here is random.** The stagger is by ROW, from the bottom up, so a
 * whole row arrives together and the wave travels straight upward. It comes
 * from GSAP's grid stagger, given the real column and row counts.
 *
 * **The cells are rendered invisible and JavaScript makes them visible**, which
 * is the opposite of the usual arrangement and the only safe way round for an
 * element that covers content. A visitor with no JavaScript, a failed import,
 * or reduced motion all see nothing at all rather than a permanent orange
 * rectangle over the section.
 *
 * Lenis needs no wiring — it animates the browser's real scroll position, so
 * ScrollTrigger reads the numbers it always does.
 */

/**
 * The grid, before anything has been measured.
 *
 * Only a starting point, and sized to WIPE_TARGET_CELLS. The real arrangement
 * comes from `pixelGrid` against the layer's own shape — the same function the
 * showreel's mask uses, for the same reason: a FIXED column and row count only
 * makes square cells in one screen shape. At 20 x 8 on a 21:9 monitor every
 * "circle" was a tall ellipse, and on a phone it would be a wide one.
 *
 * Cells are animated directly on the DOM node — one tween over all of them
 * with a per-element stagger, so there is no React update per pixel and no
 * animation frame loop of our own.
 */
const PIXEL_COLUMNS = 24;
const PIXEL_ROWS = 12;

/**
 * How far the wipe reaches ABOVE the section it belongs to, by default.
 *
 * A full screen, so the layer's bottom edge lands exactly on the section's top
 * edge and none of it overlaps the section it is a transition into. At half a
 * screen it covered the heading, which is the one thing a transition must not
 * do.
 *
 * A Tailwind class rather than a number so it can use `svh`, the unit sections
 * are measured in. Override it where a boundary needs a different reach.
 */
const DEFAULT_LIFT = "-top-[100svh]";

/**
 * Roughly how many cells the wipe aims for, whatever shape it has to fill.
 *
 * Double the showreel mask's 144. The mask covers a video rectangle and its
 * cells want to read as visible pixels; this covers a whole screen, where the
 * same count gives circles big enough to look like a polka dot. Denser reads as
 * a wipe rather than a pattern.
 *
 * Passed to `pixelGrid` rather than changed at its source, because that
 * constant is the showreel's and this is not the showreel.
 */
const DEFAULT_DENSITY = 288;

type PixelWipeProps = {
  /**
   * The wipe's colour, as a Tailwind background utility.
   *
   * Should match the host section's own background — see the note above. A
   * token, like every other colour on the site; no raw values here.
   */
  surface: string;
  /** How far it reaches above the section. Defaults to a full screen. */
  lift?: string;
  /** Roughly how many cells. Higher is denser and smaller. */
  density?: number;
};

export default function PixelWipe({
  surface,
  lift = DEFAULT_LIFT,
  density = DEFAULT_DENSITY,
}: PixelWipeProps) {
  const layerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const offsetGridRef = useRef<HTMLDivElement>(null);

  /*
    The arrangement whose cells come closest to square in this layer's shape.

    Measured rather than assumed, and re-measured on resize: the layer is a full
    viewport, so its aspect is the screen's, and that varies more than any
    single pair of counts can serve. `pixelGrid` holds the cell count roughly
    constant and varies the layout, which is what keeps the wipe reading the
    same on a phone as on a monitor.
  */
  const [grid, setGrid] = useState<PixelGrid>({
    columns: PIXEL_COLUMNS,
    rows: PIXEL_ROWS,
  });

  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;

    const measure = () => {
      const { width, height } = layer.getBoundingClientRect();
      if (width <= 0 || height <= 0) return;
      const next = pixelGrid(width / height, density);
      /* Replaced only when it actually changes, so a resize drag does not
         remount the grid on every frame. */
      setGrid((current) =>
        current.columns === next.columns && current.rows === next.rows
          ? current
          : next,
      );
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(layer);
    return () => observer.disconnect();
    /* `density` belongs here now that it is a prop: changing it changes the
       arrangement, so the layer has to be measured again against it. */
  }, [density]);

  /* The movement itself — both phases, both staggers, the scroll binding — is
     in use-pixel-wipe.ts. */
  usePixelWipe({
    layerRef,
    gridRef,
    offsetGridRef,
    columns: grid.columns,
    rows: grid.rows,
  });

  return (
    <div
      ref={layerRef}
      aria-hidden="true"
      /*
        The stage. `h-svh` so the wipe is the size of the screen it covers, and
        `overflow-hidden` so a pixel travelling upward cannot widen the page —
        `yPercent` moves it outside this box, and without the clip that becomes
        a scrollbar.
      */
      className={`pointer-events-none absolute inset-x-0 z-10 h-svh overflow-hidden ${lift}`}
    >
      {/*
        The primary lattice: one circle per cell, filling the layer exactly.
      */}
      <div
        ref={gridRef}
        className="absolute inset-0 grid"
        style={{
          /* Expressed here rather than in classes because both counts are
             measured at runtime and Tailwind cannot read them. */
          gridTemplateColumns: `repeat(${grid.columns}, 1fr)`,
          gridTemplateRows: `repeat(${grid.rows}, 1fr)`,
        }}
      >
        {Array.from({ length: grid.columns * grid.rows }, (_, cell) => (
          <div
            key={cell}
            /* `opacity-0` is the state the server sends. GSAP writes an inline
               opacity over it; nothing else ever paints this. */
            className={`size-full rounded-full opacity-0 ${surface}`}
          />
        ))}
      </div>

      {/*
        The offset lattice: a circle on every CORNER of the primary one. That is
        what doubles the density without halving the cell size, and it moves the
        deepest uncovered point from a cell corner to a cell edge — which is why
        CELL_FILL can be as low as it is. See use-pixel-wipe.ts.

        **It is bigger than the layer, by one cell in each direction, and hangs
        half a cell off every edge.** A version that simply translated a
        same-sized grid inward left the left and top edges bare: the corners
        along those edges have no offset circle, because the offset grid started
        half a cell inside them. Growing it instead puts a circle on every
        corner including the ones on the boundary, and the overhang is clipped
        by the layer.

        Sized and positioned rather than transformed, deliberately — this keeps
        `transform` free, and GSAP owns the cells' transforms outright.
      */}
      <div
        ref={offsetGridRef}
        className="absolute grid"
        style={{
          gridTemplateColumns: `repeat(${grid.columns + 1}, 1fr)`,
          gridTemplateRows: `repeat(${grid.rows + 1}, 1fr)`,
          /* One extra cell of size, half of it hanging off each edge. The
             arithmetic keeps every cell the same size as the primary grid's:
             width / (columns + 1) reduces to layer width / columns. */
          left: `${-50 / grid.columns}%`,
          top: `${-50 / grid.rows}%`,
          width: `${(100 * (grid.columns + 1)) / grid.columns}%`,
          height: `${(100 * (grid.rows + 1)) / grid.rows}%`,
        }}
      >
        {Array.from(
          { length: (grid.columns + 1) * (grid.rows + 1) },
          (_, cell) => (
            <div
              key={cell}
              className={`size-full rounded-full opacity-0 ${surface}`}
            />
          ),
        )}
      </div>
    </div>
  );
}
