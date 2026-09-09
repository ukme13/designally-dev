"use client";

import Image from "next/image";
import { useRef } from "react";

import HoverCursor from "@/app/_components/hover-cursor";
import TextLink from "@/app/_components/text-link";
import type { ElementSlots } from "@/app/_lib/element-slots";
import { useSituationCards } from "@/app/_lib/use-situation-cards";

/**
 * The three situation cards, each arriving with a spin and then filling in.
 *
 * ── The knobs ────────────────────────────────────────────────────────────
 *   the whole arrival   use-situation-cards.ts
 *   depth of the spin   PERSPECTIVE
 *   placeholder shape   FACE_RATIO
 *   hover lift          HOVER
 * ─────────────────────────────────────────────────────────────────────────
 *
 * **The finished state is what the server sends.** Nothing is rendered hidden:
 * the copy is in the HTML, in order, at full opacity, and the layout is settled
 * before a line of JavaScript runs. The starting position is written by this
 * component before paint and taken away again on cleanup, so a visitor with no
 * JavaScript, a failed import or a stopped animation all end up looking at the
 * finished cards rather than at nothing. That is the opposite of the usual
 * arrangement, and it is the only one that fails safely.
 *
 * **Three elements per card, and the split is the point.** The wrapper holds
 * the perspective, the flipper holds `preserve-3d` and is the ONLY thing GSAP
 * writes a transform to, and the two faces sit inside it. Putting the faces'
 * own `rotate-y-180` on the animated element would mean GSAP overwriting it on
 * the first frame — the back face would stop being a back face.
 *
 * Reduced motion does nothing at all: no styles are written, no timeline is
 * built, and the cards are simply there. Not a shortened animation — an absent
 * one.
 *
 * **It reverses, and only from below.** Scrolling UP past the section plays the
 * whole arrival backwards — the copy fades, then the cards turn away and drop —
 * so coming down again performs it afresh. Scrolling DOWN past it does not:
 * having watched the cards land and read on, returning from underneath should
 * find them where they were left, not catch them mid-rebuild. That asymmetry is
 * why the trigger is created by hand below rather than handed to the timeline —
 * only two of its four crossings do anything.
 *
 * The timeline is never scrubbed. It plays at its own pace once started, so the
 * arrival reads the same however fast the page is moving.
 *
 * Lenis needs no wiring — it animates the browser's real scroll position, so
 * ScrollTrigger reads the numbers it always does.
 */

/**
 * How deep the spin looks.
 *
 * Perspective is on the WRAPPER, not the spinning element: it has to describe
 * the viewer's distance from the card, and an element cannot hold the
 * perspective it is itself being viewed through.
 */
const PERSPECTIVE = "perspective-distant";

/**
 * The lift on hover.
 *
 * On the PERSPECTIVE WRAPPER, not on the card that flips — that one's transform
 * belongs to GSAP, which writes it inline on every frame of the entrance and
 * would overwrite anything a stylesheet put there. Two elements, one transform
 * owner each, is the same rule the faces follow.
 *
 * `translate`, `rotate` and `scale` are their own CSS properties in Tailwind v4
 * rather than parts of `transform`, which is why the transition names all four:
 * a `transition-transform` alone would have nothing to interpolate here.
 *
 * **Scale is what sells the card coming toward you**, not `translateZ`. The
 * perspective on this element applies to its CHILDREN, never to itself, so
 * moving it along Z would slide it without any foreshortening. Growing it is
 * the same picture with none of that trouble.
 *
 * `relative` plus `group-hover:z-10` so the raised card passes in FRONT of its
 * neighbours. Without it a later sibling paints over the card being lifted,
 * which reads as the card going behind rather than coming forward.
 *
 * **`group-hover` and not `hover`.** The link's overlay covers this element, so
 * the pointer is never actually over it — a plain `hover:` would fire only in
 * the gaps and the card would flicker. Hanging it off the article means the
 * whole card lifts together, copy included, which is what the overlay implies
 * anyway.
 *
 * A shadow would sell the lift further and is deliberately absent. A
 * `box-shadow` would draw a hard rectangle behind artwork whose edges are
 * hand-drawn and transparent, and a `drop-shadow` filter would flatten this
 * element's 3D context and stop the card flipping at all.
 *
 * 5% of growth against 24px of lift is chosen so the card never grows DOWN into
 * the copy beneath it: the rise more than covers the spread.
 */
