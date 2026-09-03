"use client";

import { useEffect, type RefObject } from "react";

const FOCUSABLE =
  'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Modal behaviour for a full-screen panel: locks page scroll, keeps focus
 * inside, closes on Escape, and returns focus where it came from.
 *
 * `fallbackFocusRef` is used when whatever had focus on open has since gone
 * from the document — normally the control that opened the panel.
 */
export function useModalPanel(
  open: boolean,
  panelRef: RefObject<HTMLElement | null>,
  onClose: () => void,
  fallbackFocusRef: RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    if (!open) return;

    const panel = panelRef.current;
    const fallback = fallbackFocusRef.current;
    const previouslyFocused = document.activeElement as HTMLElement | null;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab" || !panel) return;

      const focusable = panel.querySelectorAll<HTMLElement>(FOCUSABLE);
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);
    panel?.querySelector<HTMLElement>("a, button")?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      (previouslyFocused ?? fallback)?.focus();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
}
