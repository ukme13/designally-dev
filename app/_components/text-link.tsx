import Link from "next/link";

import Arrow from "@/app/_components/arrow";

export type TextLinkTone = "default" | "inverse";

const BASE =
  "inline-flex items-center gap-3 text-sm font-medium transition-colors duration-300 ease-standard";

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
  sweep = false,
  className,
}: TextLinkProps) {
  return (
    <Link
      href={href}
      className={`${BASE} ${TONES[tone]}${sweep ? ` ${SWEEP}` : ""}${className ? ` ${className}` : ""}`}
    >
      {label} <Arrow />
    </Link>
  );
}
