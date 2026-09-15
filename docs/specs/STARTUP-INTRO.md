# Homepage Entrance Animation

Status: Implemented, visual review outstanding
Route: `/` only
Updated: 4 September 2026

## What this is

A branded entrance for the homepage. It is **not** a loading screen.

The cream-to-orange gradient and the three statement lines are permanent parts
of the hero. They are present in the served HTML and remain on screen after the
sequence ends. **Only the mask that hides them is temporary.**

**The gradient and the lines now live in a sticky stage, not in the hero
section.** Since 7 September 2026 they sit in a `sticky top-0 h-lvh` layer that
spans the hero and the section after it: the gradient stays pinned to the top
of the viewport for the length of the hero, then releases and travels up with
the section below so the two leave as one picture. The statement lines gained a
scroll-driven transform layer and fly upward as the page scrolls past.

Two structural details that are load-bearing, both recorded in `app/page.tsx`:
the negative top margin that pulls the hero under the header lives on the
stage, because the gradient's top edge follows the stage rather than the hero;
and the negative margin that overlays the content on the gradient must be on
the CONTENT, never on the sticky element — sticky constrains an element's
margin box rather than its border box, so zeroing the gradient's own margin box
lets its visible box overhang the stage and carry on travelling behind the
section below.

Nothing waits on this animation. The page is server-rendered with its real
content and is usable throughout.

## Visual timeline

Total 3,850 ms.

| Window | What happens |
|---|---|
| 0 – 250 ms | Solid brand orange fills the hero. |
| 250 – 1,150 ms | The mask retreats downward, uncovering the permanent gradient from the top. |
| 650 – 1,850 ms | Three statement lines fall from above the hero and land. One second each, starting 100 ms apart. |
| 1,850 – 3,850 ms | The navbar moves down into place and fades in. |

Timings are declared once, in `app/_lib/intro.ts`, and the component reads
them. The document above and the code cannot drift.

`INTRO.hold` is descriptive only — the 250 ms of solid orange is created by the
reveal's start time, and nothing reads that field.

### How the reveal works

Three layers, only one of which is temporary:

| Layer | What it is |
|---|---|
| Base | `bg-action-primary`, solid orange, `absolute inset-0`. Permanent. |
| Gradient | `bg-linear-to-b from-surface-base to-primary-300`, `absolute inset-0`. Permanent, and it never moves, scales or fades. |
| Mask | A CSS mask on the gradient. Temporary — it is what retreats. |

The gradient is masked rather than moved. `--intro-reveal` is a registered
custom property, so it can be interpolated:

```css
@property --intro-reveal { syntax: "<percentage>"; inherits: false; initial-value: 0%; }
```

| | |
|---|---|
| Mask image | `linear-gradient(to bottom, #000 0%, #000 30%, transparent 50%, transparent 100%)` |
| Mask size | `100% 200%` — twice the element |
| Feather | 30% to 50% of the mask = 40svh of soft edge |
| Start, `--intro-reveal: 100%` | the transparent half sits over the gradient: solid orange shows |
| End, `--intro-reveal: 0%` | the opaque half sits over it: the gradient shows in full |

Only the mask boundary travels, so the gradient arrives in its true proportions
rather than being animated into them. Nothing is translated, scaled or faded,
and there is no separate overlay element to get the geometry of wrong — which
is what the two earlier attempts, a sliding overlay and then a sliding curtain,
both did.

The finished state is the **default**. The hidden start applies only under
`html[data-intro="running"]`, so an internal navigation paints the completed
hero with nothing to correct.

### The statement

Three lines, each placed independently in the hero:

> Make it *Right*
> Make it *Simple*
> Make it *Work*

The closing word of each is set in the display face's italic — the same accent
the footer headline uses. Poppins has no italic loaded and would be
synthesised, which is why the accent word carries `font-display`.

Each line is **two elements**, and the split is load-bearing:

