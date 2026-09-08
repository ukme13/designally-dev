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

/** The slots that currently hold an element. */
export const present = <T extends Element>(nodes: ElementSlots<T>): T[] =>
  nodes.filter((node): node is T => node !== null);
