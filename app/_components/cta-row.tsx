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
 * **Where one ink suits both surfaces, there is one label.** White reads on the
 * orange the `inverse` band stands on and on the black that crosses it, so that
 * tone draws its words once.
 *
 * **Where it does not, the words are drawn TWICE — once per ink.** `default`
 * stands on a light surface, so its ink is dark; then brand orange wipes across
 * and dark-on-orange is the reading the owner reported as poor. A single label
 * cannot serve both: flipping its colour on hover changes the whole line at
 * once, so for the length of the sweep the half the wipe has not reached yet is
 * wearing the wrong ink. This is the arrangement that note used to describe as
 * the thing to build, and it is now built.
 *
 * The second copy lives INSIDE the wipe panel, so it is revealed exactly where
 * the fill has arrived — never a frame early or late, because it is the same
 * element moving. It carries an equal and opposite translate so the words hold
 * still while the panel slides under them: the panel runs `-100% -> 0`, the
 * copy runs `+100% -> 0`, and the two cancel.
 *
 * Both copies are laid out identically, from the same `inset` and `type`, or
 * they would not line up. The duplicate is `aria-hidden` by inheritance from
 * the panel, so the label is announced once.
 *
 * A tone whose ink suits both surfaces declares no `inkOn` and pays for none of
 * this — nothing extra is rendered.
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
 * The wipe's timing AND what triggers it, in one string.
 *
 * The panel and the second copy of the label that rides inside it both take
 * this, which is what keeps them in step. They have to be: the copy carries an
 * equal and opposite translate, and the two only cancel while they share a
 * duration, an easing and a trigger. Written out separately they could be
 * changed once, and the words would drift across the band as it wiped.
 *
 * Focus gets the wipe for the same reason hover does — see the note above.
 */
const SWEEP_IN = `${SWEEP} group-hover:translate-x-0 group-focus-visible:translate-x-0`;

/**
 * What a panel adds when its tone carries a second ink.
 *
 * `z-10` lifts the fill above the resting label so it can cover it;
 * `overflow-hidden` clips the copy inside to the fill's own box. Neither is
 * optional and each was missing once — the panel's note below records what
 * each failure looked like.
 */
const COVER = "z-10 overflow-hidden";

/**
 * `rule` colours the compact size's top and bottom rules. The band has no
 * border, so on the band it does nothing.
 */
const TONES: Record<
  CtaRowTone,
  { ink: string; fill: string; rule: string; inkOn?: string }
> = {
  /**
   * On light surfaces: dark ink at rest, and brand orange wipes across.
   *
   * `inkOn` is white, because the site sets white on orange everywhere else and
   * dark-on-orange was reported as hard to read. Declaring it is what draws the
   * second copy of the label — see the note on the wipe above.
   */
  default: {
    ink: "text-text-primary",
    fill: "bg-action-primary",
    rule: "border-border-default",
    inkOn: "text-text-on-accent",
  },
  /**
   * On brand or dark surfaces: black wipes across, under white ink.
   *
   * No `inkOn`: one white label reads on both the orange it stands on and the
   * black that crosses it, so this tone draws its words once and costs nothing.
   */
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
  const { ink, fill, rule, inkOn } = TONES[tone];
  const { box, inset, type } = SIZES[size];

  /* One layout, used for both copies. They have to be laid out from the same
     values or the second would not sit exactly over the first. */
  const words = (colour: string) => (
    <span
      className={`${inset} ${type} flex h-full items-center justify-between gap-4 sm:gap-6 ${colour}`}
    >
      <span>{label}</span>
      <ArrowRightIcon className="h-[1.4em] w-auto shrink-0 transition-transform duration-500 ease-out group-hover:translate-x-2 motion-reduce:transition-none" />
    </span>
  );

  return (
    <Link
      href={href}
      className={`group relative block overflow-hidden ${box} ${rule}${className ? ` ${className}` : ""}`}
    >
      {/*
        The wipe, clipped by the band, carrying the second ink with it.

        **`z-10 overflow-hidden` when there IS a second ink.** Both are
        load-bearing, and each was missing once.

        `z-10`: with one ink the words stay ON TOP of the fill — the colour
        crosses behind fixed text, which is what `relative` on the label below
        is for. With two, the fill must COVER the resting label so the copy
        riding on it takes over. Without this the dark words painted over the
        orange and nothing appeared to change.

        `overflow-hidden`: the counter-transform holds the second copy still at
        ALL times, including at rest, where the panel is parked at `-100%` and
        the copy is pushed `+100%` — which lands it exactly over the band. With
        nothing clipping it, the white label sat permanently on top of the dark
        one and the band read white on cream before it was ever hovered. The
        panel clipping to its own box is what makes the copy visible only where
        the fill has actually arrived: the clip travels with the panel while the
        words stay put, so the colour is revealed across them left to right.
      */}
      <span
        aria-hidden="true"
        className={`absolute inset-0 -translate-x-full ${fill} ${SWEEP_IN}${inkOn ? ` ${COVER}` : ""}`}
      >
        {inkOn ? (
          /* The counter-transform. The panel travels `-100% -> 0`; this
             travels `+100% -> 0`, so the words stay put while the colour
             crosses them. Both take SWEEP_IN, which is what makes "in step" a
             fact rather than a request. */
          <span className={`absolute inset-0 translate-x-full ${SWEEP_IN}`}>
            {words(inkOn)}
          </span>
        ) : null}
      </span>

      {/* `relative` so it paints above the wipe: a positioned descendant is
          drawn over in-flow content whatever the source order says, so the
          words have to be positioned too before coming second can win.

          That is what a single-ink tone needs. A two-ink tone overrides it from
          the other side, with `z-10` on the panel above. */}
      <span className="relative block h-full">{words(ink)}</span>
    </Link>
  );
}