| | Owns |
|---|---|
| Outer `<div>` | the ref, `intro-line`, and the placement. GSAP animates this and nothing else. The CSS start state targets this. |
| Inner `<p>` | typography, colour, alignment and tilt. GSAP never sees it. |

A `rotate-*` on the wrapper does not survive. GSAP's `_parseTransform` reads the
computed `rotate`, folds it into its own `transform` matrix and writes inline
`rotate: none` to stop it applying twice — so the angle lives inside GSAP's
matrix for the fall, is destroyed when that transform is cleared, and the class
is still suppressed. Worse, CSS composes `rotate` *before* `transform`, so the
folded matrix rotates the translation too and the line drifts sideways by
`distance × sin(angle)` — about 47px at 3° over a 900px fall. Keeping the tilt
on a child GSAP never touches avoids both.

Their hidden, raised starting state is set in CSS under the pre-paint marker,
not in an effect — an effect runs after the browser can paint, so the
server-rendered text would flash in its final position first.

They fall from above the hero: an accelerating `power2.in` drop of 850 ms, then
a 150 ms settle from a 10px overshoot — one second per line. Transform only;
they do not fade. Weight rather than bounce. They start 100 ms apart, so the
last lands exactly as the navbar begins.

Because each line takes a second while they start only 100 ms apart, the three
are almost entirely overlapped: it reads as one slow group movement rather than
three separate falls. Widen `markStagger` to separate them.

#### How far each line starts above the hero

Measured **per line**, from what is painted rather than from the layout box,
once, when the timeline is built. Never recalculated from the viewport
mid-flight.

```ts
const painted = union(wrapper.getBoundingClientRect(), …children rects);
rise = painted.bottom - heroTop + RISE_CLEARANCE;   // RISE_CLEARANCE = 48
```

One figure for all three is not enough. A line placed low — `bottom-[-5%]`
starts *below* the hero's own bottom edge — needs more than one hero height,
and a tall line near the top needs its own height counted as well. Raising
everything by the hero height leaves those still on screen at the first frame.

The layout box is not enough either. The tilt is applied after layout, so a
wide `whitespace-nowrap` line turned a few degrees reaches roughly
`width × sin(angle) / 2` past the wrapper's edges — tens of pixels at a large
viewport — and `leading-[0.95]` spills glyphs outside the line box. A client
rect of a rotated element is its axis-aligned bounding box, which is exactly
the painted extent.

The transform is neutralised with `y: 0` before those rects are read: the CSS
start state has each line translated up by 100svh, and a client rect would
report that shifted position. Every write in that block is synchronous, so no
frame can paint between them, and the lines are `visibility: hidden` at that
point regardless.

Because the hero clips its overflow, the lines are out of sight above it rather
than fading in, so the movement reads as falling rather than appearing.

This is real text, not decoration, so it is left readable by assistive
technology. The page's `<h1>` remains in `#intro` below; these are paragraphs,
so the heading order is unaffected.

## Permanence

After 3,850 ms these all remain:

- the cream-to-orange gradient — plain CSS on a `div`, no JavaScript involved
- the solid-orange base beneath it
- the three statement lines
- the navbar, in its normal position with all its usual behaviour
- the hero section and every other part of the page

Removed: the mask offset, and the `data-intro` attribute.

## Replay behaviour

The animation plays **only when the browser loaded the homepage directly.**

| Situation | Plays? |
|---|---|
| Full page load of `/` | Yes |
| Hard refresh of `/` | Yes |
| Full page load of another route, then internal navigation to `/` | No |
| Internal navigation to `/` from anywhere | No |
| Navigating away from `/` and back | No |

No cookies, `localStorage` or `sessionStorage`.

`IntroCoordinator`, mounted by the root layout, records the route the
application was first loaded on. The layout persists for the lifetime of the
Next application, so this happens once per full page load and resets on the
next one — the exact lifetime the rule needs.

The capture runs during render rather than in an effect, because effects run
child-first and `HeroIntro`'s effect would otherwise read an empty value. The
write is idempotent, so React's double render in development is harmless.

### Strict Mode

