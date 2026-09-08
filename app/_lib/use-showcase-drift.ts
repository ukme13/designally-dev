"use client";

import type { RefObject } from "react";

import { useBeforePaint } from "@/app/_lib/use-before-paint";

/**
 * The motion behind the work showcase: a row that drifts, takes a push from the
 * scroll wheel, and can be dragged by mouse or finger.
 *
 * Extracted from showcase-loop.tsx so that component is markup and knobs, the
 * same split hero-intro.tsx has with use-statement-flight. Everything here is
 * imperative work on elements it is handed; it renders nothing and holds no
 * React state, because every value it computes changes on a frame boundary and
 * re-rendering for any of them would be waste.
 *
 * ── The knobs ────────────────────────────────────────────────────────────
 *   speed        DRIFT, in pixels per second
 *   scroll push  SCROLL_COUPLING and SCROLL_SMOOTHING
 *   throw        FLING_DECAY and FLING_LIMIT
 * ─────────────────────────────────────────────────────────────────────────
 *
 * **One writer, always.** Drift, scroll push and drag all feed a single
 * `offset`, and only the frame loop writes a transform. The pointer handlers
 * bank their movement and let the next frame spend it, so the three inputs can
 * never fight over the same style.
 *
 * **A frame loop rather than a CSS animation, and it has to be.** A keyframe
 * animation cannot read scroll direction, and reversing one mid-flight is not
 * something CSS does gracefully.
 *
 * Reduced motion swaps the behaviour rather than merely stopping it: no loop
 * runs at all, and the container becomes a real horizontal scroller so every
 * image is still reachable by hand. `data-lenis-prevent` is set only in that
 * case — as a static attribute it stopped the page scrolling whenever the
 * pointer crossed the row.
 */

/** Resting speed, pixels per second. The whole row drifts left at this. */
const DRIFT = 80;
/**
 * How hard scrolling pushes the row.
 *
 * A multiplier on the page's own scroll velocity: 2 means the row moves twice
 * as fast as the page while you scroll. Scrolling down pushes it further left,
 * scrolling up drags it back to the right — and past zero, so a firm upward
 * flick genuinely reverses the drift rather than just pausing it.
 */
const SCROLL_COUPLING = 2;
/**
 * How quickly the push catches up with the wheel, per frame, 0 to 1.
 *
 * Low numbers give the row weight: it takes a moment to gather speed and coasts
 * after the scroll stops, instead of snapping between speeds every frame.
 */
const SCROLL_SMOOTHING = 0.08;
/**
 * How fast a thrown row slows down, per 1/60s frame.
 *
 * Letting go of a drag hands the row the hand's own speed; this is how much of
 * that survives each frame. 0.94 coasts for roughly a second. Lower stops it
 * sooner, higher lets it run. It is raised to a power of the real frame time,
 * so a 120Hz display slows at the same rate as a 60Hz one.
 */
const FLING_DECAY = 0.94;
/**
 * The fastest a throw may launch the row, pixels per second.
 *
 * A quick flick across a trackpad can sample several thousand px/s, which sends
 * the row past a full sequence in a blink and reads as a glitch rather than
 * momentum.
 */
const FLING_LIMIT = 3000;
/**
 * How much of each pointer sample feeds the speed estimate, 0 to 1.
 *
 * Raw per-event speed is noisy, and the last event before a release is often
 * the noisiest — a finger slowing to a stop can report near zero while plainly
 * still moving. Averaging over the recent samples gives a throw that matches
 * what the hand did rather than what its final millisecond did.
 */
const DRAG_VELOCITY_SMOOTHING = 0.3;

/**
 * Drives one showcase row. Every element is required; the hook no-ops until all
 * three are mounted.
 */
