import type { Ref } from "react";

import { SHOWREEL_MASK_ID, type PixelGrid } from "@/app/_lib/showreel";

/**
 * The pixel mask the showreel's entrance reveals the video through.
 *
 * No state and no logic: it renders the cells and hands back a ref to the
 * `<mask>` itself, and the reveal drives their opacity and geometry directly
 * through GSAP — 144 React updates per frame is not a thing anyone should
 * build.
 *
 * This was an opaque cover sitting ON TOP of the video until 7 September 2026,
 * dissolving away to expose it. Inverting it — masking the video's own
 * container so the film materialises out of the page — removed the problem
 * that a cover has and a mask does not: an overlay must be painted some
 * colour, and no colour matches a background that is a gradient.
 *
 * `maskContentUnits="objectBoundingBox"` is what keeps this free of
 * measurement. Coordinates are fractions of whatever the masked element turns
 * out to be, so there is no `getBoundingClientRect`, no resize listener and
 * nothing to recompute when the viewport changes.
 *
 * That is also why the GRID has to be given rather than fixed. Fractions of a
 * 16:9 box make square cells at 16 x 9; fractions of the portrait box the
 * showreel fills on mobile would make tall rectangles, and every "circle" an
 * ellipse. The caller measures the shape and picks the arrangement — see
 * `pixelGrid`.
 *
 * A cell is square on screen even though its width and height are different
 * numbers here, because the grid was chosen to make it so. That is why a
 * circular cell needs `rx` and `ry` set separately.
 *
 * Decorative and inert: it paints nothing itself and must never reach the
 * accessibility tree.
 */
export default function ShowreelPixels({
  ref,
  grid,
}: {
  ref: Ref<SVGMaskElement>;
  grid: PixelGrid;
}) {
  const { columns, rows } = grid;
  /* Cell size in objectBoundingBox units — fractions of the masked element. */
  const cellWidth = 1 / columns;
  const cellHeight = 1 / rows;

  return (
    /* Zero-sized and positioned out of flow: a `<defs>` needs to be in the
       document to be referenced, but must not occupy or paint anything. */
    <svg aria-hidden="true" className="pointer-events-none absolute size-0">
      <defs>
        <mask
          ref={ref}
          id={SHOWREEL_MASK_ID}
          maskContentUnits="objectBoundingBox"
        >
          {Array.from({ length: columns * rows }, (_, cell) => (
            <rect
              key={cell}
              x={(cell % columns) * cellWidth}
              y={Math.floor(cell / columns) * cellHeight}
              width={cellWidth}
              height={cellHeight}
              /* Luminance, not colour. White means "show this part of the
                 element"; it is not a design value and has no token. */
              fill="#fff"
              /* Every cell starts hidden, so the rectangle is genuinely
                 transparent before the entrance runs and the hero's gradient
                 shows straight through it. GSAP takes over from here. */
              opacity={0}
            />
          ))}
        </mask>
      </defs>
    </svg>
  );
}
