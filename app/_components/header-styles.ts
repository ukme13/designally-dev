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

/** Collapsible panel for the compact menus. */
export const MENU_PANEL =
  "group overflow-hidden transition-all duration-300 ease-standard " +
  "motion-reduce:transition-none";
export const MENU_PANEL_OPEN = "visible max-h-64 opacity-100";
export const MENU_PANEL_CLOSED = "invisible max-h-0 opacity-0";
