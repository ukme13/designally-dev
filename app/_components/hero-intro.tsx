"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

import { INTRO, markIntroPlayed, shouldPlayIntro } from "@/app/_lib/intro";

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


export default function HeroIntro() {
  const rootRef = useRef<HTMLDivElement>(null);
  const gradientRef = useRef<HTMLDivElement>(null);
  /** Bumped on every effect setup, so a stale cleanup can identify itself. */
  const lineOneRef = useRef<HTMLDivElement>(null);
  const lineTwoRef = useRef<HTMLDivElement>(null);
  const lineThreeRef = useRef<HTMLDivElement>(null);
  const generationRef = useRef(0);
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
              const painted = Array.from(line.children).reduce(
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

          Two elements per line, and the split is the point:

            outer  the motion wrapper. It owns the ref, `intro-line` and the
                   placement. GSAP animates this and nothing else, and the CSS
                   pre-paint and fallback rules target this.
            inner  the type. Typography, colour, alignment and tilt. GSAP never
                   sees it, so nothing here is touched by the timeline.

          Anything that is a transform belongs on the inner element. Put a
          `rotate-*` on the wrapper instead and GSAP folds it into its own
          matrix, which both rotates the fall and loses the angle at the end.

          Placement — on the OUTER element:
            position  top-[18%] | bottom-[12%], plus a gutter utility
                      (left-gutter-mobile md:left-gutter-tablet xl:left-gutter-desktop)
                      Percentages track the hero height, so the arrangement
                      holds at every viewport size.
          Keep `intro-line` — the reduced-motion rule targets it.

          Styling — on the INNER element:
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
        <div
          ref={lineOneRef}
          className="intro-line whitespace-nowrap absolute bottom-[20%] left-gutter-mobile md:left-gutter-tablet xl:left-[-5%]"
        >
          <p className="-rotate-8 text-left font-body font-regular text-[clamp(7rem,12vw,20rem)] leading-[0.95] tracking-tight text-primary-250">
            Make it <i className="font-display">Right</i>
          </p>
        </div>
        <div
          ref={lineTwoRef}
          className="intro-line whitespace-nowrap absolute bottom-[5%] right-gutter-mobile md:right-gutter-tablet xl:right-[-10%]"
        >
          <p className="rotate-4 text-right font-body font-light text-[clamp(7rem,12vw,20rem)] leading-[0.95] tracking-tight text-primary-300">
            Make it <i className="font-display">Simple</i>
          </p>
        </div>
        <div
          ref={lineThreeRef}
          className="intro-line whitespace-nowrap absolute bottom-[-7%] left-gutter-mobile md:left-gutter-tablet xl:left-[8%]"
        >
          <p className="rotate-3 text-left font-body font-medium text-[clamp(7rem,12vw,20rem)] leading-[0.95] tracking-tight text-primary-350">
            Make it <i className="font-display">Work</i>
          </p>
        </div>
      </div>

    </div>
  );
}
