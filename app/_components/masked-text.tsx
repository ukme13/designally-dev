"use client";

import type { CSSProperties, ReactNode } from "react";
import { useRef } from "react";

import { useBeforePaint } from "@/app/_lib/use-before-paint";

/**
 * Text that slides up into a mask when it reaches the viewport.
 *
 * Each line sits in its own `overflow-hidden` box and starts one line-height
 * below it, so it is clipped out of sight rather than faded; scrolling to it
 * brings the line up into the frame.
 *
 * **It re-arms only from below.** Leaving the viewport downwards — the visitor
 * scrolling up, past and above it — puts the lines back under their masks, so
 * coming back down plays the reveal again. Leaving upwards does not: having
 * read it and scrolled on, returning from underneath should find the text
 * where it was left, not watch it re-hide and climb back. That asymmetry is
 * the whole reason there are two observers below rather than one.
 *
 * ── The knobs ────────────────────────────────────────────────────────────
 *   text            the `lines` prop, at the call site
 *   duration        REVEAL_MOTION below
 *   easing          `--ease-reveal` in app/tokens.css
 *   stagger         REVEAL_STAGGER_MS below
 *   trigger point   REVEAL_MARGIN and REVEAL_THRESHOLD below
 * ─────────────────────────────────────────────────────────────────────────
 *
 * **The hidden state is applied by JavaScript, never rendered.** The server
 * sends the text in its finished position, so a visitor with JavaScript off
 * reads it normally instead of staring at an empty box — the failure mode of
 * every reveal that ships its own hidden state in the HTML. The offset is
 * written before paint, so there is no frame where the text sits in place and
 * then drops.
 *
 * Reduced motion is handled by never hiding it: the effect returns before
 * touching anything, so the text is simply there and no transition exists to
 * run. That is also why no `motion-reduce:` variant appears below — it would
 * be a second utility competing for `transition-property`, and stylesheet
 * order rather than class order would decide the winner.
 *
 * CSS transitions rather than GSAP. The values are fixed, there is no
 * sequencing to coordinate, and this way the animation costs no JavaScript
 * beyond one IntersectionObserver and one attribute.
 *
 * **The mask is padded for glyph overflow, and this is not optional.** The
 * type utilities here set `line-height: 1`, but a font's ink needs more room
 * than that: measured from the metrics Next writes into the stylesheet,
 * Poppins occupies 124.8% of its em and EB Garamond 137.7%. Half of the
 * excess falls above the line box and half below, so a bare `overflow-hidden`
 * fitted to the line box clips descenders — about 2px off a Poppins "y" at the
 * largest size, and nearer 7px in EB Garamond, whose italic `f` descends too.
 *
 * The inner element carries `py-[0.25em]`, comfortably past EB Garamond's
 * 18.9% overflow, so the ink sits inside its box. The mask pulls that back out
 * with a matching `-my-[0.25em]`, so the passage occupies exactly the height it
 * did before. And because `translateY(100%)` is 100% of the PADDED box, the
 * hidden state hides more than it used to, not less.
 *
 * Both figures move together. Changing one alone either clips the ink again or
 * shifts the layout.
 *
 * Not covered: horizontal overhang. An italic first letter can lean a hair
 * past the left edge and be clipped there. Give the pair an `x` counterpart if
 * that ever shows.
 *
 * Accessibility: the lines are real text in the document, in order, inside a
 * single paragraph. The wrappers are `<span>`s made block-level by CSS, so
 * nothing is added to the accessibility tree and the text reads as one
 * passage.
 */

/**
 * The motion itself, applied only in the revealed state.
 *
 * Every property is declared here and nowhere else, so nothing competes for it
 * and stylesheet order never gets a vote — the trap the project rules warn
 * about. It also makes the RE-ARM instant: dropping the `in` state takes the
 * transition away with it, so a line snaps back below its mask rather than
 * sliding down.
 *
 * Written out in full rather than composed from parts. Tailwind scans this
 * file as text, so a class built from fragments at runtime compiles to
 * nothing — silently. Edit the duration and easing here.
 */
const REVEAL_MOTION =
  "group-data-[reveal=in]:transition-transform group-data-[reveal=in]:duration-750 group-data-[reveal=in]:ease-reveal group-data-[reveal=in]:delay-(--reveal-delay)";

/** Gap between one line starting and the next. Milliseconds. */
const REVEAL_STAGGER_MS = 75;
/**
 * How far into the viewport the text must come before it runs.
 *
 * A negative bottom margin holds the trigger back, so a line does not start
 * the moment its first pixel appears — by the time it moves it is properly on
 * screen. Raise the figure to trigger later, drop it to trigger sooner.
 */
