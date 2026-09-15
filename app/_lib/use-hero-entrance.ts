"use client";

import type { RefObject } from "react";
import { useEffect } from "react";

import type { ElementSlots } from "@/app/_lib/element-slots";
import { present } from "@/app/_lib/element-slots";
import {
  INTRO,
  markIntroPlayed,
  markShowreelCue,
  shouldPlayIntro,
} from "@/app/_lib/intro";

/**
 * The homepage's opening sequence: the gradient sweeps in, the statement lines
 * rise, and the navbar is cued.
 *
 * Extracted from hero-intro.tsx, which keeps the markup, the five transform
 * layers and the placement of every line. It was the last animated component on
 * the site still carrying its own timeline; the split now matches
 * use-statement-flight, use-showreel-entrance, use-situation-cards and the
 * rest — the component says what the hero IS, this says how it arrives.
 *
 * Full specification: docs/specs/STARTUP-INTRO.md.
 *
 * The sequence is documented in the comment below, which came across with the
 * code, along with the reasons for its two escape hatches: the bail-out that
 * finishes the hero if GSAP never loads, and the generation counter that stops
 * a stale timeline from writing over a newer one.
 *
 * `onDone` replaces what was a direct `setEntranceDone(true)`. Every route out
 * of the sequence called it with the same value, so the hook needs a way to say
 * "the hero has arrived" rather than the setter itself — the component turns
 * that back into state, and into the scroll lock it releases.
 */

/**
 * Extra distance, in pixels, that each line is raised beyond the point where
 * it has just cleared the top of the hero.
 *
 * The clearing distance itself is measured per line from what is painted, so a
 * lower line, a taller line or a more steeply tilted one already starts
 * further up. This is only breathing room on top of that.
 */
const RISE_CLEARANCE = 48;

export function useHeroEntrance({
  rootRef,
  gradientRef,
  entranceRefs,
  generationRef,
  lines,
  pathname,
  onDone,
}: {
  /** The hero itself. Measured, and the timeline's scope. */
  rootRef: RefObject<HTMLDivElement | null>;
  /** The cream-to-orange gradient, revealed by a travelling mask. */
  gradientRef: RefObject<HTMLDivElement | null>;
  /** The statement lines' entrance layer — one per line, in order. */
  entranceRefs: RefObject<ElementSlots<HTMLDivElement>>;
  /**
   * Which run of the sequence is current.
   *
   * A counter rather than a boolean: the import resolves on a later tick, and a
   * timeline from a previous navigation must not write to the DOM the current
   * one owns. Compared, not merely checked.
   */
  generationRef: RefObject<number>;
  /** The lines, only for their count and their per-line settings. */
  lines: readonly { readonly text: string }[] | readonly unknown[];
  /** Re-runs the sequence on a route change back to the homepage. */
  pathname: string;
  /** Called when the hero has arrived, by any route including the bail-out. */
  onDone: () => void;
}) {
  useEffect(() => {
    const generation = ++generationRef.current;
    const root = document.documentElement;
    const gradient = gradientRef.current;
    /* Reversed, because the fall is staggered from the LAST line up: GSAP
       applies a stagger in array order, so line three has to come first.
       Reversing a filtered copy, never lines itself, which every
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
      onDone();
      // Backstop for the showreel, which waits on a cue the timeline normally
      // raises partway through at INTRO.showreelCue. This covers every path
      // where the timeline never reaches that point — reduced motion, a failed
      // import, the watchdog, a load the intro does not play on. Idempotent,
      // so when the timeline did raise it this does nothing. Remembered rather
      // than broadcast, so a component that mounts later is not left waiting
      // for an event it missed.
      markShowreelCue();
    };

    /*
      Two reasons to skip straight to the finished state.

      `shouldPlayIntro` is the original one: an internal navigation, where the
      hero is already behind the reader.

      **Below `lg` is the second, added 15 September 2026.** The entrance
      animates the three statement lines, and those lines are no longer
      rendered on a phone — see STATEMENT_BLOCK in hero-intro.tsx. Playing a
      timeline against elements that are `display: none`, while holding the
      scroll lock and delaying the navbar for nearly four seconds, buys nothing
      and costs the reader the whole opening of the page.

      Routing through `finish()` rather than simply returning is the important
      part: it raises `markShowreelCue()`, which the showreel's pixel reveal
      waits on. Return early without it and the film sits invisible until its
      own 6.9s watchdog fires.

      64rem must stay in step with the `lg:` breakpoint used by the layout in
      page.tsx and by STATEMENT_BLOCK, and with the pre-paint script in
      layout.tsx. If they disagree there is a band of widths where the script
      hides the header for an intro that never plays.
    */
    const DESKTOP = "(min-width: 64rem)";
    if (!shouldPlayIntro(pathname) || !window.matchMedia(DESKTOP).matches) {
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
  }, [pathname, rootRef, gradientRef, entranceRefs, generationRef, lines, onDone]);
}