export function useShowcaseDrift({
  containerRef,
  trackRef,
  sequenceRef,
}: {
  /** The clipping box. Owns the pointer events and the reduced-motion opt-out. */
  containerRef: RefObject<HTMLDivElement | null>;
  /** The moving element. The only thing this writes a transform to. */
  trackRef: RefObject<HTMLDivElement | null>;
  /** The first copy of the set. Its width is the wrap distance. */
  sequenceRef: RefObject<HTMLUListElement | null>;
}) {
  useBeforePaint(() => {
    const container = containerRef.current;
    const track = trackRef.current;
    const sequence = sequenceRef.current;
    if (!container || !track || !sequence) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      /*
        Only here. Lenis owns the document's wheel and touch events, and this
        attribute tells it to keep its hands off — which the horizontal
        scroller needs, and which is exactly wrong the rest of the time: as a
        static attribute it stopped the PAGE scrolling whenever the pointer
        crossed the row.
      */
      container.setAttribute("data-lenis-prevent", "");
      return () => container.removeAttribute("data-lenis-prevent");
    }

    /* One sequence's width, trailing gap included, is the wrap distance.
       Cached and refreshed by the observer rather than read in the loop:
       `offsetWidth` forces a layout, and doing that every frame would be a
       reflow per frame for a number that changes on resize at most. */
    let width = sequence.offsetWidth;
    const observer = new ResizeObserver(() => {
      width = sequence.offsetWidth;
    });
    observer.observe(sequence);

    let offset = 0;
    let push = 0;
    let lastY = window.scrollY;
    let lastTime = performance.now();
    let frame = 0;

    /* Drag state. `pending` is movement the pointer has banked and the next
       frame has yet to spend — the handlers never write the transform. */
    let heldPointer: number | null = null;
    let pending = 0;
    let pointerX = 0;
    let pointerTime = 0;
    let pointerSpeed = 0;
    let fling = 0;

    const step = (now: number) => {
      /* Clamped: a backgrounded tab hands back a gap of seconds, and an
         unclamped one would jump the row a screen or more. */
      const elapsed = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;

      const y = window.scrollY;
      const velocity = elapsed > 0 ? (y - lastY) / elapsed : 0;
      lastY = y;

      if (heldPointer !== null) {
        /* Held: the row is the hand's, and nothing else moves it. Both the
           scroll push and any leftover throw are zeroed rather than merely
           ignored, so releasing resumes from rest instead of firing off a
           speed banked before the grab. `lastY` is still being read above,
           which is what keeps a scroll during the drag from landing as one
           enormous velocity sample on the frame after release. */
        push = 0;
        fling = 0;
        /* Rightward movement is positive, and moving the row right means
           translating it less far left. */
        offset -= pending;
        pending = 0;
      } else {
        /* Ease toward the scroll's own speed rather than taking it whole, so
           the row gathers and sheds momentum instead of snapping. */
        push += (velocity * SCROLL_COUPLING - push) * SCROLL_SMOOTHING;
        /* Per-second decay derived from the per-frame figure, so the throw
           lasts the same wall-clock time on any refresh rate. */
        fling *= FLING_DECAY ** (elapsed * 60);
        /* Below a pixel a second it is arithmetic nobody can see. */
        if (Math.abs(fling) < 1) fling = 0;
        offset += (DRIFT + push + fling) * elapsed;
      }

      if (width > 0) {
        /* Wrapped both ways. A plain `%` keeps the sign, so scrolling up past
           the start would send the row off to the right and never return. */
        offset = ((offset % width) + width) % width;
        track.style.transform = `translate3d(${-offset}px, 0, 0)`;
      }

      frame = requestAnimationFrame(step);
    };

    const onPointerDown = (event: PointerEvent) => {
      /* One pointer at a time, and left button only: a right-click or a second
         finger should not seize a row already being dragged. */
      if (heldPointer !== null) return;
      if (event.pointerType === "mouse" && event.button !== 0) return;

      heldPointer = event.pointerId;
      pointerX = event.clientX;
      pointerTime = event.timeStamp;
      pointerSpeed = 0;
      pending = 0;
      /* Capture keeps the move and up events coming to this element even when
         the pointer leaves the row — a fast drag outruns the cursor otherwise
         and the row sticks mid-gesture. */
      container.setPointerCapture(event.pointerId);
    };

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerId !== heldPointer) return;

      const dx = event.clientX - pointerX;
      pointerX = event.clientX;
      pending += dx;

      /* Coalesced events can share a timestamp; a zero interval would divide
         the speed estimate by nothing. */
      const interval = (event.timeStamp - pointerTime) / 1000;
      pointerTime = event.timeStamp;
      if (interval > 0) {
        pointerSpeed +=
          (dx / interval - pointerSpeed) * DRAG_VELOCITY_SMOOTHING;
      }
    };

    const onPointerEnd = (event: PointerEvent) => {
      if (event.pointerId !== heldPointer) return;

      heldPointer = null;
      if (container.hasPointerCapture(event.pointerId)) {
        container.releasePointerCapture(event.pointerId);
      }
      /* The hand's speed becomes the row's, in the row's own sign. A cancelled
         gesture — the browser taking over, a call arriving — is a release with
         no throw, so it keeps whatever speed it had sampled rather than being
         special-cased into a dead stop. */
      fling = Math.max(-FLING_LIMIT, Math.min(FLING_LIMIT, -pointerSpeed));
      pointerSpeed = 0;
      pending = 0;
    };

    container.addEventListener("pointerdown", onPointerDown);
    container.addEventListener("pointermove", onPointerMove);
    container.addEventListener("pointerup", onPointerEnd);
    container.addEventListener("pointercancel", onPointerEnd);

    frame = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      container.removeEventListener("pointerdown", onPointerDown);
      container.removeEventListener("pointermove", onPointerMove);
      container.removeEventListener("pointerup", onPointerEnd);
      container.removeEventListener("pointercancel", onPointerEnd);
    };
  }, [containerRef, trackRef, sequenceRef]);
}
