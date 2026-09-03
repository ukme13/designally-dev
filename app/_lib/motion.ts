/**
 * Entrance for a list that arrives after its panel.
 *
 * Items start above their resting position and drop into place while fading
 * in. The transition is scoped to the open state, so closing snaps back in one
 * movement rather than unwinding item by item. Each user sets its own
 * `--stagger` delay inline.
 *
 * Shared by the mobile drawer and the collapsible menus so the two cannot
 * drift apart.
 *
 * The transition lists `translate`, not `transform`: Tailwind v4's translate-*
 * utilities set the standalone `translate` property, so transitioning
 * `transform` animates nothing and the movement snaps while only the fade
 * staggers.
 */
export const STAGGER_ENTER =
  "-translate-y-6 opacity-0 group-data-open:translate-y-0 group-data-open:opacity-100 " +
  "group-data-open:transition-[opacity,translate] group-data-open:duration-500 " +
  "group-data-open:ease-sweep group-data-open:[transition-delay:var(--stagger)] " +
  "motion-reduce:transition-none";
