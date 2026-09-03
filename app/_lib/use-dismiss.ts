"use client";

import { useEffect, type RefObject } from "react";

/**
 * Closes a lightweight popover on Escape or a pointer press outside it.
 *
 * Several containers can be passed, because the same menu is mounted in more
 * than one place and only one of them is on screen at a time.
 */
export function useDismiss(
  active: boolean,
  containers: RefObject<HTMLElement | null>[],
  onDismiss: () => void,
) {
  useEffect(() => {
    if (!active) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onDismiss();
    }

    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node;
      const inside = containers.some((ref) => ref.current?.contains(target));
      if (!inside) onDismiss();
    }

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, onDismiss]);
}
