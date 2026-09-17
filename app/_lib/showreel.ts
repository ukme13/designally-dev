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
   * Unread for now: the current build holds the final frame rather than
   * advancing to the next project.
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
 * Distance from the viewport at which media may begin loading. Loading and
 * visibility are separate conditions: this one only permits the fetch.
 */
export const LOAD_MARGIN = "200px";
/** How much of the section must be on screen before it may play. */
export const VISIBLE_RATIO = 0.25;

/**
 * Last resort for the carousel, NOT the thing that drives it.
 *
 * Projects advance on `crossfadeAt` — the per-clip point where its content
 * actually ends, compared against the element's real `currentTime` in
 * `onTimeUpdate`. That lands at the right frame for each film and corrects
 * itself when a load runs slow.
 *
 * A wall clock could not. Playback begins before the entrance finishes, so a
 * clip is already ~2s in by the time it is fully revealed and that time counts
 * against its content. At a 7s dwell every clip looped back to `startAt`
 * before the switch, LAGA by nearly two seconds against its 7.3s of content.
 *
 * So this only covers the case where `crossfadeAt` never arrives: a stalled
 * download, a decode that stops reporting, a `timeupdate` that dries up.
 * Deliberately far longer than any clip, so it never races a real advance —
 * the longest carries 8.9s of content and a normal switch lands about 7s into
 * the dwell. Timed from the entrance settling, and reset by every advance.
 */
export const ADVANCE_FALLBACK_MS = 15000;

/* ---------------------------------------------------------------------------
   Pixel reveal.

   A grid of cells painted into a canvas over the video. Cells start invisible,
   so the rectangle is genuinely transparent and the hero's gradient shows
   through it; they fade in from the centre outward and the film materialises
   out of the page.

   It was a CSS mask referencing an inline SVG `<mask>` until 15 September
   2026. On an iPhone the entrance was invisible — nothing drew for its whole
   length. The exact WebKit mechanism is unconfirmed; see
   use-showreel-entrance.ts.

   It was an opaque cover dissolving OFF the video until 7 September 2026. The
   inversion is what removed the cover colour problem entirely — there is no
   longer a fill that has to match anything — along with the container's
   circle-to-rectangle morph, its clip-path measurement and the resize handling
   that went with them.
--------------------------------------------------------------------------- */

/**
 * Roughly how many cells the grid aims for on a full-size rectangle.
 *
 * The count is held near-constant and the arrangement varies, rather than the
 * other way round, so the reveal takes about the same number of steps at every
 * size.
 *
 * **It does NOT read the same on a phone as on a desktop, and this constant
 * used to claim it did.** That was disproved on a device on 15 September 2026:
 * 144 cells in the ~337px box a phone gives makes each cell about 28px, and at
 * the old `PIXEL_CELL_SCALE` the dots were 25px with 3px between them. They
 * merged on contact and the whole effect read as a soft fade rather than as
 * pixels. See `PIXEL_TARGET_CELLS_COMPACT`.
 */
export const PIXEL_TARGET_CELLS = 144;

/**
 * The count used when the rectangle is small, which in practice means a phone.
 *
 * Fewer, bigger cells. At 64 in a ~337px box the grid resolves to 8 x 8 — the
 * search finds it exactly, with zero drift — so a cell is about 42px and the
 * starting dot about 25px, leaving roughly 17px of the hero's gradient showing
 * between neighbours. That is the difference between reading as pixels and
 * reading as grain.
 *
 * The timings are untouched, so `ENTRANCE_MS` is unchanged and the hero's
 * choreography still lands where it did. Only the number of steps changes.
 */
export const PIXEL_TARGET_CELLS_COMPACT = 64;

/**
 * Box widths below this use the compact count, in CSS pixels.
 *
 * Measured against the real rectangle rather than a breakpoint: its width comes
 * from the page grid and its height from the viewport, so the same reasoning
 * that made the grid a `ResizeObserver` rather than a media query applies here.
 * A phone lands near 337, a tablet near 688, so 480 separates them with room on
 * both sides.
 */
