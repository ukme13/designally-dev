type IconProps = React.SVGProps<SVGSVGElement>;

/** Menu and close marks from the original designally.co header. */
export function MenuBarsIcon({ className, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <path
        d="M4 7h16M4 12h16M4 17h16"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function CloseIcon({ className, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <path
        d="M6 6l12 12M18 6L6 18"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Trailing arrow used on drawer navigation items. */
export function ArrowUpRightIcon({ className, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <path
        d="M7 17L17 7M9 7h8v8"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * A rough, tapered brush stroke for underlining a word.
 *
 * A filled outline, not a stroked path — so unlike ScribbleUnderline there is
 * nothing here to draw on with `stroke-dasharray`. It arrives all at once, or
 * with whatever is revealing the text around it.
 *
 * `currentColor` rather than the `#F56341` the source file carried. That value
 * is `primary-300`, which is the very colour the hero background settles to, so
 * a stroke painted in it would vanish there; inheriting means the underline
 * takes the colour of the words it sits under, wherever it is used.
 *
 * The 312x12 viewBox keeps its own ratio — give it a width and the thickness
 * follows. Do NOT add `preserveAspectRatio="none"`: stretching a hand-drawn
 * stroke is what makes it stop looking hand-drawn.
 */
export function BrushUnderline({ className, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="312"
      height="12"
      viewBox="0 0 312 12"
      fill="none"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M17.864 11.2571C0.441294 11.054 -1.53117 10.7698 3.39978 9.26751C8.82378 7.60275 20.1651 7.19659 108.265 6.50633C6.5228 6.01912 -2.84617 5.45067 1.26295 3.54229C6.52264 1.14667 40.2175 1.39029 204.254 1.30908C253.399 1.26848 280.683 0.578212 294.654 0.740627C314.049 0.98425 309.283 2.85203 301.229 3.70471L305.667 3.90773C317.337 4.43558 310.269 7.76504 295.312 8.73954C282.163 9.59222 206.555 10.4856 133.741 10.648C37.4235 10.8104 37.7522 11.5007 17.864 11.2571Z"
        fill="currentColor"
      />
    </svg>
  );
}

/**
 * Staggered three-bar menu mark, from `fa-stream.svg`. Used for the mobile
 * toggle; the floating circle toggle keeps the even-width MenuBarsIcon.
 *
 * The source fill was white; it is currentColor here so the mark follows the
 * button's text colour. The glyph occupies 28 of the 44 artboard, so render it
 * about a third larger than a tightly-cropped icon to match optically.
 */
export function MenuStreamIcon({ className, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 44 44"
      fill="none"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <path
        d="M8 12H32.5V15.5H8V12ZM11.5 20.75H36V24.25H11.5V20.75ZM32.5 29.5V33H8V29.5H32.5Z"
        fill="currentColor"
      />
    </svg>
  );
}

/**
 * The two-tone "))" mark that sits before a section title.
 *
 * Two halves of the same curve, the back one a step lighter than the front.
 *
 * In `brand` tone that pair is `primary-250` behind `primary-300` — the palette
 * entries for the exact colours the original mark hard-codes as #F78267 and
 * #F56341, so this is the same drawing taking its colour from the token layer
 * rather than from hexes baked into the file.
 *
 * In `current` tone both halves come from the inherited text colour, the back
 * one held at 60%. That is for placing the mark on a coloured surface, where
 * the brand oranges would vanish into the background.
 *
 * The 18x40 viewBox is the source artwork's. Height is the dimension worth
 * setting — `w-auto` then keeps the width honest at any size.
 */
export function DoubleChevronIcon({
  tone = "brand",
  className,
  ...props
}: IconProps & { tone?: "brand" | "current" }) {
  const behind = tone === "brand" ? "fill-primary-250" : "fill-current/60";
  const front = tone === "brand" ? "fill-primary-300" : "fill-current";
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="40"
      viewBox="0 0 18 40"
      fill="none"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <path
        d="M9 39.5L9 0.5C14.521 5.25546 18 12.2282 18 19.9967C18 27.7653 14.521 34.7413 9 39.5Z"
        className={behind}
      />
      <path
        d="M-7.5107e-07 39.5L9.53674e-07 0.5C5.52098 5.25546 9 12.2282 9 19.9967C9 27.7653 5.52098 34.7413 -7.5107e-07 39.5Z"
        className={front}
      />
    </svg>
  );
}

/**
 * White wave that masks the top edge of the closing block, so the section
 * reads as a curve rising out of the page above it. `preserveAspectRatio`
 * is none so it stretches to whatever height it is given.
 */
export function CtaWaveShape({ className, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 1000 100"
      preserveAspectRatio="none"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <path
        d="M500,97C126.7,96.3,0.8,19.8,0,0v100l1000,0V1C1000,19.4,873.3,97.8,500,97z"
        fill="currentColor"
      />
    </svg>
  );
}

/**
 * Hand-drawn loop loosely circling the contact link.
 *
 * `pathLength="1"` normalises the curve so a single dash covers all of it:
 * the loop reads as fully drawn at rest, and `stroke-dashoffset` can be run
 * from 1 to 0 to draw it without knowing the real curve length. See the
 * `scribble` keyframes in tokens.css.
 */
export function ScribbleUnderline({ className, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 500 150"
      preserveAspectRatio="none"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <path
        d="M325,18C228.7-8.3,118.5,8.3,78,21C22.4,38.4,4.6,54.6,5.6,77.6c1.4,32.4,52.2,54,142.6,63.7 c66.2,7.1,212.2,7.5,273.5-8.3c64.4-16.6,104.3-57.6,33.8-98.2C386.7-4.9,179.4-1.4,126.3,20.7"
        fill="none"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
        pathLength="1"
        strokeDasharray="1"
      />
    </svg>
  );
}
