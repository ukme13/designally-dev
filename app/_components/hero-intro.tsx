"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import {
  INTRO,
  markIntroPlayed,
  markShowreelCue,
  shouldPlayIntro,
} from "@/app/_lib/intro";

/**
 * Homepage entrance animation.
 *
 * Renders three things, two of them permanent:
 *
 * 1. the cream-to-orange gradient, which is the hero's real background and is
 *    plain CSS, so it survives with or without JavaScript;
 * 2. the three statement lines, which stay in place once they arrive;
 * 3. a solid-orange base beneath the gradient, which the reveal uncovers.
 *
 * The reveal masks rather than moves. Solid orange is the base; the finished
 * gradient sits above it and stays completely still, while a soft mask
 * uncovers it from the top down. Only the boundary travels, so the gradient
 * arrives in its true proportions instead of being animated into them.
 *
 * See docs/specs/STARTUP-INTRO.md for the full timeline.
 *
 * The navbar is not touched directly. The timeline sets `data-intro` on the
 * document element and the header's own stylesheet reacts — see globals.css.
 */
/**
 * The stage the three lines are placed on. It fills the hero and is
 * positioned, so each line can be placed against it independently.
 *
 * Each line is a positioned motion wrapper holding one paragraph of type — see
 * the markup below for which classes go on which. The wrappers carry their own
 * `top` / `bottom` / `left` / `right`, so the lines can land anywhere on the
 * screen rather than stacking. Percentages track the hero height, so the
 * arrangement holds at every viewport size, and the gutter utilities keep them
 * off the edges.
 *
 * Styling is written as separate classes rather than one of the composed
 * `type-*` utilities: those set a weight, and a `font-*` class beside one would
 * fight it, with stylesheet order deciding the winner rather than the order
 * written here.
 */
const STATEMENT_BLOCK = "absolute inset-0 pointer-events-none";

/**
 * Extra distance, in pixels, that each line is raised beyond the point where
 * it has just cleared the top of the hero.
 *
 * The clearing distance itself is measured per line from what is painted, so a
 * lower line, a taller line or a more steeply tilted one already starts
 * further up. This is only breathing room on top of that.
 */
const RISE_CLEARANCE = 48;

/**
 * Mouse parallax: how far each line may travel from its resting place, line
 * one first.
 *
 * These are PER-AXIS limits, not a radius. x and y are clamped independently,
 * so the furthest a line can actually get is the corner of its own box —
 * sqrt(x² + y²), about 22px for the last line rather than 20. Vertical is half
 * of horizontal throughout, which keeps the gaps between the three lines close
 * to constant while the horizontal spread still reads as depth.
 *
 * The order is line identity, NOT the order they fall in. The entrance array
 * is deliberately reordered to change the stagger; reordering that must not
 * silently reassign these depths.
 */
const PARALLAX_LIMIT = [
  { x: 80, y: 10 },
  { x: 140, y: 20 },
  { x: 200, y: 30 },
] as const;

/**
 * How much scrolling the flight is spread over, in viewports.
 *
 * Two, so it lasts the length of the sticky stage — the hero and the section
 * after it — rather than being over by the time the hero has gone. The lines
 * are still on screen, still leaving, while the second section is being read.
 */
const SCROLL_FLIGHT_VIEWPORTS = 2;

/**
 * How far each line travels upward, as a multiple of the viewport height,
 * across the whole of SCROLL_FLIGHT_VIEWPORTS.
 *
 * Under 1, and deliberately: this is movement RELATIVE TO the layer the lines
 * sit in, and that layer is only pinned for the length of the hero. After that
 * it releases and travels up with the page, so the total distance a line
 * covers is its own flight plus the layer's. Distances that clear the frame on
 * their own would take the lines out before the section below arrived.
 *
 * Increasing down the list, so they separate on the way out rather than
 * leaving as a block. The order is line identity, matching PARALLAX_LIMIT —
 * line one is the topmost and travels least.
 */
const SCROLL_FLIGHT = [0.7, 0.85, 1.0] as const;

