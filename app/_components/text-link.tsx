import Link from "next/link";

import Arrow from "@/app/_components/arrow";

export type TextLinkTone = "default" | "inverse";

const BASE =
  "inline-flex items-center gap-3 text-sm font-medium transition-colors duration-300 ease-standard";

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
  /** Layout overrides: margins, justify-between, underline. */
  className?: string;
};

/** A labelled link with the trailing arrow mark, used to close a section. */
export default function TextLink({
  href,
  label,
  tone = "default",
  className,
}: TextLinkProps) {
  return (
    <Link
      href={href}
      className={`${BASE} ${TONES[tone]}${className ? ` ${className}` : ""}`}
    >
      {label} <Arrow />
    </Link>
  );
}
