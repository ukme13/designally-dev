"use client";

import type { RefObject } from "react";
import { useEffect } from "react";

import { cssEase } from "@/app/_lib/css-ease";

/**
 * Makes one element follow the pointer inside another, and hides the native
 * cursor while it does.
 *
 * Extracted from hover-cursor.tsx, which keeps the circle's markup and its
 * look — the same split the other animated components have with their hooks.
 * This file is where the pointer maths and the GSAP live.
 *
 * ── The knobs ────────────────────────────────────────────────────────────
 *   follow lag    FOLLOW_DURATION
 *   fade in/out   ENTER_DURATION and LEAVE_DURATION
 *   resting size  AWAY_SCALE
 *   easing        SWEEP_TOKEN, read from app/tokens.css
 * ─────────────────────────────────────────────────────────────────────────
 *
 * **Coordinates come from the containing block, events from the area.** They
 * are usually the same element, but not always: the showcase row clips, so its
 * circle is rendered one rung out in a wrapper beside it. Measuring against the
 * circle's own `offsetParent` makes both arrangements work without the caller
 * having to say which it is.
 *
 * **The rectangle is read every frame, not every pointer move.** With Lenis the
 * page can scroll while the pointer is perfectly still — no `pointermove`
 * fires, the area slides under the cursor, and a position computed at the last
 * move is stale by however far the page has travelled.
 *
 * **`offsetParent` is read once per hover, not per frame.** It forces a layout,
 * and on the showcase this loop runs on the same frames its drift writes a
 * transform — reading it there interleaved a forced layout with a style write
 * sixty times a second.
 *
 * Only a fine, hovering pointer gets any of this, and the handlers ignore any
 * event that is not a mouse — so a hybrid laptop's touchscreen never takes the
 * native cursor away. Reduced motion keeps the cursor and drops the motion:
 * every duration falls to zero.
 */

/**
 * How long the circle takes to reach the pointer, in seconds.
 *
 * This is the whole feel of the thing. It is a lag, not a delay: the circle is
 * always travelling toward where the pointer is now, so a slow move looks glued
 * and a fast one trails. Zero pins it to the pointer exactly, which is what
 * reduced motion asks for.
 */
const FOLLOW_DURATION = 0.35;
/** How long the circle takes to appear when the pointer arrives, in seconds. */
const ENTER_DURATION = 0.3;
/** How long it takes to leave, in seconds. Quicker than it arrives. */
const LEAVE_DURATION = 0.2;
/**
 * The size it grows in FROM, and shrinks back TO. Below 1, so it scales up.
 *
 * The circle arrives small and opens out to its own size, and leaves by
 * collapsing back down — one gesture, played forwards and backwards. Lower it
 * for a bigger opening; 1 would remove the scaling and leave a plain fade.
 */
const AWAY_SCALE = 0.4;
/**
 * The easing, taken from the design tokens rather than written here.
 *
 * GSAP cannot read a CSS variable, so the token's value is fetched from the
 * document at runtime and rebuilt as a CustomEase. That keeps `app/tokens.css`
 * the single definition — copying the curve into this file would be a second
 * place to change it, and the project rules are explicit about not writing raw
 * cubic-beziers into components.
 *
 * `--ease-sweep` is the header's underline curve: a slow start, a fast middle
 * and a long settle.
 */
const SWEEP_TOKEN = "--ease-sweep";
/** The name the rebuilt curve is registered under. */
const SWEEP_EASE = "showreel-cursor-sweep";
/** If the token is missing or unparseable, the nearest built-in shape. */
const FALLBACK_EASE = "power3.inOut";
/**
 * Hides the native pointer, as an inline style rather than a `cursor-none`
 * class.
 *
 * Because a host may declare its own cursor and win. The showcase row carries
 * `motion-safe:active:cursor-grabbing`, which is two classes' worth of
 * specificity — a single `.cursor-none` would lose to it the moment a drag
 * began, and the native grabbing hand would reappear beside the circle.
 * Stylesheet order decides between competing classes, never class order, so the
 * only reliable way to win from JavaScript is not to compete.
 *
 * Clearing it restores whatever the host's own classes say — grab, pointer,
 * default — with nothing to remember or put back.
 */
const HIDDEN_CURSOR = "none";