/** Long enough to lag behind the cursor, short enough not to feel like drift. */
const PARALLAX_DURATION = 0.6;
const PARALLAX_EASE = "power3.out";

/**
 * Holds a normalised coordinate inside -1..1.
 *
 * Movement is a bounded function of the pointer's position and is never
 * accumulated, so the text cannot drift away however long the mouse moves.
 * The clamp covers the one case the maths does not: a pointer event arriving
 * from a child that overflows the hero, which `whitespace-nowrap` allows.
 */
const clampUnit = (value: number) => Math.min(1, Math.max(-1, value));


export default function HeroIntro() {
  const rootRef = useRef<HTMLDivElement>(null);
  const gradientRef = useRef<HTMLDivElement>(null);
  /** Bumped on every effect setup, so a stale cleanup can identify itself. */
  const lineOneRef = useRef<HTMLDivElement>(null);
  const lineTwoRef = useRef<HTMLDivElement>(null);
  const lineThreeRef = useRef<HTMLDivElement>(null);
  /** Layer 2 of each line: the only element the scroll flight writes to. */
  const flightOneRef = useRef<HTMLDivElement>(null);
  const flightTwoRef = useRef<HTMLDivElement>(null);
  const flightThreeRef = useRef<HTMLDivElement>(null);
  /** Layer 4 of each line: the only element mouse parallax writes to. */
  const parallaxOneRef = useRef<HTMLDivElement>(null);
  const parallaxTwoRef = useRef<HTMLDivElement>(null);
  const parallaxThreeRef = useRef<HTMLDivElement>(null);
  const generationRef = useRef(0);
  /** Gates the parallax effect. Set by finish(), which is the single end. */
  const [entranceDone, setEntranceDone] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const generation = ++generationRef.current;
    const root = document.documentElement;
    const gradient = gradientRef.current;
    // Ordered, because the fall is staggered from the first line down.
    const lines = [
      lineThreeRef.current,
      lineTwoRef.current,
      lineOneRef.current,
    ].filter((node): node is HTMLDivElement => node !== null);

    /**
     * Puts every element into its finished state and clears anything
     * temporary. Visual only — it deliberately does not decide whether the
     * intro counts as played. Safe to call repeatedly.
     */
    const restore = () => {
      root.removeAttribute("data-intro");
      if (gradient) {
        gradient.style.setProperty("--intro-reveal", "0%");
      }
      for (const line of lines) {
        // Only what the sequence itself put here. `data-intro` is already gone,
        // so the rules that hid and raised the wrapper no longer match and the
        // stylesheet defines the finished state on its own.
        line.style.removeProperty("will-change");
        line.style.removeProperty("visibility");
        line.style.removeProperty("transform");
      }
    };

    /** The end of a real run: restore, and make sure it cannot happen again. */
    const finish = () => {
      restore();
      markIntroPlayed();
      // Every real ending runs through here — the timeline completing, the
      // reduced-motion branch, a failed import, the watchdog, and the
      // immediate call when this load is not one the intro plays on. That last
      // case is why an internal navigation gets parallax straight away.
      //
      // Deliberately not in restore(), which is also the unmount path.
      setEntranceDone(true);
      // Backstop for the showreel, which waits on a cue the timeline normally
      // raises partway through at INTRO.showreelCue. This covers every path
      // where the timeline never reaches that point — reduced motion, a failed
      // import, the watchdog, a load the intro does not play on. Idempotent,
      // so when the timeline did raise it this does nothing. Remembered rather
      // than broadcast, so a component that mounts later is not left waiting
      // for an event it missed.
      markShowreelCue();
    };

    if (!shouldPlayIntro(pathname)) {
      finish();
      return;
    }

    /**
     * React runs effects twice in development. The first pass is thrown away,
     * so its async continuation must not build a timeline or mark the intro as
     * played — otherwise the surviving mount finds nothing left to do and the
     * animation never appears.
     */
    let cancelled = false;
    let context: { revert: () => void } | undefined;
    let watchdog: ReturnType<typeof setTimeout> | undefined;

    const run = async () => {
      try {
        const { gsap } = await import("gsap");
        if (cancelled || generationRef.current !== generation) return;

        const media = gsap.matchMedia();

        media.add(
          {
            motion: "(prefers-reduced-motion: no-preference)",
            reduced: "(prefers-reduced-motion: reduce)",
          },
          (mediaContext) => {
            const { reduced } = mediaContext.conditions as {
              motion: boolean;
              reduced: boolean;
            };

            if (reduced) {
              finish();
              return;
            }

            // Hand control from the CSS fail-safes to the timeline. The header is
            // already hidden by the pre-paint script; this only takes over.
            // CSS is holding --intro-reveal at 100% and nothing is moving,
            // so the timeline starts from the value already on screen. Pin it
            // inline first, then switch the marker — both synchronous, so no
            // frame can paint between them and there is nothing to reset.
            gsap.set(gradient, { "--intro-reveal": "100%" });

            /*
              How far each line starts above the hero.

              Per line, not one figure for all three: the distance a line needs
              is its own bottom edge. Raising everything by the hero height
              leaves a line placed at, say, bottom-[-5%] still showing that 5%
              at the first frame, because its bottom edge starts below the
              hero's own.

              Measured from what is PAINTED rather than from the layout box,
              because two things routinely fall outside that box:

                - the tilt. `rotate-*` sits on the inner paragraph and applies
                  after layout, so a wide `whitespace-nowrap` line turned a few
                  degrees reaches about width * sin(angle) / 2 past the
                  wrapper's top and bottom edges — tens of pixels at a large
                  viewport.
                - `leading-[0.95]`. A line height under 1 means the glyphs
                  spill outside the line box.

              The union of the wrapper's rect and its children's covers both: a
              client rect of a rotated element is its axis-aligned bounding
              box, which is the painted extent.

              Neutralising the transform first is what makes those rects
              usable. The CSS start state has the line translated up by 100svh
              and a client rect would report that shifted position, so an
              inline y: 0 puts the line back at its resting place to be
              measured. Every write here is synchronous, so no frame can paint
              between them — and the lines are still `visibility: hidden` at
              this point regardless.

              Read once, when the timeline is built. Nothing recalculates from
              the viewport mid-flight.
            */
            gsap.set(lines, { y: 0 });

            const heroTop = rootRef.current?.getBoundingClientRect().top ?? 0;
            const risePerLine = lines.map((line) => {
              // Every descendant, not just the children: the tilted paragraph
              // is a grandchild now that parallax has its own layer, and the
              // plain wrapper between them has no rotation of its own to
              // report. Missing it would drop the tilt out of the measurement.
              const painted = Array.from(line.querySelectorAll("*")).reduce(
                (lowest, child) =>
                  Math.max(lowest, child.getBoundingClientRect().bottom),
                line.getBoundingClientRect().bottom,
              );
              return painted - heroTop + RISE_CLEARANCE;
            });

            // Raised first, made visible second, so they are never on screen in
            // their final position. Both writes are synchronous, and the hero
            // clips its overflow, so they cannot be seen up there either.
            gsap.set(lines, {
              y: (index: number) => -risePerLine[index],
              willChange: "transform",
            });
            gsap.set(lines, { visibility: "visible" });

            root.setAttribute("data-intro", "armed");


            const timeline = gsap.timeline({
              onComplete: finish,
              onInterrupt: restore,
            });

            // The run is now genuinely under way, so it must not repeat.
            markIntroPlayed();

            // Stage 1 the background, stage 2 the statement lines, stage 3
            // the navbar.
            timeline
              .to(
                gradient,
                {
                  "--intro-reveal": "0%",
                  duration: INTRO.revealDuration / 1000,
                  ease: "power2.inOut",
                },
                INTRO.revealStart / 1000,
              )
              // The fall accelerates, so it reads as weight. Transform only —
              // the lines never change opacity.
              .to(
                lines,
                {
                  y: 10,
                  duration: INTRO.markFall / 1000,
                  ease: "power2.in",
                  stagger: INTRO.markStagger / 1000,
                },
                INTRO.markStart / 1000,
              )
              // A 10px overshoot easing out: a small, controlled settle, not a
              // bounce, and no rotation.
              .to(
                lines,
                {
                  y: 0,
                  duration: INTRO.markSettle / 1000,
                  ease: "power2.out",
                  stagger: INTRO.markStagger / 1000,
                  onComplete: () => {
                    for (const line of lines) line.style.willChange = "";
                  },
                },
                (INTRO.markStart + INTRO.markFall) / 1000,
              )
              // Releases the showreel, which has been waiting to start its
              // own entrance. Deliberately here rather than at the end of this
              // timeline: the navbar's transition below is two full seconds
              // and the showreel does not depend on it, so waiting for it put
              // the video's entrance at roughly 5.9s from load. The two now
              // run together. Nothing about the navbar is affected — this
              // fires a cue and moves on.
              .call(
                () => markShowreelCue(),
                undefined,
                INTRO.showreelCue / 1000,
              )
              // Stage 3: the whole navbar enters once the last line has
              // settled. The header lives in the root layout, outside this
              // component's subtree, so the timeline flips the marker and the
              // header's own stylesheet does the movement.
              .call(
                () => root.setAttribute("data-intro", "navbar"),
                undefined,
                INTRO.navbarStart / 1000,
              )
              // Holds the timeline open for the entrance, so onComplete does
              // not clear the marker while the transition is still running.
              .to({}, { duration: INTRO.navbarDuration / 1000 });

            return () => timeline.kill();
          },
        );

        context = media;

        // If the timeline never reports back — a stalled tab, a thrown error
        // inside a callback — the page still ends up in its finished state.
        watchdog = setTimeout(finish, INTRO.total + 2000);
      } catch {
        // GSAP failed to load or initialise. The CSS failsafe is still on the
        // gradient if we never got as far as removing it; restore() covers the
        // case where we did.
        finish();
      }
    };

    void run();

    return () => {
      cancelled = true;
      if (watchdog) clearTimeout(watchdog);
      context?.revert();

      /*
        Do not restore yet.

        React runs effects twice in development, cleaning up and setting up
        again inside the same commit. Restoring here would clear the marker and
        reveal the finished gradient; the replacement setup then waits on a
        dynamic import, and the browser paints that revealed gradient before
        GSAP can hide it again. That is the flash.

        Deferring to a microtask puts this after the replacement setup has run
        and still before any paint. The generation token then tells the two
        cases apart: if a newer setup exists this cleanup is a Strict Mode
        replay and does nothing; if not it is a real unmount and the page is
        restored.

        A microtask rather than an animation frame, so it still runs when the
        tab is in the background.
      */
      queueMicrotask(() => {
        // Reading the ref late is the whole mechanism: a changed value means a
        // replacement setup has already run, so this cleanup is a Strict Mode
        // replay. The lint rule's advice — copy it into the effect — would
        // freeze the value and defeat the check.
        // eslint-disable-next-line react-hooks/exhaustive-deps
        if (generationRef.current !== generation) return;
        restore();
      });
    };
  }, [pathname]);

  /*
    Scroll flight: the lines leave upward as the page scrolls past the hero.

    A third effect for the same reason parallax is a second one — the entrance
    owns a generation token and a microtask-deferred restore that exist to
    survive Strict Mode, and nothing else should have to reason about them.

    It writes to layer 2 and nothing else. The entrance owns layer 3, placement
    owns layer 1 and the tilt lives on the paragraph, so no two things ever
    share a transform. Putting this on an existing layer would fold it into
    that layer's matrix and the tilt would be lost at the end.

    Gated on `entranceDone`, so scrolling during the first four seconds cannot
    have the lines falling in and flying out at once.

    A plain listener with a `quickSetter` rather than ScrollTrigger: the value
    is a direct function of `scrollY` with no easing, timeline or pinning
    involved, and the plugin would be 40kB to compute one number. Reads are
    coalesced to one per frame.
  */
  useEffect(() => {
    if (!entranceDone) return;

    const layers = [
      flightOneRef.current,
      flightTwoRef.current,
      flightThreeRef.current,
    ].filter((node): node is HTMLDivElement => node !== null);

    /* Requiring the full set keeps each layer aligned with its own distance;
       a short array would silently shift them up by one. */
    if (layers.length !== SCROLL_FLIGHT.length) return;

    let cancelled = false;
    let context: { revert: () => void } | undefined;

    const run = async () => {
      const { gsap } = await import("gsap");
      if (cancelled) return;

      const media = gsap.matchMedia();

      media.add("(prefers-reduced-motion: no-preference)", () => {
        const setters = layers.map((layer) =>
          gsap.quickSetter(layer, "y", "px"),
        );
        let frame = 0;

        const update = () => {
          frame = 0;
          const height = window.innerHeight || 1;
          /* Spread over the whole stage rather than the hero alone, so the
             lines are still travelling while the section below is on screen.
             Clamped, so they settle once they are gone rather than
             accelerating away down the rest of the page. */
          const progress = Math.min(
            1,
            Math.max(
              0,
              window.scrollY / (height * SCROLL_FLIGHT_VIEWPORTS),
            ),
          );
          setters.forEach((set, index) => {
            set(-progress * height * SCROLL_FLIGHT[index]);
          });
        };

        /* Coalesced to one write per frame. Scroll fires far more often than
           the screen repaints, and this reads layout-independent values only,
           so there is nothing to gain from running on every event. */
        const onScroll = () => {
          if (!frame) frame = requestAnimationFrame(update);
        };

        /* Once immediately: a reload partway down the page must not start the
           lines at zero and then jump. */
        update();
        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("resize", onScroll);

        return () => {
          if (frame) cancelAnimationFrame(frame);
          window.removeEventListener("scroll", onScroll);
          window.removeEventListener("resize", onScroll);
        };
      });

      context = media;
    };

    void run();

    return () => {
      cancelled = true;
      /* Runs the cleanup above, and reverts the inline transform, so the lines
         are left exactly where the stylesheet puts them. */
      context?.revert();
    };
  }, [entranceDone]);

  /*
    Mouse parallax on the three statement lines.

    A second effect on purpose. The entrance effect's generation token,
    `cancelled` flag and microtask-deferred restore exist to survive Strict
    Mode's discarded first pass; keeping parallax out of it means neither has
    to reason about the other.

    It writes to layer 3 of each line and nothing else. The entrance owns
    layer 2, the placement owns layer 1 and the tilt lives on the paragraph, so
    no two things ever share a transform.
  */
  useEffect(() => {
    if (!entranceDone) return;

    const hero = rootRef.current;
    const layers = [
      parallaxOneRef.current,
      parallaxTwoRef.current,
      parallaxThreeRef.current,
    ].filter((node): node is HTMLDivElement => node !== null);

    // Requiring the full set keeps each layer aligned with its own limit;
    // a short array would silently shift the depths up by one.
    if (!hero || layers.length !== PARALLAX_LIMIT.length) return;

    let cancelled = false;
    let context: { revert: () => void } | undefined;

    const run = async () => {
      const { gsap } = await import("gsap");

      // The import resolves on a later tick, by which time this effect may
      // already have been cleaned up — Strict Mode guarantees it in
      // development. The cleanup below has nothing to revert at that point, so
      // a stale resolution must attach no listeners and build no tweens at all
      // rather than leaving either behind.
      if (cancelled) return;

      const media = gsap.matchMedia();

      media.add(
        "(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)",
        () => {
          /*
            One paused tween per property per layer, re-aimed by resetTo on
            each pointer event. Nothing is allocated while the mouse moves, and
            GSAP's ticker runs only while a tween is actually travelling — so
            there is no standing animation loop, and none is needed.
          */
          const setters = layers.map((layer, index) => ({
            x: gsap.quickTo(layer, "x", {
              duration: PARALLAX_DURATION,
              ease: PARALLAX_EASE,
            }),
            y: gsap.quickTo(layer, "y", {
              duration: PARALLAX_DURATION,
              ease: PARALLAX_EASE,
            }),
            limit: PARALLAX_LIMIT[index],
          }));

          /*
            Whether the cursor was over the hero on the previous event.

            `home()` restarts its tweens, so calling it on every event while
            the pointer is elsewhere on the page would keep the lines
            perpetually 600ms from home instead of letting them arrive. Only
            the crossing matters.
          */
          let wasInside = false;

          /** Ease everything back to its resting place. */
          const home = () => {
            wasInside = false;
            for (const setter of setters) {
              setter.x(0);
              setter.y(0);
            }
          };

          const onPointerMove = (event: PointerEvent) => {
            // A hybrid laptop matches (hover: hover) and (pointer: fine) and
            // can still be touched. Only a mouse should move these.
            if (event.pointerType !== "mouse") return;

            // Read per event rather than cached: browsers coalesce pointermove
            // to roughly one per frame, so this is one layout read per frame,
            // and it stays correct when the page is scrolled or resized
            // without needing listeners for either.
            const rect = hero.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) return;

            const inside =
              event.clientX >= rect.left &&
              event.clientX <= rect.right &&
              event.clientY >= rect.top &&
              event.clientY <= rect.bottom;

            if (!inside) {
              if (wasInside) home();
              return;
            }
            wasInside = true;

            const nx = clampUnit(
              ((event.clientX - rect.left) / rect.width) * 2 - 1,
            );
            const ny = clampUnit(
              ((event.clientY - rect.top) / rect.height) * 2 - 1,
            );

            for (const setter of setters) {
              setter.x(nx * setter.limit.x);
              setter.y(ny * setter.limit.y);
            }
          };

          /*
            Listening on the window, but driven entirely by the hero's own
            rectangle — the test above is what scopes this, not the element the
            event happens to land on.

            It has to work this way because the header is fixed at z-40 across
            the top of the hero and swallows the pointer there whatever its
            background is. Bound to the hero element, moving the cursor into
            that 80-120px strip fired `pointerleave` and sent the lines home
            mid-gesture. The rectangle does not care what is painted on top.

            No extra cost while the pointer is elsewhere: the handler reads one
            rect, fails the bounds test and returns.
          */
          window.addEventListener("pointermove", onPointerMove);
          // Two ways the pointer can stop being over the hero without another
          // move event: the gesture being cancelled by the browser, and the
          // pointer leaving the document or the window losing focus with the
          // cursor still inside. The last matters because nothing follows an
          // alt-tab, so without it the lines would stay held off-centre.
          window.addEventListener("pointercancel", home);
          document.addEventListener("pointerleave", home);
          window.addEventListener("blur", home);

          return () => {
            window.removeEventListener("pointermove", onPointerMove);
            window.removeEventListener("pointercancel", home);
            document.removeEventListener("pointerleave", home);
            window.removeEventListener("blur", home);
          };
        },
      );

      context = media;
    };

    void run();

    return () => {
      cancelled = true;
      // One call does all three: runs the cleanup above, kills the tweens
      // created inside the context, and reverts the inline transforms they
      // wrote — so the lines are left exactly where the stylesheet puts them.
      context?.revert();
    };
  }, [entranceDone]);

  return (
    <div ref={rootRef} className="absolute inset-0 overflow-hidden">
      {/* Base. Solid orange, permanently beneath the gradient. */}
      <div aria-hidden="true" className="absolute inset-0 bg-action-primary" />

      {/* The finished gradient. Permanent and stationary — a soft mask
          uncovers it from the top down, so only the edge moves. */}
      <div
        ref={gradientRef}
        aria-hidden="true"
        className="intro-gradient absolute inset-0 bg-linear-to-b from-surface-base to-primary-300"
      />


      {/* Permanent statement. Real text, so it is left readable by assistive
          technology rather than hidden as decoration.

          Five elements per line, and the split is the point — no two things
          may share a transform:

            1 position   absolute top/left/right/bottom. Nothing animates it.
            2 flight     scroll-driven y. Carries the line up and out of frame
                         as the page scrolls past the hero.
            3 entrance   owns the ref and `intro-line`. The timeline writes y
                         here; the CSS pre-paint and fallback rules target it.
            4 parallax   mouse-driven x and y. Nothing else touches it.
            5 type       typography, colour, alignment and the tilt. No GSAP
                         target ever.

          Anything that is a transform belongs on the type element. Put a
          `rotate-*` on an animated wrapper instead and GSAP folds it into its
          own matrix, which both rotates the movement and loses the angle at
          the end.

          Placement — on element 1:
            position  top-[18%] | bottom-[12%], plus a gutter utility
                      (left-gutter-mobile md:left-gutter-tablet xl:left-gutter-desktop)
                      Percentages track the hero height, so the arrangement
                      holds at every viewport size.
          Keep `intro-line` — the reduced-motion rule targets it.

          Styling — on element 5:
            family    font-display | font-body | font-accent
            size      an arbitrary font size — `text-` plus a clamp() of
                      min, preferred, max in square brackets. The vw figure in
                      the middle drives it; 11vw nearly fills the line, so
                      raise it to go bigger. Written out rather than shown as a
                      class because Tailwind scans comments too, and a literal
                      example here compiles into a real rule.
            leading   leading-[0.95] stacks the lines tightly
            weight    font-thin 100 | font-light 300 | font-regular 400 |
                      font-medium 500 | font-semibold 600 | font-bold 700
            colour    text-white | text-text-primary | text-primary-300
            align     text-left | text-right
            tilt      rotate-3 | -rotate-6 | rotate-[2.5deg]

          The closing word carries `font-display` so the italic is EB Garamond
          against Poppins; Poppins has no italic loaded and would be faked. */}
      <div className={STATEMENT_BLOCK}>
        {/* 1 — position */}
        <div className="whitespace-nowrap absolute bottom-[20%] left-gutter-mobile md:left-gutter-tablet xl:left-[-5%]">
          {/* 2 — flight */}
          <div ref={flightOneRef}>
            {/* 3 — entrance */}
            <div ref={lineOneRef} className="intro-line">
              {/* 4 — parallax */}
              <div ref={parallaxOneRef}>
                {/* 5 — type */}
                <p className="-rotate-8 text-left font-body font-regular text-[clamp(7rem,12vw,20rem)] leading-[0.95] tracking-tight text-primary-250/50">
                  Make it <i className="font-display">Right</i>
                </p>
              </div>
            </div>
          </div>
        </div>
        {/* 1 — position */}
        <div className="whitespace-nowrap absolute bottom-[5%] right-gutter-mobile md:right-gutter-tablet xl:right-[-10%]">
          {/* 2 — flight */}
          <div ref={flightTwoRef}>
            {/* 3 — entrance */}
            <div ref={lineTwoRef} className="intro-line">
              {/* 4 — parallax */}
              <div ref={parallaxTwoRef}>
                {/* 5 — type */}
                <p className="rotate-4 text-right font-body font-light text-[clamp(7rem,12vw,20rem)] leading-[0.95] tracking-tight text-primary-300">
                  Make it <i className="font-display">Simple</i>
                </p>
              </div>
            </div>
          </div>
        </div>
        {/* 1 — position */}
        <div className="whitespace-nowrap absolute bottom-[-8%] left-gutter-mobile md:left-gutter-tablet xl:left-[6%]">
          {/* 2 — flight */}
          <div ref={flightThreeRef}>
            {/* 3 — entrance */}
            <div ref={lineThreeRef} className="intro-line">
              {/* 4 — parallax */}
              <div ref={parallaxThreeRef}>
                {/* 5 — type */}
                <p className="rotate-2 text-left font-body font-medium text-[clamp(7rem,12vw,20rem)] leading-[0.95] tracking-tight text-primary-350">
                  Make it <i className="font-display">Work</i>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
