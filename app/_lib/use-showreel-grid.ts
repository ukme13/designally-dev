"use client";

import type { RefObject } from "react";
import { useEffect, useRef, useState } from "react";

import {
  PIXEL_COLUMNS,
  PIXEL_COMPACT_MAX_PX,
  PIXEL_ROWS,
  PIXEL_TARGET_CELLS,
  PIXEL_TARGET_CELLS_COMPACT,
  pixelGrid,
  type PixelGrid,
} from "@/app/_lib/showreel";

/**
 * The mask arrangement, kept matched to the rectangle's real shape.
 *
 * A `ResizeObserver` rather than a media query: the box is not simply
 * "portrait below md". Its width comes from the page grid and its height from
 * the viewport, so the ratio moves continuously with both — and an orientation
 * change on a phone crosses the whole range at once.
 *
 * `boxRef` should be the position wrapper, which is always mounted, rather
 * than the mask, which comes and goes with each entrance.
 *
 * `revealRunning` is what makes this more than a wrapper around `pixelGrid`.
 * A re-arrangement must never land while a reveal is in flight, but it must
 * also not be lost — see the two notes below, which are the whole reason this
 * has its own file.
 */
export function useShowreelGrid(
  boxRef: RefObject<HTMLElement | null>,
  revealRunning: boolean,
): PixelGrid {
  /*
    16 x 9 until something has been measured, which is also what a 16:9 box
    resolves to — so the common case never changes after the first frame. On
    mobile the rectangle fills the screen height instead, and a portrait box
    needs a portrait grid or its cells stop being square.
  */
  const [grid, setGrid] = useState<PixelGrid>({
    columns: PIXEL_COLUMNS,
    rows: PIXEL_ROWS,
  });

  /*
    True while a reveal is actually running, mirrored into a ref so the
    ResizeObserver below can read it without being torn down and rebuilt every
    time the flag changes. Written from an effect rather than during render —
    the latter is what `react-hooks/set-state-in-effect` and its neighbours
    exist to discourage.
  */
  const revealRunningRef = useRef(false);
  /*
    The latest measurement taken while a reveal was running, held until it can
    be applied without disturbing it. Null when nothing is outstanding.

    A ref rather than state on purpose: parking a measurement must not itself
    cause a render, or the deferral would reintroduce exactly the mid-reveal
    churn it exists to avoid.
  */
  const pendingGridRef = useRef<PixelGrid | null>(null);

  useEffect(() => {
    revealRunningRef.current = revealRunning;
    if (revealRunning) return;

    /*
      The reveal has finished, so a re-arrangement can no longer disturb it —
      apply whatever the observer parked while it was running.

      This cannot restart anything, structurally rather than by luck. The
      caller's flag only drops when its reveal is done, and the entrance hook's
      `canReveal` carries the same `!revealDone`, so the entrance effect re-runs
      on the new `grid` and returns at its first line. The canvas has already
      unmounted. The value is simply in place for the next project, which arms
      with the current shape.
    */
    const pending = pendingGridRef.current;
    if (!pending) return;
    pendingGridRef.current = null;
    setGrid((current) =>
      current.columns === pending.columns && current.rows === pending.rows
        ? current
        : pending,
    );
  }, [revealRunning]);

  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;

    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (!width || !height) return;
      /* Fewer, bigger cells on a small rectangle. 144 of them in the ~337px
         box a phone gives made each dot 25px with 3px between it and its
         neighbour, so they merged and the reveal read as a fade rather than as
         pixels — see PIXEL_TARGET_CELLS_COMPACT. Chosen from the box's real
         width, like the arrangement itself, rather than from a breakpoint. */
      const next = pixelGrid(
        width / height,
        width < PIXEL_COMPACT_MAX_PX
          ? PIXEL_TARGET_CELLS_COMPACT
          : PIXEL_TARGET_CELLS,
      );

      /*
        **Never re-lay the grid under a running reveal. DEFER it, do not drop
        it.**

        `pixelGrid` searches for the squarest arrangement, so it is knife-edge
        sensitive: a ONE PIXEL change in width or height can flip 18x8 to 19x8.
        And `grid` is in the entrance effect's dependency array — and used to be
        part of the canvas `key` — so a change mid-flight remounted the canvas
        and re-ran the effect: `elapsed` reset to zero and the same clip
        revealed a second time. Reported on desktop, 15 September 2026.

        There was no large layout event to blame and there did not need to be;
        any sub-pixel settle inside the ~2s reveal window was enough.

        **An earlier version of this discarded the measurement instead, and that
        was too blunt.** A cell is `width / columns` by `height / rows`, so a
        grid held against a box that has changed shape is stretched by exactly
        that difference: a 16x8 grid painted into a box 88px shorter — one `sm`
        breakpoint step of `--showreel-reserve` — is 16.7% off square, and into
        one 200px narrower, 15.7%. The search's own residual is 0.1-1.7% on a
        desktop box, so a stale grid is an order of magnitude worse than the
        imprecision it was traded against. Visible, and reported.

        Parking it costs nothing: the reveal still runs to completion on one
        stable grid, and the effect above applies this the moment it ends.
      */
      if (revealRunningRef.current) {
        pendingGridRef.current = next;
        return;
      }

      pendingGridRef.current = null;
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
  }, [boxRef]);

  return grid;
}
