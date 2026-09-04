/** Shared control styles for the site header. */

/** Text toggle: mark plus label, sized to keep a 44px target without a border. */
export const TOGGLE =
  "-mr-2 inline-flex h-11 shrink-0 cursor-pointer items-center gap-2 px-2 " +
  "type-label text-text-primary transition-colors duration-150 " +
  "hover:text-action-primary";

/** Circular outline toggle used on tablet and in the floating header. */
export const CIRCLE_TOGGLE =
  "inline-flex size-13 shrink-0 cursor-pointer items-center justify-center rounded-pill " +
  "border-[1.5px] border-solid border-action-primary bg-surface-base text-action-primary " +
  "transition-colors duration-300";

/**
 * Collapsible panel for the compact menus.
 *
 * The closing delay is what lets the list inside be seen leaving: without it
 * the panel collapses and fades from the first frame, clipping and hiding rows
 * that are still animating. It waits out their exit, then goes. Opening has no
 * such wait — `data-open:delay-0` cancels it — so the panel is already there
 * when the rows begin to arrive.
 */
export const MENU_PANEL =
  "group overflow-hidden transition-all duration-300 ease-standard " +
  "delay-250 data-open:delay-0 motion-reduce:transition-none";
export const MENU_PANEL_OPEN = "visible max-h-64 opacity-100";
export const MENU_PANEL_CLOSED = "invisible max-h-0 opacity-0";

/**
 * Cross-fade between the two states of a toggle's icon.
 *
 * Both icons stay mounted and share one box, so the outgoing one has somewhere
 * to animate to — a conditional swap removes it from the DOM immediately and
 * there is nothing left to fade.
 *
 * The transition names `opacity, rotate, scale` and not `transform`: Tailwind
 * v4's rotate-* and scale-* utilities set the independent CSS properties of
 * those names, so a transition on `transform` would have nothing to interpolate.
 * One declaration rather than several utilities, because each would overwrite
 * transition-property and only the last in the stylesheet would survive.
 */
export const ICON_SWAP_BOX = "relative block size-6";
export const ICON_SWAP =
  "absolute inset-0 size-6 transition-[opacity,rotate,scale] " +
  "duration-300 ease-standard motion-reduce:transition-none";
/** The icon that belongs to the current state. */
export const ICON_SWAP_IN = "rotate-0 scale-100 opacity-100";
/** The other one: turned away, a little smaller, invisible. */
export const ICON_SWAP_OUT = "-rotate-45 scale-75 opacity-0";
