"use client";

import { useLenis } from "lenis/react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { present } from "@/app/_lib/element-slots";
import type { ElementSlots } from "@/app/_lib/element-slots";
import { useGradientFade } from "@/app/_lib/use-gradient-fade";
import { useStatementFlight } from "@/app/_lib/use-statement-flight";
import { useStatementParallax } from "@/app/_lib/use-statement-parallax";
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
const STATEMENT_BLOCK = "absolute inset-0 pointer-events-none opacity-30";

/**
 * The three lines, in line identity order — one, two, three.
 *
 * That order is load-bearing beyond the markup: PARALLAX_LIMIT and
 * SCROLL_KEYFRAMES are indexed by it, so reordering this array reassigns their
 * depths and journeys too. The entrance deliberately animates the reverse of
 * it; see the note where that array is built.
 *
 * Every class is written out as a literal string. Tailwind scans this file as
 * text, so a class that only ever exists here still compiles — but one that is
 * assembled from fragments at runtime does not.
 *
 * `placement` is layer 1 and `type` is layer 5. Nothing else about a line is
 * editable from here, and nothing else should be: the three wrappers between
 * them each own one transform and carry no styling at all.
 */
const STATEMENT_LINES = [
  {
    placement:
      "whitespace-nowrap absolute bottom-[20%] left-gutter-mobile md:left-gutter-tablet xl:left-[-5%]",
    type: "text-left font-body font-regular text-[clamp(7rem,12vw,20rem)] leading-[0.95] tracking-tight text-primary-250/50",
    lead: "Make it ",
    accent: "Right",
  },
  {
    placement:
      "whitespace-nowrap absolute bottom-[5%] right-gutter-mobile md:right-gutter-tablet xl:right-[-10%]",
    type: "text-right font-body font-light text-[clamp(7rem,12vw,20rem)] leading-[0.95] tracking-tight text-primary-300",
    lead: "Make it ",
    accent: "Simple",
  },
  {
    placement:
      "whitespace-nowrap absolute bottom-[-8%] left-gutter-mobile md:left-gutter-tablet xl:left-[6%]",
    type: "text-left font-body font-medium text-[clamp(7rem,12vw,20rem)] leading-[0.95] tracking-tight text-primary-350",
    lead: "Make it ",
    accent: "Work",
  },
] as const;

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
 * THE KNOBS. Where each statement line starts and ends its scroll journey.
 *
 * One entry per line, in the same order as STATEMENT_LINES:
 *
 *   [0]  Make it Right
 *   [1]  Make it Simple
 *   [2]  Make it Work
 *
 * `x` and `y` are pixels, `rotation` is degrees. `start` is what the line
 * looks like at the top of the sticky stage and `end` is what it looks like at
 * the bottom; every frame between is a straight interpolation of the three.
 *
 * `start.rotation` replaces the `rotate-*` class each line used to carry. Those
 * classes were removed rather than kept, because a Tailwind rotate and an
 * animated rotation both write `transform` on the same element and the
 * stylesheet would decide the winner, not this file.
 *
 * Positive `x` moves right, positive `y` moves down — so the lines leave
 * upward on negative `y`.
 */
const SCROLL_KEYFRAMES = [
  {
    start: { x: 0, y: 0, rotation: -3 },
    end: { x: -180, y: -160, rotation: -14 },
  },
  {
    start: { x: 0, y: 0, rotation: 4 },
    end: { x: 280, y: -190, rotation: 10 },
  },
  {
    start: { x: 0, y: 0, rotation: 2 },
    end: { x: -380, y: -220, rotation: -4 },
  },
] as const;

/**
 * The attribute `page.tsx` puts on the sticky stage, and the contract between
 * the two files.
 *
 * Progress is measured against that element's own rectangle rather than
 * `window.scrollY`, so the animation keeps its timing if content is ever added
 * above the hero — the stage moves with the page and the maths follows it.
 */
const SCROLL_STAGE_ATTRIBUTE = "data-scroll-stage";

/** Long enough to lag behind the cursor, short enough not to feel like drift. */
const PARALLAX_DURATION = 0.6;
const PARALLAX_EASE = "power3.out";

