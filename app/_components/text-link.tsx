import Link from "next/link";

import Arrow from "@/app/_components/arrow";

export type TextLinkTone = "default" | "inverse";

const BASE =
  "inline-flex items-center gap-3 font-medium transition-colors duration-300 ease-standard";

export type TextLinkSize = "sm" | "md" | "lg";

/**
 * The link's type size, as a prop rather than something a call site overrides.
 *
 * `text-sm` used to live in BASE, which meant a caller wanting a larger link had
 * to add a competing `text-*` class and hope it won — and between two utilities
 * setting one property it is stylesheet order that decides, never the order the
 * class names are written. A prop picks exactly one of these instead.
 *
 * The arrow is a text glyph, so it grows with the label on its own.
 */
const SIZES: Record<TextLinkSize, string> = {
  /** The default, and what every existing call site gets. 14 -> 15px. */
  sm: "text-sm",
  /** For links that close a card or a panel rather than a line of prose. 18px. */
  md: "text-body-lg",
  /**
   * For a link that is the whole point of the block it sits in. 24px.
   *
   * `--text-accent-md`, used here purely as a size — the accent family is
   * Caveat, but a bare `text-*` utility carries no font, only the measurement.
   * section-title.tsx does the same with `text-accent-xl`.
   *
   * It is reached for because the body and heading scales have nothing between
   * `--text-body-lg` at 18px and `--text-h1` at 28px: `--text-h2` sits at
   * 18-20px, indistinguishable from `md`, and 28px overpowered the question it
   * sits under. The accent scale fills exactly that gap.
   */
  lg: "text-accent-md",
};

/**
 * Underline that sweeps in from the left on hover, as the header's nav links do.
 *
 * The rule is drawn by an `::after` at full width and held at `scale-x-0`, so
 * hovering only has to release it — animating a transform rather than a width,
 * which stays on the compositor and never reflows the line. `origin-left` is
 * what makes it wipe across instead of growing from the middle.
 *
 * `--ease-sweep` is a near-instant-then-glide curve, the same one the header
 * uses, so a link here and a link in the nav move identically. That pairing is
 * currently kept in step by hand: site-header.tsx holds its own copy of these
 * classes, because Tailwind reads class names as literal text and a constant
 * imported from elsewhere would compile to nothing.
 *
 * Keyboard focus gets the same sweep. The header does not do this, but a link
 * whose only affordance is a hover state is invisible to anyone tabbing to it.
 */
const SWEEP =
  "relative after:absolute after:-bottom-0.5 after:left-0 after:h-0.5 after:w-full " +
  "after:origin-left after:scale-x-0 after:bg-action-primary " +
  "after:transition-transform after:duration-700 after:ease-sweep " +
  "hover:after:scale-x-100 focus-visible:after:scale-x-100 " +
  "motion-reduce:after:transition-none";

const TONES: Record<TextLinkTone, string> = {
  /** On light surfaces. */
  default: "text-text-primary hover:text-action-primary",
  /** On dark or brand-coloured surfaces. */
  inverse: "text-white hover:text-primary-200",
};

type TextLinkProps = {
  href: string;
  label: string;
  tone?: TextLinkTone;
  /** Type size. `sm` unless a link needs more presence than running text. */
  size?: TextLinkSize;
  /** Draw the header's sweeping underline under the label on hover and focus. */
  sweep?: boolean;
  /** Layout overrides: margins, justify-between, underline. */
  className?: string;
};

/** A labelled link with the trailing arrow mark, used to close a section. */
export default function TextLink({
  href,
  label,
  tone = "default",
  size = "sm",
  sweep = false,
  className,
}: TextLinkProps) {
  return (
    <Link
      href={href}
      className={`${BASE} ${SIZES[size]} ${TONES[tone]}${sweep ? ` ${SWEEP}` : ""}${className ? ` ${className}` : ""}`}
    >
      {label} <Arrow />
    </Link>
  );
}
