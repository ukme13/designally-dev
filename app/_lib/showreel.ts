/**
 * Homepage showreel — the selected-work video carousel.
 *
 * Data only. Every media-specific playback value lives here rather than as a
 * special case inside the component, because each clip behaves differently at
 * its head and tail and the component must not know which project it is
 * showing.
 *
 * Full specification, including how each value was measured:
 * docs/specs/SHOWREEL.md
 *
 * Client permission for these four names and their media is NOT documented.
 * See WEBSITE-BRIEF.md — permission must be confirmed before publishing a
 * client name. This blocks launch, not development.
 */

import { projects } from "@/app/_lib/projects";

export type ShowreelProject = {
  /** Matches the `name` in app/_lib/projects.ts, which owns the facts. */
  name: string;
  /** Stable id for keys, control ids and the asset filenames. */
  slug: string;
  video: string;
  poster: string;
  /**
   * Where playback begins, in seconds.
   *
   * Not always 0. Bitazza opens on a measured black segment running 0.00-0.52s,
   * and LAGA opens on a soft near-white blur that reveals badly. Both were
   * measured with ffmpeg blackdetect and signalstats, not chosen by eye.
   */
  startAt: number;
  /**
   * When the crossfade to the next project may begin, in seconds.
   *
   * Compared against the video's real `currentTime`, never a timer. Chosen per
   * clip from where its content actually ends: LAGA and Nourigo both settle
   * onto a blank end card, INN News onto a static brand block at 8.5, and
   * Bitazza's logo reaches full presence at 9.0 before fading toward black.
   * Every value leaves room for the 500ms crossfade to finish before the media
   * does.
   *
   * Unused in Stage A, which holds the final frame instead of advancing.
   */
  crossfadeAt: number;
  /**
   * The frame each poster was extracted from, in seconds.
   *
   * Build-time only — nothing reads it at runtime. Recorded so a poster can be
   * regenerated identically:
   *   ffmpeg -ss <posterTime> -i <source> -frames:v 1 \
   *     -vf "scale=1280:720:flags=lanczos" out.png
   *   cwebp -q 72 out.png -o <slug>-poster.webp
   */
  posterTime: number;
};

/** Approved order. The heaviest file, Bitazza, is deliberately last. */
export const SHOWREEL: readonly ShowreelProject[] = [
  {
    name: "Laga",
    slug: "laga",
    video: "/showreel/laga.mp4",
    poster: "/showreel/laga-poster.webp",
    startAt: 1.5,
    crossfadeAt: 8.8,
    posterTime: 5.0,
  },
  {
    name: "Nourigo",
    slug: "nourigo",
    video: "/showreel/nourigo.mp4",
    poster: "/showreel/nourigo-poster.webp",
    startAt: 0,
    crossfadeAt: 8.8,
    posterTime: 6.0,
  },
  {
    name: "INN News",
    slug: "inn-news",
    video: "/showreel/inn-news.mp4",
    poster: "/showreel/inn-news-poster.webp",
    startAt: 0,
    crossfadeAt: 8.9,
    posterTime: 3.2,
  },
  {
    name: "Bitazza",
    slug: "bitazza",
    video: "/showreel/bitazza.mp4",
    poster: "/showreel/bitazza-poster.webp",
    startAt: 0.6,
    crossfadeAt: 9.2,
    posterTime: 5.0,
  },
];

/**
 * The stage and services shown beside the video, read from the single place
 * that owns them. Nothing about a project is restated here.
 */
export function showreelCaption(name: string) {
  const project = projects.find((entry) => entry.name === name);
  return project
    ? { stage: project.stage, services: project.services }
    : undefined;
}

/**
 * Distance from the viewport at which media may begin loading. Loading and
 * visibility are separate conditions: this one only permits the fetch.
 */
export const LOAD_MARGIN = "200px";
/** How much of the section must be on screen before it may play. */
export const VISIBLE_RATIO = 0.25;

/* ---------------------------------------------------------------------------
   Pixel reveal — Stage B.

   A grid of orange cells covering the rectangle, cleared from the centre
   outward so the moving video appears through it.
--------------------------------------------------------------------------- */

/** Matches the 16:9 rectangle, so every cell is exactly square. */
export const PIXEL_COLUMNS = 16;
export const PIXEL_ROWS = 9;
export const PIXEL_CELLS = PIXEL_COLUMNS * PIXEL_ROWS;