React runs effects twice in development and discards the first pass. Two
separate defects came from that, and both fixes are deliberate.

**The animation was consumed.** Cleanup marked the intro as played, so the
surviving mount found nothing to do. The async continuation is now guarded with
a `cancelled` flag, and whether a run counts is decided when the timeline is
actually built, on a live mount.

**The gradient flashed.** The discarded pass's cleanup cleared the marker and
revealed the gradient; the replacement setup then awaited `import("gsap")`,
which yields — and the browser painted the revealed gradient before GSAP could
hide it again.

The visual restore is therefore deferred by one microtask and gated on a
generation token bumped by every setup. If a newer setup exists, the cleanup is
a Strict Mode replay and does nothing; if not, it is a real unmount and the page
is restored. A microtask rather than an animation frame, because microtasks
still run in a background tab and drain before paint. Reading the token late is
the whole mechanism — copying it into the effect, as the exhaustive-deps rule
advises, would freeze the value and defeat the check.

## Reduced motion

`prefers-reduced-motion: reduce` gets the finished page immediately: the full
gradient, the statement in place, the navbar in place. No movement, no fade, no
artificial delay.

This is stated twice on purpose, so neither path can be missed:

- **CSS** — `--intro-reveal` is pinned to `0%`, the line and navbar rules are
  neutralised, and every fail-safe animation is cancelled, all with
  `!important`. This holds even if JavaScript never runs.
- **JavaScript** — `gsap.matchMedia()` has an explicit `reduce` branch that
  finishes immediately and builds no timeline.

It does not rely on the global reduced-motion rule in `globals.css`.

## Failure behaviour

The page can never be left mid-sequence.

- **No JavaScript, or hydration never completes** — every element carries a
  CSS fail-safe that resolves it to the finished state.
- **GSAP fails to load** — the dynamic import is inside `try/catch`, and the
  fail-safes are still attached.
- **An error after the timeline starts** — `finish()` runs from the `catch`.
- **The timeline stalls** — a watchdog calls `finish()` at total + 2,000 ms.
- **The component unmounts** — cleanup reverts the GSAP context and restores.

### The fail-safes hold, they do not move

Each of the three fail-safes is a **1 ms snap on a 3,000 ms delay**, not a
reproduction of the animation:

```css
html[data-intro="running"] .intro-line { animation: intro-line-bail 1ms linear 3000ms forwards; }
@keyframes intro-line-bail { to { visibility: visible; transform: none; } }
```

Nothing moves while GSAP loads. An earlier version reproduced the movement in
CSS, and it raced the dynamic import: the fallback began travelling, then GSAP
arrived and reset everything to the start position — a visible backward jump.
Because the fallback now holds the start state still, the timeline begins from
exactly what is already on screen and there is nothing to reset.

### Two exit paths

| | |
|---|---|
| `restore()` | Visual only, idempotent. Removes the marker, pins the gradient to its finished value, and clears the temporary inline values on each line. |
| `finish()` | `restore()`, then marks the intro as played. |

`restore()` **removes** inline declarations rather than overwriting them —
`removeProperty("transform")`, not `transform = "none"`. Overwriting deletes
GSAP's folded rotation while its `rotate: none` suppression is still in place,
and the line ends up flat. Removing hands the property back to the stylesheet,
which is where the finished state is defined; `data-intro` is gone by then, so
the rules that hid and raised the line no longer match.

## Accessibility

- The base, the gradient and the mask are `aria-hidden` — decorative. The
  statement lines are not: they are real copy and stay readable.
- No meaningful text is hidden. The `<h1>` and hero copy are in `#intro` and
  are never animated or concealed.
- The navbar is hidden with `visibility: hidden`, so while it is invisible its
  links take neither pointer events nor keyboard focus. Interaction returns
  when it enters.
- The navbar is hidden only after the timeline has started. If the animation
  never runs, it is visible and usable from first paint.
- Focus is never moved. Nothing is announced.
- The skip link stays at `z-60`, above all site chrome, and works throughout.
- No keyboard trap.

