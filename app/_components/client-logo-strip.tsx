import type { CSSProperties } from "react";

import { clientLogos, type ClientLogo } from "@/app/_lib/clients";
import { maskStyle } from "@/app/_lib/mask";

/**
 * Approved client logos in two rows that drift in opposite directions, fading
 * out at both ends.
 *
 * ── The knobs ────────────────────────────────────────────────────────────
 *   logo size     HEIGHT, plus `optical` per logo in app/_lib/clients.ts
 *   spacing       SPACE_X, SPACE_Y
 *   speed         SECONDS_PER_UNIT
 *   edge fade     FADE
 *   ink           INK
 * ─────────────────────────────────────────────────────────────────────────
 *
 * **Renders nothing without an approved logo.** It reads `clientLogos`, which
 * lists only clients whose permission is recorded. An empty list returns
 * `null` rather than placeholders: publishing blank "logo" slots on the
 * homepage would suggest clients the site cannot name.
 *
 * **One ink, from each file's shape.** Each logo is a `<span>` painted in
 * `INK` and cut to the logo's outline by using its file as a CSS mask. Only
 * the file's transparency matters, so an SVG or a transparent PNG both work,
 * and an opaque image would come out as a solid rectangle. Every client's own
 * colours disappear and the row reads as one tone. The site header's logo
 * works the same way.
 *
 * **Same height, then corrected by eye.** Every logo gets one height, and its
 * width follows its own ratio, so nothing is stretched. Equal heights still
 * make a square mark look bigger than a long wordmark, which is what the
 * per-logo `optical` multiplier is for.
 *
 * ## The loop
 *
 * Each row is a track holding its logos `COPIES` times, moved by exactly one
 * copy and then started again. Because the copy it lands on is identical to the
 * one it started from, the restart is invisible.
 *
 * Two things make "exactly one copy" exact:
 *
 * - **The space after each logo is padding on the logo, not a flex `gap`.** A
 *   gap sits only BETWEEN items, so the last logo of one copy and the first of
 *   the next would have no gap to share, and every loop would jump by one
 *   gap's width. With padding, each copy ends with the same space it has
 *   between logos, and the copies simply abut.
 * - **The distance is a percentage of the track**, `-100% / COPIES`, so it is
 *   one copy wide at every screen width and every logo size without
 *   measuring anything.
 *
 * Three copies rather than the usual two. A row only never shows a gap if the
 * track still reaches the far edge at the end of each loop, which needs two
 * copies to be at least as wide as the strip. The top row's eight logos come
 * to about 1,470px at desktop size, narrower than the strip on the widest
 * screens, so two copies would leave empty space for part of every loop.
 *
 * Tracks are aligned to the START of the strip, not centred. A centred track
 * spills both ways, and moving it by a whole copy would pull its far end short
 * of the edge.
 *
 * **Both rows move at the same speed.** The rows are different lengths, so one
 * shared duration would make the longer one visibly faster. Each row's
 * duration comes from its length instead, estimated from the data: every logo's
 * width in logo heights (ratio × optical) plus its spacing. That estimate uses
 * the desktop proportions; on a phone both rows are smaller and slightly
 * slower, together.
 *
 * The second row used to be offset to the right by a fixed transform. It is
 * not any more: on a track that moves by a whole copy, a fixed shift leaves an
 * empty band at one end of the loop. Two rows travelling in opposite directions
 * are never lined up for long anyway.
 *
 * **Never pauses under the pointer.** It used to stop on hover; it keeps
 * moving now, by the owner's choice. Reduced motion is the only thing that
 * stops it, which leaves an open accessibility question: see the WCAG 2.2.2
 * note in docs/IMPLEMENTATION-STATUS.md before adding a pause back.
 *
 * **Still for reduced motion.** The animation is `motion-safe:` only, so a
 * visitor who has asked their device for less motion gets two static rows,
 * the first copy of each starting at the left edge.
 *
 * **Why it can't make the page scroll sideways.** The tracks are far wider
 * than the screen, but the strip is `overflow-hidden`, and a transform takes
 * up no layout space.
 *
 * **Each client is announced once.** The first copy of each row is a real list
 * whose logos are `role="img"` with the client's name. The other copies exist
 * only to fill the loop and are `aria-hidden`. The group is labelled "Selected
 * clients" and has no visible heading, as the brief asks.
 */

