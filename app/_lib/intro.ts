/**
 * State for the homepage entrance animation.
 *
 * The intro plays only when the browser loaded the homepage directly — a fresh
 * visit or a hard refresh of "/". It must not play when someone lands on
 * another route and then navigates to the homepage, and it must not replay on
 * any client-side navigation.
 *
 * Cookies and storage are deliberately not used. Module state is enough: this
 * module is evaluated once per JavaScript context, so it resets on a full page
 * load and survives every client-side navigation in between — exactly the
 * lifetime the requirement describes.
 *
 * `initialPath` is recorded by IntroCoordinator, which the root layout mounts
 * on every route. See that file for why the capture happens during render.
 */

/** Milliseconds. The whole sequence runs to INTRO_TOTAL. */
export const INTRO = {
  /** Solid orange holds. Descriptive: the reveal's start time is what
   *  creates this window, so nothing reads this field. */
  hold: 250,
  /** Cream sweeps down, revealing the permanent gradient. */
  revealStart: 250,
  revealDuration: 900,
  /** The statement lines fall in, overlapping the tail of the reveal. */
  markStart: 650,
  /** Accelerating drop, then a settle on landing. Together, one second
   *  per line. */
  markFall: 850,
  markSettle: 150,
  /** Gap between each line, so the last one lands exactly on navbarStart. */
  markStagger: 100,
  /** Navbar enters last. */
  navbarStart: 1850,
  navbarDuration: 2000,
  total: 3850,
} as const;

let initialPath: string | null = null;
let hasPlayed = false;

/** Records the route the application was first loaded on. Idempotent. */
export function recordInitialPath(path: string): void {
  if (initialPath === null) {
    initialPath = path;
  }
}

/**
 * True only for a direct load of the homepage that has not animated yet.
 * `trailingSlash: true` means the homepage is always exactly "/".
 */
export function shouldPlayIntro(currentPath: string): boolean {
  return !hasPlayed && initialPath === "/" && currentPath === "/";
}

/** Called once the sequence has run, or been skipped, so it cannot repeat. */
export function markIntroPlayed(): void {
  hasPlayed = true;
}
