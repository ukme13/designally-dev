import { FollowMark } from "@/app/_components/social-icons";
import { socialProfiles } from "@/app/_lib/social";

type SocialLinksProps = {
  /** Show the "Follow us" heading above the row. */
  withLabel?: boolean;
  /** `brand` for light surfaces, `inverse` for the orange closing block. */
  tone?: "brand" | "inverse";
};

/**
 * Row of social marks.
 *
 * Each source file draws the complete badge — the outer shape with the glyph
 * knocked out — so the mark takes the text colour and the glyph shows the
 * surface behind it. The files carry 8px of padding inside a 44 artboard, so
 * the visible badge is 64% of the box.
 *
 * A profile with no confirmed URL renders as a non-interactive image rather
 * than a dead link, and becomes a link as soon as one is set.
 */
const TONES = {
  brand: "text-action-primary",
  inverse: "text-white",
} as const;

const HOVER = {
  brand: "hover:text-action-hover",
  inverse: "hover:text-text-primary",
} as const;

export default function SocialLinks({
  withLabel = true,
  tone = "brand",
}: SocialLinksProps) {
  const tile = `inline-flex size-14 items-center justify-center ${TONES[tone]}`;

  return (
    <div className={withLabel ? undefined : "flex flex-col items-center"}>
      {withLabel ? (
        <p className="flex items-center gap-3 type-label text-text-primary">
          <FollowMark className="h-6 w-auto shrink-0" />
          Follow us
        </p>
      ) : null}

      <ul
        className={`-ml-2 flex flex-wrap items-center ${withLabel ? "mt-4" : ""}`}
      >
        {socialProfiles.map(({ label, href, Icon }) => (
          <li key={label}>
            {href ? (
              <a
                href={href}
                target="_blank"
                rel="noreferrer noopener"
                aria-label={label}
                className={`${tile} transition-colors duration-150 ${HOVER[tone]}`}
              >
                <Icon className="size-14" />
              </a>
            ) : (
              <span role="img" aria-label={label} className={tile}>
                <Icon className="size-14" />
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
