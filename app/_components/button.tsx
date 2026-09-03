import Link from "next/link";
import type { ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "outline" | "inverse";

/**
 * Shape, size and rhythm shared by every button. Deliberately sets no
 * justify-* or width so a call site can override those without depending on
 * Tailwind's stylesheet ordering. Height and horizontal padding
 * come from the --control-height / --control-padding-inline tokens so a control
 * resize is a one-line token change rather than an edit per call site.
 */
const BASE =
  "inline-flex min-h-(--control-height) items-center gap-3 rounded-pill px-(--control-padding-inline) type-button transition-colors duration-300 ease-standard";

const VARIANTS: Record<ButtonVariant, string> = {
  /** Solid brand fill. The main call to action on light surfaces. */
  primary: "bg-action-primary text-white hover:bg-action-hover",
  /** Neutral outline. Secondary action beside a primary button. */
  secondary:
    "border border-border-strong text-text-primary hover:border-action-primary hover:text-action-primary",
  /** Brand outline that fills on hover — the header contact treatment. */
  outline:
    "border border-solid border-action-primary text-action-primary hover:bg-action-primary hover:text-white",
  /** Solid white. For use on brand-coloured surfaces. */
  inverse: "bg-white text-text-primary",
};

type ButtonProps = {
  children: ReactNode;
  variant?: ButtonVariant;
  /** Layout and one-off overrides: margins, width, text-transform. */
  className?: string;
  /**
   * Renders a link. A path beginning with "/" uses next/link; anything else
   * (mailto:, tel:, an external URL) renders a plain anchor. Omit for a
   * native <button>.
   */
  href?: string;
  type?: "button" | "submit";
  "aria-label"?: string;
};

export default function Button({
  children,
  variant = "primary",
  className,
  href,
  type = "button",
  "aria-label": ariaLabel,
}: ButtonProps) {
  const classes = `${BASE} ${VARIANTS[variant]}${className ? ` ${className}` : ""}`;

  if (href?.startsWith("/")) {
    return (
      <Link href={href} className={classes} aria-label={ariaLabel}>
        {children}
      </Link>
    );
  }

  if (href) {
    return (
      <a href={href} className={classes} aria-label={ariaLabel}>
        {children}
      </a>
    );
  }

  return (
    <button type={type} className={classes} aria-label={ariaLabel}>
      {children}
    </button>
  );
}
