import Image from "next/image";
import Link from "next/link";

import { ArrowRightIcon } from "@/app/_components/icons";
import FlipCard from "@/app/_components/flip-card";
import { INSIGHT_TAG, type Insight } from "@/app/_lib/insights";
import { maskStyle } from "@/app/_lib/mask";
import { insightsHref } from "@/app/_lib/navigation";
import { SWATCHES } from "@/app/_lib/swatches";

/**
 * An insight card: a 4:3 picture cut to the insight's shape, then the topic,
 * the title and the summary, all on the insight's colour swatch. ADR-007.
 *
 * ── The knobs ────────────────────────────────────────────────────────────
 *   colours       app/_lib/swatches.ts (surface, ink, edge, fill)
 *   picture size  CARD_SIZES
 * ─────────────────────────────────────────────────────────────────────────
 *
 * **The shape is a stencil.** The picture box is 4:3 and the shape's SVG is
 * 4:3, so the SVG's filled area lines up with the box exactly (`100% 100%`).
 * The photo shows through where the shape is filled and nowhere else.
 *
 * **The SVG is only ever a CSS mask, never markup in the page.** An uploaded
 * SVG can contain script. Used as an image, as a mask is, the browser renders
 * it as a picture and does not run it. Shapes from Sanity are fetched on the
 * server and inlined as a `data:` URL, so there is no extra request per card
 * and no reliance on the CDN's cross-origin headers. Files already on this
 * site (a path starting with "/") are used as they are.
 *
 * **The colour does two jobs.** It is the card's background, and it sits behind
 * the photo inside the shape, so a slow photo arrives on its own colour rather
 * than on a gap. With no photo, a shape in that same colour would vanish into
 * the card. So the shape is filled with the swatch's `fill` instead, the ink
 * colour, which makes it a solid graphic. With neither a photo nor a shape
 * there is nothing to show, and the picture area is left out.
 *
 * All text is in the swatch's ink at full strength, so hierarchy comes from
 * size alone.
 *
 * **The arrow beside the summary signals that the card opens an article.** The
 * summary is cut to 2 lines. The circle is a fixed 44px at every width, about
 * the height of those 2 lines.
 */

/** The picture's rendered width, so the browser fetches a copy that size. */
const CARD_SIZES = "(min-width: 768px) 33vw, 100vw";

/**
 * The publish date, short: "11 Sept 2026". A spelled-out month, not
 * "11/09/2026", because a numeric date reads differently in different
 * countries. In Bangkok time, where the studio works, so an article published
 * late in the evening UTC shows the day it was published there. Formatted on
 * the server, so every visitor sees the same text.
 */
const DATE = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Bangkok",
});

/** The date as shown, or nothing if there is none or it does not parse. */
function published(iso: string | undefined) {
  if (!iso) return null;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : DATE.format(date);
}

/**
 * Where the mask comes from. A path on this site is used as it is. A remote
 * SVG is fetched here on the server, checked to be an SVG, and inlined as a
 * `data:` URL. Anything that fails leaves the card without a stencil, never
 * broken.
 */
async function maskSource(shape: string | undefined) {
  if (!shape) return undefined;
  if (shape.startsWith("/")) return shape;
  try {
    const response = await fetch(shape, {
      cache: "force-cache",
      next: { tags: [INSIGHT_TAG] },
    });
    if (!response.ok) return undefined;
    const svg = await response.text();
    if (!/^\s*(<\?xml[^>]*>\s*)?<svg[\s>]/i.test(svg)) return undefined;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  } catch {
    return undefined;
  }
}

export default async function InsightCard({
  insight,
  heading = "h3",
}: {
  insight: Insight;
  /** The title's level: `h3` inside a homepage section, `h2` on /insights/. */
  heading?: "h2" | "h3";
}) {
  const swatch = SWATCHES[insight.colour];
  const mask = await maskSource(insight.shape);
  const Heading = heading;
  const hasPicture = Boolean(insight.image || mask);
  const date = published(insight.publishedAt);

  return (
    <FlipCard>
      <article
        className={`relative flex h-full flex-col rounded-lg border p-5 ${swatch.surface} ${swatch.ink} ${swatch.edge}`}
      >
        {hasPicture ? (
          <div
            className={`relative aspect-4/3 overflow-hidden${mask ? "" : " rounded-sm"}`}
            style={mask ? maskStyle(mask) : undefined}
          >
            {insight.image ? (
              <Image
                src={insight.image.src}
                alt={insight.image.alt}
                width={insight.image.width}
                height={insight.image.height}
                sizes={CARD_SIZES}
                className="size-full object-cover"
              />
            ) : (
              /* No photo: the shape as a graphic, washed in the ink colour. */
              <div aria-hidden="true" className={`size-full ${swatch.fill}`} />
            )}
          </div>
        ) : null}

        <div className="flex flex-1 flex-col px-2 pt-8 pb-2">
          <div className="flex items-center justify-between text-sm font-semibold tracking-label uppercase">
            <span>{insight.topic}</span>
            {/* The date, where the number used to be. A planned article has
                none, so it shows nothing rather than an invented date. */}
            {date ? <time dateTime={insight.publishedAt}>{date}</time> : null}
          </div>
          {/*
            The whole card is the target, and the LINK is only the title.

            `after:inset-0` stretches an empty pseudo-element over the card, so a
            click anywhere follows this link — while the accessible name stays the
            article's title rather than every word on the card, which is what
            wrapping the whole thing in an anchor would produce. Keyboard focus
            lands on the title, where the focus ring is legible.

            The overlay is positioned and the copy beneath it is not, so it paints
            above without a z-index. The arrow's circle IS positioned, which is why
            it gives up pointer events below.
          */}
          <Heading className="mt-3 type-h1">
            <Link
              href={insightsHref}
              className="after:absolute after:inset-0 after:content-['']"
            >
              {insight.title}
            </Link>
          </Heading>
          <div className="mt-auto flex items-start gap-4 pt-8 type-small">
            {/* Cut visually only; screen readers still get the whole summary. */}
            <p className="line-clamp-2 min-w-0 flex-1">
              {insight.summary}
            </p>
            {/*
              The mark, and the wipe that fills it on hover.

              Same construction as cta-row.tsx: a panel parked at
              `-translate-x-full` inside an `overflow-hidden` box, sliding to `0`
              on the group's hover. A translate rather than a width or a scale, so
              nothing is laid out twice and the circle never reflows.

              `bg-current` takes the card's ink without any colour plumbing; the
              arrow then turns the card's own surface colour, so it reads as a
              hole punched through the fill. See `onFill` in swatches.ts.
            */}
            <span
              aria-hidden="true"
              className="pointer-events-none relative grid size-11 shrink-0 place-items-center overflow-hidden rounded-full border border-current"
            >
              <span
                className="absolute inset-0 -translate-x-full bg-current transition-transform duration-700 ease-sweep group-hover:translate-x-0 motion-reduce:transition-none"
              />
              {/* 24px, the icon's own size: the arrow itself is about 15px across,
                  a third of the circle. `relative` keeps it above the panel. */}
              <ArrowRightIcon
                className={`relative size-6 transition-colors duration-300 motion-reduce:transition-none ${swatch.onFill}`}
              />
            </span>
          </div>
        </div>
      </article>
    </FlipCard>
  );
}
