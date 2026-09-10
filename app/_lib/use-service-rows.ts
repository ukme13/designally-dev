"use client";

import type { RefObject } from "react";

import type { ElementSlots } from "@/app/_lib/element-slots";
import { present } from "@/app/_lib/element-slots";
import { useBeforePaint } from "@/app/_lib/use-before-paint";

/**
 * Stacks the service rows against the top of the screen, brings each one into
 * focus as it arrives, and carries the finished stack off as one piece.
 *
 * ── The knobs ────────────────────────────────────────────────────────────
 *   where the stack begins   STACK_TOP
 *   which screens stack      STACK_QUERY
 *   how long it holds        STACK_HOLD
 *   the focus                ROW_ENTRY_*, FOCUS_START and FOCUS_END
 * ─────────────────────────────────────────────────────────────────────────
 *
 * A row rises to its place, holds while you read it, and is then covered by
 * the next — leaving its number, title and the head of its image showing. By
 * the last row all five are on screen, in order, as a contents page of the
 * section. Then the whole stack leaves together.
 *
 * ## Why this is not `position: sticky`
 *
 * It was. Sticky gets the stacking right and the departure wrong.
 *
 * A sticky box is released by its containing block: it can be pushed out of the
 * flow only until its bottom edge reaches the bottom of that block, which for
 * row `i` works out to `release = listBottom − rowHeight − stop`. Rows
 * therefore release in order of `rowHeight + stop` — and that sum strictly
 * increases down a stack whatever the heights are, so the BOTTOM row always
 * runs out of room first, then the next. The stack is eaten from below one band
 * at a time instead of leaving. No arrangement of sticky rows can avoid it, and
 * trailing space only delays every release equally.
 *
 * So the rows are positioned by hand: one transform each, written from the
 * scroll position, out of three numbers.
 *
 *     held   = max(0, stop − natural)              per row; what sticky does
 *     depart = max(0, last row's held − STACK_HOLD) shared by every row
 *     lift   = max(0, held − depart)                what is written
 *
 * `depart` being one number for the whole stack is the entire point — it is the
 * thing sticky cannot express. Measuring it from the LAST ROW LANDING rather
 * than from the end of the list is what makes the stack ride out instead of sit
 * there: keyed to the list's bottom edge, nothing moves until that edge has
 * climbed most of the screen, and the section visibly ends underneath a stack
 * that is still parked.
 *
 * It also needs no rate. `depart` is the last row's own `held`, which grows
 * one-for-one with scroll as every other row's does, so `lift` is CONSTANT from
 * the moment the stack is complete: the last row is never held, the four above
 * are glued to it one band apart, and the group is ordinary scrolling content
 * from then on.
 *
 * ## Measuring
 *
 * **A band is measured from the ROW's top to the TITLE's bottom**, not by the
 * title's own height. That folds in three things a stop needs and the title has
 * not got: the row's top border, the row's top padding, and the title's own
 * bottom padding. Measuring the title alone leaves every row short by all
 * three, and the error accumulates down the stack.
 *
 * It is also why the title's bottom padding sets how much of the image shows in
 * a stacked row: the image starts at the title's top edge and the stop is the
 * title's bottom edge, so the strip left showing is exactly the title's box.
 * See TITLE_TAIL in service-rows.tsx.
 *
 * Nothing is assumed. Title lengths differ, they rewrap at every width, and the
 * display font swaps in after first paint, so a fixed number per row would be
 * wrong somewhere — and wrong means a clipped title or a strip of the row
 * beneath showing through. Measurement takes the transforms off first and puts
 * them back after, so the rectangles it reads are the ones the layout would
 * have had; everything per-frame reads only the list, which is never
 * transformed.
 *
 * ## Failing safe
 *
 * **Nothing is written into the HTML.** The server sends a plain list at full
 * strength in document order, and every offset here is an inline style added
 * before paint and removed on cleanup. No JavaScript leaves a readable list
 * rather than five rows piled at the top of the screen, which is what a
 * stylesheet-only version would do — without the measured stops every row
 * would stop in the same place.
 *
 * **Narrow screens do not stack.** Below `STACK_QUERY` the titles wrap to two
 * and three lines and five bands eat the whole viewport, leaving no room for
 * the row being read. It is also where the site header is `fixed`, so a row
 * held at the top would sit under it. The focus still runs.
 *
 * **Reduced motion keeps the stack and drops the focus.** Stacking moves
 * nothing the scroll did not; dimming and scaling a row is decoration.
 *
 * Lenis needs no wiring: it animates the browser's real scroll position, so the
 * `scroll` event fires and `getBoundingClientRect` reads the truth.
 */

