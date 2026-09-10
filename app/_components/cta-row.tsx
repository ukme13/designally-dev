import Link from "next/link";

import { ArrowRightIcon } from "@/app/_components/icons";
import { PAGE_INSET } from "@/app/_components/layout-styles";

/**
 * A full-bleed band that closes a section: one big label, an arrow, and a
 * colour that wipes across it on hover. The whole band is the link.
 *
 * ── The knobs ────────────────────────────────────────────────────────────
 *   band height   HEIGHT
 *   label         TYPE
 *   wipe speed    SWEEP
 *   colours       TONES
 * ─────────────────────────────────────────────────────────────────────────
 *
 * ## The wipe
 *
 * One panel behind the words, sliding from `-translate-x-full` to `0`, with the
 * band clipping it. The words sit on top and never move, so it reads as a
 * colour crossing fixed text.
 *
 * A transform rather than a width or a `clip-path`: it stays on the compositor
 * and never reflows the line. `origin`-based `scale-x` would do as well here
 * and is what text-link.tsx uses for its underline — a translate is used
 * instead because a panel this size has to arrive from off the edge, not grow
 * out of it.
 *
 * **This works because the ink does not change.** White reads on the orange the
 * band stands on and on the black that crosses it, so there is one label and
 * one colour for it. A tone whose fill needs the ink to flip cannot be built
 * this way: the colour would change over the whole label at once, leaving the
 * half the wipe had already reached unreadable for the length of the
 * transition. That needs the words drawn twice, once per ink, inside a panel
 * with a counter-transform to hold them still — worth knowing before adding a
 * tone whose fill and ink do not both suit one label colour.
 *
 * Keyboard focus gets the same wipe. A band whose only affordance is a hover
 * state is invisible to anyone tabbing to it — the same reason text-link.tsx
 * adds `focus-visible` to its underline.
 *
 * ## Layout
 *
 * The band is edge to edge and the words are inset to the page grid, so it has
 * to be rendered OUTSIDE a padded container and inset itself — the same
 * arrangement as service-rows.tsx, which is what it is designed to sit under.
 *
 * **No border of its own.** The list above closes itself with its own bottom
 * rule, and the band's other edge is wherever the caller puts it — here the
 * section boundary, where the colour change is the edge. A rule would also
 * misbehave under the wipe: `inset-0` is the padding box, so the fill stops
 * short of a border, and a 1px strip of the section showing through beneath a
 * black band reads as a seam. A caller that wants one can pass it in
 * `className` and pick a colour that suits its own surface.
 */

export type CtaRowTone = "default" | "inverse";

/** 160px. The band is the control, so this is its whole presence. */
const HEIGHT = "h-40";

/**
 * The label: Poppins, at the same size as the section titles above it.
 *
 * `font-sans` with a bare `text-*` size, not one of the `type-*` utilities —
 * every one of those at this scale carries `--font-display`, which is the
 * serif. A bare `text-*` utility is a measurement and nothing else, so the
 * family has to be stated beside it. section-title.tsx does the same.
 *
 * Stepped down below `lg`. At 44px "Explore our services" wraps on a phone,
 * which the band has the height to absorb but does not need to.
 */
const TYPE = "font-sans text-h1 font-medium lg:text-accent-xl";

/**
 * The wipe's timing. `--ease-sweep` is the near-instant-then-glide curve the
 * header's nav underline uses, so everything on the site that wipes moves
 * identically.
 */
const SWEEP =
  "transition-transform duration-700 ease-sweep motion-reduce:transition-none";

const TONES: Record<CtaRowTone, { ink: string; fill: string }> = {
  /** On light surfaces: brand orange wipes across, under dark ink. */
  default: { ink: "text-text-primary", fill: "bg-action-primary" },
  /** On brand or dark surfaces: black wipes across, under white ink. */
  inverse: { ink: "text-text-on-accent", fill: "bg-surface-inverse" },
};

export default function CtaRow({
  href,
  label,
  tone = "default",
  className,
}: {
  href: string;
  label: string;
  /** Which surface the band is standing on. */
  tone?: CtaRowTone;
  /** Layout overrides: a margin or an edge, if the band needs one. */
  className?: string;
}) {
  const { ink, fill } = TONES[tone];

  return (
    <Link
      href={href}
      className={`group relative block overflow-hidden ${HEIGHT}${className ? ` ${className}` : ""}`}
    >
      {/* The wipe, clipped by the band. */}
      <span
        aria-hidden="true"
        className={`absolute inset-0 -translate-x-full ${fill} ${SWEEP} group-hover:translate-x-0 group-focus-visible:translate-x-0`}
      />

      {/* `relative` so it paints above the wipe: a positioned descendant is
          drawn over in-flow content whatever the source order says, so the
          words have to be positioned too before coming second can win. */}
      <span
        className={`relative ${PAGE_INSET} ${TYPE} flex h-full items-center justify-between gap-4 sm:gap-6 ${ink}`}
      >
        <span>{label}</span>
        <ArrowRightIcon className="h-[1.6em] w-auto shrink-0 transition-transform duration-500 ease-out group-hover:translate-x-2 motion-reduce:transition-none" />
      </span>
    </Link>
  );
}