export function useHoverCursor({
  areaRef,
  cursorRef,
}: {
  /** The element the pointer hovers. Owns the listeners. */
  areaRef: RefObject<HTMLElement | null>;
  /** The circle. Its `offsetParent` is the coordinate space. */
  cursorRef: RefObject<HTMLDivElement | null>;
}) {
  useEffect(() => {
    const area = areaRef.current;
    const cursor = cursorRef.current;
    if (!area || !cursor) return;

    let cancelled = false;
    let revert: (() => void) | undefined;

    const run = async () => {
      const [{ gsap }, { CustomEase }] = await Promise.all([
        import("gsap"),
        import("gsap/CustomEase"),
      ]);

      /* The import resolves on a later tick, by which time this effect may
         already have been cleaned up — Strict Mode guarantees it in
         development. A stale resolution must attach no listeners and build no
         tweens rather than leaving either behind. */
      if (cancelled) return;

      gsap.registerPlugin(CustomEase);
      const sweep = cssEase(
        (id, data) => CustomEase.create(id, data),
        SWEEP_TOKEN,
        SWEEP_EASE,
        FALLBACK_EASE,
      );

      const media = gsap.matchMedia();

      media.add(
        {
          smooth:
            "(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)",
          instant:
            "(hover: hover) and (pointer: fine) and (prefers-reduced-motion: reduce)",
        },
        (context) => {
          const instant = context.conditions?.instant === true;
          const follow = instant ? 0 : FOLLOW_DURATION;
          const enter = instant ? 0 : ENTER_DURATION;
          const leave = instant ? 0 : LEAVE_DURATION;

          gsap.set(cursor, {
            /* Half its own width and height back, so `x`/`y` name its centre
               rather than its top-left corner. */
            xPercent: -50,
            yPercent: -50,
            x: 0,
            y: 0,
            opacity: 0,
            scale: AWAY_SCALE,
          });

          /*
            Built ONCE, here, and reused for the life of this context. A pair of
            paused tweens re-aimed by `resetTo` on each call: nothing is
            allocated while the mouse travels, and GSAP's ticker only runs while
            a tween is genuinely moving.
          */
          const moveX = gsap.quickTo(cursor, "x", { duration: follow });
          const moveY = gsap.quickTo(cursor, "y", { duration: follow });

          /** The last raw viewport coordinate. Written by pointermove only. */
          let clientX = 0;
          let clientY = 0;
          let frame = 0;
          /*
            The element the circle is positioned FROM, resolved once per hover.

            `offsetParent` is a layout-forcing read, and this loop runs on every
            frame the pointer is inside. On the showcase that is the same frame
            the drift loop writes a transform to the track, so reading it here
            interleaved a forced layout with a style write sixty times a second
            — the one place in this component that could be felt. It cannot
            change while a pointer is held over the area, so it is read on the
            way in and kept.
          */
          let origin: HTMLElement = area;
          /* The last position actually sent, so an idle frame sends nothing. */
          let lastX = Number.NaN;
          let lastY = Number.NaN;

          /*
            Convert, clamp, aim. `snap` passes the destination as quickTo's
            START value too, which is how you reposition without a fly-in from
            wherever the circle was last seen. Doing that with `gsap.set`
            instead writes behind quickTo's back and leaves its internal start
            stale, so the next move jumps.
          */
          const aim = (snap: boolean) => {
            const rect = origin.getBoundingClientRect();
            /* The pointer's position in that element's own coordinates, and
               that is all. `xPercent` has already taken care of centring, and
               nothing is clamped — on an edge the circle straddles it. */
            const x = clientX - rect.left;
            const y = clientY - rect.top;

            if (snap) {
              lastX = x;
              lastY = y;
              moveX(x, x);
              moveY(y, y);
              return;
            }

            /* A still pointer over a still page produces the same numbers every
               frame. Re-aiming a quickTo restarts its tween, so sending them
               again is work with nothing to show for it. */
            if (x === lastX && y === lastY) return;
            lastX = x;
            lastY = y;
            moveX(x);
            moveY(y);
          };

          const tick = () => {
            aim(false);
            frame = requestAnimationFrame(tick);
          };

          const stopTicking = () => {
            if (frame) cancelAnimationFrame(frame);
            frame = 0;
          };

          /* A hybrid machine can satisfy `hover: hover` and still be touched.
             Only a mouse takes the native cursor away. */
          const isMouse = (event: PointerEvent) => event.pointerType === "mouse";

          const onEnter = (event: PointerEvent) => {
            if (!isMouse(event)) return;
            clientX = event.clientX;
            clientY = event.clientY;
            /* See the note on `origin`: read here, not in the frame loop. */
            origin = (cursor.offsetParent as HTMLElement | null) ?? area;
            area.style.cursor = HIDDEN_CURSOR;
            aim(true);
            stopTicking();
            frame = requestAnimationFrame(tick);
            /*
              `overwrite: "auto"` and NOT `true`. `true` kills every other tween
              on this target — including the two position tweens above, mid
              flight — which reads exactly like the circle stalling and jumping.
              "auto" only resolves conflicts on the same properties, and this
              tween touches neither x nor y.
            */
            gsap.to(cursor, {
              opacity: 1,
              scale: 1,
              duration: enter,
              ease: sweep,
              overwrite: "auto",
            });
          };

          /* Records the coordinate and nothing else. No rectangle is read here,
             and no state is written: the frame loop owns all of that. */
          const onMove = (event: PointerEvent) => {
            if (!isMouse(event)) return;
            clientX = event.clientX;
            clientY = event.clientY;
          };

          const onLeave = (event: PointerEvent) => {
            if (!isMouse(event)) return;
            /* Stop aiming first, so the circle cannot keep travelling toward an
               edge while it fades. */
            stopTicking();
            area.style.cursor = "";
            gsap.to(cursor, {
              opacity: 0,
              scale: AWAY_SCALE,
              duration: leave,
              ease: sweep,
              overwrite: "auto",
            });
          };

          area.addEventListener("pointerenter", onEnter);
          area.addEventListener("pointermove", onMove);
          area.addEventListener("pointerleave", onLeave);
          /* A pointer cancelled mid-hover — a browser gesture taking over —
             never fires `pointerleave`, and the circle would be left on screen
             with no native cursor to replace it. */
          area.addEventListener("pointercancel", onLeave);

          return () => {
            stopTicking();
            area.removeEventListener("pointerenter", onEnter);
            area.removeEventListener("pointermove", onMove);
            area.removeEventListener("pointerleave", onLeave);
            area.removeEventListener("pointercancel", onLeave);
            /* Whatever state the cursor was in, the visitor gets their pointer
               back. The quickTo tweens go with the matchMedia revert. */
            area.style.cursor = "";
          };
        },
      );

      revert = () => media.revert();
    };

    void run();

    return () => {
      cancelled = true;
      revert?.();
    };
  }, [areaRef, cursorRef]);
}
