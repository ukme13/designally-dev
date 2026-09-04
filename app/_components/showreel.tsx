"use client";

import { useEffect, useRef, useState } from "react";

import ShowreelPixels from "@/app/_components/showreel-pixels";
import { subscribeIntroSettled } from "@/app/_lib/intro";
import {
  LOAD_MARGIN,
  CIRCLE_HOLD_MS,
  ENTRANCE_MS,
  MORPH_MS,
  PIXEL_CELL_MS,
  PIXEL_CELL_SCALE,
  PIXEL_COVER_MAX_MS,
  PIXEL_ORDER,
  PIXEL_REVEAL_MS,
  SHOWREEL,
  VISIBLE_RATIO,
  showreelCaption,
} from "@/app/_lib/showreel";

/**
 * Homepage showreel — Stage A.
 *
 * The final rectangle with real media and manual project selection. No
 * automatic advance, no crossfade, no pixel reveal, no circle morph: those are
 * Stages B and C, and this markup is already the shape they will animate.
 *
 * Full specification: docs/specs/SHOWREEL.md
 *
 * Two conditions, deliberately separate, from two observers:
 *
 *   nearViewport   200px of margin. Permits the fetch, nothing more.
 *   visible        a real threshold, no margin. Permits playback.
 *
 * One observer serving both would either start playback while the section is
 * still off screen, or delay loading until it is already in view. Stage B
 * depends on the same split so the entrance cannot finish before it is seen.
 */
