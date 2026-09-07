# ADR-003: Mask-in showreel entrance and the sticky hero stage

- Status: Accepted
- Date: 7 September 2026

## Context

The showreel moved from its own section below the fold into the middle of the
hero. Two things that had worked below the fold stopped working there, and both
turned out to be structural rather than cosmetic.

**The entrance had a colour it could not choose.** It was an opaque cover of 144
cells that dissolved off the video. Below the fold that cover matched the
section's own flat background exactly, so it was invisible until it cleared. In
the hero the background is a cream-to-orange gradient and the rectangle spans a
*band* of it, so there is no single colour to match. Two attempts proved it: a
near-miss orange read as a bug, and a dark rectangle read as a hole punched in
the page.

**The hero needed to hold its background while the page scrolled**, and a
background that belongs to a section leaves when that section does.

## Decisions

### The entrance masks the video rather than covering it

144 `<rect>` cells in an SVG `<mask>` applied to the video's own container. They
start at opacity 0, so the rectangle is genuinely transparent and the hero's
gradient shows through it, then fade in from the centre outward and the film
materialises out of the page.

**A mask has no fill, so the colour problem disappears rather than being
solved.** Nothing is painted over the video at any point.

Support was verified before the rewrite, not assumed: `mask-image: url(#…)`
referencing an inline `<mask>` was confirmed working on both a plain element and
a live `<video>` container in Chrome and Safari, using a temporary probe route
that was deleted once it had answered the question. `CSS.supports` cannot
answer this — it parses the declaration and returns true for a reference that
never resolves.

`maskContentUnits="objectBoundingBox"` means coordinates are fractions of the
masked element, so there is no measurement and no resize handling. The grid is
chosen from the rendered aspect ratio, so cells stay square as the rectangle
changes shape between a phone and a desktop.

The container's circle-to-rectangle morph went with the cover, and with it the
clip-path measurement and a workaround for Chrome's computed-`clip-path`
handling. The per-cell circle-to-square remains and is the whole effect.

### The rectangle takes the grid's width and the page's height, with no ratio

Holding 16:9 and filling the page grid cannot both be had: a gutter-aligned
16:9 rectangle on a 1440x900 screen is 1280x720, which with the caption and the
paddings needs 1067px of a 900px viewport. Holding the ratio meant the rectangle
ran 70-82% of the grid width on every ordinary desktop, visibly narrower than
the navigation above it.

Both dimensions are now taken directly and `object-cover` crops the film — the
frame changes shape, not the film. `--showreel-reserve` is the single value that
keeps the hero at 100svh, and it is the sum of everything vertical that is not
the rectangle.

### The gradient and the statement lines live in a sticky stage

They moved out of the hero section into a `sticky top-0 h-svh` layer spanning
the hero and the section after it. The gradient is pinned for the length of the
hero, then releases and travels up with the section below so the two leave as
one picture. The statement lines gained a scroll-driven transform layer and fly
upward as the page scrolls past.

Holding the gradient still while the following section rose over it was tried
and rejected: it read as two things moving against each other rather than one
picture leaving.

## Consequences

- **The first film is fetched on every homepage load.** The section is on
  screen at first paint, so `preload` no longer stays `"none"`. LAGA
  (1,063,184 B) is now part of the homepage's initial media cost for every
  visitor. Not measured, and no decision taken.
- **Three joins depend on `primary-300` being identical in all of them**: the
  hero gradient's end stop, the solid section after the stage, and the `from-`
  of the section that fades back to the page background. Change one and all
  three move.
- **The statement lines carry five transform layers**, one per concern:
  position, scroll flight, entrance, mouse parallax, and the tilt on the type
  itself. No two things may share a transform, or GSAP folds one into the
  other's matrix and the tilt is lost.
- **Auto-advance is driven by `crossfadeAt`, not a timer.** A fixed interval
  could not fit: playback begins before the entrance finishes, so a clip is
  already ~2s in by the time it is fully revealed, and that time counts against
  its content.
- The showreel is no longer a candidate for a shared "media section" component.
  It is coupled to the hero's sizing, the intro's cue and the stage's geometry.

## Alternatives considered

**Gradient-matched cover.** Give each cell a slice of the hero gradient so the
cover stays invisible. Rejected: cells start as oversized overlapping circles,
so each would show a mismatched magnified tile. Making it work meant giving up
the circular pixels, or rebuilding the cover as a gradient-filled element behind
an SVG mask — which is the mask approach, with an extra element.

**ScrollTrigger for the scroll flight.** Rejected: the value is a direct
function of `scrollY` with no easing, timeline or pinning involved, and the
plugin would be roughly 40kB to compute one number. A plain listener with a
`quickSetter` does it, coalesced to one write per frame.

**Duplicating the project controls for an infinite carousel.** Adopted in part —
three copies of the set, with the outer two `aria-hidden` and out of the tab
order, so the accessibility tree still holds exactly four controls and
`aria-current` is true of one element. Padding the ends was tried first and
replaced one blank with another.
