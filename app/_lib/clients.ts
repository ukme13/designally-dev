/**
 * Client logos approved for public display on the homepage.
 *
 * Every client logo needs the client's permission (docs/specs/HOMEPAGE.md,
 * "Trust and proof": "Every client logo requires permission"). The strip reads
 * only this list and renders nothing when it is empty, so no logo reaches the
 * page without a recorded approval.
 *
 * The shape follows the Client model in docs/product/CONTENT-MODEL.md: name,
 * slug, logo, and its approved-for-public-display flag. That flag is typed as
 * the literal `true`, so an unapproved client cannot be added here by accident,
 * and every entry says where its approval is recorded.
 *
 * The 16 below, in order, come from docs/assets/client-logos/manifest.json: two
 * rows of eight, row 1 first. The strip puts the first half of this list in
 * the top row, so the order here IS the layout. Their permission is recorded in
 * docs/content/CLIENT-LOGO-PERMISSIONS.md.
 *
 * The files in public/clients/ are one-ink PNG masks made from the 174 × 123
 * JPGs on the old About page by docs/assets/client-logos/prepare-masks.py:
 * white made transparent, margins cropped, nothing redrawn or upscaled. They
 * are black on purpose, because the strip paints them in its own ink. Replace
 * any of them with the client's official transparent SVG or PNG when one is
 * available, and update its width and height here.
 *
 * To add a client:
 *   1. Record the permission in the planning docs, with who gave it and when.
 *   2. Put the logo in `public/clients/` as an SVG or a PNG with a transparent
 *      background. Colour does not matter: only the transparency is used.
 *   3. Add an entry with the file's own width and height, so the logo keeps its
 *      proportions.
 */
export type ClientLogo = {
  name: string;
  slug: string;
  /** Path under `public/`: an SVG, or a PNG with a transparent background. */
  logo: string;
  /** The logo file's intrinsic size. Only the ratio matters. */
  width: number;
  height: number;
  /**
   * Optical size correction, as a multiple. Optional; 1 by default.
   *
   * Every logo gets the same height, which makes a compact square mark look
   * larger than a long wordmark. The values below started from
   * (3.5 / aspect ratio) ^ 0.4, kept between 0.65 and 1.45: close to equal
   * visual weight, without tall marks towering over the row. Adjust by eye.
   */
  optical?: number;
  /** Mirrors the content model's flag. Only `true` can be written here. */
  approvedForPublicDisplay: true;
  /** Where the permission is recorded: a document path and a date. */
  permission: string;
};

/** The owner's confirmation covering all 16 logos below. */
const PERMISSION = "docs/content/CLIENT-LOGO-PERMISSIONS.md — 2026-09-11";

export const clientLogos: ClientLogo[] = [
  {
    name: "Marriott",
    slug: "marriott",
    logo: "/clients/marriott.png",
    width: 102,
    height: 77,
    optical: 1.45,
    approvedForPublicDisplay: true,
    permission: PERMISSION,
  },
  {
    name: "SCG",
    slug: "scg",
    logo: "/clients/scg.png",
    width: 153,
    height: 57,
    optical: 1.11,
    approvedForPublicDisplay: true,
    permission: PERMISSION,
  },
  {
    name: "Lazada",
    slug: "lazada",
    logo: "/clients/lazada.png",
    width: 154,
    height: 41,
    optical: 0.97,
    approvedForPublicDisplay: true,
    permission: PERMISSION,
  },
  {
    name: "CP Land",
    slug: "cp-land",
    logo: "/clients/cp-land.png",
    width: 162,
    height: 35,
    optical: 0.89,
    approvedForPublicDisplay: true,
    permission: PERMISSION,
  },
  {
    name: "LINE",
    slug: "line",
    logo: "/clients/line.png",
    width: 148,
    height: 56,
    optical: 1.12,
    approvedForPublicDisplay: true,
    permission: PERMISSION,
  },
  {
    name: "Major Cineplex",
    slug: "major-cineplex",
    logo: "/clients/major-cineplex.png",
    width: 74,
    height: 108,
    optical: 1.45,
    approvedForPublicDisplay: true,
    permission: PERMISSION,
  },
  {
    name: "Bangkok University",
    slug: "bangkok-university",
    logo: "/clients/bangkok-university.png",
    width: 89,
    height: 103,
    optical: 1.45,
    approvedForPublicDisplay: true,
    permission: PERMISSION,
  },
  {
    name: "Bitazza",
    slug: "bitazza",
    logo: "/clients/bitazza.png",
    width: 112,
    height: 105,
    optical: 1.45,
    approvedForPublicDisplay: true,
    permission: PERMISSION,
  },
  {
    name: "SO/ Bangkok",
    slug: "so-bangkok",
    logo: "/clients/so-bangkok.png",
    width: 163,
    height: 19,
    optical: 0.7,
    approvedForPublicDisplay: true,
    permission: PERMISSION,
  },
  {
    name: "SC ASSET",
    slug: "sc-asset",
    logo: "/clients/sc-asset.png",
    width: 159,
    height: 49,
    optical: 1.03,
    approvedForPublicDisplay: true,
    permission: PERMISSION,
  },
  {
    name: "DDProperty",
    slug: "ddproperty",
    logo: "/clients/ddproperty.png",
    width: 154,
    height: 37,
    optical: 0.93,
    approvedForPublicDisplay: true,
    permission: PERMISSION,
  },
  {
    name: "StashAway",
    slug: "stashaway",
    logo: "/clients/stashaway.png",
    width: 160,
    height: 39,
    optical: 0.94,
    approvedForPublicDisplay: true,
    permission: PERMISSION,
  },
  {
    name: "Boonthavorn",
    slug: "boonthavorn",
    logo: "/clients/boonthavorn.png",
    width: 162,
    height: 31,
    optical: 0.85,
    approvedForPublicDisplay: true,
    permission: PERMISSION,
  },
  {
    name: "Banpu NEXT",
    slug: "banpu-next",
    logo: "/clients/banpu-next.png",
    width: 153,
    height: 19,
    optical: 0.72,
    approvedForPublicDisplay: true,
    permission: PERMISSION,
  },
  {
    name: "Pomelo",
    slug: "pomelo",
    logo: "/clients/pomelo.png",
    width: 152,
    height: 35,
    optical: 0.92,
    approvedForPublicDisplay: true,
    permission: PERMISSION,
  },
  {
    name: "Aroma Group",
    slug: "aroma-group",
    logo: "/clients/aroma-group.png",
    width: 154,
    height: 53,
    optical: 1.08,
    approvedForPublicDisplay: true,
    permission: PERMISSION,
  },
];
