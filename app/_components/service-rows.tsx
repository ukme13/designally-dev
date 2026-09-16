"use client";

import Image from "next/image";
import { useRef } from "react";

import type { ElementSlots } from "@/app/_lib/element-slots";
import { slot } from "@/app/_lib/element-slots";
import ConvoSticker from "@/app/_components/convo-sticker";
import { PAGE_INSET } from "@/app/_components/layout-styles";
import type { Service } from "@/app/_lib/services";
import { useServiceRows } from "@/app/_lib/use-service-rows";

/**
 * The five services, as a stack of full-bleed rows that pile up as you scroll.
 *
 * ── The knobs ────────────────────────────────────────────────────────────
 *   the page grid    GRID, PAGE_INSET and the AREA lines
 *   the visible band PAD.top and PAD.tail
 *   media            MEDIA, IMAGES
 *   the stacking     use-service-rows.ts
 * ─────────────────────────────────────────────────────────────────────────
 *
 * **The rules run the full width of the screen, the words do not.** Each row is
 * edge to edge so its top border crosses the whole viewport; inside it, a
 * container repeats the page's own gutters so the number, title and copy line
 * up with the section heading above. Which is why this list is rendered OUTSIDE
 * the section's padded container in page.tsx — a full-bleed child of a padded
 * parent would need negative margins that come undone at every breakpoint.
 *
 * ## What survives the stack
 *
 * A stacked row keeps only its top, so the layout is arranged around what that
 * top should hold: the number, the title, and the head of the media rectangle.
 *
 * Three columns on ONE 12-column grid and ONE grid row: the number, a text
 * column holding the title and the description, and the media. `self-start` on
 * the media puts its top edge level with the title's, so a strip of it as tall
 * as the title stays on screen once the row is stacked. The image is not
 * cropped or duplicated to manage this; it is simply tall, and the next row
 * covers the rest of it.
 *
 * **The title and description are nested rather than being grid items of their
 * own.** They were two grid rows with the media spanning both, which looks
 * equivalent and is not: a spanning item taller than the tracks it covers has
 * its height distributed across them, so the portrait media inflated the
 * title's row and opened a gap of a hundred-odd pixels above the description.
 * Nesting takes the media out of the text's sizing altogether — the gap is now
 * just the title's own bottom padding, whatever shape the image is.
 *
 * The stop is measured to the bottom of the TITLE — see use-service-rows.ts —
 * so `PAD.tail` sets both the air under a stacked title and how much of the
 * image shows beneath it. One number for both, because they are the same edge.
 * A wider gap between title and description WITHOUT more band air is a margin
 * on the `<p>`: that space falls below the band, so the next row covers it.
 *
 * Grid lines are stated as start and end, never `*-span-*`: that compiles to a
 * shorthand which rewrites both ends and would silently beat a neighbouring
 * `col-end-*`.
 *
 * Below `lg` there is no grid and no stacking — the four parts simply follow
 * one another, which is what a phone wants. See STACK_QUERY in the hook.
 *
 * **Each row has an illustration**, from IMAGES, at the section's 4:5 ratio. A
 * row without one keeps an empty tinted box of the same shape, so a new service
 * can go in before its artwork exists without breaking the layout.
 *
 * A `<ul>` of `<li>`s: five items of one kind in a stated order. The number is
 * real text rather than a CSS counter, because it is content — the services are
 * numbered in the copy, not just presented that way.
 *
 * The stacking, the departure and the focus are all in use-service-rows.ts,
 * and this list renders complete, readable and unstacked without any of them.
 */

/** The shared 12-column grid. Everything in a row sits on it. */
const GRID = "lg:grid lg:grid-cols-12 lg:items-baseline lg:gap-x-10";

/** The three edges that shape a row. `tail` is the one worth tuning. */
const PAD = {
  /** Above the title. Part of the band, so part of every row's stop. */
  top: "pt-7 lg:pt-9",
  /** Below the row, under the description and the rest of the media. */
  bottom: "pb-12 lg:pb-16",
  /** The air under a stacked title — and so how much image shows beside it. */
  tail: "pb-9 lg:pb-12",
};

/** Where each part of a row sits: three columns of twelve, one row. */
const AREA = {
  number: "lg:col-start-1 lg:col-end-2",
  /** The title and description together, so the media cannot size them. */
  text: "lg:col-start-3 lg:col-end-9",
  /** `self-start` holds it at the title's top edge however tall it is. */
  media: "lg:col-start-9 lg:col-end-13 lg:self-start",
};

/**
 * Which row carries the "we should have a convo!" sticker, by slug.
 *
 * One row only, and stated here rather than in `app/_lib/services.ts`: it is a
 * piece of this section's art direction, not a fact about the service. A slug
 * rather than an index so that reordering the five cannot silently move it.
 */
const STICKER_SLUG = "websites";

/**
 * The reserved rectangle: its shape, and a tint of the section's own ink so it
 * reads as a held space. Whatever fills it should match the ratio.
 */
const MEDIA = "aspect-portrait bg-text-on-accent/10";

/**
 * Each row's illustration, by slug. WebP at 1120 x 1400, converted from the
 * owner's PNGs; next/image serves smaller copies to smaller screens. A slug
 * missing from here gets the empty box instead of a broken image.
 */
