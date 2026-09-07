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
  /**
   * When the showreel is told it may begin. NOT the end of this timeline.
   *
   * It used to be the end — the showreel waited for `finish()`, which runs on
   * the timeline's completion at `total`. But the navbar's own transition is
   * two full seconds of that, and nothing about the showreel depends on the
   * navbar having arrived. Waiting for it put the video's entrance at roughly
   * 5.9s from load.
   *
   * Set to `navbarStart`, so the two run together: the navbar takes 2000ms to
   * arrive and the showreel's entrance 2050ms, and the page resolves as one
   * rather than in sequence. Raise it toward `total` if the pair reads as busy;
   * the navbar is unaffected either way, since this only fires a cue.
   */
  showreelCue: 1850,
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

/* ---------------------------------------------------------------------------
   Showreel cue.

   The showreel's entrance waits on the hero, but the two live in different
   component subtrees and mount independently. A one-time event would not do:
   the showreel can subscribe after the cue has already been raised — on an
   internal navigation the hero finishes synchronously, before the showreel's
   effects run at all — and would then wait forever for something that already
   happened.

   So the fact is remembered, and a late subscriber is told immediately.

   It is a CUE, not an ending, and the name says so deliberately. It was
   `markIntroSettled` while the two were the same moment; they are not any
   more. The timeline raises it at INTRO.showreelCue, partway through, and
   `finish()` raises it again as the safety net that covers every path where
   the timeline never reaches that point.
--------------------------------------------------------------------------- */

let cued = false;
const cueListeners = new Set<() => void>();

/**
 * Raised at INTRO.showreelCue, and by every real ending as a backstop: the
 * timeline completing, reduced motion, a failed GSAP import, the watchdog, and
 * a load the intro does not play on. Idempotent — later calls do nothing, so
 * whichever comes first wins and the rest are free.
 */
export function markShowreelCue(): void {
  if (cued) return;
  cued = true;
  for (const listener of cueListeners) listener();
}

/**
 * Notified when the cue is raised, or immediately if it already has been.
 * Returns an unsubscribe function.
 */
export function subscribeShowreelCue(listener: () => void): () => void {
  if (cued) {
    listener();
    return () => {};
  }
  cueListeners.add(listener);
  return () => {
    cueListeners.delete(listener);
  };
}