/** Logo height before the optical correction. */
const HEIGHT = "[--logo-height:1.75rem] lg:[--logo-height:2.25rem]";

/** Space after each logo. Padding rather than `gap`: see "The loop". */
const SPACE_X = "pr-14 lg:pr-24";
/** Space between the two rows. */
const SPACE_Y = "gap-y-12 lg:gap-y-16";

/**
 * The spacing above, in logo heights at desktop size (96px / 36px). Used only
 * to estimate each row's length for its speed; keep it in step with SPACE_X.
 */
const SPACE_UNITS = 96 / 36;

/**
 * Seconds per logo-height of row length: the speed. At desktop size one unit is
 * 36px, so 1.2s moves about 30px a second. Lower is faster.
 */
const SECONDS_PER_UNIT = 1.2;

/** How many times each row is repeated along its track. See "The loop". */
const COPIES = 3;

/** Solid across the middle, fading to nothing over the outer fifth each side. */
const FADE = "mask-x-from-80% mask-x-to-100%";

/** The one colour every logo is painted in. */
const INK = "bg-text-primary";

/** Each row's direction. `motion-safe:` so reduced motion leaves both still. */
const MOTION = {
  left: "motion-safe:animate-marquee-left",
  right: "motion-safe:animate-marquee-right",
} as const;

/**
 * One logo's box: its outline as a mask, its height after the optical
 * correction, and its own ratio for the width.
 */
function logoStyle(client: ClientLogo): CSSProperties {
  return {
    /* `contain`, not the header's stretch: a client file carries padding
       around its artwork and has to scale down inside its box. */
    ...maskStyle(client.logo, "contain"),
    height: `calc(var(--logo-height) * ${client.optical ?? 1})`,
    aspectRatio: `${client.width} / ${client.height}`,
  };
}

/**
 * How long one copy of a row takes to pass. Its length in logo heights, every
 * logo's width (ratio × optical) plus its spacing, at SECONDS_PER_UNIT.
 */
function rowDuration(logos: ClientLogo[]) {
  const units = logos.reduce(
    (sum, client) =>
      sum + (client.width / client.height) * (client.optical ?? 1) + SPACE_UNITS,
    0,
  );
  return `${(units * SECONDS_PER_UNIT).toFixed(1)}s`;
}

function Row({
  logos,
  direction,
}: {
  logos: ClientLogo[];
  direction: keyof typeof MOTION;
}) {
  return (
    <div
      className={`flex w-max ${MOTION[direction]}`}
      style={
        {
          "--marquee-shift": `calc(-100% / ${COPIES})`,
          "--marquee-duration": rowDuration(logos),
        } as CSSProperties
      }
    >
      {Array.from({ length: COPIES }, (_, copy) => (
        <ul
          key={copy}
          /* Only the first copy is read out; the rest only fill the loop. */
          aria-hidden={copy > 0 ? true : undefined}
          className="flex shrink-0 items-center"
        >
          {logos.map((client) => (
            <li key={client.slug} className={`shrink-0 ${SPACE_X}`}>
              <span
                role="img"
                aria-label={client.name}
                className={`block ${INK}`}
                style={logoStyle(client)}
              />
            </li>
          ))}
        </ul>
      ))}
    </div>
  );
}

export default function ClientLogoStrip({
  className,
}: {
  /** Placement from the caller: a grid area, usually. */
  className?: string;
}) {
  if (clientLogos.length === 0) return null;

  /* The top row takes the extra logo when the count is odd. */
  const split = Math.ceil(clientLogos.length / 2);

  return (
    <div
      role="group"
      aria-label="Selected clients"
      className={`flex flex-col items-start overflow-hidden ${SPACE_Y} ${HEIGHT} ${FADE}${className ? ` ${className}` : ""}`}
    >
      <Row logos={clientLogos.slice(0, split)} direction="left" />
      <Row logos={clientLogos.slice(split)} direction="right" />
    </div>
  );
}