const HOVER =
  "relative transition-[transform,translate,rotate,scale] duration-[400ms] ease-out " +
  "group-hover:z-10 group-hover:-translate-y-6 group-hover:scale-105 group-hover:rotate-3 " +
  "motion-reduce:transition-none";

/**
 * The placeholder's shape: 4:5, a playing card stood upright.
 *
 * Whatever artwork replaces the faces should keep this ratio — the spin reads
 * as a card turning only while the two faces are the same size and shape.
 */
const FACE_RATIO = "aspect-portrait";

/**
 * The card artwork, 800x1000 each — the 4:5 above, exactly.
 *
 * The fronts are per card and indexed by POSITION, not by the card's `number`.
 * Deriving a filename from content would mean renumbering a card silently
 * breaks its picture; a list is greppable and fails at the fallback instead.
 *
 * All four carry transparency, and the faces below have no background of their
 * own — the section's colour is meant to show through the artwork.
 */
const FACE_FRONTS = [
  "/situations/cardframe-front-01.png",
  "/situations/cardframe-front-02.png",
  "/situations/cardframe-front-03.png",
];
const FACE_BACK = "/situations/cardframe-back.png";

/** Natural size of every face, used by next/image as a ratio. */
const FACE_SIZE = { width: 800, height: 1000 };

/** Rendered width: a third of the page grid from `lg`, the full column below. */
const FACE_SIZES = "(min-width: 1024px) 33vw, 100vw";

export type Situation = {
  number: string;
  name: string;
  question: string;
  description: string;
  action: string;
};

