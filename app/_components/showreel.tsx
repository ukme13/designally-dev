"use client";

import { Fragment, useCallback, useEffect, useRef, useState } from "react";

import HoverCursor from "@/app/_components/hover-cursor";
import ShowreelPixels from "@/app/_components/showreel-pixels";
import { subscribeShowreelCue } from "@/app/_lib/intro";
import { useShowreelEntrance } from "@/app/_lib/use-showreel-entrance";
import { useShowreelStrip } from "@/app/_lib/use-showreel-strip";
import {
  ADVANCE_FALLBACK_MS,
  LOAD_MARGIN,
  PIXEL_COVER_MAX_MS,
  PIXEL_COLUMNS,
  PIXEL_ROWS,
  pixelGrid,
  SHOWREEL,
  SHOWREEL_MASK_ID,
  type PixelGrid,
  VISIBLE_RATIO,
} from "@/app/_lib/showreel";

/**
 * Homepage showreel.
 *
 * The final rectangle with real media and manual project selection, plus the
 * one-time pixel entrance. No automatic advance and no crossfade yet.
 *
 * The entrance reveals the video THROUGH an SVG mask rather than dissolving a
 * cover off it, so nothing is ever painted over the film and the rectangle is
 * genuinely transparent until it runs.
 *
 * Full specification: docs/specs/SHOWREEL.md
 *
 * Two conditions, deliberately separate, from two observers:
 *
 *   nearViewport   200px of margin. Permits the fetch, nothing more.
 *   visible        a real threshold, no margin. Permits playback.
 *
 * One observer serving both would either start playback while the section is
 * still off screen, or delay loading until it is already in view. The entrance
 * depends on the same split, so it cannot finish before it is seen.
 */
