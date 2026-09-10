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
 * A plain arrow pointing right, for a control that leads somewhere.
 *
 * The up-right mark above says "away" — it is what the site's text links carry.
 * This one says "onward", which is what a band you walk through wants. Same
 * 24x24 box and the same stroke weight, so the two are interchangeable.
 */
export function ArrowRightIcon({ className, ...props }: IconProps) {
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
        d="M4 12h15M12.5 5.5 19 12l-6.5 6.5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Two hands clapping — the mark from the "we should have a convo!" sticker on
 * designally.co/online-brand-guide.
 *
 * Traced from the live page's own inline SVG, carried across path for path. The
 * eight fills were `black` there; they are `currentColor` here, because the
 * sticker is used on the brand-orange section where black would disappear —
 * same reason BrushUnderline dropped its hard-coded hex.
 *
 * The 80x80 box is square, so a single size utility is enough.
 */
export function ClappingHandsIcon({ className, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="80"
      height="80"
      viewBox="0 0 80 80"
      fill="none"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <path
        d="M44.7677 15.7568C45.7159 13.0546 43.8635 11.4104 42.3715 13.6475C41.2768 15.3065 39.9936 19.8097 40.4053 20.5875C41.3609 22.3608 43.1574 20.3629 44.7677 15.7568Z"
        fill="currentColor"
      />
      <path
        d="M32.9019 22.4006C34.2696 22.6605 34.6368 21.8314 34.2039 19.465C33.3248 14.7974 31.648 13.026 29.2985 14.3054C28.1827 14.9062 31.3827 22.1164 32.9019 22.4006Z"
        fill="currentColor"
      />
      <path
        d="M19.8514 25.2005C23.0874 27.0603 25.2758 27.7944 26.2761 27.2923C27.5174 26.6765 27.2556 26.2624 24.6688 24.6852C21.3684 22.6421 19.6308 22.1297 18.0917 22.7389C16.9976 23.1674 17.4337 23.7939 19.8514 25.2005Z"
        fill="currentColor"
      />
      <path
        d="M45.6077 22.9112C44.9896 23.7704 44.9922 23.7913 45.5836 24.1233C47.2669 25.0666 48.8109 23.9688 54.6855 17.5986C56.2612 15.8818 53.2111 15.0391 51.33 16.6866C50.3515 17.5467 46.3361 21.9114 45.6077 22.9112Z"
        fill="currentColor"
      />
      <path
        d="M75.0212 57.605C74.2164 57.0865 73.5997 56.015 73.1971 54.4299C72.9175 53.3391 68.3738 35.3013 66.7268 30.5987C65.3659 26.689 62.6696 25.0825 60.6912 25.2142C59.4499 25.2997 58.8368 26.2008 58.2972 25.9474C56.8349 25.2533 56.4107 24.9012 55.0873 25.1876C54.465 25.3048 53.1091 25.8496 52.6784 26.3256C52.3948 26.6143 51.9976 26.662 51.0916 26.5375C46.6454 25.905 45.2349 30.2326 47.9312 36.2517C49.4693 39.6945 50.8702 37.9351 49.905 33.787C48.63 28.2971 48.6851 27.6965 50.4962 28.1153C51.4775 28.3368 51.5294 28.4154 51.5839 29.5757C51.652 31.201 53.6659 38.4265 54.1168 38.6481C55.3575 39.2627 56.075 37.8188 55.4598 35.8773C53.7666 30.4377 54.0421 26.9043 56.1543 27.1808C56.8018 27.2727 57.3297 27.782 57.4076 28.4303C58.2686 34.7124 58.8365 38.9083 60.7604 38.6771C61.9733 38.5313 61.9784 38.5731 61.0506 33.1477C60.0617 27.3901 60.7141 26.9935 61.7765 27.184C63.3166 27.4656 63.8802 30.9195 64.1397 31.843C64.1422 31.8639 70.0549 53.174 70.0599 53.2158C71.0504 58.1034 74.6447 62.0629 76.6328 60.4238C77.0368 60.0782 75.9875 58.2314 75.0212 57.605Z"
        fill="currentColor"
      />
      <path
        d="M20.2014 37.462C19.7967 34.0951 19.8059 33.8183 20.3846 32.985C21.4082 31.4406 21.938 32.671 22.9421 39.0844C23.6748 43.7696 23.7033 43.8298 24.7423 44.002C26.0866 44.2435 26.1392 43.622 25.3545 38.3278C24.6326 33.5564 24.6334 33.3866 25.1854 32.6839C26.3236 31.2106 26.6583 31.7007 27.7474 36.1734C28.3928 38.8961 28.5369 40.4487 28.3842 42.8855C28.3526 43.5045 28.4797 43.6801 28.9992 43.7662C30.4012 43.9584 30.576 43.4707 30.4958 39.4495C30.3591 32.4864 29.1693 30.5292 25.2746 30.9548C24.1219 31.0721 22.7868 31.084 22.3016 30.9302C21.8189 30.7973 20.7557 30.7765 19.9426 30.8954C19.1295 31.0144 17.7836 31.1125 16.9763 31.1034C15.9993 31.0935 15.2147 31.2727 14.6803 31.5915C12.4085 32.9889 12.1461 34.3357 11.155 49.9201C10.9906 52.6129 10.8414 55.9615 10.8584 57.3384C10.8697 59.904 10.3457 62.9582 9.46612 65.5248C8.85158 67.2958 9.11271 67.8796 10.4093 67.7238C12.7306 67.4449 14.4531 63.4193 14.3803 58.4002C14.3355 55.7325 14.6858 54.5873 14.7986 48.464C14.9931 36.6666 15.125 35.293 16.1327 33.793C17.5193 31.7382 17.4458 32.3623 18.9567 43.1698C19.012 43.6299 19.473 43.9351 19.9281 43.838C20.757 43.6748 20.8523 42.8784 20.2014 37.462Z"
        fill="currentColor"
      />
      <path
        d="M62.6676 61.6144C61.0586 59.3468 60.9439 59.2758 58.5716 59.3063C55.6898 59.3344 53.3608 58.4899 52.2287 57.0136C49.7337 53.7282 45.6985 44.6878 45.7843 42.5773C45.8951 39.6152 46.8821 39.7087 48.8476 42.8244C50.3931 45.2693 51.3193 46.0914 54.4875 47.917C55.8997 48.7231 56.7974 49.485 57.4433 50.4469C58.2424 51.6238 58.4975 51.8053 59.2504 51.7148C61.8226 51.4057 58.0775 46.1915 54.82 45.5646C53.4313 45.3072 52.9704 45.002 52.8875 44.3119C52.4728 40.8613 46.9831 37.7236 44.4822 39.5092C42.3351 41.0613 42.378 43.0079 44.6635 48.6096C49.0512 59.3472 51.0375 61.3997 56.8278 61.213C59.0906 61.1532 59.6795 61.4643 61.0626 63.4407C62.9594 66.1616 64.4983 63.9613 64.0875 63.544C63.9394 63.3708 63.306 62.5135 62.6676 61.6144Z"
        fill="currentColor"
      />
      <path
        d="M32.1627 42.3692C30.7215 43.2637 29.2805 45.2189 28.7705 46.9774C28.396 48.274 28.2647 48.4171 27.1163 48.746C24.6127 49.4499 22.6247 51.6194 22.5339 53.6881C22.4572 55.5218 24.408 56.2207 24.8812 54.5092C25.5057 52.2914 27.0454 50.4517 28.8906 49.742C30.0266 49.3085 32.0873 46.6848 33.7373 43.6438C34.7784 41.7155 35.9039 44.0199 35.3623 46.9277C33.6423 55.9172 30.6392 61.115 26.5748 62.0701C24.8642 62.4878 24.5304 62.8886 23.4 66.0157C22.6483 68.0577 22.64 68.1648 23.2081 68.4784C24.5734 69.2478 25.6599 68.2262 26.1839 65.7023C26.5475 63.9615 26.6002 63.8703 27.8382 63.4033C32.4998 61.5915 34.542 58.4609 36.9647 49.493C38.8156 42.6517 36.7246 39.5511 32.1627 42.3692Z"
        fill="currentColor"
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