export default function Showreel() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  /** The element the entrance clips. Nothing else touches its clip-path. */
  const shapeRef = useRef<HTMLDivElement>(null);
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
  const [introSettled, setIntroSettled] = useState(false);
  /**
   * True once the pixel cover is gone, by any route: the reveal finishing, the
   * visitor switching project before it ran, GSAP failing to load, or the
   * watchdog. Once set it never clears, so the entrance happens at most once
   * per page load and switching projects cannot replay it.
   */
  const [revealDone, setRevealDone] = useState(false);

  const project = SHOWREEL[index];
  const caption = showreelCaption(project.name);

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
    The cover is armed as soon as the media is, which is 200px before the
    section is on screen — so it is already in place by the time anyone can see
    the rectangle. It is never rendered on the server, so without JavaScript
    there is nothing to remove and the poster simply shows.
  */
  const showPixels = mayLoad && !revealDone;
  /*
    Every condition the entrance waits on.

    `visible` and not `nearViewport`: the reveal must not run inside the
    loading margin, or it would be over before the section reached the screen.
    `ready` means the initial seek finished, `playing` means the element
    reported real playback — a reveal onto a frozen first frame is not the
    effect. LAGA only, so a switch made while waiting cancels rather than
    running the entrance over a different film.
  */
  const canReveal =
    !revealDone &&
    introSettled &&
    visible &&
    ready &&
    playing &&
    !failed &&
    index === 0;

  /**
   * Back to the finished rectangle, by dropping the inline clip.
   *
   * The stylesheet already describes that state — `rounded-lg` plus
   * `overflow-hidden` — and the entrance's final clip-path is the same shape
   * expressed inline, so removing it is invisible rather than a jump. Safe to
   * call at any point, including mid-morph.
   */
  const settleShape = () => {
    const shape = shapeRef.current;
    if (!shape) return;
    shape.style.removeProperty("clip-path");
    shape.style.removeProperty("will-change");
  };

  /* The hero's entrance owns this. Remembered rather than broadcast, so
     arriving late — an internal navigation settles it before this component's
     effects run at all — still resolves immediately. */
  useEffect(() => subscribeIntroSettled(() => setIntroSettled(true)), []);

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
    Last resort for the cover itself.

    The reveal's own watchdog only exists once the reveal has begun. This one
    covers the case where it never begins — autoplay refused, `playing` never
    reported, a stall — which would otherwise leave the grid in place forever.
    Timed from becoming visible, so waiting off screen costs nothing.
  */
  useEffect(() => {
    if (!showPixels || !visible) return;
    const timer = setTimeout(() => {
      settleShape();
      setRevealDone(true);
    }, PIXEL_COVER_MAX_MS);
    return () => clearTimeout(timer);
  }, [showPixels, visible]);

  /*
    The entrance — Stages B and C as one timeline.

      0 -  700ms  pixel cells clear, centre outward, inside a circular clip
    700 - 1600ms  the full circle holds
   1600 - 2400ms  the circle opens into the final rounded rectangle

    Cells are driven straight on the DOM nodes: one tween over 144 elements
    with a per-element delay, so there is no React update per pixel and no
    animation frame loop of our own.

    The cover can never be left in place. Five routes remove it — the timeline
    completing, a failed import, either watchdog, and a project switch — and
    each one also restores the finished rectangle.
  */
  useEffect(() => {
    if (!canReveal) return;
    const grid = gridRef.current;
    const shape = shapeRef.current;
    if (!grid || !shape) return;

    let cancelled = false;
    let running: { kill: () => void } | undefined;
    /* If the timeline never reports back, the rectangle still arrives. */
    const watchdog = setTimeout(() => {
      settleShape();
      setRevealDone(true);
    }, ENTRANCE_MS + 1500);

    const cells = Array.from(grid.children) as HTMLElement[];
    const clearHints = () => {
      for (const cell of cells) {
        cell.style.removeProperty("will-change");
        cell.style.removeProperty("border-radius");
        cell.style.removeProperty("transform");
      }
    };

    /*
      Geometry, measured from the real element rather than assumed.

      A true circle needs a square clip region, so its diameter is the shorter
      side — the height, for a 16:9 box, but taken as min() so an unexpected
      ratio degrades to the largest circle that fits rather than an ellipse.

      The end radius is read from the computed style, so it is whatever
      `rounded-lg` resolves to. Hardcoding 24px would silently diverge the day
      --radius-lg changes.
    */
    const box = shape.getBoundingClientRect();
    const diameter = Math.min(box.width, box.height);
    const sideInset = (box.width - diameter) / 2;
    const topInset = (box.height - diameter) / 2;
    const endRadius =
      Number.parseFloat(getComputedStyle(shape).borderTopLeftRadius) || 0;

    /*
      Two-value inset form — vertical then horizontal — at BOTH ends.

      The count of numbers has to match or GSAP pairs them positionally and
      animates the wrong edges. It reads the start from the computed style, and
      Chrome collapses a four-value inset to this two-value shorthand, so
      writing four here produced five numbers against three and put a moving
      inset on the bottom edge: the video was cropped from below through the
      whole morph. Three against three interpolates cleanly.
    */
    const circle = `inset(${topInset}px ${sideInset}px round ${diameter / 2}px)`;
    const rectangle = `inset(0px 0px round ${endRadius}px)`;

    const run = async () => {
      try {
        const { gsap } = await import("gsap");
        /* The import resolves on a later tick, by which time this effect may
           already have been cleaned up — Strict Mode guarantees it in
           development. Building the timeline then would animate nodes nothing
           is watching. */
        if (cancelled) return;

        /*
          The circle is applied BEFORE the first cell moves, while the grid
          still covers all 144 squares. Both writes are synchronous, so no
          frame can paint the full rectangle in between — which is the flash
          this ordering exists to prevent.
        */
        gsap.set(shape, { clipPath: circle, willChange: "clip-path" });
        /*
          Every cell starts as a circle, oversized so the ring of circles still
          covers the frame completely — see PIXEL_CELL_SCALE. They are all the
          same orange and they overlap, so at rest this reads as solid colour;
          the shape only becomes visible as a cell fades, which is exactly when
          it squares up.
        */
        gsap.set(cells, {
          borderRadius: "50%",
          scale: PIXEL_CELL_SCALE,
          willChange: "opacity, transform",
        });

        const timeline = gsap.timeline({
          onComplete: () => {
            clearHints();
            /* Drop the inline clip and hand the shape back to the stylesheet,
               which already describes exactly this rectangle. */
            settleShape();
            setRevealDone(true);
          },
        });

        timeline
          .to(
            cells,
            {
              opacity: 0,
              /* Circle to square as it goes, echoing the container's own morph
                 at the scale of a single pixel. Scale and radius move together
                 so the slot stays covered the whole way down. */
              borderRadius: "0%",
              scale: 1,
              duration: PIXEL_CELL_MS / 1000,
              ease: "none",
              /* Each cell's own delay, from its precomputed place in the
                 order. Function-based, so the value is per element rather
                 than a single distributed step. */
              stagger: (cellIndex: number) =>
                (PIXEL_ORDER[cellIndex] * (PIXEL_REVEAL_MS - PIXEL_CELL_MS)) /
                1000,
            },
            0,
          )
          /* Placed at an absolute time, so the hold between the last pixel and
             the first movement is exactly CIRCLE_HOLD_MS however the stagger
             is later retimed. */
          .to(
            shape,
            {
              clipPath: rectangle,
              duration: MORPH_MS / 1000,
              ease: "power2.inOut",
            },
            (PIXEL_REVEAL_MS + CIRCLE_HOLD_MS) / 1000,
          );

        running = timeline;
      } catch {
        /* GSAP unavailable. Uncover immediately rather than animating. */
        settleShape();
        setRevealDone(true);
      }
    };

    void run();

    return () => {
      cancelled = true;
      clearTimeout(watchdog);
      /* kill(), not revert(): reverting would put the cells back to full
         opacity and the clip back to a circle, over a video already showing. */
      running?.kill();
      clearHints();
      settleShape();
    };
  }, [canReveal]);

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

  const onTimeUpdate = () => {
    const video = videoRef.current;
    if (!video || seekingRef.current) return;
    if (video.currentTime >= project.crossfadeAt) loopBack();
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

  const selectProject = (next: number) => {
    setIndex(next);
    /* New media, so the poster returns until its first frame is in place.
       Reset here rather than in an effect watching `index`: this is the only
       place the project changes, and doing it in the same commit avoids a
       render that claims the old video's readiness for the new one. */
    setReady(false);
    setFailed(false);
    setPlaying(false);
    seekingRef.current = false;
    /* Switching during or before the entrance cancels it rather than replaying
       it over a different film. Either way it happens at most once, and the
       rectangle is what is left behind. */
    settleShape();
    setRevealDone(true);
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-gutter-mobile md:px-gutter-tablet xl:px-gutter-desktop">
      <div ref={sectionRef}>
        {/*
          Position wrapper. Owns the final size and reserves it from the first
          paint via aspect-video, so nothing shifts when the media arrives.
          Stages B and C add the shape and pixel layers inside this.
        */}
        {/*
          Position wrapper. Reserves the 16:9 space from the first paint, and
          nothing else — no background and no clipping, because during the
          circle phase everything outside the circle must be the section's own
          orange showing through, not a box of some other colour.
        */}
        <div className="relative aspect-video w-full">
          {/*
            Shape wrapper. Owns the clip and holds the media. `rounded-lg` and
            `overflow-hidden` ARE the finished state: the entrance's last
            clip-path is inset(0px round <that same radius>), so removing the
            inline style at the end changes nothing on screen.
          */}
          <div
            ref={shapeRef}
            className="absolute inset-0 overflow-hidden rounded-lg bg-surface-inverse"
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
            onEnded={loopBack}
            onError={() => {
              setFailed(true);
              /* The entrance will never run now, so the cover has to go or it
                 would sit over the poster for good, and the shape has to be
                 the finished rectangle rather than whatever it was mid-way. */
              settleShape();
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

          {/* Outside the shape wrapper on purpose: the cover spans the whole
              rectangle while the media beneath it is only a circle. Its cells
              are the section's orange, so the corners it clears are seamless. */}
          {showPixels ? <ShowreelPixels ref={gridRef} /> : null}
        </div>

        {/* Everything that matters is real text. The section sits on the brand
            orange, so type and controls use the on-accent ink rather than the
            default dark inks, which would sit on their own hue. */}
        <div className="mt-6 flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="type-label text-text-on-accent">Selected work</p>
            <p className="mt-2 type-h3 text-text-on-accent">{project.name}</p>
            {caption ? (
              <p className="mt-1 type-body text-text-on-accent">
                {caption.stage} · {caption.services}
              </p>
            ) : null}
            {failed ? (
              <p className="mt-2 type-small text-text-on-accent">
                The film could not be loaded. Showing a still instead.
              </p>
            ) : null}
          </div>

          <div
            role="group"
            aria-label="Choose a project"
            className="flex flex-wrap items-center gap-2"
          >
            {SHOWREEL.map((entry, entryIndex) => {
              const active = entryIndex === index;
              return (
                <button
                  key={entry.slug}
                  type="button"
                  onClick={() => selectProject(entryIndex)}
                  aria-current={active ? "true" : undefined}
                  /* Cream on orange either way. The active one is filled, so it
                     reads at a glance and never relies on hue alone; the rest
                     are outlined and fill on hover. `bg-action-primary` would
                     be invisible here — it is this section's own background. */
                  className={`cursor-pointer rounded-pill border-[1.5px] border-solid border-surface-base px-4 py-2 type-label transition-colors duration-300 ease-standard motion-reduce:transition-none ${
                    active
                      ? "bg-surface-base text-text-primary"
                      : "text-text-on-accent hover:bg-surface-base hover:text-text-primary"
                  }`}
                >
                  {entry.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
