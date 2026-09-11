/**
 * The colour presets for insight cards. ADR-007, decision 7.
 *
 * An insight in Sanity stores one of these NAMES, never a colour value. The site
 * maps the name to classes that already exist in app/tokens.css, so every
 * colour stays in that file and CMS content cannot introduce a new one.
 *
 * The preset fills the shape behind the card's photo (showing while it loads,
 * or as a solid shape when there is no photo), and it is the card's
 * background. `ink` is the colour for words on that surface, chosen for
 * contrast. WCAG AA needs 4.5:1 for normal-size text:
 *
 *   orange          #f56341  white     3.1:1  (fails AA for small text)
 *   cream           #faf9f5  dark ink  15.3:1
 *   dark            #11100e  white     19.0:1
 *   surface-raised  #ffffff  dark ink  16.1:1
 *
 * Dark ink is `--ink-primary`, #212121 (5.2:1 on orange).
 *
 * **Orange takes white, by the owner's choice, and it fails AA for small text.**
 * White on orange is 3.1:1. That passes for the large title (3:1 is enough
 * there) but not for the topic, date and summary, which need 4.5:1. Dark ink
 * would pass. The rest of the site puts white on orange too, but only on large
 * text. Recorded as a known accessibility issue in docs/updates/2026-09-11.md.
 *
 * The Studio's schema must offer exactly these four names. Adding a fifth
 * means adding it here first.
 */
/**
 * Four classes per preset:
 *
 *   surface  the card's background, and what sits behind the photo
 *   ink      every word on the card
 *   edge     the card's border: a hairline on the two light surfaces, which
 *            would otherwise melt into the cream page, and transparent on the
 *            two strong ones, so every card is the same size
 *   fill     the shape when there is no photo. The ink colour, because a shape
 *            in the surface colour would vanish into the card behind it.
 */
export const SWATCHES = {
  orange: {
    surface: "bg-primary-300",
    ink: "text-text-on-accent",
    edge: "border-transparent",
    fill: "bg-text-on-accent",
  },
  cream: {
    surface: "bg-surface-base",
    ink: "text-text-primary",
    edge: "border-border-default",
    fill: "bg-text-primary",
  },
  dark: {
    surface: "bg-surface-inverse",
    ink: "text-text-on-accent",
    edge: "border-transparent",
    fill: "bg-text-on-accent",
  },
  "surface-raised": {
    surface: "bg-surface-raised",
    ink: "text-text-primary",
    edge: "border-border-default",
    fill: "bg-text-primary",
  },
} as const;

export type Swatch = keyof typeof SWATCHES;

/** Used when an insight from Sanity has no colour, or one this site does not know. */
export const DEFAULT_SWATCH: Swatch = "cream";

/** Narrows a value from the CMS, which may be missing or out of date. */
export function isSwatch(value: unknown): value is Swatch {
  return typeof value === "string" && Object.hasOwn(SWATCHES, value);
}
