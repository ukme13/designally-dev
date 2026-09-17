import type { CSSProperties } from "react";

/**
 * An SVG used as a CSS mask, so the element's own background is what colours it.
 *
 * The files carry their own `fill`, so `currentColor` cannot reach them —
 * masking is how a brand mark takes the colour of whatever it is dropped into.
 * It is also why these are never put into the page as markup: a script inside
 * an uploaded SVG cannot run from a mask. See ADR-007, decision 6.
 *
 * **`fit` is the only thing that ever varied**, across the four copies of this
 * function that existed before it moved here:
 *
 *   "stretch"   `mask-size: 100% 100%`. The file is fitted to its box and the
 *               box is already the right ratio, so stretching is exact — the
 *               header's wordmark against `aspect-[536/50]`, or an insight's
 *               4:3 stencil against a 4:3 picture.
 *   "contain"   Scales the artwork down inside its box instead. For a file
 *               with padding around the artwork, or one dropped into a box of
 *               a different shape, where stretching would distort it.
 *
 * `client-logo-strip.tsx` kept a local copy precisely because the header's
 * hard-coded `100% 100%` was wrong for a padded client logo. That reason is
 * what the parameter answers, so one helper can now serve both.
 *
 * `mask-position: center` is set for every caller. Under "contain" it is what
 * centres the artwork; under "stretch" the mask already fills the box, so it
 * changes nothing.
 */
export function maskStyle(
  src: string,
  fit: "stretch" | "contain" = "stretch",
): CSSProperties {
  const size = fit === "contain" ? "contain" : "100% 100%";

  return {
    maskImage: `url("${src}")`,
    WebkitMaskImage: `url("${src}")`,
    maskSize: size,
    WebkitMaskSize: size,
    maskRepeat: "no-repeat",
    WebkitMaskRepeat: "no-repeat",
    maskPosition: "center",
    WebkitMaskPosition: "center",
  };
}