export default function HeroIntro() {
  const rootRef = useRef<HTMLDivElement>(null);
  const gradientRef = useRef<HTMLDivElement>(null);
  /** Bumped on every effect setup, so a stale cleanup can identify itself. */
  /** Layer 3 of each line: the only element the entrance timeline writes to. */
  const entranceRefs = useRef<ElementSlots<HTMLDivElement>>([]);
  /** Layer 2 of each line: the only element the scroll flight writes to. */
  const flightRefs = useRef<ElementSlots<HTMLDivElement>>([]);
  /** Layer 4 of each line: the only element mouse parallax writes to. */
  const parallaxRefs = useRef<ElementSlots<HTMLDivElement>>([]);
  /**
   * Layer 5 of each line: the paragraph itself, and the only element the
   * scroll flight's ROTATION writes to.
   *
   * The rotation lives here rather than on one of the wrappers because this is
   * where it has always lived — as a `rotate-*` class. Moving it up a layer
   * would rotate that layer's translation too, which is the exact trap the
   * five-layer split exists to avoid.
   */
  const typeRefs = useRef<ElementSlots<HTMLParagraphElement>>([]);
  const generationRef = useRef(0);
  /** Gates the parallax effect. Set by finish(), which is the single end. */
  const [entranceDone, setEntranceDone] = useState(false);
  /**
   * Undefined until Lenis has mounted, and on any page where it has not.
   *
   * Read from the global store Lenis keeps in `root` mode, so no provider has
   * to wrap this subtree. It arrives one commit late — effects run child-first,
   * so this component's run before the one in the layout that fills the store
   * — and the subscription re-renders when it lands.
   */
  const lenis = useLenis();
  const pathname = usePathname();

  useEffect(() => {
    const generation = ++generationRef.current;
    const root = document.documentElement;
    const gradient = gradientRef.current;
    /* Reversed, because the fall is staggered from the LAST line up: GSAP
       applies a stagger in array order, so line three has to come first.
       Reversing a filtered copy, never STATEMENT_LINES itself, which every
       other index in this file is counted against. */
    const lines = present(entranceRefs.current).reverse();

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
    Scroll is locked while the entrance plays.

    The sequence is composed to be watched from the top: the gradient sweeps,
    the lines fall, the navbar arrives, the showreel materialises. Scrolling
    through it shows none of that, only a half-finished page moving away.

    Released by `entranceDone`, which `finish()` sets — and `finish()` is the
    single path every real ending goes through, including reduced motion, a
    failed GSAP import and the watchdog. So the lock cannot outlive a broken
    intro along any route the entrance already handles.

    The timeout is for the routes it does not. A scroll lock that survived an
    unexpected throw would leave the page unusable, which is far worse than a
    missed animation, so it also expires on its own.

    `data-intro` is the condition rather than the pathname: the attribute is
    set before paint by the script in layout.tsx and removed by restore(), so
    this locks exactly when the intro is genuinely running. Reduced motion and
    internal navigations never set it, and so are never locked. Neither is a
    visitor with JavaScript off — Lenis is absent and the page just scrolls,
    which is the right way for this to fail.
  */
  useEffect(() => {
    if (!lenis || entranceDone) return;
    if (!document.documentElement.hasAttribute("data-intro")) return;

    lenis.stop();
    const failsafe = setTimeout(() => lenis.start(), INTRO.total + 2000);

    return () => {
      clearTimeout(failsafe);
      lenis.start();
    };
  }, [lenis, entranceDone]);

  /* Both behaviours live in app/_lib/. Their knobs stay here, where they are
     edited; only the machinery moved out. */
  /* The gradient dissolves into the solid orange beneath it as the stage
     scrolls, finishing exactly as the pin releases. See use-gradient-fade.ts. */
  useGradientFade({
    gradientRef,
    stageAttribute: SCROLL_STAGE_ATTRIBUTE,
  });

  useStatementFlight({
    enabled: entranceDone,
    originRef: rootRef,
    stageAttribute: SCROLL_STAGE_ATTRIBUTE,
    layerRefs: flightRefs,
    typeRefs,
    keyframes: SCROLL_KEYFRAMES,
  });

  useStatementParallax({
    enabled: entranceDone,
    heroRef: rootRef,
    layerRefs: parallaxRefs,
    limits: PARALLAX_LIMIT,
    duration: PARALLAX_DURATION,
    ease: PARALLAX_EASE,
  });

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

          Edited in STATEMENT_LINES at the top of this file, not here — the
          markup below is one template mapped over that array, so a line's
          placement and typography are the only things that vary.

          `placement` — element 1:
            position  top-[18%] | bottom-[12%], plus a gutter utility
                      (left-gutter-mobile md:left-gutter-tablet xl:left-gutter-desktop)
                      Percentages track the hero height, so the arrangement
                      holds at every viewport size.
          Keep `intro-line` on element 3 — the reduced-motion rule targets it.

          `type` — element 5:
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
            tilt      NOT here any more — a line's angle is
                      SCROLL_KEYFRAMES[n].start.rotation, in degrees, and its
                      angle at the bottom of the stage is `end.rotation`

          The closing word carries `font-display` so the italic is EB Garamond
          against Poppins; Poppins has no italic loaded and would be faked. */}
      <div className={STATEMENT_BLOCK}>
        {STATEMENT_LINES.map((line, index) => (
          /* 1 — position */
          <div key={line.accent} className={line.placement}>
            {/* 2 — flight */}
            <div
              ref={(node) => {
                flightRefs.current[index] = node;
              }}
              /* The start keyframe, rendered by the server. Without it the
                 line would paint at 0,0 for one frame before the effect ran —
                 and under reduced motion, or with JavaScript off, this is the
                 only placement it ever gets. */
              style={{
                transform: `translate3d(${SCROLL_KEYFRAMES[index].start.x}px, ${SCROLL_KEYFRAMES[index].start.y}px, 0)`,
              }}
            >
              {/* 3 — entrance */}
              <div
                ref={(node) => {
                  entranceRefs.current[index] = node;
                }}
                className="intro-line"
              >
                {/* 4 — parallax */}
                <div
                  ref={(node) => {
                    parallaxRefs.current[index] = node;
                  }}
                >
                  {/* 5 — type */}
                  <p
                    ref={(node) => {
                      typeRefs.current[index] = node;
                    }}
                    className={line.type}
                    /* The start rotation, for the same reasons as the
                       translation above. This replaces the `rotate-*` class
                       each line used to carry — see SCROLL_KEYFRAMES. */
                    style={{
                      transform: `rotate(${SCROLL_KEYFRAMES[index].start.rotation}deg)`,
                    }}
                  >
                    {line.lead}
                    <i className="font-display">{line.accent}</i>
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