## Hiding the navbar

The whole `<header>` is hidden — background, border, shadow, logo and links —
not just its contents, so no navbar strip is visible above the hero.

It has to be hidden before the first paint, which React cannot do: the markup
is already on screen by the time an effect runs. A small script in the root
layout's `<head>` sets `data-intro="running"` on `<html>` when the page is a
full load of `/` and motion is allowed. The browser runs it synchronously while
parsing, ahead of any body content. An inline script cannot run on a
client-side navigation, which is exactly the condition the intro needs, so it
doubles as the direct-load check.

`<html>` carries `suppressHydrationWarning`, because the attribute is
deliberately absent from the server markup and present in the live document.
Without it React treats the difference as a hydration error and client-renders
from the nearest boundary, which would undo the correction. The suppression
applies to that element only, not its subtree. This follows the pattern in the
installed Next documentation, `guides/preventing-flash-before-hydration`.

Three states, in order:

| Value | Set by | Meaning |
|---|---|---|
| `running` | the head script | Header hidden, gradient hidden, lines raised. Fail-safes armed. |
| `armed` | HeroIntro, once GSAP is ready | Still hidden, fail-safes cancelled, timeline in control. |
| `navbar` | the timeline, at `INTRO.navbarStart` | Header transitions down and fades in over `navbarDuration`. |

The header's entrance is a CSS transition, not a GSAP tween, because the header
lives in the root layout — outside the homepage's React subtree. The timeline
flips the marker and the header's own stylesheet does the movement. Its
duration is declared in both places and must be kept in step: `navbarDuration`
in `intro.ts`, and the `transition` on `html[data-intro] [data-site-header]`.

The marker also suppresses the floating header for the whole sequence, so
scrolling during the entrance cannot bring it on screen.

Both rules target explicit hooks — `[data-site-header]` and
`[data-site-floating]` on the real elements — rather than the `header` element
type, so nothing else can match them.

### Why the gradient defaults to finished

`.intro-gradient` defaults to `--intro-reveal: 0%`, the completed state. The
hidden start is applied only under `html[data-intro="running"]`, and the CSS
fail-safe is scoped to the same marker.

That matters for internal navigation. The component and its classes are in the
markup on every mount, but an effect runs after the browser can paint — so a
default of "hidden" would flash solid orange when navigating to the homepage
from another route. With the default inverted, that paint is already the
finished gradient and no correction is needed.

The attribute is removed when the sequence settles, and the header's own styles
resume untouched.

If scripting is unavailable the attribute is never set and the header renders
normally, so it is never hidden without something guaranteed to bring it back.

## Hero geometry

The hero runs behind the header so the orange reaches the top edge of the
viewport from the first painted frame.

| Breakpoint | Space the header reserves | Hero |
|---|---|---|
| `< md` | 80px — the `h-20` spacer, since the header is fixed | `-mt-20 min-h-svh` |
| `md – lg` | 80px — the header in flow, `h-20` row | `-mt-20 min-h-svh` |
| `>= lg` | 120px — the header in flow, `h-section-tablet` row | `lg:-mt-30 min-h-svh` |

The negative margin and the extra height cancel exactly, so the section below
still begins at 100svh at every breakpoint. Nothing else moves, and there is no
jump when the sequence ends because the geometry never changes during it.

Two supporting changes:

- `<main>` uses `overflow-x-clip`, not `overflow-hidden`. The hero extends
  above `<main>`, and `hidden` on one axis forces the other to `auto`, which
  would turn `<main>` into a scroll container. `clip` has no such rule.
- The header is `md:relative` rather than `md:static`. Layout is identical —
  `relative` with no offsets occupies the same space — but z-index has no
  effect on a static element, so the pulled-up hero would otherwise paint over
  it.

The mobile spacer is untouched. The hero simply covers it.

## Layering

| Layer | z-index |
|---|---|
| Skip link | 60 |
| Mobile drawer | 55 |
| Floating header | 50 |
| Top bar | 40 |
| Hero, base, gradient, statement | in flow |