const REVEAL_MARGIN = "0px 0px -15% 0px";
/** How much of the block must be inside that margin. */
const REVEAL_THRESHOLD = 0.1;

export default function MaskedText({
  lines,
  className,
  as: Tag = "p",
}: {
  /**
   * One entry per line. The component never breaks text itself.
   *
   * An ARRAY, not children, and that is load-bearing. A children API reads
   * better and would make React's key rules irrelevant — but this component is
   * a client one and its callers are server components, so children cross the
   * RSC boundary and are serialised on the way. Fragments do not survive that
   * as single nodes: `<>a<i>b</i>c</>` arrives as three separate children, and
   * `Children.toArray` then sees three lines instead of one. It was tried on
   * 8 September 2026 and produced six masked lines from two.
   *
   * An array prop crosses intact.
   *
   * A line can carry markup — a coloured span, an EB Garamond italic. See the
   * note on glyph overflow above before swapping the family: the mask is
   * measured for it, but only up to a point.
   *
   * **Each entry needs a `key`.** Not because of the map below — those
   * wrappers carry their own — but because the array is built in a server
   * component and handed to this client one, and React validates arrays of
   * elements crossing that boundary. A bare `<>` cannot take a key, so lines
   * with markup are written as `<Fragment key=…>`.
   */
  lines: readonly ReactNode[];
  /** Typography for the passage. Composed `type-*` utilities belong here. */
  className?: string;
  /**
   * The element to render. A paragraph unless told otherwise.
   *
   * Here because a section heading has to stay a heading. Wrapping this
   * component in an `<h2>` is not an option — it renders a `<p>`, and a `<p>`
   * inside an `<h2>` is invalid, which browsers "fix" by closing the heading
   * early and leaving the words outside it. Nothing about the reveal changes
   * with the tag; only the semantics do.
   */
  as?: "p" | "h1" | "h2" | "h3";
}) {
  const rootRef = useRef<HTMLElement>(null);

  useBeforePaint(() => {
    const root = rootRef.current;
    if (!root) return;
    /* Read once, at the moment it would matter. Nothing here animates under
       reduced motion, so there is nothing to keep watching. */
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    /* Before paint, so the drop into the mask is never seen. The lines carry
       no transition in this state, so setting it cannot animate. */
    root.dataset.reveal = "hidden";

    /*
      Reveal. Held back by REVEAL_MARGIN so a line does not start the instant
      its first pixel appears. Not disconnected after firing — it has to be
      able to fire again once the observer below re-arms it.
    */
    const reveal = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) root.dataset.reveal = "in";
      },
      { rootMargin: REVEAL_MARGIN, threshold: REVEAL_THRESHOLD },
    );

    /*
      Re-arm, and only from below.

      A separate observer with no margin, so it can tell "gone from the screen"
      from "past the reveal line". Re-arming on the margin instead would put
      the lines back under their masks while they were still visible at the
      bottom of the window, and they would visibly drop.

      The direction test is the point. `boundingClientRect.top` at or past the
      root's bottom edge means the element sits entirely below the viewport,
      which only happens by scrolling UP past it — so it is armed for the next
      approach from above. Leaving upwards fails this test and changes nothing,
      which is what stops the text re-hiding in front of someone scrolling back
      to it from underneath.
    */
    const rearm = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) return;
        /* `rootBounds` is null in a few cross-origin cases; the window is the
           root here, so its own height is the honest fallback. */
        const bottom = entry.rootBounds?.bottom ?? window.innerHeight;
        if (entry.boundingClientRect.top >= bottom) {
          root.dataset.reveal = "hidden";
        }
      },
      { threshold: 0 },
    );

    reveal.observe(root);
    rearm.observe(root);
    return () => {
      reveal.disconnect();
      rearm.disconnect();
    };
  }, []);

  return (
    <Tag
      /* The tag is chosen at runtime, so its ref type is a union React cannot
         narrow here. Everything this component does with the node — one data
         attribute, two observers — is on HTMLElement. */
      ref={rootRef as React.RefObject<HTMLHeadingElement & HTMLParagraphElement>}
      className={`group ${className ?? ""}`}
    >
      {lines.map((line, index) => (
        /* The mask. Nothing but a clipping box — it takes no styling, so the
           typography above governs the line box it clips to. */
        /* Keyed by position. These wrappers are this component's own list, not
           the caller's, and nothing reorders or filters it. */
        <span key={index} className="my-[-0.25em] block overflow-hidden">
          <span
            className={`block py-[0.25em] group-data-[reveal=hidden]:translate-y-full ${REVEAL_MOTION}`}
            style={{ "--reveal-delay": `${index * REVEAL_STAGGER_MS}ms` } as CSSProperties}
          >
            {line}
          </span>
        </span>
      ))}
    </Tag>
  );
}