/**
 * Whole reveal, first cell starting to last cell finished.
 *
 * The single knob for the scatter's pace. The order is unaffected — the gaps
 * between cells stretch, nothing is resequenced — and the morph follows,
 * because it is placed at PIXEL_REVEAL_MS + CIRCLE_HOLD_MS rather than a fixed
 * time, so the circle always holds for exactly CIRCLE_HOLD_MS.
 */
export const PIXEL_REVEAL_MS = 1100;
/**
 * How long one cell takes to go.
 *
 * Short, so the result reads as pixels switching off rather than a soft
 * dissolve — but not zero, which would alias badly on a moving video.
 */
export const PIXEL_CELL_MS = 160;
/**
 * How much each cell is oversized while it is still round.
 *
 * A circle only covers a square if its diameter is that square's diagonal, so
 * the scale has to be at least sqrt(2) ~ 1.4142 or the corners of every slot
 * would be uncovered and the video would show through a grid of gaps before
 * the reveal began. A hair over, for rounding.
 *
 * Scale and radius are interpolated together, and coverage holds throughout:
 * at scale 1 the cell is a square exactly filling its slot, and at every point
 * between, the rounded box still contains the slot's corners.
 */
export const PIXEL_CELL_SCALE = 1.42;

/** Stage C: the circle holds, fully revealed, before it opens out. */
export const CIRCLE_HOLD_MS = 900;
/** Stage C: circle to final rounded rectangle. */
export const MORPH_MS = 800;
/** First pixel to final corner. 700 + 900 + 800. */
export const ENTRANCE_MS = PIXEL_REVEAL_MS + CIRCLE_HOLD_MS + MORPH_MS;

/**
 * The longest the cover may stay once the section is actually on screen.
 *
 * The reveal waits on several conditions, and any of them can fail to arrive:
 * autoplay refused despite the video being muted, a decode that never reports
 * `playing`, a stalled network. None of those should leave an orange rectangle
 * sitting over the work. Measured from becoming visible, not from arming, so
 * the cover can wait indefinitely while off screen.
 */
export const PIXEL_COVER_MAX_MS = ENTRANCE_MS + 3000;

/**
 * How much the order is scattered rather than strictly radial.
 *
 * 0 clears in perfect rings from the centre, which reads as a machine drawing
 * circles. 1 is pure noise with no sense of origin at all. In between, the
 * reveal still opens from the middle but the edge is broken up and no ring is
 * ever complete — the circle is implied rather than drawn.
 *
 * Raise it for more chaos, lower it to tighten the rings.
 */
export const PIXEL_SCATTER = 0.5;

/**
 * A fixed, repeatable value in 0..1 for a cell index.
 *
 * Deliberately not `Math.random()`. The order has to be identical on the
 * server and the client, and identical between reloads, or the grid would
 * differ across a hydration boundary. This is a 32-bit integer hash — the
 * output looks unstructured but is entirely determined by the index.
 *
 * `Math.imul` because plain `*` on these constants exceeds the 53-bit safe
 * integer range and silently loses the low bits that carry the randomness.
 */
function pixelNoise(index: number): number {
  let hash = Math.imul(index ^ 0x9e3779b9, 0x85ebca6b);
  hash = Math.imul(hash ^ (hash >>> 13), 0xc2b2ae35);
  hash ^= hash >>> 16;
  return (hash >>> 0) / 4294967296;
}

/**
 * Each cell's place in the order, 0 first and 1 last.
 *
 * Row-major, matching the order the cells are rendered in, so a cell's index
 * is its delay's index. Computed once at module scope from pure arithmetic:
 * identical on the server and the client, and identical between reloads.
 *
 * Distance from the centre and noise are blended rather than added, so the
 * result always spans the full 0..1 range whatever `PIXEL_SCATTER` is set to
 * and the reveal always takes its whole duration.
 */
export const PIXEL_ORDER: readonly number[] = (() => {
  const centreX = (PIXEL_COLUMNS - 1) / 2; // 7.5
  const centreY = (PIXEL_ROWS - 1) / 2; // 4
  const furthest = Math.hypot(centreX, centreY); // exactly 8.5
  const order: number[] = [];

  for (let row = 0; row < PIXEL_ROWS; row += 1) {
    for (let column = 0; column < PIXEL_COLUMNS; column += 1) {
      const index = row * PIXEL_COLUMNS + column;
      const distance = Math.hypot(column - centreX, row - centreY) / furthest;
      order.push(
        distance * (1 - PIXEL_SCATTER) + pixelNoise(index) * PIXEL_SCATTER,
      );
    }
  }

  return order;
})();
