import { useEffect, useLayoutEffect } from "react";

/**
 * `useLayoutEffect` in the browser, `useEffect` on the server.
 *
 * For effects that must write to the DOM before the browser paints — an
 * element that has to start somewhere other than where the server rendered it,
 * or a value read from a live rectangle on the first frame. A plain
 * `useEffect` runs after paint, so the initial state is visible for a frame
 * and the change reads as a jump.
 *
 * React warns when `useLayoutEffect` runs during server rendering, where it
 * does nothing useful anyway, so the server gets the hook that is a no-op
 * there. The choice is made once per environment, never per render, so the
 * hook order is stable.
 */
export const useBeforePaint =
  typeof window === "undefined" ? useEffect : useLayoutEffect;
