"use client";

import type { RefObject } from "react";
import { useEffect } from "react";

import {
  ENTRANCE_MS,
  PIXEL_CELL_SCALE,
  PIXEL_DOT_HOLD_MS,
  PIXEL_FADE_MS,
  PIXEL_MORPH_MS,
  PIXEL_REVEAL_MS,
  pixelOrder,
  type PixelGrid,
} from "@/app/_lib/showreel";

export type RevealDiagnostics = {
  status: string;
  frames: number;
  elapsed: number;
};

const clamp = (value: number) => Math.max(0, Math.min(1, value));
// Same cubic curve as the previous GSAP power2.inOut morph.
const ease = (value: number) => value < 0.5
  ? 4 * value ** 3
  : 1 - (-2 * value + 2) ** 3 / 2;

/**
 * Draw and advance the reveal on one clock. The old GSAP timeline could finish
 * while the separate canvas loop returned early or had stopped after an error.
 * Here the clock starts only once there is a drawable frame and a sized canvas.
 * Completion follows a successful final paint, never an independent tween.
 */
export function useShowreelEntrance({
  canvasRef,
  videoRef,
  canReveal,
  grid,
  projectKey,
  diagnosticsRef,
  onRevealed,
}: {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  videoRef: RefObject<HTMLVideoElement | null>;
  canReveal: boolean;
  grid: PixelGrid;
  projectKey: number;
  diagnosticsRef: RefObject<RevealDiagnostics>;
  onRevealed: () => void;
}) {
  useEffect(() => {
    if (!canReveal) return;
    let frame = 0;
    let lastTime: number | undefined;
    let elapsed = 0;
    let stopped = false;
    diagnosticsRef.current = { status: "waiting for drawable frame", frames: 0, elapsed: 0 };
    const { columns, rows } = grid;
    const order = pixelOrder(columns, rows);

    const complete = (status: string) => {
      stopped = true;
      cancelAnimationFrame(frame);
      clearTimeout(watchdog);
      diagnosticsRef.current.status = status;
      onRevealed();
    };
    const watchdog = setTimeout(() => complete("drawing timeout"), ENTRANCE_MS + 3000);

    const paint = (time: number) => {
      if (stopped) return;
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const width = canvas?.clientWidth ?? 0;
      const height = canvas?.clientHeight ?? 0;
      if (!canvas || !video || !width || !height || video.readyState < 2 ||
          !video.videoWidth || !video.videoHeight || video.seeking) {
        // Do not consume the entrance while layout or a seek is pending.
        lastTime = undefined;
        frame = requestAnimationFrame(paint);
        return;
      }
      const context = canvas.getContext("2d");
      if (!context) {
        complete("canvas context unavailable");
        return;
      }

      // A suspended tab or a slow frame must not skip the entire reveal.
      const nextElapsed = elapsed + (lastTime === undefined ? 0 : Math.min(64, time - lastTime));
      lastTime = time;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const deviceWidth = Math.round(width * ratio);
      const deviceHeight = Math.round(height * ratio);
      if (canvas.width !== deviceWidth || canvas.height !== deviceHeight) {
        canvas.width = deviceWidth;
        canvas.height = deviceHeight;
      }

      try {
        context.setTransform(ratio, 0, 0, ratio, 0, 0);
        context.globalCompositeOperation = "source-over";
        context.globalAlpha = 1;
        context.clearRect(0, 0, width, height);
        // This is an alpha mask; the white fill is replaced by the film below.
        context.fillStyle = "#fff";
        const slotWidth = width / columns;
        const slotHeight = height / rows;
        const diameter = Math.min(slotWidth, slotHeight) * PIXEL_CELL_SCALE;
        for (let cell = 0; cell < columns * rows; cell++) {
          const local = nextElapsed - order[cell] * (PIXEL_REVEAL_MS - PIXEL_FADE_MS);
          const alpha = clamp(local / PIXEL_FADE_MS);
          if (!alpha) continue;
          const morph = ease(clamp(
            (local - PIXEL_FADE_MS - PIXEL_DOT_HOLD_MS) / PIXEL_MORPH_MS,
          ));
          const cellWidth = diameter + (slotWidth - diameter) * morph;
          const cellHeight = diameter + (slotHeight - diameter) * morph;
          const x = (cell % columns) * slotWidth + (slotWidth - cellWidth) / 2;
          const y = Math.floor(cell / columns) * slotHeight + (slotHeight - cellHeight) / 2;
          const radius = diameter * (1 - morph) / 2;
          context.globalAlpha = alpha;
          context.beginPath();
          context.roundRect(x, y, cellWidth, cellHeight, Math.max(0, radius));
          context.fill();
        }
        context.globalAlpha = 1;
        context.globalCompositeOperation = "source-in";
        const scale = Math.max(width / video.videoWidth, height / video.videoHeight);
        const drawWidth = video.videoWidth * scale;
        const drawHeight = video.videoHeight * scale;
        context.drawImage(video, (width - drawWidth) / 2, (height - drawHeight) / 2,
          drawWidth, drawHeight);
        context.globalCompositeOperation = "source-over";
      } catch (error) {
        complete(`draw failed: ${error instanceof Error ? error.message : String(error)}`);
        return;
      }

      elapsed = nextElapsed;
      diagnosticsRef.current.frames++;
      diagnosticsRef.current.elapsed = Math.round(elapsed);
      diagnosticsRef.current.status = "drawing";
      if (elapsed >= ENTRANCE_MS) complete("painted complete");
      else frame = requestAnimationFrame(paint);
    };

    frame = requestAnimationFrame(paint);
    return () => {
      stopped = true;
      clearTimeout(watchdog);
      cancelAnimationFrame(frame);
      // Never paint a complete frame during cleanup: React can clean up for a
      // resize or effect replay while the reveal is still pending.
    };
  }, [canReveal, grid, projectKey, canvasRef, videoRef, diagnosticsRef, onRevealed]);
}