export const PIXEL_COMPACT_MAX_PX = 480;

/** The 16:9 arrangement. Also the default before anything has been measured. */
export const PIXEL_COLUMNS = 16;
export const PIXEL_ROWS = 9;

/**
 * How far the cell count may drift from the target in exchange for squarer
 * cells, as a fraction.
 *
 * The search below trades one against the other. 0.2 keeps every arrangement
 * between about 115 and 173 cells, so the reveal still takes a comparable
 * number of steps at every size, while leaving enough room to pick a genuinely
 * square pair rather than the first one that multiplies to 144.
 */
const PIXEL_CELL_BUDGET = 0.2;

export type PixelGrid = { columns: number; rows: number };

/**
 * The arrangement whose cells come closest to square in a box of this shape.
 *
 * Cell geometry is expressed in objectBoundingBox units — fractions of the
 * masked element — so a fixed 16 x 9 grid only produces square cells in a 16:9
 * box. The showreel stopped being 16:9 everywhere on 7 September 2026: it
 * fills the screen height on mobile, where a portrait box would have turned
 * every cell into a tall rectangle and every "circle" into an ellipse.
 *
 * `columns = sqrt(cells * aspect)` is the continuous answer: with
 * `columns * rows = cells` and `columns / rows = aspect`, that is what falls
 * out. But columns and rows have to be WHOLE NUMBERS, and rounding is where the
 * squareness goes.
 *
 * **Deriving rows from the target rather than from the rounded columns was the
 * bug.** `rows = round(cells / columns)` and `rows = round(columns / aspect)`
 * are the same expression before rounding and diverge after it, because the
 * first uses the ideal column count and the second the one actually chosen. On
 * a 1400x712 box that produced 17 x 8 and cells 7.5% off square — visible as
 * rounded rectangles rather than rounded squares partway through the morph.
 *
 * So this searches instead. A handful of column counts either side of the ideal,
 * each with the two row counts that bracket `columns / aspect`, scored on how
 * close the resulting cell comes to square and tie-broken on staying near the
 * target count. At most ten candidates, all integer arithmetic, and the same
 * answer every time for a given shape.
 *
 * Measured against the old formula: 1400x712 7.5% -> 1.7%, 1024x480 5.2% ->
 * 0.4%, a 390x484 phone 4.8% -> 2.6%, and 16:9 unchanged at 0.0%. The residual
 * never reaches zero for an arbitrary box — integers cannot tile every shape
 * squarely — but it is now small enough not to read as a mistake.
 *
 * `target` is how many cells to aim for. It defaults to the showreel's own
 * `PIXEL_TARGET_CELLS` and is a parameter because the section wipe wants a
 * denser grid from the same arithmetic — the squareness search has nothing to
 * do with how many cells there are, and duplicating it for a different count
 * would mean two copies of the one thing here worth getting right.
 *
 * Clamped at both ends. A pathological box — a sliver during a resize, a
 * measurement of zero — must not produce a grid of one enormous cell or of
 * thousands of invisible ones. A shape so extreme that nothing fits the cell
 * budget keeps its cells SQUARE and lets the count drift instead, rather than
 * jumping to the 16:9 default — see the note on that branch below.
 */
