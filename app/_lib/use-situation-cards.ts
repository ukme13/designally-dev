"use client";

import type { RefObject } from "react";

import { cssEase } from "@/app/_lib/css-ease";
import type { ElementSlots } from "@/app/_lib/element-slots";
import { present } from "@/app/_lib/element-slots";
import { useBeforePaint } from "@/app/_lib/use-before-paint";

/**
 * The situation cards' arrival: each one rises, turns face-up, and then fills
 * in with its copy.
 *
 * Extracted from situation-cards.tsx, which keeps the markup and the layout —
 * the same split hero-intro.tsx has with use-statement-flight and
 * showcase-loop.tsx with use-showcase-drift. Everything about WHEN and HOW the
 * cards move is here; everything about what they look like is there.
 *
 * ── The knobs ────────────────────────────────────────────────────────────
 *   how far it rises    CARD_ENTRY_Y
 *   how far it turns    CARD_ENTRY_ROTATION and CARD_REST_ROTATION
 *   its tilt and size   CARD_ENTRY_TILT and CARD_ENTRY_SCALE
 *   card timing         CARD_DURATION and CARD_STAGGER
 *   copy timing         CONTENT_DELAY, CONTENT_DURATION and CONTENT_Y
 *   easings             CARD_EASE_TOKEN and COPY_EASE_TOKEN
 *   when it runs        SCROLL_START
 * ─────────────────────────────────────────────────────────────────────────
 *
 * **The finished state is what the server sends.** Nothing is rendered hidden:
 * the copy is in the HTML, in order, at full opacity, and the layout is settled
 * before a line of JavaScript runs. The starting position is written here before
 * paint and taken away again on cleanup, so a visitor with no JavaScript, a
 * failed import or a stopped animation all end up looking at the finished cards
 * rather than at nothing. That is the opposite of the usual arrangement, and it
 * is the only one that fails safely.
 *
 * **It reverses, and only from below.** Scrolling UP past the section plays the
 * whole arrival backwards — the copy fades, then the cards turn away and drop.
 * Scrolling DOWN past it does not: having watched the cards land and read on,
 * returning from underneath should find them where they were left. That
 * asymmetry is why the trigger is built by hand rather than handed to the
 * timeline; only two of its four crossings do anything.
 *
 * Reduced motion does nothing at all: no styles are written, no timeline is
 * built, and the cards are simply there. Not a shortened animation — an absent
 * one.
 *
 * Lenis needs no wiring — it animates the browser's real scroll position, so
 * ScrollTrigger reads the numbers it always does.
 */

/** How far below its resting place a card starts, in pixels. */
const CARD_ENTRY_Y = 180;
/**
 * The card's rotation about the Y axis, at the start and at rest, in degrees.
 *
 * It turns from 0 to 180, and the card COMES TO REST AT 180. That is the part
 * worth understanding, because the obvious arrangement — rest at 0 — put the
 * artwork on the face that is only ever seen from behind, and it rendered
 * mirrored.
 *
 * Resting at 180 means the face carrying `rotate-y-180` has turned a full 360
 * by the end, so it faces the viewer squarely and is NOT mirrored. That is
 * where the artwork belongs. The plain face shows at the start, when the card
 * is still at 0.
 *
 * A half-turn apart is what makes this a card being turned over. Adding full
 * turns (360, 540) makes it spin and flicker instead; keep them 180 apart.
 */
const CARD_ENTRY_ROTATION = 0;
const CARD_REST_ROTATION = 180;
/**
 * The tilt it arrives with, in degrees around the Z axis.
 *
 * A card thrown onto a table does not land square. Eight degrees is enough to
 * read as a hand having placed it and little enough not to look like a mistake;
 * it unwinds to 0 as the card settles.
 */
const CARD_ENTRY_TILT = -8;
/**
 * How small it starts, as a multiple of its final size.
 *
 * Under the perspective below, a smaller card reads as a more distant one — so
 * this is the card coming toward the viewer, not merely growing.
 */