export default function Showreel() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  /** The `<mask>` itself, so its `<rect>` children are the animation targets. */
  const gridRef = useRef<SVGMaskElement>(null);
  /**
   * The outgoing film, frozen, sitting UNDER the mask during a switch.
   *
   * A canvas rather than a second `<video>`. Two elements would mean two sets
   * of playback state and handlers, and an outgoing clip that restarted from
   * zero unless its `currentTime` were carried across — a lot of machinery for
   * two seconds of picture. One frame held still under a film materialising
   * over it is indistinguishable at this length, and it is what stops the
   * rectangle going blank mid-switch.
   *
   * Always mounted so it can be drawn to synchronously inside the click, and
   * merely hidden when idle; a canvas that is not displayed still has its
   * backing store.
   */
  const holdRef = useRef<HTMLCanvasElement>(null);
  /** The rectangle itself. Only measured, never animated. */
  const boxRef = useRef<HTMLDivElement>(null);
  /** The scrolling strip of project pills. */
  const controlsRef = useRef<HTMLDivElement>(null);
  /** True between asking for a seek and the browser reporting it done. */
  const seekingRef = useRef(false);

  const [index, setIndex] = useState(0);
  const [nearViewport, setNearViewport] = useState(false);
  const [visible, setVisible] = useState(false);
  const [reduced, setReduced] = useState(false);
  /**
   * False until the first seek to `startAt` has completed.
   *
   * This is what holds the poster up. Revealing the video on `loadeddata`
   * would show frame zero for a moment — LAGA opens on a pale blur, Bitazza on
   * a measured half-second of black — and only then jump to the real start.
   */
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  /** True once the element reports it is actually playing, not merely asked. */
  const [playing, setPlaying] = useState(false);
  const [heroCued, setHeroCued] = useState(false);
  /**
   * True once the pixel mask is gone, by any route: the reveal finishing, GSAP
   * failing to load, or either watchdog.
   *
   * Per PROJECT, not per page load. It was once-and-never-again until the
   * entrance became the way every project arrives rather than a one-time
   * flourish; switching now clears it so the next film materialises the same
   * way the first did.
   */
  const [revealDone, setRevealDone] = useState(false);
  /**
   * True from the moment the entrance could first run, and never false again.
   *
   * The entrance used to be armed as soon as the media was — 200px before the
   * section reached the screen — because it was below the fold and nobody
   * could see it waiting. In the hero it is on screen at first paint and the
   * entrance cannot start until the hero cues it, so arming that
   * early left a rectangle sitting in the middle of the page for nearly four
   * seconds.
   *
   * Latched rather than derived, so a scroll away mid-entrance cannot pull the
   * mask out from under a running timeline. Only `revealDone` removes it, and
   * a project switch sets it straight back — which is what empties the
   * rectangle the instant a control is pressed.
   */
  const [coverArmed, setCoverArmed] = useState(false);
  /**
   * True once the caption has risen, and never false again.
   *
   * `revealDone` cannot drive the caption directly now that it clears on every
   * switch: the text would drop and re-rise on each click, and it no longer
   * says anything about the current project — it is a fixed statement. It
   * arrives once and stays.
   */
  const [captionShown, setCaptionShown] = useState(false);
  /** True while the outgoing frame is being held under an incoming film. */
  const [holding, setHolding] = useState(false);
  /**
   * The mask arrangement, chosen from the rectangle's real shape.
   *
   * 16 x 9 until something has been measured, which is also what a 16:9 box
   * resolves to — so the common case never changes after the first frame. On
   * mobile the rectangle fills the screen height instead, and a portrait box
   * needs a portrait grid or its cells stop being square.
   */
  const [grid, setGrid] = useState<PixelGrid>({
    columns: PIXEL_COLUMNS,
    rows: PIXEL_ROWS,
  });

  const project = SHOWREEL[index];

  /*
    Reduced motion means the poster and nothing else. There is no control that
    could start playback, so the file is never fetched either — downloading a
    video that can never play would be pure waste.
  */
  const mayLoad = nearViewport && !reduced;
  const shouldPlay = mayLoad && visible && !failed;
  /* The poster covers every case where there is no true frame beneath it: not
     permitted to load, still loading, not yet seeked to its start, failed. */
  const showPoster = !mayLoad || !ready || failed;
  /*
    The mask exists only for the entrance itself: it is applied at the same
    moment the reveal begins and starts resolving immediately. It is never
    rendered on the server, so without JavaScript there is no mask to apply and
    the poster simply shows.
  */
  const showPixels = coverArmed && !revealDone;
  /*
    Whether the rectangle paints at all.

    Before the entrance is armed there is nothing to show: painting the video
    or its poster would mean showing the work in full and then masking it back
    out to reveal it again. So the rectangle stays transparent and the hero's
    gradient shows through it — the wrapper above still holds its height, so
    nothing moves when it arrives.

    The mask alone cannot do this. It is rendered client-side only, and the
    observer that permits it resolves a tick after hydration, so there is a
    window where the video would be on screen with no mask over it.

    Hidden ONLY while an entrance is genuinely pending. The other two terms are
    not optional, and each covers a case where nothing would ever arm the mask:

      !mayLoad     no entrance is coming at all. Reduced motion, and the
                   server render — which is also what a visitor with no
                   JavaScript is left with, since nothing then flips this.
                   Both must show the poster in the finished rectangle.
      revealDone   every failure route sets it without arming the mask:
                   autoplay refused, `playing` never reported, a stall, a
                   project switch.

    Getting this wrong is invisible in a type-check and invisible in the
    browser with JavaScript on. It shows up in the generated HTML, where the
    server-rendered wrapper must be opaque.
  */
  const rectangleVisible = !mayLoad || coverArmed || revealDone;
  /*
    The caption rises once the film has resolved, not with it.

    Same shape as the rule above and for the same reasons, but one term
    shorter: `coverArmed` is deliberately absent, so the text stays down for
    the whole entrance and arrives after it rather than competing with it.

    `!mayLoad` is what keeps this honest everywhere the animation will never
    run — reduced motion, and the server render, which is also what a visitor
    with JavaScript off is left with. In those cases the text is simply there,
    in place and fully opaque, with nothing to wait for.
  */
  const captionVisible = !mayLoad || captionShown;
  /*
    Every condition the entrance waits on.

    `visible` and not `nearViewport`: the reveal must not run inside the
    loading margin, or it would be over before the section reached the screen.
    `ready` means the initial seek finished, `playing` means the element
    reported real playback — a reveal onto a frozen first frame is not the
    effect.

    No longer restricted to the first project. Every film now arrives through
    the entrance, so the conditions are read fresh after each switch: `ready`
    and `playing` refer to the new media, and the reveal waits for them exactly
    as it did on load.
  */
  const canReveal =
    !revealDone && heroCued && visible && ready && playing && !failed;

  /*
    Arms the mask the first time every condition is met, and leaves it armed.

    Adjusted during render rather than in an effect. `canReveal` is derived
    entirely from state, so the render that first makes it true is already
    happening; React re-runs this component immediately with the new value and
    nothing is painted in between. An effect would commit one paint too late —
    the video would show unmasked for a frame before the mask landed on it —
    and setting state from an effect body is what `react-hooks/set-state-in-
    effect` exists to prevent.

    The `!coverArmed` guard is what terminates it.
  */
  if (canReveal && !coverArmed) setCoverArmed(true);
  /* Same latch, one step later in the sequence: the caption rises when the
     first entrance finishes and is not involved in any that follow. */
  if (revealDone && !captionShown) setCaptionShown(true);
  /* The held frame has done its job the moment the new film is whole. Cleared
     here rather than in an effect so it goes in the same commit the mask does,
     with nothing painted in between. Every route that ends an entrance sets
     `revealDone`, including the failures, so this cannot strand the canvas. */
  if (revealDone && holding) setHolding(false);

  /* The hero raises this partway through its own timeline — see
     INTRO.showreelCue — not when it finishes. Remembered rather than
     broadcast, so arriving late (an internal navigation raises it before this
     component's effects run at all) still resolves immediately. */
  useEffect(() => subscribeShowreelCue(() => setHeroCued(true)), []);

  /* Centres the breadcrumb on the current name, and hands back the function
     the click handler needs to do the same on a switch. */
  const alignToNearestCopy = useShowreelStrip({
    controlsRef,
    index,
    reduced,
    captionVisible,
  });

  /*
    Keep the grid matched to the rectangle's shape.

    A ResizeObserver rather than a media query: the box is not simply "portrait
    below md". Its width comes from the page grid and its height from the
    viewport, so the ratio moves continuously with both — and an orientation
    change on a phone crosses the whole range at once.

    Observing the position wrapper, which is always mounted, rather than the
    mask, which comes and goes with each entrance.
  */
  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;

    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (!width || !height) return;
      const next = pixelGrid(width / height);
      /* Only on a real change: this fires on every resize frame, and a new
         object each time would remount the mask mid-drag. */
      setGrid((current) =>
        current.columns === next.columns && current.rows === next.rows
          ? current
          : next,
      );
    });
    observer.observe(box);
    return () => observer.disconnect();
  }, []);


  /* Read live, so changing the system setting does not need a reload. */
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduced(query.matches);
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, []);

  /* Loading. Fires early, and only ever flips on: once the media is permitted
     to load there is nothing to gain by forbidding it again. */
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setNearViewport(true);
          observer.disconnect();
        }
      },
      { rootMargin: LOAD_MARGIN },
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  /* Playback. No margin, a real threshold, and it keeps observing — this one
     has to report leaving as well as arriving. */
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: VISIBLE_RATIO },
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  /*
    The one place playback is decided.

    Derived from state rather than issued as commands from handlers, so the
    element cannot drift out of step with the conditions: leaving the viewport
    pauses, returning resumes from where it stopped. play() rejects when the
    browser refuses or the source changes underneath it. Both are ordinary
    here, and neither should reach the console.
  */
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !mayLoad) return;

    if (shouldPlay) {
      void video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [shouldPlay, mayLoad, index]);

  /*
    Last resort for the entrance itself.

    The reveal's own watchdog only exists once the reveal has begun. This one
    covers the case where it never begins — autoplay refused, `playing` never
    reported, a stall. It is gated on `mayLoad` rather than on the mask, so it
    runs whether or not the entrance was ever armed: since the rectangle stays
    transparent until the entrance can start, an entrance that never starts
    would otherwise leave a permanent hole where the work belongs. Setting
    `revealDone` resolves it — the mask is dropped and the rectangle paints.

    Timed from the point the reveal could actually start, which is the LATER of
    becoming visible and the hero's entrance settling. Both matter and neither
    alone is enough:

      - waiting off screen must cost nothing, so `visible` has to be in here;
      - the showreel now sits inside the hero, where `visible` is already true
        at first paint while the hero's cue is still 1850ms away. Timing from
        visibility alone would spend most of PIXEL_COVER_MAX_MS before the
        entrance was even allowed to begin, and the timer would fire partway
        through the reveal — cutting the entrance short, which is the one
        thing it exists to prevent.

    With both, the budget is what it was designed to be: the whole entrance
    plus three seconds of slack, measured from the first moment it could run.

    `reduced` needs no special case — it clears `mayLoad`, so this effect never
    arms and the rectangle paints immediately.
  */
  useEffect(() => {
    if (revealDone || !mayLoad || !visible || !heroCued) return;
    const timer = setTimeout(() => {
      setRevealDone(true);
    }, PIXEL_COVER_MAX_MS);
    return () => clearTimeout(timer);
  }, [revealDone, mayLoad, visible, heroCued]);

  /*
    The pixel entrance. See use-showreel-entrance.ts, and docs/specs/SHOWREEL.md.

    `useCallback` with no dependencies because `setRevealDone` is stable and
    this lands in the hook's dependency array — a fresh function each render
    would tear the timeline down and rebuild it on every one.
  */
  const handleRevealed = useCallback(() => setRevealDone(true), []);
  useShowreelEntrance({
    gridRef,
    boxRef,
    canReveal,
    grid,
    onRevealed: handleRevealed,
  });


  /**
   * Paint the frame currently on screen into the hold canvas.
   *
   * Must run before `src` changes: assigning a new source blanks the element
   * immediately, and the frame is gone. Returns whether there was anything to
   * capture — on the very first entrance, or before any frame has decoded,
   * there is not, and the hero's gradient is what shows through instead.
   */
  const captureHold = () => {
    const video = videoRef.current;
    const canvas = holdRef.current;
    if (!video || !canvas) return false;
    /* HAVE_CURRENT_DATA. Below this there is no frame to draw and drawImage
       would paint nothing while still resizing the canvas. */
    if (video.readyState < 2 || !video.videoWidth) return false;
    const context = canvas.getContext("2d");
    if (!context) return false;
    /* Sized to the media, not the box: the canvas carries the frame at its own
       resolution and `object-cover` fits it exactly as the video was fitted. */
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);
    return true;
  };

  const selectProject = (next: number) => {
    /* Both of these run before any state changes, and both must: the frame
       has to be captured before `src` is reassigned, and the strip has to be
       aligned before the centring effect scrolls it. */
    setHolding(captureHold());
    alignToNearestCopy(next);
    setIndex(next);
    /* New media, so the poster returns until its first frame is in place.
       Reset here rather than in an effect watching `index`: this is the only
       place the project changes, and doing it in the same commit avoids a
       render that claims the old video's readiness for the new one. */
    setReady(false);
    setFailed(false);
    setPlaying(false);
    seekingRef.current = false;
    /*
      Re-arm rather than cancel. Arming the mask in the same commit as the
      switch empties the rectangle at once, so a press reads as the film
      switching off; the new one then materialises through the pixels when it
      reports ready and playing, exactly as the first did on load.

      `coverArmed` first and `revealDone` second is not arbitrary — together
      they keep `showPixels` true across the change, and the mask remounts on
      its `key` with every cell back at opacity 0.

      Emptying the rectangle does not mean emptying the frame. The mask covers
      only the incoming film; the outgoing one is held on the canvas beneath it
      and stays until the new one is whole, so a switch dissolves rather than
      cutting to nothing.
    */
    setCoverArmed(true);
    setRevealDone(false);
  };

  /**
   * Return to this clip's own start.
   *
   * Deliberately not the native `loop` attribute, which replays the whole file
   * — including the openings these values exist to skip and the blank end
   * cards they stop before. Paused first so nothing plays on past the loop
   * point while the seek resolves; playback resumes in `onSeeked`.
   */
  const loopBack = () => {
    const video = videoRef.current;
    if (!video || seekingRef.current) return;
    seekingRef.current = true;
    video.pause();
    video.currentTime = project.startAt;
  };

  /**
   * Whether the showreel is allowed to move on by itself right now.
   *
   * The same four conditions the fallback timer uses, so the two can never
   * disagree about whether rotation is permitted.
   */
  const mayAdvance = revealDone && visible && !reduced && !failed;

  /**
   * The clip has reached the end of its content.
   *
   * Advance if rotation is allowed, otherwise loop. The fallback matters: an
   * entrance still running, a film that failed, or reduced motion all mean the
   * clip must keep playing rather than run on into the blank end card that
   * `crossfadeAt` exists to stop before.
   */
  const atContentEnd = () => {
    if (mayAdvance) selectProject((index + 1) % SHOWREEL.length);
    else loopBack();
  };

  /*
    This is what drives the carousel, not a timer.

    `crossfadeAt` was measured per clip from where its content actually ends,
    and it is compared against the element's real `currentTime` — so the switch
    lands at the right frame for each film and self-corrects for a slow load,
    where a wall clock would drift.

    A fixed interval could not do this. Playback begins before the entrance
    finishes, so a clip is already ~2s in by the time it is fully revealed, and
    that time counts against its content: at ENTRANCE_MS + 7s of playback all
    four clips looped back to `startAt` before the switch, LAGA by nearly two
    seconds. Its content is only 7.3s.
  */
  const onTimeUpdate = () => {
    const video = videoRef.current;
    if (!video || seekingRef.current) return;
    if (video.currentTime >= project.crossfadeAt) atContentEnd();
  };

  const onLoadedData = () => {
    const video = videoRef.current;
    if (!video) return;
    if (project.startAt > 0) {
      /* `ready` is set by onSeeked instead, so the poster stays up until the
         frame on screen is the intended one. */
      seekingRef.current = true;
      video.currentTime = project.startAt;
    } else {
      /* Nothing to seek to. Assigning 0 to a currentTime already at 0 is not
         guaranteed to fire `seeked`, so waiting for it would strand the
         poster. */
      setReady(true);
    }
  };

  /* The element reporting real playback, which is what the reveal waits on —
     play() resolving only means the request was accepted. */
  const onPlaying = () => setPlaying(true);

  const onSeeked = () => {
    seekingRef.current = false;
    setReady(true);
    const video = videoRef.current;
    if (video && shouldPlay) void video.play().catch(() => {});
  };


  /*
    Fallback only. `crossfadeAt` in onTimeUpdate is what normally advances the
    showreel; this exists for the case where that moment never arrives — a
    stalled download, a decode that stops reporting, a `timeupdate` that dries
    up — which would otherwise leave one project on screen for good.

    Deliberately far longer than any clip. The longest carries 8.9s of content
    and the entrance eats about 2s of it, so a real advance lands roughly 7s
    after the dwell begins; ADVANCE_FALLBACK_MS is set well past that so it
    never races the real thing. A normal advance changes `index`, which rebuilds
    this timer before it can fire.

    Gated exactly as `mayAdvance` is, so the two cannot disagree — and `visible`
    matters twice over here, since the video is paused off screen and would
    never reach `crossfadeAt` on its own.
  */
  useEffect(() => {
    if (!mayAdvance) return;
    const timer = setTimeout(() => {
      selectProject((index + 1) % SHOWREEL.length);
    }, ADVANCE_FALLBACK_MS);
    return () => clearTimeout(timer);
    /* `selectProject` is redefined every render, so listing it would tear down
       and rebuild the timer on each one and it would never fire. `index` stands
       in for it — the only thing about a switch this needs to react to. */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mayAdvance, index]);


  return (
    /* Page width, matching the header's own container and gutters, so the
       rectangle lines up with the navigation above it. Was max-w-5xl. NOTE:
       the media is 1280x720 and was encoded for that narrower cap — see the
       displayed-width note in docs/specs/SHOWREEL.md. */
    <div className="mx-auto w-full max-w-page px-gutter-mobile md:px-gutter-tablet xl:px-gutter-desktop">
      {/*
        Width is grid-aligned first and height-capped second.

          w-[min(100%, (100svh - reserve) * 16/9)]

        `100%` is the page container above, so whenever there is room the
        rectangle spans the full grid width and lines up with the header. When
        there is not, the second term takes over: the tallest 16:9 box that
        still leaves `--showreel-reserve` for everything else, expressed as the
        WIDTH that produces it.

        Constraining width rather than height is not a stylistic choice. With a
        definite width, `aspect-ratio` derives the height — so a `max-height`
        would clamp the box shorter than its own ratio and `object-cover` would
        crop the film. Driving width keeps 16:9 intact and lets `mx-auto`
        centre whatever is left.

        `--showreel-reserve` is everything vertical that is NOT the video:

          hero pt-20               80        80
          mt-6 under the rectangle 24        24
          caption row             ~150      ~160  (stacked below md)
          hero bottom padding     100         0   (pb-25 sm:pb-0)
                                  ---       ---
                                  ~360      ~264
                                  22.5rem   18rem from sm

        Two values because the hero's bottom padding is only there below `sm`.
        Carrying the 100px past that point cost the rectangle 100px of height
        for space that was no longer being used, and left the hero finishing
        short of the fold with the slack split above and below it.

        18rem rather than the 16.5rem the sum strictly needs: the caption term
        is an estimate, and the cost of guessing low is the hero overshooting
        100svh, where the cost of guessing high is only a slightly shorter
        rectangle.

        One figure at every size rather than a pair, because the two ends
        cancel: mobile stacks the statement above the pills but has a smaller
        typeface, desktop sets them side by side but much larger.

        The caption term assumes the statement wraps to TWO lines, which it
        does at every width checked — `type-display-sm` runs 40px to 76px and
        the text is 26 characters against a `max-w-2xl` measure. Sized for the
        wrap rather than the ideal, because a reserve that is too small does
        not clip anything: it pushes the hero past 100svh and the section below
        stops beginning at the fold.

        Worst case across mobile, tablet, laptop and desktop is 4px of room to
        spare. Keep it in step with all four terms — it is the only thing
        stopping the hero outgrowing 100svh. Lower it for a taller rectangle if
        the statement turns out to fit on one line.
      */}
      <div
        ref={sectionRef}
        className="w-full [--showreel-reserve:22.5rem] sm:[--showreel-reserve:18rem]"
      >
        {/*
          Position wrapper. Reserves the space from the first paint so nothing
          shifts when the media arrives, and does nothing else — no background
          and no clipping, because wherever the mask has not filled in, the
          hero's own gradient is what should be showing.

          The height, at every size. The width comes from the page grid above,
          so the rectangle lines up with the navigation and never exceeds it.
          `object-cover` on the video crops to whatever shape the two produce —
          portrait on a phone, a wide band on a desktop — so nothing is
          letterboxed or stretched. It is the frame that changes shape, not the
          film.

          The mask grid follows on its own; see the ResizeObserver above and
          `pixelGrid`.
        */}
        <div ref={boxRef} className="relative h-[calc(100svh-var(--showreel-reserve))] w-full">
          {/*
            Shape wrapper. Owns the clip and holds the media. `rounded-lg` and
            `overflow-hidden` ARE the finished state: the entrance's last
            clip-path is inset(0px round <that same radius>), so removing the
            inline style at the end changes nothing on screen.
          */}
          <div
            /*
              No background. There is nothing behind the media to hide, and a
              solid one would show as a block in the hero while the entrance
              waited.

              `rounded-lg` and `overflow-hidden` clip everything inside before
              the mask applies, so the corners stay rounded throughout the
              reveal rather than snapping round when the mask is dropped.
            */
            className={`absolute inset-0 overflow-hidden rounded-lg ${
              rectangleVisible ? "opacity-100" : "opacity-0"
            }`}
          >
          {/* The outgoing film, frozen at the moment of the switch and left
              UNDER the mask so it keeps the rectangle full while the incoming
              one materialises over it. Empty and hidden at every other time —
              it stays mounted so the click can draw to it synchronously. */}
          <canvas
            ref={holdRef}
            aria-hidden="true"
            className={`absolute inset-0 size-full object-cover ${
              holding ? "" : "hidden"
            }`}
          />

          {/*
            Everything the mask acts on, and only that. It sits inside the
            shape wrapper rather than on it so the held frame above is left
            alone — masking the wrapper would take the outgoing film with the
            incoming one and the rectangle would go blank mid-switch.

            The mask arrives in the same commit that renders it, with every
            cell already at opacity 0, so the first painted frame is empty
            rather than a flash of video. Written as both properties because
            the unprefixed form is not universally resolved for a reference to
            an inline `<mask>`; verified working in Chrome and Safari before
            this was built.
          */}
          <div
            className="absolute inset-0"
            style={
              showPixels
                ? {
                    maskImage: `url(#${SHOWREEL_MASK_ID})`,
                    WebkitMaskImage: `url(#${SHOWREEL_MASK_ID})`,
                  }
                : undefined
            }
          >
          {/*
            Decorative. It carries no controls, and nothing in it is available
            only here — the project name, stage and services are all real text
            below. Muted and playsInline are what make unattended playback
            permissible at all. No `loop`: the loop points are per clip and
            handled in onTimeUpdate.
          */}
          <video
            ref={videoRef}
            aria-hidden="true"
            className="size-full object-cover"
            muted
            playsInline
            preload={mayLoad ? "auto" : "none"}
            poster={project.poster}
            src={mayLoad ? project.video : undefined}
            onLoadedData={onLoadedData}
            onTimeUpdate={onTimeUpdate}
            onSeeked={onSeeked}
            onPlaying={onPlaying}
            onEnded={atContentEnd}
            onError={() => {
              setFailed(true);
              /* The entrance will never run now, so the mask has to go or it
                 would hide the poster for good. */
              setRevealDone(true);
            }}
          />

          {/* Held above the video until there is a true frame beneath it, so a
              slow load, a failure, or the moment before the start seek never
              shows through. */}
          {showPoster ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={project.poster}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 size-full object-cover"
            />
          ) : null}
          </div>
          </div>

          {/* Paints nothing itself — a `<defs>` holding the mask the wrapper
              above references. Rendered only while the entrance is live, so
              dropping it is what returns the video to normal. */}
          {/* Keyed on the project so a switch remounts it. That is what
              guarantees every cell starts hidden again: without the key the
              nodes would survive with whatever opacity the last entrance left
              them at, and a switch made mid-entrance would show the new film
              in full before the pixels took it back. */}
          {showPixels ? (
            <ShowreelPixels
              key={`${index}-${grid.columns}x${grid.rows}`}
              ref={gridRef}
              grid={grid}
            />
          ) : null}

          {/* The hover cursor. The LAST CHILD of the media box, and it has to
              be inside it: the circle is `absolute`, so its containing block is
              the nearest positioned ancestor, and its coordinates are measured
              from this box's own rect. Placed as a SIBLING of the box those two
              were different elements, and the circle sat a fixed distance to
              the left of the pointer.

              After the media wrapper rather than within it — that wrapper
              carries the entrance's opacity and mask, and the circle has no
              business inheriting either. */}
          <HoverCursor areaRef={boxRef} />
        </div>

        {/* Everything that matters is real text. It sits on the orange end of
            the hero's gradient, so type and controls use the on-accent ink
            rather than the default dark inks, which would sit on their own
            hue. */}
        {/* Everything below rises into place: opacity and a short lift, the
            controls a beat behind the statement. Transitions rather than a
            timeline — there is no sequencing to coordinate, just two elements
            reacting to one flag, and it costs no JavaScript at all.

            `translate` and `opacity` are named explicitly rather than using
            `transition-all`, which would also animate the controls' own
            colour transitions and fight them. */}
        {/* gap-2 stacks the statement and the pills 8px apart, which is the
            spacing that reads as one caption rather than two blocks. Restored
            to gap-6 at md, where the two sit side by side and the gap is the
            minimum distance between them rather than the space under the
            text. */}
        <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between md:gap-6">
          <div
            className={`transition-[opacity,translate] duration-700 ease-out delay-100 motion-reduce:transition-none ${
              captionVisible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
            }`}
          >
            {/*
              A statement, not a heading. Rendered as a paragraph on purpose:
              the page's only <h1> is in the intro section below, and this now
              sits above it in document order, so making this a heading would
              either give the page two <h1>s or put an <h2> before its <h1>.

              If this should BE the page heading, the one below has to be
              demoted in the same change — see the note in app/page.tsx.

              It replaced the project name, stage and services on 7 September
              2026. Those facts are not lost: the four controls beside this name
              every project and mark the current one with `aria-current`, and
              the selected-work section further down the page carries each
              project's stage and services as text.
            */}
            <p className="max-w-3xl type-h1 text-text-on-accent text-balance">
              Your Creative Design Ally.
            </p>
            {failed ? (
              <p className="mt-2 type-small text-text-on-accent">
                The film could not be loaded. Showing a still instead.
              </p>
            ) : null}
          </div>

          <div
            role="group"
            aria-label="Choose a project"
            ref={controlsRef}
            /* Lenis owns the document's wheel and touch events. Without this
               the strip could not be swiped or scrolled horizontally — the
               gesture would be taken for the page. The attribute needs Lenis's
               own stylesheet, which smooth-scroll.tsx imports. */
            data-lenis-prevent
            /*
              One line that scrolls, rather than a block that wraps.

              Four pills come to roughly 370px and a phone offers about 340px
              between the gutters, so they wrapped to two rows — which cost the
              rectangle vertical space and read as a paragraph of buttons. They
              now sit on one line, and the strip carries THREE copies of the
              set so the active pill can always be centred with real pills
              either side of it. See the loop note on the copies below.

              `flex-wrap` returns from md up, where all four fit and the copies
              are hidden.

              `-mx-gutter-mobile` pulls the strip back out of the page gutter
              so it spans the full screen and the pills are clipped by its
              edges rather than stopping short inside the margin. The strip is
              the only thing that does this — the rectangle above keeps the
              gutter and stays on the page grid. Cancelled at md, where the
              strip wraps and there is nothing to clip.

              The scrollbar is hidden on both engines. It would sit under a
              row of pills on the brand gradient and it is not the affordance
              here — the pills are.
            */
            className={`-mx-gutter-mobile flex flex-nowrap items-center gap-2 overflow-x-auto scrollbar-none [&::-webkit-scrollbar]:hidden md:mx-0 md:flex-wrap md:overflow-visible transition-[opacity,translate] duration-700 ease-out delay-300 motion-reduce:transition-none ${
              captionVisible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
            }`}
          >
            {/*
              Three copies of the set, and only the middle one is real.

              Centring the active pill in a single copy leaves the first and
              last with nothing beside them — a wide blank on one side, which
              padding could close but only by replacing the blank with a
              different blank. A copy either side means there is always a pill
              where the eye expects one, and the strip reads as continuous.

              This is a LOOP IN APPEARANCE, not in behaviour: nothing wraps
              around, the middle copy is simply kept centred and the outer two
              are what show past its ends. With four projects that is enough to
              fill any phone.

              The copies are `aria-hidden` and out of the tab order, so the
              accessibility tree still contains exactly four controls, each
              announcing its project once, and `aria-current` is true of one
              element rather than three. They stay clickable by pointer, which
              is the only way they can be reached anyway.

              `md:hidden` on the copies: from md up the strip wraps instead of
              scrolling, and unhidden copies would lay out as eight extra
              pills.
            */}
            {[0, 1, 2].map((copy) =>
              SHOWREEL.map((entry, entryIndex) => {
                const real = copy === 1;
                const active = entryIndex === index;
                /*
                  The separators, and the rule that decides which show.

                  A slash belongs to the name AFTER it, so it appears wherever
                  that name does — which is what keeps the row reading as one
                  continuous breadcrumb across the copies rather than three
                  lists laid end to end.

                  Two exceptions, both about not opening with a slash. The very
                  first item never has one. And from `md` up only the middle
                  copy is on screen, so the slash before ITS first name would be
                  leading too — every separator except the middle copy's inner
                  three is therefore `md:hidden`, which is exactly the set of
                  buttons that hide there plus that one.
                */
                const opensTheRow = copy === 0 && entryIndex === 0;
                const survivesAtMd = copy === 1 && entryIndex > 0;
                return (
                  <Fragment key={`${copy}-${entry.slug}`}>
                    {opensTheRow ? null : (
                      <span
                        /* Punctuation, not content. Four buttons already
                           announce themselves; "slash" between them is noise. */
                        aria-hidden="true"
                        className={`shrink-0 select-none font-body font-medium text-label text-text-on-accent/50 ${
                          survivesAtMd ? "" : "md:hidden"
                        }`}
                      >
                        /
                      </span>
                    )}
                    <button
                      type="button"
                      data-copy={copy}
                      data-entry={entryIndex}
                      onClick={() => selectProject(entryIndex)}
                      aria-current={real && active ? "true" : undefined}
                      aria-hidden={real ? undefined : true}
                      tabIndex={real ? undefined : -1}
                      /* Only the real copy is a scroll target, so the centring
                         effect cannot aim at a decoration. */
                      data-active={real && active ? "true" : undefined}
                      /*
                         Cream on orange throughout, separated by opacity alone:
                         the current project at full strength, the rest at half,
                         lifting to 70% under the pointer.

                         The weight does NOT change with state, deliberately.
                         Bolding the active name would change its width, and the
                         centring effect measures widths to place it — the row
                         would shift a few pixels every time the selection moved.

                         `py-2` survives the loss of the pill. Nothing shows for
                         it, but it is what keeps a bare word a 40px-tall tap
                         target instead of a 16px one.
                      */
                      /*
                        `font-body font-medium text-label` rather than
                        `type-label`, which is the same three things plus
                        `text-transform: uppercase`. The project names are set as
                        written — Laga, Nourigo, INN News, Bitazza — so the
                        capitals in INN News mean something instead of being
                        swallowed by a blanket transform.

                        Composed from primitives rather than `type-label
                        normal-case`: two utilities setting `text-transform`
                        would be decided by stylesheet order, not by the order
                        written here, which is exactly the trap the project rules
                        warn about. `type-label` itself is left alone — 27 places
                        use it and they all want the capitals.

                        `text-label` still carries the token's 0.02em tracking.
                        That is 0.32px at this size, tuned for caps but harmless
                        in sentence case.
                      */
                      className={`shrink-0 cursor-pointer py-2 font-body font-medium text-label transition-colors duration-300 ease-standard motion-reduce:transition-none ${
                        real ? "" : "md:hidden "
                      }${
                        active
                          ? "text-text-on-accent"
                          : "text-text-on-accent/50 hover:text-text-on-accent/70"
                      }`}
                    >
                      {entry.name}
                    </button>
                  </Fragment>
                );
              }),
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