Verified in the compiled stylesheet. The intro adds no stacking context of its
own: with the reveal done by a mask rather than a covering element, there is
nothing that has to sit above the site chrome, and nothing that could intercept
a click.

## Implementation

| File | Role |
|---|---|
| `app/_lib/intro.ts` | Timings, initial-route memory, played flag |
| `app/_components/intro-coordinator.tsx` | Records the first route. Renders nothing |
| `app/_components/hero-intro.tsx` | Base, gradient, statement, timeline |
| `app/globals.css` | Mask, CSS fail-safes, `data-intro` navbar states, reduced motion |
| `app/page.tsx` | Renders `HeroIntro` inside `#hero` |
| `app/layout.tsx` | Pre-paint script, mounts `IntroCoordinator`. Still a Server Component |

GSAP core 3.15.0, no plugins, no ScrollTrigger. Imported dynamically, so it is
fetched only when the homepage animation actually runs.

The navbar is not modified. `header-shell.tsx` is untouched by the intro. The
timeline sets `data-intro` on `<html>` and the header's styles react — the
documented handle for reaching chrome that lives outside the homepage's React
subtree.

## Adjusting the statement

Everything is a class on one of the two elements. Which element matters.

**On the outer wrapper — where the line sits:**

| Property | Example | Notes |
|---|---|---|
| Vertical | `top-[18%]`, `bottom-[-5%]` | Percentages track the hero height, so the arrangement holds at every viewport size |
| Horizontal | `left-gutter-mobile md:left-gutter-tablet xl:left-[40%]` | With only `left` set, the box is shrink-to-fit and its available width is `100% − left`; a large offset is also a width limit, and long lines will wrap |
| Wrapping | `whitespace-nowrap` | Keeps the line on one row; it then takes its full natural width and may run past the hero, where `overflow-hidden` clips it |

Keep `intro-line` — the CSS start state and the reduced-motion rule both target
it.

**On the inner paragraph — how the line looks:**

| Property | Example | Alternatives |
|---|---|---|
| Family | `font-body` | `font-display` (EB Garamond), `font-accent` (Caveat) |
| Weight | `font-regular` | `font-thin` 100 … `font-bold` 700 |
| Size | `text-[clamp(2rem,12vw,20rem)]` | The `vw` figure drives it; raise it to go bigger |
| Leading | `leading-[0.95]` | An arbitrary size carries no line height of its own, unlike a theme size |
| Alignment | `text-left` / `text-right` | |
| Colour | `text-primary-300` | `text-white`, `text-text-primary` |
| Tilt | `rotate-3`, `-rotate-6`, `rotate-[2.5deg]` | Never `transform: rotate(…)` — that is the property the timeline drives |

Deliberately **not** one of the composed `type-*` utilities. Those set a font
weight themselves, so a `font-*` class beside one would fight it, with
stylesheet order deciding the winner rather than the order written.

**Order of the fall** is the array of refs in `hero-intro.tsx`; GSAP's stagger
walks it. Reorder it and both the fall and the settle follow, which is what
keeps them in step — the settle is positioned at a fixed absolute time and only
lines up because the two tweens share a stagger.

`RISE_CLEARANCE` is breathing room on top of the measured clearing distance.
Raise it if a line still shows at the first frame.

## Waiting on design approval

1. **The 250 ms hold.** On a fast connection the screen is solid orange, with
   nothing happening, for a quarter of a second. Deliberate, but it is dead
   time and worth seeing on a real device.
2. **Which word is italic.** The closing word of each line.
3. **Statement size, colour, placement and tilt.** See "Adjusting the
   statement" above for how to change any of them.
4. **The sequence runs 3.85 seconds.** One second per line plus a two-second
   navbar fade. That is a long time to hold the page before the navigation is
   usable, and worth a decision. Shortening it means changing `navbarDuration`
   in `intro.ts` *and* the matching `transition` duration in `globals.css`.