const CARD_ENTRY_SCALE = 0.82;
/** How long one card takes to arrive, in seconds. */
const CARD_DURATION = 1.1;
/** The gap between card 01 setting off and card 02, in seconds. */
const CARD_STAGGER = 0.18;
/** The pause after the cards land before their copy begins, in seconds. */
const CONTENT_DELAY = 0.12;
/** How long a card's copy takes to arrive, in seconds. */
const CONTENT_DURATION = 0.5;
/** Where the section has to reach before any of it runs. */
const SCROLL_START = "top 75%";
/**
 * Easings, both taken from the design tokens rather than written here. See
 * app/_lib/css-ease.ts for why they are read from the document.
 *
 * The cards use `--ease-in-out`: slow to start, quickest through the middle of
 * the spin, and a long settle into place. Nothing overshoots — an earlier
 * version sprang past its mark on `back.out`, which is livelier and less calm.
 * A token cannot express a spring anyway: a CSS cubic-bezier with control
 * points inside 0-1 has no way to travel past its end value.
 *
 * The copy uses `--ease-out`, the site's arrival curve. It has further to fall
 * in feel than in pixels, and starting it at full speed suits text appearing
 * more than it suits an object moving.
 */
const CARD_EASE_TOKEN = "--ease-in-out";
const CARD_EASE_ID = "situation-cards-in-out";
const CARD_EASE_FALLBACK = "power2.inOut";
const COPY_EASE_TOKEN = "--ease-out";
const COPY_EASE_ID = "situation-cards-out";
const COPY_EASE_FALLBACK = "power3.out";
/** How far the copy rises as it fades in, in pixels. */
const CONTENT_Y = 24;

