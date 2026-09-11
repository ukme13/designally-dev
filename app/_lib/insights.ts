import { createImageUrlBuilder } from "@sanity/image-url";

import { sanityClient } from "@/app/_lib/sanity/client";
import { DEFAULT_SWATCH, isSwatch, type Swatch } from "@/app/_lib/swatches";

/**
 * Insight content. From Sanity when it is configured, from the static list
 * below when it is not. See ADR-007.
 *
 * **Which source wins.**
 *
 * - Sanity not configured (no environment variables): the static list. That is
 *   the state today, and it is what local development without a token gets.
 * - Sanity configured but unreadable (a network error, a revoked token): the
 *   static list, with the error logged so it shows in the build output. Builds
 *   never fail for want of a CMS.
 * - Sanity configured and readable: Sanity, even if it has no approved insights
 *   yet. Once the CMS is live it is the source of truth. Topping it up with
 *   static drafts would put unapproved copy beside approved content.
 *
 * **The contract with the Studio.** The queries below name the fields the
 * Studio's schema must use: `insight` with `title`, `slug`, `summary`, `topic`
 * (a reference to `topic`), `featuredOnHome`, `colour` (one of
 * app/_lib/swatches.ts), `featuredImage` (with `alt` and `decorative`), `shape`
 * (a reference to `shape`, whose `svg` is a file), `status` and `publishedAt`.
 * Renaming a field in the Studio means renaming it here too.
 */

export type InsightImage = {
  /** A 4:3 crop centred on the editor's focal point, from Sanity's image CDN. */
  src: string;
  width: number;
  height: number;
  /** Empty when the editor marked the image decorative. */
  alt: string;
};

export type Insight = {
  topic: string;
  title: string;
  summary: string;
  /** Shown in the homepage's thinking section. */
  featuredOnHome: boolean;
  /** The card's colour preset, one of app/_lib/swatches.ts. */
  colour: Swatch;
  /**
   * When it was published, as an ISO date-time from Sanity. The static list's
   * articles are planned, not written, so they have none, and none is made up.
   */
  publishedAt?: string;
  /** Only insights from Sanity have a slug or a photo. */
  slug?: string;
  image?: InsightImage;
  /**
   * The shape's SVG URL. Only ever used as a CSS mask, never put into the page
   * as markup, so a script inside an uploaded SVG cannot run. ADR-007,
   * decision 6.
   */
  shape?: string;
};

/**
 * The owner's stencils, in public/shapes/: twelve 4:3 Figma exports on a
 * 700 x 524 frame, copied unchanged. Each shape sits in the central 400 x 400
 * square, so the card's colour shows around it. Same-origin, so they are used
 * as masks directly rather than fetched and inlined. Once the Studio exists,
 * these twelve are the seed for its Shape library.
 */
const STENCIL = (n: string) => `/shapes/stencil-${n}.svg`;

/**
 * The static list: the fallback, and the seed content for the first import
 * into Sanity.
 *
 * The recommended launch set from docs/specs/HOMEPAGE.md. These articles are
 * planned, not written, so nothing links to them yet, and none has a publish
 * date or a photo. Each card shows its stencil as a solid graphic: the clover
 * (07), the pinwheel (04) and the flower (10), on three different presets, so
 * the design can be judged on each kind of surface.
 */
export const staticInsights: Insight[] = [
  {
    topic: "Rebranding",
    title: "When Is It Time to Rebrand?",
    summary:
      "The signs that a business has moved forward while its brand has stayed behind.",
    featuredOnHome: true,
    colour: "orange",
    shape: STENCIL("07"),
  },
  {
    topic: "Brand Strategy",
    title: "Brand Strategy vs Brand Identity: What Does Your Business Need First?",
    summary:
      "What each one does, how they work together, and what your business needs first.",
    featuredOnHome: true,
    colour: "dark",
    shape: STENCIL("04"),
  },
  {
    topic: "Business & Brand",
    title: "Rebranding a Family Business Without Losing Its Heritage",
    summary:
      "How to protect what matters while preparing the brand for its next generation.",
    featuredOnHome: true,
    colour: "surface-raised",
    shape: STENCIL("10"),
  },
];

/**
 * The cache tag on every insight read. The publish webhook will call
 * `revalidateTag(INSIGHT_TAG, 'max')` so that pages showing insights refresh
 * together.
 */
