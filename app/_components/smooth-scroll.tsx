"use client";

import { ReactLenis } from "lenis/react";

import "lenis/dist/lenis.css";

/**
 * Inertial scrolling for the whole document.
 *
 * Lenis 1.3.26, MIT, no runtime dependencies. Chosen over GSAP's own
 * ScrollSmoother — which is already in `node_modules` — because the two work
 * in fundamentally different ways. ScrollSmoother translates the page inside a
 * fixed wrapper (`smooth-wrapper` / `smooth-content`), so the document never
 * really scrolls; Lenis animates the browser's own scroll position. This site
 * depends on the page genuinely scrolling in three places: the hero gradient's
 * `position: sticky`, the statement lines reading `window.scrollY`, and the
 * showreel's IntersectionObservers. All three keep working untouched.
 *
 * `root` with no children renders NOTHING — verified in the installed source,
 * which returns null when there are no children and otherwise only wraps them
 * when `root` is absent. So this adds no element to the layout and cannot
 * disturb a containing block the sticky stage depends on. It sits alongside
 * the other layout-level behaviour components rather than wrapping the tree.
 *
 * Reduced motion needs no handling here: Lenis reads the preference itself and
 * forces lerp to 1, so scrolling tracks the input device exactly and
 * programmatic scrolls jump.
 *
 * The stylesheet is required, not decorative. It carries the
 * `overscroll-behavior: contain` that makes `data-lenis-prevent` work — which
 * the showreel's horizontal pill strip relies on — and the `height: auto`
 * rules that stop the html and body fighting the animated scroll.
 *
 * NOTE — `autoRaf` is left on, so Lenis drives its own animation frame rather
 * than sharing GSAP's ticker. Sharing is the documented ideal, but GSAP is
 * imported dynamically and only ever on the homepage: importing it here to
 * reach `gsap.ticker` would put it in all eleven route bundles, and importing
 * it dynamically would leave scrolling frozen until it resolved. Everything
 * scroll-driven on this site already coalesces its own writes to one per
 * frame, so the second loop costs a frame of alignment at worst. Revisit if
 * that shows as jitter against the sticky stage.
 */
/**
 * How closely the animated scroll position follows the real one, per frame.
 *
 * Lenis's default is `0.1` (confirmed in the installed 1.3.26 source, the
 * `lerp = .1` default in its constructor). LOWER means the page takes longer
 * to catch up to the input, which is what reads as weight and glide — 0.075
 * lengthens the settle by roughly a third without becoming slippery.
 *
 * **This changes the wheel, not the phone.** `syncTouch` defaults to `false`,
 * so touch scrolling is left entirely to the platform and keeps iOS's own
 * momentum. Turning it on would hand touch to Lenis and override that; it is
 * deliberately not done here.
 *
 * It also does not slow any scroll-driven animation down. Every one of them is
 * scrubbed to scroll POSITION, so the mapping from distance to progress is
 * unchanged — what changes is how quickly the position itself moves after an
 * input. To make a particular animation pass more slowly, widen its own scroll
 * range instead, the way `SECTION_FILL_VH` does in use-pixel-wipe.ts.
 */
const SCROLL_LERP = 0.075;

export default function SmoothScroll() {
  return <ReactLenis root options={{ lerp: SCROLL_LERP }} />;
}