export function useSituationCards({
  rootRef,
  flipperRefs,
  copyRefs,
  count,
}: {
  /** The grid. What ScrollTrigger measures. */
  rootRef: RefObject<HTMLDivElement | null>;
  /** The element GSAP transforms on each card. Never a face — see the note in
   *  situation-cards.tsx about who owns which transform. */
  flipperRefs: RefObject<ElementSlots<HTMLDivElement>>;
  /** The block of words under each card, revealed once the cards have landed. */
  copyRefs: RefObject<ElementSlots<HTMLDivElement>>;
  /** How many cards there are. Rebuilds the timeline when it changes. */
  count: number;
}) {
  useBeforePaint(() => {
    const root = rootRef.current;
    const flippers = present(flipperRefs.current);
    const copies = present(copyRefs.current);
    if (!root || flippers.length === 0) return;

    /* Read once, here. Nothing below animates under reduced motion, so there is
       nothing to keep watching for. */
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    /*
      The starting position, written before paint so it is never seen being
      applied — and written as inline styles rather than classes so that
      clearing them restores exactly what the stylesheet says.
    */
    const hide = () => {
      for (const flipper of flippers) {
        flipper.style.opacity = "0";
        /* Written in the order GSAP composes its own transform — translate,
           then Z, then Y, then scale — so the frame before GSAP takes over
           looks identical to the frame after it. A different order is a
           different matrix, and the card would visibly jump. */
        flipper.style.transform = `translateY(${CARD_ENTRY_Y}px) rotate(${CARD_ENTRY_TILT}deg) rotateY(${CARD_ENTRY_ROTATION}deg) scale(${CARD_ENTRY_SCALE})`;
        /* CARD_ENTRY_ROTATION is 0, so that last term is an identity — it is
           written out anyway so this line stays true if the start changes. */
      }
      for (const copy of copies) {
        copy.style.opacity = "0";
        copy.style.transform = `translateY(${CONTENT_Y}px)`;
      }
    };

    /* Every route out of the animation goes through this, including the ones
       where the animation never happens: a failed import, an unmount mid-flight,
       or the timeline finishing. The cards end up in place either way. */
    const show = () => {
      for (const element of [...flippers, ...copies]) {
        element.style.transform = "";
        element.style.opacity = "";
      }
    };

    hide();

    let cancelled = false;
    let revert: (() => void) | undefined;

    const run = async () => {
      const [{ gsap }, { CustomEase }, { ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/CustomEase"),
        import("gsap/ScrollTrigger"),
      ]);

      /* The imports resolve on a later tick, by which time this effect may
         already have been cleaned up — Strict Mode guarantees it in
         development. A stale resolution must build no timeline, or the second
         mount runs two of them over the same elements. */
      if (cancelled) return;

      gsap.registerPlugin(CustomEase, ScrollTrigger);
      const create = (id: string, data: string) => CustomEase.create(id, data);
      const cardEase = cssEase(
        create,
        CARD_EASE_TOKEN,
        CARD_EASE_ID,
        CARD_EASE_FALLBACK,
      );
      const copyEase = cssEase(
        create,
        COPY_EASE_TOKEN,
        COPY_EASE_ID,
        COPY_EASE_FALLBACK,
      );

      /*
        Paused, and with no ScrollTrigger of its own. The trigger is made
        separately below so the four crossings can be treated differently —
        handing the timeline to ScrollTrigger would have it play and rewind on
        all of them.
      */
      const timeline = gsap.timeline({ paused: true });

      /*
        `fromTo`, and it has to be — `to` alone does not spin.

        A `to` tween reads its start value off the element, and for a transform
        that means the computed MATRIX. A matrix cannot record how many times
        something has been turned: `rotateY(-1080deg)` and `rotateY(0deg)`
        produce exactly the same one. So GSAP read the pre-paint start as 0,
        animated it to 0, and the cards rose without ever spinning.

        Stating the start explicitly keeps all three turns, because GSAP then
        stores the number itself rather than inferring it from the element.

        The pre-paint CSS start stays as it is. It renders identically to the
        `from` values here — three full turns look like none — so there is no
        jump when GSAP takes over, and it is still what a visitor sees if the
        import never resolves.
      */
      timeline.fromTo(
        flippers,
        {
          y: CARD_ENTRY_Y,
          rotationY: CARD_ENTRY_ROTATION,
          rotationZ: CARD_ENTRY_TILT,
          scale: CARD_ENTRY_SCALE,
        },
        {
          y: 0,
          rotationY: CARD_REST_ROTATION,
          rotationZ: 0,
          scale: 1,
          duration: CARD_DURATION,
          stagger: CARD_STAGGER,
          ease: cardEase,
        },
      );

      /*
        The fade is its own tween, deliberately kept out of the one above.

        The card's own curve is slow at both ends, and a fade that crawls in
        at the start reads as a card that is late rather than one that is
        arriving. Linear over the first half of the drop instead, which has it
        solid well before it lands. Its start needs no stating: unlike a
        rotation, opacity is read back from the element exactly.
      */
      timeline.to(
        flippers,
        {
          opacity: 1,
          duration: CARD_DURATION / 2,
          stagger: CARD_STAGGER,
          ease: "none",
        },
        0,
      );

      /* After the cards land, not alongside them. `+=` on the position
         parameter is measured from the end of the timeline so far. */
      timeline.to(
        copies,
        {
          opacity: 1,
          y: 0,
          duration: CONTENT_DURATION,
          stagger: CARD_STAGGER,
          ease: copyEase,
        },
        `+=${CONTENT_DELAY}`,
      );

      /*
        Two of the four crossings are handled, and the other two deliberately
        are not.

          onEnter       coming down to it       -> run forwards
          onLeaveBack   going up past it        -> run BACKWARDS
          onLeave       going down past it      -> ignored; leave them landed
          onEnterBack   coming back up to it    -> ignored; they are already in

        `reverse()` and not `pause(0)`. Seeking to zero is instantaneous, so
        scrolling up made the cards vanish between one frame and the next;
        reversing plays the same timeline backwards, and the copy fades out
        before the cards turn away and drop. The arrival undone, rather than
        cancelled.

        Neither call takes a time argument, which is what makes changing your
        mind mid-flight work: `play()` and `reverse()` both continue from
        wherever the playhead already is, so scrolling down through a
        half-finished exit picks the cards back up instead of restarting them.
      */
      const trigger = ScrollTrigger.create({
        trigger: root,
        start: SCROLL_START,
        onEnter: () => timeline.play(),
        onLeaveBack: () => timeline.reverse(),
      });

      revert = () => {
        trigger.kill();
        timeline.kill();
      };
    };

    /* A failed import must not leave the cards hidden for good. */
    void run().catch(show);

    return () => {
      cancelled = true;
      revert?.();
      show();
    };
  }, [rootRef, flipperRefs, copyRefs, count]);
}