/**
 * Where the first row stops, in pixels from the top of the viewport. Zero: at
 * `STACK_QUERY` and up the site header is `md:relative` and scrolls away with
 * the page, so there is nothing at the top to clear.
 */
const STACK_TOP = 0;

/**
 * Which screens stack. `lg`, the same breakpoint at which the rows take up
 * their 12 columns — above this there is room for a band and a body at once.
 */
const STACK_QUERY = "(min-width: 64rem)";

/**
 * How long the finished stack sits before it rides out, as a fraction of the
 * screen's height. Zero: the fifth row lands and the group leaves with the
 * page, which is the whole point of keying the departure to that row.
 *
 * Raising it parks the complete stack for that much scrolling first. Note what
 * is underneath while it is parked — with no trailing space in the list, the
 * link below it and then the next section climb into view behind a stack that
 * is not moving, which is the thing keying it to the last row fixed.
 */
const STACK_HOLD = 0;

/** How far below its place a row starts, in pixels. Small on purpose. */
const ROW_ENTRY_Y = 32;
/** How small it starts, as a multiple of its final size. */
const ROW_ENTRY_SCALE = 0.98;
/** How dim it starts. This is what separates the arriving row from the rest. */
const ROW_ENTRY_OPACITY = 0.35;

/**
 * When a row focuses, as the fraction of the viewport its top edge is at: from
 * the bottom of the screen to seven tenths of the way down.
 *
 * It ends high up the screen deliberately. The last row's stop is four bands
 * down, which on a short laptop is past the halfway mark, and a row still
 * resolving as it takes its place in the stack would fidget against a scroll
 * that has already parked it.
 */
const FOCUS_START = 1;
const FOCUS_END = 0.7;

/**
 * How far outside the viewport the rows are promoted to their own layers.
 *
 * They are transformed every frame while the list is on screen, and five
 * full-width rows of text repainting per frame is real work; a layer each makes
 * it a composite instead. Dropped again the moment the section is out of the
 * way, because a layer costs the row's whole area in video memory and there is
 * no reason to hold five of them for the life of the page.
 */
const PROMOTE_MARGIN = "20% 0px";

/** One row's fixed geometry. Measured rarely, read every frame. */
type RowLayout = {
  /** Its own top, relative to the list's. */
  flow: number;
  /** Where it stops: every band above it, plus STACK_TOP. */
  stop: number;
};

const clamp01 = (value: number) => (value < 0 ? 0 : value > 1 ? 1 : value);

/**
 * Ease out, cubic.
 *
 * Not `--ease-out` from the tokens: reading that needs a `CustomEase` to
 * evaluate it, and pulling GSAP into a writer that runs on every scroll frame
 * to soften one dim is not worth it. This is the same shape.
 */
const easeOut = (progress: number) => 1 - (1 - progress) ** 3;

/**
 * How resolved a row is, from where its top edge sits on the screen — as the
 * three values that say so. Pure, so the writer below stays about position.
 */
const focusOf = (natural: number, viewport: number) => {
  const span = viewport * (FOCUS_START - FOCUS_END);
  const eased = easeOut(
    clamp01(span > 0 ? (viewport * FOCUS_START - natural) / span : 1),
  );
  return {
    /** Added to the stack's own lift, so a row rises as it resolves. */
    rise: (1 - eased) * ROW_ENTRY_Y,
    scale: ROW_ENTRY_SCALE + (1 - ROW_ENTRY_SCALE) * eased,
    opacity: ROW_ENTRY_OPACITY + (1 - ROW_ENTRY_OPACITY) * eased,
  };
};

