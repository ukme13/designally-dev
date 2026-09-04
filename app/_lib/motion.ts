/**
 * Entrance and exit for a list that arrives after its panel.
 *
 * Items rest above their place and drop in while fading; on the way out they
 * fade and lift back the same way.
 *
 * The transition itself lives in the BASE state. Scoping it to `data-open`, as
 * this did, meant the declaration vanished at the exact moment it was needed:
 * removing the attribute removed the transition along with it, so there was
 * nothing left to animate and the list snapped shut.
 *
 * Only the timing is scoped. Opening is slow, swept and staggered per item;
 * closing is short and unstaggered, so the list leaves as one movement rather
 * than unwinding in reverse. The stagger delay goes with it — `transition-delay`
 * is 0s by default, so nothing has to undo it.
 *
 * Shared by the mobile drawer and the collapsible menus so the two cannot
 * drift apart. Each user sets its own `--stagger` delay inline.
 *
 * The transition lists `translate`, not `transform`: Tailwind v4's translate-*
 * utilities set the standalone `translate` property, so transitioning
 * `transform` animates nothing and the movement snaps while only the fade
 * staggers.
 */
export const STAGGER_ENTER =
  "transition-[opacity,translate] duration-250 ease-standard " +
  "-translate-y-6 opacity-0 " +
  "group-data-open:translate-y-0 group-data-open:opacity-100 " +
  "group-data-open:duration-500 group-data-open:ease-sweep " +
  "group-data-open:delay-(--stagger) " +
  "motion-reduce:transition-none";
