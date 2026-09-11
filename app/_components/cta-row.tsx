import Link from "next/link";

import { ArrowRightIcon } from "@/app/_components/icons";
import { PAGE_INSET } from "@/app/_components/layout-styles";

/**
 * A full-bleed band that closes a section: one big label, an arrow, and a
 * colour that wipes across it on hover. The whole band is the link.
 *
 * ── The knobs ────────────────────────────────────────────────────────────
 *   size          SIZES: `band` (160px, full-bleed) or `compact` (64px)
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
 * **The band has no border of its own.** The list above closes itself with its own bottom
 * rule, and the band's other edge is wherever the caller puts it — here the
 * section boundary, where the colour change is the edge. A rule would also
 * misbehave under the wipe: `inset-0` is the padding box, so the fill stops
 * short of a border, and a 1px strip of the section showing through beneath a
 * black band reads as a seam. A caller that wants one can pass it in
 * `className` and pick a colour that suits its own surface.
 *
 * The compact size is the exception: its rules ARE its edges, top and bottom,
 * in the tone's `rule` colour. They are opaque, so the fill stopping at the
 * padding box leaves two dividers either side of it, not a seam.
 */

export type CtaRowTone = "default" | "inverse";

export type CtaRowSize = "band" | "compact";

/**
 * The two sizes. The wipe, the arrow, keyboard focus and reduced motion are
 * shared, so the two cannot drift apart; only the frame and the type differ.
 *
 * The label is Poppins through `font-sans` and a bare `text-*` size, not a
 * `type-*` utility: every one of those at these sizes carries `--font-display`,
 * which is the serif. A bare `text-*` is a measurement and nothing else, so the
 * family is stated beside it. section-title.tsx does the same.
 */
const SIZES: Record<CtaRowSize, { box: string; inset: string; type: string }> = {
  /**
   * Full-bleed, closing a section: 160px, the words on the page grid, at the
   * section titles' size. Stepped down below `lg`, where 44px "Explore our
   * services" would wrap on a phone.
   */
  band: {
    box: "h-40",
    inset: PAGE_INSET,
    type: "font-sans text-h1 font-medium lg:text-accent-xl",
  },
  /**
   * Inside its column, between a rule above and below: 64px, at 24px. The
   * words sit 16px in from the rules' ends, so the fill never runs flush
   * against them.
   */
  compact: {
    box: "h-16 border-y",
    inset: "w-full px-4",
    type: "font-sans text-accent-md font-medium",
  },
};

/**
 * The wipe's timing. `--ease-sweep` is the near-instant-then-glide curve the
 * header's nav underline uses, so everything on the site that wipes moves
 * identically.
 */
const SWEEP =
  "transition-transform duration-700 ease-sweep motion-reduce:transition-none";

/**
 * `rule` colours the compact size's top and bottom rules. The band has no
 * border, so on the band it does nothing.
 */
const TONES: Record<CtaRowTone, { ink: string; fill: string; rule: string }> = {
  /** On light surfaces: brand orange wipes across, under dark ink. */
  default: {
    ink: "text-text-primary",
    fill: "bg-action-primary",
    rule: "border-border-default",
  },
  /** On brand or dark surfaces: black wipes across, under white ink. */
  inverse: {
    ink: "text-text-on-accent",
    fill: "bg-surface-inverse",
    rule: "border-text-on-accent/25",
  },
};

export default function CtaRow({
  href,
  label,
  tone = "default",
  size = "band",
  className,
}: {
  href: string;
  label: string;
  /** Which surface the band is standing on. */
  tone?: CtaRowTone;
  /** `band`, full-bleed at 160px, or `compact`, inside its column at 64px. */
  size?: CtaRowSize;
  /** Layout overrides: a margin or an edge, if the band needs one. */
  className?: string;
}) {
  const { ink, fill, rule } = TONES[tone];
  const { box, inset, type } = SIZES[size];

  return (
    <Link
      href={href}
      className={`group relative block overflow-hidden ${box} ${rule}${className ? ` ${className}` : ""}`}
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
        className={`relative ${inset} ${type} flex h-full items-center justify-between gap-4 sm:gap-6 ${ink}`}
      >
        <span>{label}</span>
        <ArrowRightIcon className="h-[1.4em] w-auto shrink-0 transition-transform duration-500 ease-out group-hover:translate-x-2 motion-reduce:transition-none" />
      </span>
    </Link>
  );
}
