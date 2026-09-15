"use client";

import type { RefObject } from "react";
import { useEffect, useRef } from "react";

/** Centre the pressed copy first; rebase identical copies only after travel. */
export function useShowreelStrip({
  controlsRef,
  index,
  reduced,
  captionVisible,
}: {
  controlsRef: RefObject<HTMLDivElement | null>;
  index: number;
  reduced: boolean;
  captionVisible: boolean;
}) {
  const pending = useRef<{ index: number; copy?: number } | null>(null);
  const frame = useRef(0);

  const selectCopy = (next: number, copy?: number) => {
    cancelAnimationFrame(frame.current);
    pending.current = { index: next, copy };
  };

  useEffect(() => {
    const strip = controlsRef.current;
    if (!strip) return;

    const targetLeft = (element: HTMLElement) => {
      const box = element.getBoundingClientRect();
      const bounds = strip.getBoundingClientRect();
      return strip.scrollLeft + box.left + box.width / 2 -
        (bounds.left + bounds.width / 2);
    };

    const centre = () => {
      cancelAnimationFrame(frame.current);
      if (getComputedStyle(strip).overflowX === "visible") return;
      const real = strip.querySelector<HTMLElement>(
        `[data-copy="1"][data-entry="${index}"]`,
      );
      if (!real) return;
      const selection = pending.current;
      pending.current = null;
      let target = real;
      if (selection?.index === index) {
        const copies = Array.from(strip.querySelectorAll<HTMLElement>(
          `[data-entry="${index}"]`,
        ));
        if (selection.copy !== undefined) {
          target = copies.find((element) =>
            element.dataset.copy === String(selection.copy)) ?? real;
        } else {
          // Automatic advances always move to the next occurrence on the right,
          // including the last-project -> first-project boundary.
          target = copies.find((element) => targetLeft(element) > strip.scrollLeft + 1)
            ?? real;
        }
      }

      let destination = targetLeft(target);
      // A manually scrolled outermost copy may not have enough space to centre.
      // Translate both endpoints by a full copy before animating in that case.
      const max = strip.scrollWidth - strip.clientWidth;
      if (destination < 0 || destination > max) {
        const shift = targetLeft(real) - destination;
        const rebased = strip.scrollLeft + shift;
        if (rebased >= 0 && rebased <= max) {
          strip.scrollLeft = rebased;
          destination += shift;
        }
      }
      destination = Math.max(0, Math.min(max, destination));
      const start = strip.scrollLeft;
      const rebase = () => {
        // This is visually the same row, with room available for the next move.
        strip.scrollLeft = targetLeft(real);
      };
      if (reduced || !selection || !captionVisible) {
        strip.scrollLeft = destination;
        rebase();
        return;
      }

      let started: number | undefined;
      const move = (time: number) => {
        started ??= time;
        const progress = Math.min(1, (time - started) / 400);
        const eased = 1 - (1 - progress) ** 3;
        strip.scrollLeft = start + (destination - start) * eased;
        if (progress < 1) frame.current = requestAnimationFrame(move);
        else rebase();
      };
      frame.current = requestAnimationFrame(move);
    };

    centre();
    // ResizeObserver delivers an initial notification too. Do not let it cancel
    // the click animation just started by this effect.
    let width = strip.clientWidth;
    const observer = new ResizeObserver(() => {
      if (strip.clientWidth === width) return;
      width = strip.clientWidth;
      centre();
    });
    observer.observe(strip);
    return () => {
      cancelAnimationFrame(frame.current);
      observer.disconnect();
    };
  }, [controlsRef, index, reduced, captionVisible]);

  return selectCopy;
}
