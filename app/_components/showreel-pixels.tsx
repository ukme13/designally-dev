import type { Ref } from "react";

import { PIXEL_CELLS, PIXEL_COLUMNS, PIXEL_ROWS } from "@/app/_lib/showreel";

/**
 * The temporary pixel cover for the showreel's entrance.
 *
 * 144 cells in the same 16:9 proportion as the rectangle, so each one is
 * exactly square. No state and no logic: it renders the cells and hands back a
 * ref, and the reveal drives their opacity directly through GSAP — 144 React
 * updates per frame is not a thing anyone should build.
 *
 * Decorative and inert. It sits above the video, so it must never take a
 * pointer event or reach the accessibility tree.
 *
 * The fill is `bg-primary-300` rather than the semantic `bg-action-primary`
 * because it has to match the enclosing section exactly, and the section uses
 * the palette step directly. Two names for the same value today could drift
 * into two values tomorrow, and the seam would show.
 */
export default function ShowreelPixels({ ref }: { ref: Ref<HTMLDivElement> }) {
  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 grid"
      style={{
        gridTemplateColumns: `repeat(${PIXEL_COLUMNS}, 1fr)`,
        gridTemplateRows: `repeat(${PIXEL_ROWS}, 1fr)`,
      }}
    >
      {Array.from({ length: PIXEL_CELLS }, (_, cell) => (
        <div key={cell} className="bg-primary-300" />
      ))}
    </div>
  );
}
