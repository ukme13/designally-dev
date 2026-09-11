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
 *   orange          #f56341  dark ink  5.2:1  (white would be 3.1:1, failing)
 *   cream           #faf9f5  dark ink  15.3:1
 *   dark            #11100e  white     19.0:1
 *   surface-raised  #ffffff  dark ink  16.1:1
 *
 * Dark ink is `--ink-primary`, #212121. Orange takes dark ink, not the white
 * the rest of the site uses on orange: the site's white-on-orange passes only
 * because that text is large, and a card's description is not.
 *
 * The Studio's schema must offer exactly these four names. Adding a fifth
 * means adding it here first.
 */
export const SWATCHES = {
  orange: { surface: "bg-primary-300", ink: "text-text-primary" },
  cream: { surface: "bg-surface-base", ink: "text-text-primary" },
  dark: { surface: "bg-surface-inverse", ink: "text-text-on-accent" },
  "surface-raised": { surface: "bg-surface-raised", ink: "text-text-primary" },
} as const;

export type Swatch = keyof typeof SWATCHES;

/** Used when an insight has no colour, including every static fallback card. */
export const DEFAULT_SWATCH: Swatch = "cream";

/** Narrows a value from the CMS, which may be missing or out of date. */
export function isSwatch(value: unknown): value is Swatch {
  return typeof value === "string" && Object.hasOwn(SWATCHES, value);
}