export function pixelGrid(
  aspect: number,
  target: number = PIXEL_TARGET_CELLS,
): PixelGrid {
  if (!Number.isFinite(aspect) || aspect <= 0) {
    return { columns: PIXEL_COLUMNS, rows: PIXEL_ROWS };
  }

  const clamp = (value: number) => Math.min(32, Math.max(4, value));
  const seed = clamp(Math.round(Math.sqrt(target * aspect)));

  let best: PixelGrid | undefined;
  let bestError = Number.POSITIVE_INFINITY;
  let bestDrift = Number.POSITIVE_INFINITY;

  for (let columns = clamp(seed - 2); columns <= clamp(seed + 2); columns += 1) {
    /* The row count that would make this column count square, and the two
       whole numbers around it. */
    const ideal = columns / aspect;
    for (const candidate of [Math.floor(ideal), Math.ceil(ideal)]) {
      if (candidate < 4 || candidate > 32) continue;

      const drift = Math.abs(columns * candidate - target);
      if (drift > target * PIXEL_CELL_BUDGET) continue;

      /* A cell measures (width / columns) by (height / rows), so its aspect is
         the box's aspect times rows over columns. 1 is square. */
      const error = Math.abs((aspect * candidate) / columns - 1);

      /* Squareness first, then the count. The epsilon stops two arrangements
         that are equally square from being ordered by floating-point noise. */
      const squarer = error < bestError - 1e-4;
      const asSquare = Math.abs(error - bestError) <= 1e-4;
      if (squarer || (asSquare && drift < bestDrift)) {
        best = { columns, rows: candidate };
        bestError = error;
        bestDrift = drift;
      }
    }
  }

  if (best) return best;

  /*
    Nothing fitted the cell budget: the box is wide enough that every
    arrangement inside the column clamp misses the target count.

    **Rows come from the ASPECT here, never from the count, and that is the
    whole point of this branch.** Deriving them from the count — `target /
    columns` — is what this did before, and it holds the number of cells while
    letting the cells themselves go oblong. On a 5120x1440 screen the wipe's
    50svh band resolved to 32x9 cells of 160x80, a ratio of 2.0, and circles
    drawn with `rounded-full` rendered as flat ovals. Reported on a wide screen,
    17 September 2026, and reported once before at 30svh for the same reason.

    Squareness is what this function is for, so the COUNT is what gives way.
    That screen now resolves to 32x5: 160 cells rather than 288, and a ratio of
    1.11. Fewer and larger cells, which is the right trade for a shape no
    arrangement can tile both squarely and at count.

    Measured either side of the change — 3440x1440 1.34 -> 1.05, 3840x1600
    1.35 -> 1.05, 5120x1440 2.00 -> 1.11. The showreel's own boxes never reach
    this branch at either of its targets, checked from a 337px phone to a 2560px
    desktop, so only the wipe travels this path.
  */
  const columns = clamp(Math.round(Math.sqrt(target * aspect)));
  return { columns, rows: clamp(Math.round(columns / aspect)) };
}

/**
 * The scatter: first cell starting to last cell finished FADING IN.
 *
 * The knob for the wave's pace. The order is unaffected — the gaps between
 * cells stretch, nothing is resequenced. It does not cover the morph, which
 * follows each cell individually.
 */
export const PIXEL_REVEAL_MS = 1300;

/* ---------------------------------------------------------------------------
   A cell's life, in three phases.

   These were one 160ms tween until 7 September 2026, with opacity and shape
   moving together. That was the bug: a cell faded in WHILE squaring up, so it
   was never a visible circle at any point and the result read as squares
   simply appearing. Separating the phases is what makes the shape legible —
   the circle has to exist on screen before it is allowed to change.
--------------------------------------------------------------------------- */

/**
 * Phase 1 — the cell appears, as a circle, and does not change shape.
 *
 * Short, so the result reads as a pixel switching on rather than a soft
 * dissolve, but not zero, which would alias badly on a moving video.
 */
export const PIXEL_FADE_MS = 200;
/**
 * Phase 2 — it sits there, fully opaque and still round.
 *
 * The whole point of the effect. Without a hold the morph begins the instant
 * the cell is visible and the eye reads one continuous event rather than a
 * circle that then becomes a square. Raise it to make the dot more emphatic.
 */
export const PIXEL_DOT_HOLD_MS = 200;
/**
 * Phase 3 — circle to square.
 *
 * Long and eased, because this is the part worth watching. It is nearly three
 * times the fade for that reason.
 */