export default function SituationCards({
  situations,
}: {
  /**
   * The cards' content, from the page. Passed in rather than restated here so
   * there is one copy of the words in the codebase.
   */
  situations: readonly Situation[];
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const flipperRefs = useRef<ElementSlots<HTMLDivElement>>([]);
  const copyRefs = useRef<ElementSlots<HTMLDivElement>>([]);

  /* Everything about the movement — the rise, the turn, the copy that follows,
     and when any of it runs — is in use-situation-cards.ts. */
  useSituationCards({
    rootRef,
    flipperRefs,
    copyRefs,
    count: situations.length,
  });

  return (
    <div
      ref={rootRef}
      className="mt-16 grid gap-10 md:gap-12 lg:grid-cols-3"
    >
      {situations.map((situation, index) => (
        <SituationCard
          key={situation.name}
          situation={situation}
          front={FACE_FRONTS[index] ?? FACE_FRONTS[0]}
          flipperRef={(node) => {
            flipperRefs.current[index] = node;
          }}
          copyRef={(node) => {
            copyRefs.current[index] = node;
          }}
        />
      ))}
    </div>
  );
}

/**
 * One card: the artwork that turns over, the copy beneath it, and the whole
 * thing as a single link.
 *
 * Its own component so it can hold a ref of its own — the hover cursor needs
 * one element to watch, and a ref cannot be created inside a `map`.
 */
function SituationCard({
  situation,
  front,
  flipperRef,
  copyRef,
}: {
  situation: Situation;
  /** This card's artwork. The back is shared, so only the front is passed. */
  front: string;
  flipperRef: (node: HTMLDivElement | null) => void;
  copyRef: (node: HTMLDivElement | null) => void;
}) {
  const cardRef = useRef<HTMLElement>(null);

  return (
    <article ref={cardRef} className="group relative flex flex-col">
          {/* The placeholder. Decorative until real artwork replaces the two
              faces below, so it says nothing to a screen reader — every word
              that matters is in the copy underneath. */}
          <div className={`${PERSPECTIVE} ${HOVER} w-full`} aria-hidden="true">
            <div
              ref={flipperRef}
              /* The only element GSAP touches. `transform-3d` is what lets the
                 faces inside it have a front and a back at all. */
              className={`relative w-full transform-3d ${FACE_RATIO}`}
            >
              {/*
                The two faces, and which artwork sits on which.

                The card settles at `rotateY(180)`, so the face carrying
                `rotate-y-180` is the one at rest — it has come round a full 360
                and faces the viewer squarely. The plain face is what shows at
                the start, at `rotateY(0)`.

                So the artwork goes on the ROTATED face and the card back on the
                plain one. The reverse of that was tried first and is wrong in a
                way that is easy to miss: it puts the artwork on a face that is
                only ever seen from behind, so it renders mirrored.

                **Neither face may carry `overflow-hidden`.** A non-visible
                overflow renders an element into its own flattened plane, which
                can take it out of the parent's 3D context and stop
                `backface-visibility` applying — and when that fails BOTH faces
                draw, so the card rests looking mirrored. The rounding lives on
                the images instead, which need no clipping: they fill the face
                exactly.

                No background on either. The artwork carries its own
                transparency and the section's colour is meant to show through
                it.
              */}
              {/* The turned-away face FIRST, the resting face LAST. Paint
                  order is the safety net: if `backface-visibility` ever fails
                  to apply, both faces render and the later sibling wins — so
                  the one that wins should be the one the card rests on, not a
                  mirrored copy of the other. */}
              {/* The card BACK, on the plain face. The card starts at
                  `rotateY(0)`, so this is what faces the viewer as it arrives —
                  head-on, and so not mirrored. */}
              <div className="absolute inset-0 backface-hidden">
                <Image
                  src={FACE_BACK}
                  /* Decorative: every word on this card is in the copy below,
                     and the wrapper is already out of the accessibility tree. */
                  alt=""
                  width={FACE_SIZE.width}
                  height={FACE_SIZE.height}
                  sizes={FACE_SIZES}
                  className="size-full rounded-lg object-cover"
                />
              </div>
              {/* The card FRONT, on the `rotate-y-180` face. By the end of the
                  turn the card is at 180 and this face has come round a full
                  360 — square to the viewer, and the right way round. The
                  artwork belongs HERE and not on the plain face: the plain face
                  is the one turned away at rest, and anything on it would only
                  ever be seen from behind. */}
              <div className="absolute inset-0 rotate-y-180 backface-hidden">
                <Image
                  src={front}
                  alt=""
                  width={FACE_SIZE.width}
                  height={FACE_SIZE.height}
                  sizes={FACE_SIZES}
                  className="size-full rounded-lg object-cover"
                />
              </div>
            </div>
          </div>

          {/* The words. One element so the whole block arrives together, which
              is what "then the content appears" means. */}
          <div
            ref={copyRef}
            className="flex flex-1 flex-col px-4 sm:px-6"
          >
            {/* On-accent inks throughout: this block sits on brand orange, and
                the default dark inks it used to carry were chosen for the
                page's own light surface. The link takes the `inverse` tone for
                the same reason. */}
            <div className="mt-8 flex items-center justify-between type-small text-text-on-accent/70">
              <span>{situation.number}</span>
              <span>{situation.name}</span>
            </div>
            <h3 className="mt-6 max-w-xl type-accent-2xl text-text-on-accent">
              {situation.question}
            </h3>
            <p className="mt-4 max-w-sm type-body text-text-on-accent/80">
              {situation.description}
            </p>
            <TextLink
              href="/services/"
              label={situation.action}
              tone="inverse"
              /* Larger than running text: this is the card's one action, and at
                 `sm` it read as a footnote under a 40px question. */
              size="lg"
              /*
                `after:absolute after:inset-0` turns this one link into the
                whole card's hit area — it stretches an invisible box over the
                nearest positioned ancestor, which is the article.

                An overlay rather than wrapping the card in a second `<Link>`:
                two links to the same place mean a screen reader announcing the
                destination twice per card. This way there is exactly one link,
                its text says where it goes, and every pixel of the card
                triggers it.
              */
              className="mt-auto w-full justify-between pt-10 after:absolute after:inset-0 after:content-['']"
            />
          </div>

          {/* The circle-and-arrow pointer, as on the showreel. It watches the
              whole article, which is also the whole link — so the cursor it
              replaces is the one that would have been a pointing hand. */}
          <HoverCursor areaRef={cardRef} />
        </article>
  );
}
