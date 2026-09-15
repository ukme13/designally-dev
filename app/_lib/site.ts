/**
 * Canonical origin for the production site. Used by `metadataBase`, the
 * sitemap and robots.txt so the domain is declared in exactly one place.
 */
export const siteUrl = "https://designally.co";

/**
 * The colour declared to browsers for the UI around the page — the Android and
 * Chrome address bar, and Safari's own chrome before Safari 26.
 *
 * **A literal, and it has to be.** `viewport.themeColor` resolves when the
 * document is built, so it cannot read a CSS custom property; this is the one
 * place the value is mirrored out of `app/tokens.css`. It is `--surface-base` /
 * `--color-cream`, the body's own background. Keep the two in step.
 *
 * Removed on 15 September 2026 to test whether declaring a `theme-color` was
 * what stopped Safari 26 using its translucent toolbar material, and **restored
 * the same day once device testing disproved that**: the real cause was a
 * sticky element reaching the bottom viewport edge. Its absence cost Chrome and
 * Android their cream address bar for no Safari benefit.
 */
export const themeColor = "#faf9f5";