export const PIXEL_MORPH_MS = 550;
/**
 * How much each cell is oversized while it is still round.
 *
 * Every cell starts as a circle and squares up as it arrives, so a pixel
 * resolves rather than simply appearing.
 *
 * The figure is inherited from the cover this replaced, where it was a
 * coverage requirement: a circle only hides a square if its diameter is that
 * square's diagonal, so anything under sqrt(2) left the corners of every slot
 * showing. Revealing rather than covering, that constraint is gone — the
 * finished state is a square at scale 1 tiling its slot exactly, and coverage
 * at the START no longer matters.
 *
 * So this is now purely aesthetic, and it is set for legibility rather than
 * coverage. At the inherited 1.42 the round cells overlapped heavily and the
 * image filled in before the circles could be read as circles.
 *
 * **0.9 was still far too large, and it took a device to show it.** The
 * reasoning here previously argued for a value "just over 1", on the grounds
 * that neighbours should meet as they resolve. On the phone that left a 25px
 * dot in a 28px cell — a 3px gap — so the dots touched almost immediately and
 * the reveal read as a soft fade. Confirmed not to be a drawing fault first:
 * the canvas reported `painted complete` over 125 frames and 2060ms.
 *
 * At 0.6 a dot is a little over half its cell, so a clear band of the hero's
 * gradient shows between neighbours and each one is visibly a circle before it
 * grows into its slot. The gaps close during the morph, which is where that
 * closing belongs.
 *
 * Only the START is affected. Every cell finishes at its own slot exactly,
 * whatever this is set to, so the finished mask always tiles perfectly — which
 * is what makes this safe to tune by eye.
 */
export const PIXEL_CELL_SCALE = 0.6;

/**
 * First pixel appearing to the last one finishing its morph.
 *
 * The last cell finishes fading at PIXEL_REVEAL_MS, holds, then morphs — so
 * the tail of the entrance is one cell's remaining two phases, not the whole
 * scatter over again.
 */
export const ENTRANCE_MS =
  PIXEL_REVEAL_MS + PIXEL_DOT_HOLD_MS + PIXEL_MORPH_MS;

/**
 * The longest the rectangle may stay unrevealed once it could actually reveal.
 *
 * The reveal waits on several conditions, and any of them can fail to arrive:
 * autoplay refused despite the video being muted, a decode that never reports
 * `playing`, a stalled network. None of those should leave a permanent hole
 * where the work belongs.
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
 * Each cell's place in the order, 0 first and 1 last, for a given grid.
 *
 * Cached per arrangement: the grid is chosen from the rendered shape now, so
 * this is called again whenever that changes, and the maths is pure.
 *
 * Row-major, matching the order the cells are rendered in, so a cell's index
 * is its delay's index, and the same index addresses the matching `<rect>` in
 * the mask. Computed once at module scope from pure arithmetic:
 * identical on the server and the client, and identical between reloads.
 *
 * Distance from the centre and noise are blended rather than added, so the
 * result always spans the full 0..1 range whatever `PIXEL_SCATTER` is set to
 * and the reveal always takes its whole duration.
 */
const orderCache = new Map<string, readonly number[]>();

export function pixelOrder(columns: number, rows: number): readonly number[] {
  const key = `${columns}x${rows}`;
  const cached = orderCache.get(key);
  if (cached) return cached;

  const centreX = (columns - 1) / 2;
  const centreY = (rows - 1) / 2;
  const furthest = Math.hypot(centreX, centreY) || 1;
  const order: number[] = [];

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const index = row * columns + column;
      const distance = Math.hypot(column - centreX, row - centreY) / furthest;
      order.push(
        distance * (1 - PIXEL_SCATTER) + pixelNoise(index) * PIXEL_SCATTER,
      );
    }
  }

  orderCache.set(key, order);
  return order;
}