export function useServiceRows({
  listRef,
  rowRefs,
  titleRefs,
  count,
}: {
  /** The list. Never transformed, so it is what everything is read against. */
  listRef: RefObject<HTMLElement | null>;
  /** One element per row — the whole row, so its parts move together. */
  rowRefs: RefObject<ElementSlots<HTMLElement>>;
  /**
   * The title of each row — the last thing a stacked row keeps, so its bottom
   * edge is where the row below stops. Measured, never assumed.
   */
  titleRefs: RefObject<ElementSlots<HTMLElement>>;
  /** How many rows there are. Rebuilds everything when it changes. */
  count: number;
}) {
  useBeforePaint(() => {
    const list = listRef.current;
    const rows = present(rowRefs.current);
    const titles = present(titleRefs.current);
    /* Both lists are filled in the same render, so a short one means a commit
       this effect should not be reading. Indexing them against each other with
       a hole in either would shift every row's stop by one. */
    if (!list || count === 0) return;
    if (rows.length !== count || titles.length !== count) return;

    const stackable = window.matchMedia(STACK_QUERY);
    const focusable = !window.matchMedia("(prefers-reduced-motion: reduce)")
      .matches;

    let layout: RowLayout[] = [];
    /** Whether the rows are worth writing to at all right now. */
    let onScreen = true;

    /** Back to the flow, exactly as the stylesheet leaves it. */
    const reset = () => {
      for (const row of rows) {
        row.style.transform = "";
        row.style.opacity = "";
      }
    };

    const write = () => {
      /* Nothing to write against until the first measurement. Both observers
         below can fire before it, since their first callbacks are queued. */
      if (!onScreen || layout.length === 0) return;

      const rect = list.getBoundingClientRect();
      const viewport = window.innerHeight;
      const stacking = stackable.matches;
      const last = layout[layout.length - 1];

      /* One number for the whole stack — see the note on why this is not
         `position: sticky`. Zero until the last row has taken its place. */
      const depart = stacking
        ? Math.max(
            0,
            last.stop - (rect.top + last.flow) - STACK_HOLD * viewport,
          )
        : 0;

      rows.forEach((row, index) => {
        /* Where this row would be with nothing written to it. */
        const natural = rect.top + layout[index].flow;
        const held = stacking ? Math.max(0, layout[index].stop - natural) : 0;
        const lift = Math.max(0, held - depart);

        if (!focusable) {
          row.style.transform = `translateY(${lift.toFixed(2)}px)`;
          return;
        }

        /* One transform, composed here rather than split across two elements:
           the stack and the focus both want `translateY`, and Tailwind v4 emits
           `translate` and `scale` as standalone properties that a `transform`
           of our own would not compose with. */
        const focus = focusOf(natural, viewport);
        row.style.opacity = focus.opacity.toFixed(3);
        row.style.transform =
          `translateY(${(lift + focus.rise).toFixed(2)}px)` +
          ` scale(${focus.scale.toFixed(4)})`;
      });
    };

    /*
      Layout, read with the transforms taken off so the rectangles are the ones
      the page would have had without this hook. Rare enough — mount, resize, a
      rewrapped title — that the two extra reflows do not matter.
    */
    const measure = () => {
      /* `will-change` is deliberately left alone: it belongs to the promotion
         observer, and clearing it on every resize would drop the layers until
         the next time that observer happened to fire. */
      reset();

      const base = list.getBoundingClientRect().top;
      let stop = STACK_TOP;

      layout = rows.map((row, index) => {
        const top = row.getBoundingClientRect().top;
        const measured = { flow: top - base, stop };
        /* Row top to title bottom: the border, the padding above the title, the
           title, and the padding below it — the whole visible band. */
        stop += titles[index].getBoundingClientRect().bottom - top;
        return measured;
      });

      write();
    };

    /* One write per frame at most, however many scroll events arrive. */
    let frame = 0;
    const schedule = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        write();
      });
    };

    const promote = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry.isIntersecting;
        for (const row of rows) {
          row.style.willChange = onScreen ? "transform" : "";
        }
        /* Straight away, not on the next scroll: the rows have been still while
           the page moved, so what they show is stale by however far. */
        write();
      },
      { rootMargin: PROMOTE_MARGIN },
    );
    promote.observe(list);

    /* Titles rewrap on resize and the display font swaps in after first paint;
       both change a band's height and so every stop below it. */
    const sizes = new ResizeObserver(measure);
    sizes.observe(list);
    for (const title of titles) sizes.observe(title);

    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", measure);
    stackable.addEventListener("change", measure);

    measure();

    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", measure);
      stackable.removeEventListener("change", measure);
      promote.disconnect();
      sizes.disconnect();
      reset();
      for (const row of rows) row.style.willChange = "";
    };
  }, [listRef, rowRefs, titleRefs, count]);
}