export const INSIGHT_TAG = "insight";

/** The card image's proportions: 4:3, as the owner chose. ADR-007. */
const IMAGE_WIDTH = 1200;
const IMAGE_HEIGHT = 900;

/** How many insights the homepage shows. Its grid is three across. */
const HOMEPAGE_COUNT = 3;

const FIELDS = `{
  title,
  "slug": slug.current,
  summary,
  "topic": topic->title,
  publishedAt,
  featuredOnHome,
  colour,
  featuredImage{ asset, hotspot, crop, alt, decorative },
  "shape": shape->svg.asset->url
}`;

/* `status == "approved"` is the site's rule, separate from Sanity's own
   published state: a published but unapproved insight never reaches the site. */
const ALL_QUERY = `*[_type == "insight" && status == "approved"] | order(publishedAt desc) ${FIELDS}`;
const FEATURED_QUERY = `*[_type == "insight" && status == "approved" && featuredOnHome == true] | order(publishedAt desc) [0...${HOMEPAGE_COUNT}] ${FIELDS}`;

/** A row as Sanity returns it. Anything may be missing on an incomplete document. */
type SanityInsight = {
  title?: string | null;
  slug?: string | null;
  summary?: string | null;
  topic?: string | null;
  publishedAt?: string | null;
  featuredOnHome?: boolean | null;
  colour?: string | null;
  featuredImage?: {
    asset?: { _ref: string } | null;
    hotspot?: { x: number; y: number; height: number; width: number } | null;
    crop?: { top: number; bottom: number; left: number; right: number } | null;
    alt?: string | null;
    decorative?: boolean | null;
  } | null;
  shape?: string | null;
};

const imageUrls = sanityClient ? createImageUrlBuilder(sanityClient) : null;

/** One Sanity row as an Insight, or nothing if it lacks a title or summary. */
function toInsight(row: SanityInsight): Insight[] {
  if (!row.title || !row.summary) return [];

  const photo = row.featuredImage;
  const image =
    imageUrls && photo?.asset
      ? {
          /* `fit('crop')` with both dimensions honours the editor's hotspot and
             crop, so the 4:3 frame lands where they chose. */
          src: imageUrls
            .image({ asset: photo.asset, hotspot: photo.hotspot ?? undefined, crop: photo.crop ?? undefined })
            .width(IMAGE_WIDTH)
            .height(IMAGE_HEIGHT)
            .fit("crop")
            .auto("format")
            .url(),
          width: IMAGE_WIDTH,
          height: IMAGE_HEIGHT,
          alt: photo.decorative ? "" : (photo.alt ?? ""),
        }
      : undefined;

  return [
    {
      topic: row.topic ?? "",
      title: row.title,
      summary: row.summary,
      featuredOnHome: row.featuredOnHome ?? false,
      publishedAt: row.publishedAt ?? undefined,
      colour: isSwatch(row.colour) ? row.colour : DEFAULT_SWATCH,
      slug: row.slug ?? undefined,
      image,
      shape: row.shape ?? undefined,
    },
  ];
}

/**
 * Read from Sanity. `null` means "use the static list": either Sanity is not
 * configured, or it could not be read.
 */
async function fromSanity(query: string): Promise<Insight[] | null> {
  if (!sanityClient) return null;
  try {
    const rows = await sanityClient.fetch<SanityInsight[]>(
      query,
      {},
      /* Cached by Next and tagged, so the page stays static and the webhook
         can refresh it. The client passes these straight through to fetch. */
      { cache: "force-cache", next: { tags: [INSIGHT_TAG] } },
    );
    return rows.flatMap(toInsight);
  } catch (error) {
    console.error("Sanity could not be read. Using the static insights.", error);
    return null;
  }
}

/** Every approved insight, newest first. */
export async function getInsights(): Promise<Insight[]> {
  return (await fromSanity(ALL_QUERY)) ?? staticInsights;
}

/** The homepage's insights: approved, featured, newest first, at most three. */
export async function getFeaturedInsights(): Promise<Insight[]> {
  return (
    (await fromSanity(FEATURED_QUERY)) ??
    staticInsights.filter((insight) => insight.featuredOnHome)
  );
}