const IMAGES: Record<string, string> = {
  "brand-strategy": "/what-we-build/brand-strategy.webp",
  "branding-identity": "/what-we-build/branding-identity.webp",
  rebranding: "/what-we-build/rebranding.webp",
  websites: "/what-we-build/websites.webp",
  "creative-partner": "/what-we-build/creative-partner.webp",
};

/** The files' natural size, which next/image uses for the ratio. */
const MEDIA_SIZE = { width: 1120, height: 1400 };

/**
 * How wide the picture is drawn, so the browser fetches a copy that size: a
 * third of the page from `lg`, the capped column (28rem) on a tablet, the full
 * width on a phone.
 */
const MEDIA_SIZES = "(min-width: 1024px) 30vw, (min-width: 480px) 28rem, 100vw";

export default function ServiceRows({
  services,
  surface,
}: {
  services: Service[];
  /**
   * The section's own background, as a Tailwind class. Required rather than
   * defaulted: a stacked row has to be opaque or the row beneath shows through
   * it, and only the caller knows what colour it is standing on. Same contract
   * as pixel-wipe.tsx.
   */
  surface: string;
}) {
  const listRef = useRef<HTMLUListElement>(null);
  const rowRefs = useRef<ElementSlots<HTMLElement>>([]);
  const titleRefs = useRef<ElementSlots<HTMLElement>>([]);

  /* The stacking, the departure and the focus — where they stop, and when. */
  useServiceRows({ listRef, rowRefs, titleRefs, count: services.length });

  return (
    /* The list is the one element the hook never transforms, so it is what
       every measurement is taken against. */
    <ul ref={listRef} className="border-b border-text-on-accent/25">
      {services.map((service, index) => (
        <li
          key={service.slug}
          ref={slot(rowRefs, index)}
          /* Nothing positions this row: the hook writes one transform per
             frame, and `will-change` with it while the list is on screen.
             Without JavaScript every row keeps its place in the flow and the
             list reads top to bottom, which is the state the server sends. */
          className={`border-t border-text-on-accent/25 ${surface}`}
        >
          <div className={PAGE_INSET}>
            {/* `max-lg:flex max-lg:flex-col` exists only to give the three
                parts an order below `lg`, where there is no grid — the picture
                is moved ahead of the words, so a phone meets the illustration
                before the description rather than after it.

                The variants are `max-lg:` rather than plain classes neutralised
                at `lg` on purpose. At `lg` the parts are placed by explicit
                column lines on one row, and a stray `order` there would make
                the auto-placement cursor run past the text's own columns and
                drop it onto a second row. Scoping the rule to below `lg` means
                `lg` never sees an order at all, and if these variants ever
                failed to compile the layout would simply stay as it is. */}
            <div
              className={`${PAD.top} ${PAD.bottom} max-lg:flex max-lg:flex-col ${GRID}`}
            >
              <span
                className={`type-accent-2xl text-text-on-accent max-lg:order-1 ${AREA.number}`}
              >
                {String(index + 1).padStart(2, "0")}
              </span>

              <div className={`max-lg:order-3 ${AREA.text}`}>
                {/* The measured element. Its bottom edge is where every row
                    below it stops, so its own padding is the band's tail. */}
                <h3
                  ref={slot(titleRefs, index)}
                  className={`mt-3 type-h1-alt text-text-on-accent lg:mt-0 ${PAD.tail}`}
                >
                  {service.name}
                </h3>

                <p className="max-w-xl text-accent-lg text-text-on-accent pt-8">
                  {service.summary}
                </p>

              </div>

              {/* The media, and anything stuck to it. The wrapper carries the
                  grid area and the width; the box inside carries the ratio and
                  the fill, so the sticker can be positioned against the
                  image's own edges rather than the column's. */}
              <div
                className={`relative mt-8 w-full max-w-md max-lg:order-2 lg:mt-0 lg:max-w-none ${AREA.media}`}
              >
                {/* The row's illustration, or the empty tinted box if it has
                    none yet. Decorative either way: the title and description
                    beside it say everything the picture does, so the image has
                    an empty `alt`. Nothing is hidden on the wrapper, because
                    the sticker inside it is real copy and would be announced
                    to nobody.

                    The tint in MEDIA shows while the image loads, and the ratio
                    holds the space, so nothing moves when it arrives. The
                    wrapper caps the width below `lg`, where a full-width 4:5
                    picture per row would make the section several screens
                    taller. */}
                {IMAGES[service.slug] ? (
                  <Image
                    src={IMAGES[service.slug]}
                    alt=""
                    width={MEDIA_SIZE.width}
                    height={MEDIA_SIZE.height}
                    sizes={MEDIA_SIZES}
                    className={`w-full rounded-md object-cover ${MEDIA}`}
                  />
                ) : (
                  <div
                    aria-hidden="true"
                    className={`w-full rounded-md ${MEDIA}`}
                  />
                )}

                {/* Stuck to the image's bottom-left corner, hanging 8px past
                    its left edge. Dark ink, not the section's white: on the
                    Websites row it sits on the illustration's bright yellow,
                    where white text all but disappears.

                    On a phone the image's left edge sits on the 24px page
                    gutter, so an 8px overhang stays inside the screen. */}
                {service.slug === STICKER_SLUG ? (
                  <ConvoSticker className="absolute -left-2 -bottom-6 font-medium text-text-primary/80" />
                ) : null}
              </div>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
