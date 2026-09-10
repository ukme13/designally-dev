import type { RefObject } from "react";

/**
 * A list of elements filled by callback refs, one slot per item rendered.
 *
 * A slot can be null between an item unmounting and the next commit, which is
 * why every reader filters before using it — and then checks the count against
 * whatever it is indexing in parallel. A short array would silently shift each
 * item's settings up by one, which looks like a design mistake rather than a
 * bug.
 */
export type ElementSlots<T extends Element> = (T | null)[];

/**
 * A callback ref that fills one slot.
 *
 * `ref={slot(rowRefs, index)}` rather than the arrow it replaces, which had to
 * be written as a block — `(node) => { refs.current[i] = node; }` — because an
 * assignment expression returns a value and React rejects a ref callback that
 * returns anything but a cleanup function. Easy to get wrong, and four lines of
 * noise in the middle of the markup every time.
 *
 * A new function each render, exactly as the inline arrow was, so React still
 * clears the slot and refills it on every commit.
 */
export const slot =
  <T extends Element>(slots: RefObject<ElementSlots<T>>, index: number) =>
  (node: T | null) => {
    slots.current[index] = node;
  };

/** The slots that currently hold an element. */
export const present = <T extends Element>(nodes: ElementSlots<T>): T[] =>
  nodes.filter((node): node is T => node !== null);
