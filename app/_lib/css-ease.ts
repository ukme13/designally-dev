/**
 * Rebuilds a CSS easing token as an ease GSAP can run.
 *
 * GSAP cannot read a CSS custom property, so an animation that wants to match
 * the site's motion has two bad options: copy the curve into the component, or
 * approximate it with a built-in. The first puts a raw cubic-bezier in a
 * component, which the project rules forbid and which quietly goes stale when
 * the token moves; the second is a guess.
 *
 * This takes the third option — read the token off the document at runtime and
 * hand its control points to CustomEase. `app/tokens.css` stays the single
 * definition, and a change there reaches the JavaScript animations too.
 *
 * CustomEase ships inside the installed GSAP, so this adds no dependency. It is
 * passed in rather than imported here because GSAP is loaded dynamically at
 * every call site, and importing it in this module would pull it into any
 * bundle that touches these helpers.
 */

const CUBIC_BEZIER = /cubic-bezier\(([^)]+)\)/;

/**
 * @param create   `CustomEase.create`, from the caller's dynamic import.
 * @param token    Custom property name, e.g. `--ease-out`.
 * @param id       Name to register the rebuilt curve under.
 * @param fallback A built-in ease, used when the token is missing or is not a
 *                 cubic-bezier — `ease-linear` and the keyword easings are not
 *                 convertible, and neither is a token that has been renamed.
 * @returns The ease name to hand to GSAP.
 */
export function cssEase(
  create: (id: string, data: string) => unknown,
  token: string,
  id: string,
  fallback: string,
): string {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(token);
  const match = CUBIC_BEZIER.exec(raw);
  if (!match) return fallback;

  const points = match[1].split(",").map((part) => Number(part.trim()));
  if (points.length !== 4 || points.some(Number.isNaN)) return fallback;

  const [x1, y1, x2, y2] = points;
  /* CustomEase takes an SVG path, so the four control numbers become the two
     control points of a curve from 0,0 to 1,1 — the same shape the browser
     would run for a CSS transition on this token. */
  create(id, `M0,0 C${x1},${y1} ${x2},${y2} 1,1`);
  return id;
}
