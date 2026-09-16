# Homepage Showreel

Status: rectangle, pixel entrance and auto-advance implemented. Crossfade not
built — a switch cuts, it does not blend.
Route: `/` only, inside `#hero`, wrapper `#showreel`
Updated: 15 September 2026

**The entrance is painted into a `<canvas>`, not an SVG mask.** It was a CSS
`mask-image: url(#…)` until 15 September 2026, which does not work on iOS
Safari — the reveal never drew there at all. See **The pixel reveal** below.

## What this is

A selected-work video carousel sitting in the middle of the hero, with a
one-time branded entrance: the film materialises out of the page, pixel by
pixel from the centre outward, each pixel resolving from a circle into a
square as it arrives.

The rectangle is **revealed, not covered**. Until the entrance runs it paints
nothing at all and the hero's gradient shows straight through it; the cells
then fill in and the video appears. Nothing is ever painted over the film.

This replaced an opaque cover that dissolved off the video, along with a
circle hold and a circle-to-rectangle morph of the container, on 7 September
2026. See **Why it was inverted**.

The entrance runs on the first load and on each project change. A repeated
press on the already active project does nothing.

## Sticky background height

The sticky background uses `100lvh`, paired with a `-100lvh` margin on the
content wrapper. Their layout contributions cancel, so the stage's height and
the pin arithmetic are the same whichever viewport unit is used — the unit only
decides whether the box can be SHORTER than the screen.

That matters because nothing is painted behind it: `HeroIntro` is
`absolute inset-0` inside the box, the stage has no background, and `<body>` is
cream. A box that falls short shows a cream band at the foot of the screen.
`svh` is short whenever the toolbar is collapsed; `dvh` equals the viewport at
rest but still falls short while Safari animates its floating toolbar. `lvh` is
the maximum and cannot fall short.

The cost: with the toolbar showing, the gradient's bottom stop sits just below
the fold, so the visible bottom is slightly less orange than the stop.

Hero content retains its `svh` sizing so the video and caption do not resize
with toolbar motion. No solid sampling strips or new background colours are
added. Needs device QA.

## Placement

The showreel renders inside `<section id="hero">` in `app/page.tsx`, centred
by that section's own flex box and raised over the three statement lines with
`z-10`.

### Mobile fills the screen height

Below `md` the rectangle is `100svh - var(--showreel-reserve)` tall, not 16:9.
It stays inside the page gutters at every size — a full-bleed version was tried
on 7 September 2026 and reverted the same day. A 16:9 strip on a phone is a letterbox with page around it
rather than a piece of work. `object-cover` on the video crops to the portrait
box, so nothing is letterboxed or stretched — the frame changes shape, not the
film. The width cap below applies from `md` up only.

**The mask grid has to follow.** Cell geometry is in objectBoundingBox units —
fractions of the masked element — so a fixed 16 x 9 grid makes square cells
only in a 16:9 box. In a portrait box every cell would be a tall rectangle and
every "circle" an ellipse.

`pixelGrid(aspect, target)` picks the arrangement that squares them, holding the
cell count near the target and varying the layout: `columns =
round(sqrt(cells * aspect))`, rows derived from that, both clamped to 4-32 so a
sliver mid-resize cannot produce one enormous cell or thousands of invisible
ones.

**The target is not one number.** `PIXEL_TARGET_CELLS` is 144, but a box
narrower than `PIXEL_COMPACT_MAX_PX` (480 CSS px, i.e. a phone) uses
`PIXEL_TARGET_CELLS_COMPACT` — 64. Holding 144 everywhere was wrong and this
spec used to claim it made the effect "read the same on a phone as on a
desktop": on a real iPhone it made each cell 28px and the dots merged, so the
reveal read as a soft fade. See **Cell shape**.

Executed against `pixelGrid` itself, not estimated. Dot is the starting circle
at `PIXEL_CELL_SCALE`:

| | Box | Target | Grid | Cell | Dot | Cell aspect |
|---|---|---|---|---|---|---|
| iPhone (square box) | 337x337 | 64 | 8x8 | 42x42 | 25 | 1.00 |
| iPhone SE | 327x427 | 64 | 7x9 | 47x47 | 28 | 0.99 |
| phone, taller box | 390x520 | 64 | 7x9 | 56x58 | 33 | 0.96 |
| iPad mini | 688x387 | 144 | 16x9 | 43x43 | 26 | 1.00 |
| laptop | 1116x628 | 144 | 16x9 | 70x70 | 42 | 1.00 |
| desktop | 1400x712 | 144 | 16x8 | 88x89 | 53 | 0.98 |

Tablet and up are unchanged by the compact target. `ENTRANCE_MS` is unchanged
at 2050ms either way — only the number of steps differs, never the timing.

A `ResizeObserver` on the position wrapper drives it, not a media query: the
box's width comes from the page grid and its height from the viewport, so the
ratio moves continuously with both and an orientation change crosses the whole
range at once. The grid is only replaced when it actually changes, so a drag
does not remount the mask on every frame — and when it does change, the mask
remounts on its key and the entrance rebuilds against the new cells.

`PIXEL_ORDER` became `pixelOrder(columns, rows)`, cached per arrangement and
still deterministic — the noise is a hash of the cell index, never
`Math.random()`.

### Sizing: the grid's width, the page's height, no ratio

Both dimensions are simply taken. The width comes from the page container, so
the rectangle lines up with the navigation and never exceeds it; the height is
`100svh - var(--showreel-reserve)`, so the hero ends at the fold. `object-cover`
on the video crops the film to whatever shape those two produce.

| Viewport | Box height | Reserve | Hero vs 100svh |
|---|---|---|---|
| 390x844 | 484 | 22.5rem | -17 |
| 600x900 | 580 | 20rem | -65 |
| 768x1024 | 704 | 20rem | -113 |
| 1024x768 | 448 | 20rem | -98 |
| 1440x900 | 580 | 20rem | -73 |
| 1920x1080 | 760 | 20rem | -64 |
| 2560x1440 | 1120 | 20rem | -64 |

**The reserve has two values, because the hero's bottom padding does.** It is
`pb-25 sm:pb-0`, so from `sm` up there is no bottom padding to budget for and
the reserve drops from 22.5rem to 20rem. Carrying the full mobile figure past
that point cost the rectangle height for space that was not being used.

**20rem rather than the ~16.5rem the sum strictly needs, and the surplus is the
design rather than a safety margin.** The hero is `flex min-h-svh items-center`,
so every pixel the reserve does not spend becomes free space that `items-center`
divides evenly above and below the block. That free space IS the gap under the
breadcrumb, and the reserve is the only honest way to set it — bottom padding
cannot do the job, because it is spent from the reserve and then centred
against, so it costs the rectangle twice and lands on one side only.

Raised from 18rem on 16 September 2026. At 18rem the free space was ~24px, so
the block sat about 12px above the fold against the 80px of `pt-20` above it and
read bottom-heavy. 20rem costs 32px of rectangle height and returns roughly 16px
at each end. The caption term remains an estimate, and guessing low costs the
fold while guessing high costs only a slightly shorter rectangle.

Full grid width at every size, and the hero still clears the fold everywhere.
The shape swings from portrait on a phone to a wide band on a desktop, and the
mask grid follows it without being told — cells stay within 3% of square across
the whole range.

**It held 16:9 until 7 September 2026**, capping its width to fit the height.
The two cannot both be had: a gutter-aligned 16:9 rectangle on a 1440x900
screen is 1280x720, which with the caption and the paddings needs 1067px of a
900px viewport. Holding the ratio meant the rectangle ran 70-82% of the grid
width on every ordinary desktop and only reached full alignment on a screen as
tall as 2560x1440 — visibly narrower than the navigation above it. Dropping the
ratio is what buys the alignment back, and the film is cropped rather than
letterboxed, exactly as it already was on mobile.

**The hero is 100svh again because of this.** The section is `min-h-svh` — a
floor, not a fixed height — and between the widening to `max-w-page` and this
cap it overflowed that floor by 100-400px on every desktop size, so the section
below no longer began at the fold. With the cap the block clears the fold by
about 36px at every size checked.

A `pb-40 lg:pb-60` on the hero was tried first, as a way to ride the showreel
higher. There was no slack to centre in, so it moved nothing and added 240px to
the hero's height at `lg`. Reverted. It moved there on 7 September 2026; before that it was its own
orange-backed section below the fold.

The hero carries `pt-20 lg:pt-section-tablet`, putting back exactly the space
its negative margin removes, so the rectangle centres in the area **below** the
fixed header rather than in the full viewport box. `min-h-svh` is a minimum,
not a fixed height: on a short viewport the video plus its caption is taller
than the space available, and the section grows rather than overflowing into
the one below.

The mouse-parallax statement lines pass behind the rectangle's edges. That is
intended, not a collision to fix.

`id="showreel"` moved onto the inner wrapper so any existing `#showreel` link
still resolves, though it now lands at the top of the page.

**This placement has a real cost.** See "Loading and visibility are separate"
below: the section is on screen at first paint, so the first film is now
fetched on every homepage load rather than only for visitors who scroll.

## Client permission — OUTSTANDING, blocks launch

Permission to republish the four client names and their media is **not
documented anywhere**. `WEBSITE-BRIEF.md` requires it before publishing a client
name, and this section publishes four.

The films were served from the live designally.co, which is evidence of past
use, not of current permission to reuse. This does not block development. It
blocks launch.

## Media

Sources stay in the sibling `designally-clone` repository and are never copied
here. Only the encoded output is committed.

| Asset | Bytes | Notes |
|---|---|---|
| `public/showreel/laga.mp4` | 1,063,184 | 850 kbps |
| `public/showreel/nourigo.mp4` | 294,806 | 235 kbps |
| `public/showreel/inn-news.mp4` | 86,313 | 69 kbps |
| `public/showreel/bitazza.mp4` | 1,462,724 | 1,170 kbps |
| four `*-poster.webp` | 82,540 | 9–38 kB each |
| **Total** | **2,989,567 B** | **2.99 MB decimal / 2.85 MiB binary** |

All four: 1280×720, H.264 High@4.0, `yuv420p`, 10.00s, 25fps, no audio track.
Encoded from 1920×1080 sources with:

```bash
ffmpeg -i <source>.mp4 -an -vf "scale=1280:720:flags=lanczos" \
  -c:v libx264 -profile:v high -level 4.0 -pix_fmt yuv420p \
  -crf 28 -maxrate 2M -bufsize 4M -preset slow -g 50 -movflags +faststart \
  public/showreel/<slug>.mp4
```

`+faststart` is not optional: without it the index sits at the end of the file
and the first frame cannot display until most of it has arrived, which would
defeat the video-ready gate. `yuv420p` and High@4.0 are for mobile Safari.

Measured quality against the source downscaled to the same 720p: SSIM 0.982 to
0.999, PSNR 40.2 to 52.4 dB. The densest frame — Bitazza's grid of small social
posts — was compared at 1:1 pixels; the smallest body copy softens, but it is
already at the limit in the source downscale, so that is a downscale
characteristic and not encoder loss.

720p was chosen by measuring the displayed width. The rectangle is sized by

```
width: min(100%, (100svh - var(--showreel-reserve)) * 16 / 9)
```

so the grid width is an upper bound and the height cap usually binds before it.
Computed against the tokens, the displayed width lands between 880 and 1440 CSS
px across ordinary desktop sizes — at or under the 1280px source almost
everywhere, and about 1.12x at 1920x1080.

It only exceeds the source meaningfully on a very large, very tall screen:
2560x1440 reaches the `max-w-page` cap at 1920 CSS px, a 1.5x upscale. If that
becomes a target, re-encode all four at 1920x1080 from the sources still held
in the sibling `designally-clone` repository — roughly tripling the 2.99 MB
budget, on top of the homepage load cost noted under **Placement**.

This is much better than it was between the widening and the height cap on
7 September 2026, when the rectangle took the full grid width and reached
1760 CSS px.

Posters are one real extracted frame each — never a substituted image.

```bash
ffmpeg -ss <posterTime> -i <source>.mp4 -frames:v 1 \
  -vf "scale=1280:720:flags=lanczos" -q:v 2 /tmp/p.jpg
cwebp -q 72 /tmp/p.jpg -o public/showreel/<slug>-poster.webp
```

Note the installed ffmpeg has **no WebP encoder** — only `mjpeg` and `png` for
stills — so `cwebp` from the `webp` formula does the conversion.

## Per-project playback values

All in `app/_lib/showreel.ts`. The component never branches on which project is
showing; every media-specific value is data.

| | startAt | crossfadeAt | posterTime |
|---|---|---|---|
| Laga | 1.5 | 8.8 | 5.0 |
| Nourigo | 0 | 8.8 | 6.0 |
| INN News | 0 | 8.9 | 3.2 |
| Bitazza | 0.6 | 9.2 | 5.0 |

`startAt` is not cosmetic. `blackdetect` measured a true black segment in
Bitazza from 0.00 to 0.52s, and LAGA opens on a soft near-white blur — mean
luminance 222/255 — which reveals badly behind pixels.

`crossfadeAt` is where each clip's content actually ends, taken from its tail
frames: LAGA and Nourigo settle onto a blank end card, INN News onto a static
brand block from 8.5s, and Bitazza's logo peaks at 9.0 before fading toward
black. Every value leaves room for a 500ms crossfade to finish before the media
does.

`posterTime` is build-time only. Nothing reads it at runtime; it records which
frame each poster came from so one can be regenerated identically.

## Custom loop

The native `loop` attribute is deliberately **not** used. It would replay the
whole file, including the openings `startAt` exists to skip and the blank end
cards `crossfadeAt` stops before.

Instead, `timeupdate` compares the real `currentTime` against `crossfadeAt`,
pauses, seeks to `startAt`, and resumes in `seeked`. A `seekingRef` guards
re-entry, and `ended` is a safety net — `timeupdate` fires about four times a
second and every `crossfadeAt` leaves at least 0.8s of margin, but if it ever
overshot, `ended` is the only signal left.

`startAt: 0` needs care: assigning `0` to a `currentTime` already at `0` is not
guaranteed to fire `seeked`, so those two projects set `ready` directly rather
than stranding the poster forever.

## Loading and visibility are separate

Two IntersectionObservers, deliberately not one.

| | Margin | Threshold | Permits |
|---|---|---|---|
| `nearViewport` | 200px | — | the fetch |
| `visible` | none | 0.25 | playback, and the entrance |

One observer serving both would either start the entrance while the section was
still off screen — so it would be over before anyone saw it — or delay loading
until the section was already in view.

The split still holds, but the hero placement changed what it buys. Both
observers now fire at first paint, because the section is on screen from the
start.

**Consequence: the first film is fetched on every homepage load.** While the
showreel sat below the fold, `preload` stayed `"none"` with no `src` until the
visitor scrolled, and someone who never did downloaded zero video. That is no
longer true — LAGA (1,063,184 B) is now part of the homepage's initial media
cost for every visitor. The other three are still only fetched on demand, and
reduced motion still fetches nothing at all.

This has not been measured against the page's load metrics, and no decision
has been taken about whether to accept it. Options if it proves too expensive:
re-encode LAGA harder, hold the `src` until the hero entrance settles so the
fetch does not compete with it, or restore a scroll-gated placement.

## The entrance

```
0 - 1300ms   cells fade in, centre outward, each as a CIRCLE and nothing more
  then       each cell holds as a dot for 200ms
  then       each cell morphs from circle to square over 550ms, eased
```

Total 2050ms. There is no container morph — this is all of it.

**Per cell, not per grid.** A cell's morph is timed from its own arrival rather
than from the grid finishing, so the wave of dots and the wave of squares chase
each other across the rectangle. Both tweens share one stagger function for
exactly that reason.

**The three phases exist because two of them used to be one.** Until 7
September 2026 a cell faded in and squared up together, over 160ms. A cell was
therefore never a visible circle at any point, and the effect read as squares
simply appearing — the shape was in the code and not on the screen. Separating
them is what makes it legible:

| | Constant | Why |
|---|---|---|
| appear, still round | `PIXEL_FADE_MS` 200 | a pixel switching on, not a dissolve |
| hold as a dot | `PIXEL_DOT_HOLD_MS` 200 | the circle has to exist before it changes |
| circle to square | `PIXEL_MORPH_MS` 550 | eased, and the part worth watching |

The hold is the one that fixes the complaint. Without it the morph starts the
instant the cell is visible and the eye reads one continuous event.

It begins only when all of these are true: the hero has raised its cue, the
section is actually visible, the initial `startAt` seek has completed, the
element has reported real playback, and motion is not reduced.

**It runs for every project, not just the first.** Until 7 September 2026 it
was restricted to LAGA and a switch cancelled it; the entrance is now how every
film arrives. Pressing a control arms the mask in the same commit as the
switch, so the rectangle empties at once and the new film materialises when it
reports ready and playing. `revealDone` is per project rather than per page
load, and the mask is keyed on the project index so it remounts with every cell
back at opacity 0 — without that a switch made mid-entrance would show the new
film in full before the pixels took it back.

The caption does not replay. It is latched on `captionShown`, which never
clears: the statement is fixed text that says nothing about the current
project, so it rises once and stays.

`playing` rather than "play() resolved": the promise resolving only means the
request was accepted, and a reveal onto a frozen first frame is not the effect.

### When the entrance is armed

**The rectangle paints nothing until the entrance is armed.** `aspect-video` on
the position wrapper reserves the space, and the hero's gradient shows straight
through it; the mask and the video's own frame both appear in the same commit
that starts the reveal.

This exists because of the hero placement. The entrance used to be armed as
soon as the media was — 200px before the section reached the screen — which was
free while the showreel sat below the fold: nobody could see it waiting. In the
hero the section is visible at first paint while the entrance cannot start
until the hero's own has settled at 3850ms, so arming that early left a
rectangle sitting in the middle of the page for nearly four seconds.

Two things it must not do, both load-bearing:

- **Show the work and then hide it.** Painting the video or its poster during
  the wait would mean revealing the film, then masking it back out to reveal it
  again. So the whole rectangle stays transparent.

  The mask cannot do this on its own: it is client-only, and the observer that
  permits it resolves a tick after hydration, so there is a window where the
  video would be on screen with nothing over it.
- **Arrive a frame late.** `coverArmed` is latched during render, not in an
  effect — the render that first satisfies every condition is already
  happening, so React re-runs the component immediately and nothing paints in
  between. An effect would commit one paint later and the video would flash
  unmasked. It is also what `react-hooks/set-state-in-effect` forbids.

`coverArmed` never clears once set, so scrolling away mid-entrance cannot pull
the mask out from under a running timeline. Only `revealDone` removes it.

**The rectangle is hidden only while an entrance is genuinely pending.** It
paints whenever `!mayLoad || coverArmed || revealDone`, and the first and last
terms are not optional:

- `!mayLoad` covers reduced motion and the server render — which is also what a
  visitor with JavaScript off is left with, since nothing then flips it. Both
  must show the poster in the finished rectangle.
- `revealDone` covers every route that finishes without ever arming the mask.

A wrong condition here passes a type-check and looks correct in a browser with
JavaScript on. It is visible in the generated HTML, where the server-rendered
shape wrapper must carry `opacity-100`.

### Why it was inverted

The showreel moved into the hero on 7 September 2026, and an opaque cover
cannot survive that move. A cover has to be painted **some** colour, and the
background it must not betray is a gradient — so there is no colour to pick.
Two attempts made that concrete: a near-miss orange read as a bug, and a dark
rectangle read as a hole punched in the page.

A mask has no fill. There is nothing to match, because nothing is painted.

**The claim that Safari support was verified was wrong, and it cost an iPhone
release.** This spec previously recorded that `mask-image: url(#…)` over a live
`<video>` had been confirmed working in Chrome and Safari using a temporary
probe route. That route was deleted, so the claim could never be re-checked —
and it does not hold on iOS. MDN's browser-compat-data and caniuse both record
that Safari does not support `mask-image` referencing an SVG mask by `url(#id)`.

What was OBSERVED on an iPhone 17 / iOS 26: nothing drew for the whole 2050ms
and the film appeared in one step at the end. The reveal was never drawn.

**The mechanism is unconfirmed.** That behaviour fits the mask being applied but
never re-read as its rects are mutated, and fits equally well the reference
failing to resolve and being treated as an empty mask, which hides everything
while applied. No WebKit bug report was found for either, and no device
debugging was done. The canvas fix does not depend on which it is.

The reveal is therefore painted into a `<canvas>`, which depends on no CSS mask
support at all. See **The pixel reveal**.

### The pixel reveal

A grid of cells painted into a `<canvas>` laid over the film, matching the
rectangle's proportion so each cell is exactly square — 16 × 9 = 144 on a
desktop, 8 × 8 = 64 or 7 × 9 = 63 on a phone. The canvas is
`aria-hidden` and `pointer-events-none`, and is mounted only while the entrance
runs — unmounting it is what returns the rectangle to the real video. Never
rendered on the server, so without JavaScript nothing covers the poster.

Two passes per frame:

1. the cells are filled as paths, each at its own alpha, which builds the shape;
2. `globalCompositeOperation = "source-in"` draws the video frame, which
   survives only where a cell is and at that cell's alpha.

Where no cell has arrived the canvas is genuinely transparent, so the hero's
gradient shows straight through it.

**The real `<video>` is held at `opacity: 0` underneath, not unmounted.** The
canvas reads its frames with `drawImage`, so the element has to stay laid out,
playing and decoding. `hidden` would stop it rendering on iOS and there would be
nothing to draw.

**One requestAnimationFrame loop computes and paints the cells.** Geometry is
calculated from the current canvas dimensions on each frame. The starting
circle diameter uses the shorter side of a grid slot; width and height grow
independently into the slot while the radius shrinks to zero. The cubic morph
matches the previous `power2.inOut` easing.

The animation clock starts only with a sized canvas and a decoded, non-seeking
video frame. Missing layout or media does not spend the reveal duration. A
long frame contributes at most 64ms, avoiding a jump straight to the end after
a scheduling pause. The real video replaces the canvas only after the final
paint succeeds, or an explicit fallback. The backing resolution remains capped
at device pixel ratio 2.


Cells are filled `#fff`. That is a luminance value, not a design colour — white
means "show this part of the element" — so it has no token and wants none.

**Order.** Each cell's place is `distance × (1 − PIXEL_SCATTER) + noise ×
PIXEL_SCATTER`, computed once at module scope. `Math.random()` is deliberately
absent — the order must be identical on the server and the client and between
reloads, so the noise is a 32-bit integer hash of the cell index. `Math.imul` is
required: plain `*` on those constants exceeds the 53-bit safe range and
silently drops the low bits that carry the randomness.

At `PIXEL_SCATTER = 0.5` the rings are gone but the centre still empties first
and the corners last — the circle is implied rather than drawn.

**Cell shape.** Each cell starts as a circle and squares up as it arrives, so a
pixel resolves rather than simply appearing.

**The circle is sized in pixels, not in cell fractions.** objectBoundingBox
units are fractions of a box that is not square, so equal fractions are not
equal lengths — and `pixelGrid` rounds its columns and rows to integers, which
leaves cells up to about 11% off square. Taking `rx` and `ry` as half of each
cell's own side fed that error straight into the shape, and at 75-100px cells
it read as a visible ellipse: 40 x 43 at 1512x982, 28 x 30 at 1024x768.

The diameter is now taken from the shorter side of the cell and both axes are
given that same length, converted back through the box's own dimensions. The
rect is square on screen whatever shape its cell is. `finished` still fills the
cell exactly, so the morph ends on a grid that tiles — only the start is a
circle. Cells begin at `PIXEL_CELL_SCALE` of their slot and grow to fill it
exactly.

That figure is inherited from the cover, where it was a coverage requirement: a
circle only *hides* a square if its diameter is that square's diagonal, so
anything under √2 left the corners of every slot showing. **Revealing rather
than covering, that constraint is gone** — the finished state is a square at
scale 1 tiling its slot exactly, and coverage at the start no longer matters.

So `PIXEL_CELL_SCALE` is set for legibility rather than coverage, and it is
**0.6**. At the inherited 1.42 the round cells overlapped heavily and the image
filled in before the circles could be read as circles.

**0.9 was still far too large, and only a device showed it.** This spec
previously argued for "just over 1", on the grounds that neighbours should meet
as they resolve. On an iPhone that left a 25px dot in a 28px cell — a 3px gap —
so the dots touched almost at once and the whole reveal read as a soft fade
rather than as pixels. That was confirmed *not* to be a drawing fault first: the
canvas reported `painted complete` over 125 frames and 2060ms before anything
was retuned.

At 0.6 the dot is a little over half its slot, so a clear band of the hero's
gradient shows between neighbours and each is visibly a circle before it grows.
The gaps close during the morph, which is where that belongs.

Only the start state is affected — every cell finishes at its own slot exactly,
so the finished mask tiles perfectly whatever this is set to. That is what
makes it safe to tune by eye.

**Cells are grown, not transformed.** The four geometry attributes — `x`, `y`,
`width`, `height` — animate together with `rx` and `ry`, rather than a
`scale()` about a transform origin. A transform on an SVG element inside an
objectBoundingBox mask has to reason about a non-uniform user space and an
origin; animating geometry has neither problem, and it is the same number of
values GSAP would write either way. The start geometry is derived from each
rect's own rendered attributes, so where a cell sits is defined in exactly one
place: `showreel-pixels.tsx`.

### Layer structure

```
position wrapper   aspect-video, reserves the space. No background and no
                   clip — the hero's gradient shows through wherever the
                   reveal has not yet filled in.
  shape wrapper    rounded-lg + overflow-hidden ARE the finished state. No
                   background: there is nothing behind the video to hide, and
                   a solid one would show as a block in the hero while the
                   entrance waited.
    media layer    the video and its poster. opacity-0 for the entrance.
      video        size-full object-cover, never scaled or distorted
      poster       shown until the first real frame exists
    reveal canvas  the cells, drawn over the film. Mounted only while the
                   entrance runs, and clipped by the shape wrapper's corners
```

The rounding survives the reveal without extra work: `rounded-lg` plus
`overflow-hidden` clip the video *before* the mask applies, so corners are
already round while the pixels are filling in and nothing snaps when the mask
is dropped.

## Automatic advance

**Driven by `crossfadeAt`, not by a clock.** `onTimeUpdate` compares the
element's real `currentTime` against the per-clip point where its content
actually ends, so the switch lands at the right frame for each film and
corrects itself when a load runs slow.

| Project | Content | Advances at | Dwell after the entrance |
|---|---|---|---|
| Laga | 7.3s | 7.3s | 5.3s |
| Nourigo | 8.8s | 8.8s | 6.8s |
| INN News | 8.9s | 8.9s | 6.9s |
| Bitazza | 8.6s | 8.6s | 6.5s |

A fixed interval could not do this, and the attempt is worth recording.
Playback begins before the entrance finishes, so a clip is already about 2s in
by the time it is fully revealed — and that time counts against its content. At
a 7s dwell every clip looped back to `startAt` before the switch, LAGA by
nearly two seconds against only 7.3s of content. Shortening the interval far
enough to clear the shortest clip would have cut the others short.

`crossfadeAt` was measured for exactly this. It is the same value the custom
loop compares against; reaching it now advances instead of looping, whenever
rotation is allowed.

**When rotation is not allowed, it loops instead.** `mayAdvance` is
`revealDone && visible && !reduced && !failed`, and each term is a reason the
clip must keep playing rather than run on into the blank end card:

| | Why |
|---|---|
| `revealDone` | the entrance is still running; do not switch under it |
| `visible` | the video is paused off screen — a visitor scrolling back would otherwise return to a project that had rotated on without them |
| `!reduced` | there is no video at all under reduced motion, and rotating the poster would be movement the visitor asked not to have |
| `!failed` | a film that could not load holds its poster rather than dragging the carousel on |

`onEnded` routes through the same decision. It should never fire — every
`crossfadeAt` sits well before the media ends — but if it did, the choice is
the same one.

### `ADVANCE_FALLBACK_MS` — the stall watchdog

15s, timed from the entrance settling, for the case where `crossfadeAt` never
arrives: a stalled download, a decode that stops reporting, a `timeupdate` that
dries up. Without it one project would stay on screen for good.

Deliberately far past any real advance — the longest normal dwell is 6.9s, so
the narrowest margin is about 8s. A real advance changes `index`, which rebuilds
the timer before it can fire. Gated on the same `mayAdvance`, so the two can
never disagree.

**Outstanding — no pause control.** WCAG 2.2.2 asks for a way to pause
auto-updating content that runs longer than five seconds. Reduced motion
disables the rotation entirely, which covers the visitors most affected, but
there is no control for anyone else. Worth adding before launch.

### The outgoing film is held, not dropped

A switch would otherwise empty the rectangle: the mask hides whatever it is
applied to, and applying it to the wrapper took the outgoing film with the
incoming one. So the mask moved **inside** the shape wrapper, onto a layer
holding only the video and its poster, and a canvas sits unmasked beneath it.

On a switch the frame currently on screen is drawn to that canvas
synchronously, inside the click — before `src` changes, because assigning a new
source blanks the element immediately and the frame is gone. The held frame
stays until `revealDone`, so the new film materialises **over** the old one
rather than over nothing.

**A canvas rather than a second `<video>`.** Two elements would mean two sets
of playback state and handlers, and an outgoing clip that restarted from zero
unless its `currentTime` were carried across — a lot of machinery for about two
seconds of picture. One frame held still, under a film materialising over it,
is indistinguishable at that length.

It is a **held frame, not a crossfade**. The outgoing film stops rather than
playing on. A true crossfade is still unbuilt, and `crossfadeAt` still unread.

Nothing is held on the first entrance, or before any frame has decoded
(`readyState < 2`): there is no outgoing film, and the hero's gradient shows
through instead, which is correct.

```
shape wrapper      rounded-lg + overflow-hidden, opacity gate. No background.
  hold canvas      the outgoing frame. Never hidden by the reveal, and
                   hidden when idle
  media layer      the incoming film. opacity-0 while the entrance runs
    video
    poster
  reveal canvas    the cells, drawn from the video above
```

## Failure behaviour

The entrance completes after a successful final paint. A missing canvas
context, a drawing exception, a video error, or a drawing timeout reveals the
normal video/poster instead of leaving a permanent blank rectangle.

Two independent budgets cover different phases:

- Media readiness: `ENTRANCE_MS + 3000`, starting once visible and hero-cued.
  Cancelled when `canReveal` becomes true; reset for each project.
- Drawing: `ENTRANCE_MS + 3000`, starting when the drawing effect begins.

Cleanup cancels the drawing loop without painting a fully revealed frame.
Resuming visibility or changing the grid restarts the pending reveal. A project
change starts a new reveal over the captured outgoing frame. A repeated press
on the current project leaves playback and the entrance alone.

The temporary `/?debug=showreel` readout retains the drawing status, frame count
and elapsed reveal time after the canvas unmounts. It distinguishes normal
completion, media readiness timeout, drawing timeout and drawing failure.
Device verification is still required; the screenshots alone do not establish
which path caused the original missing effect.

Without JavaScript: no grid is rendered, no `src` is set, and the poster shows
inside the final rectangle.

## Reduced motion

No mask rendered at all, no autoplay, and **no video fetched** —
`mayLoad` is false, which also means the rectangle paints immediately rather
than waiting for an entrance that will never arm.
there is no control that could start playback, so downloading the file would be
pure waste. The approved poster shows in the final rectangle. Switching project
swaps the poster instantly.

## Coordination with the hero

The showreel's entrance waits on the hero's. The two are now in the same
section but still in different component subtrees, mounting independently —
`HeroIntro` and `Showreel` are siblings that know nothing about each other.
`app/_lib/intro.ts` carries a **remembered** signal, not a one-time event:

```ts
markShowreelCue()          // idempotent, raised by the timeline and by finish()
subscribeShowreelCue(fn)   // fires immediately if it was already raised
```

**It is a cue, not an ending.** The name changed from `markIntroSettled` on
7 September 2026, because the two stopped being the same moment.

Immediate notification is the whole point. On an internal navigation the hero
entrance settles synchronously, before the showreel's effects run at all — a
plain event would be missed and the showreel would wait forever.

**The entrance begins when the navbar starts arriving, not when it finishes.**
The timeline raises the cue at `INTRO.showreelCue` — 1850ms, the same moment as
`navbarStart` — and carries on. Nothing in `page.tsx` sequences this; it falls
out of the cue.

It used to wait for `finish()`, which runs on the timeline's completion at
`INTRO.total` (3850ms = `navbarStart` 1850 + `navbarDuration` 2000). But the
navbar's transition is two full seconds of that and the showreel depends on
none of it, so waiting put the video's entrance at roughly 5.9s from load. Now
the navbar's 2000ms and the showreel's 2050ms run together and the page
resolves as one, both finishing within 50ms of each other at about 3.9s.

The navbar is untouched by the change: the cue is a `.call` that fires and
returns, sitting immediately before the navbar's own `.call` at the same
position. Raise `showreelCue` toward `total` if the pair reads as busy.

`finish()` in `hero-intro.tsx` still raises the cue as a backstop, covering
every path where the timeline never reaches 1850ms — completion, reduced
motion, a skipped intro, a failed import and the watchdog are all one call.
Idempotent, so whichever comes first wins.

## Controls

Four project buttons, real HTML text, in a `role="group"` labelled "Choose a
project".

**One line that scrolls, below `md`.** Four pills come to roughly 370px and a
phone offers about 340px between the gutters, so they wrapped to two rows —
which cost the rectangle vertical space and read as a paragraph of buttons.
They now sit on one line with the strip scrolling, and the active pill is kept
centred so its neighbours stay visible and reachable. `flex-wrap` returns from
`md` up, where they fit and there is nothing to scroll.

**Three copies of the set, and only the middle one is real.** Centring the
active pill in a single copy leaves the first and last with nothing beside them
— a wide blank on one side. Padding the ends closes it only by replacing the
blank with a different blank. A copy either side means there is always a pill
where the eye expects one.

It is a **loop in appearance, not in behaviour**: nothing wraps around, the
middle copy is simply kept centred and the outer two are what show past its
ends. With four projects that is enough to fill any phone. Against a 342px
strip: one copy is 370px, `scrollWidth` 1126, usable range 0-784, and the four
middle-copy targets fall at 242, 329, 429 and 531 — all comfortably inside, so
nothing ever clamps.

**The copies cost nothing in the accessibility tree.** They are `aria-hidden`
and out of the tab order, so it still contains exactly four controls, each
announcing its project once, and `aria-current` is true of one element rather
than three. Verified in the generated HTML: 12 pills, 8 of them hidden, one
`aria-current`. They stay clickable by pointer, which is the only way they can
be reached anyway.

`md:hidden` on the copies — from `md` up the strip wraps instead of scrolling,
and unhidden copies would lay out as eight extra pills.

**A click centres the exact copy pressed.** The row animates toward that name
for 400ms, then rebases to the identical middle copy without visible travel.
An automatic advance chooses the next occurrence to the right, including the
last-to-first project boundary. The middle copy is no longer an unconditional
animation target.

The initial ResizeObserver notification does not cancel an active animation;
only an actual width change recentres the row. Reduced motion centres instantly.
Clicking the already active project does not reset playback or move the strip.

**The strip is the only thing that leaves the page grid.** `-mx-gutter-mobile`
pulls it back out so it spans the full screen and the pills are clipped by the
screen edges rather than stopping short inside the margin. The rectangle above
keeps its gutter. Cancelled at `md`, where the strip wraps and there is nothing
to clip.

`getComputedStyle(...).overflowX` decides whether the centring applies at all,
rather than a second copy of the breakpoint: the strip is a scroller exactly
when its own classes have made it one.

Centring writes `scrollLeft` on the strip, never `scrollIntoView` on the pill: the
latter walks up the ancestor chain and can scroll the page itself, which on a
phone would mean the hero jumping every time the showreel rotated on its own.
Offsets are measured from rendered rectangles rather than `offsetLeft`, which
is relative to the nearest positioned ancestor and not this strip. It honours
reduced motion by jumping rather than smooth-scrolling — an automatic advance
every few seconds should not animate at someone who asked for less.

The scrollbar is hidden on both engines. It would sit under a row of pills on
the brand gradient, and it is not the affordance here — the pills are. The active one carries `aria-current="true"` and is filled rather than
outlined, so it does not rely on hue alone.

There is no play/pause control: playback is unattended, pauses when the section
leaves the viewport and resumes when it returns. The video is therefore
`aria-hidden` — it carries no controls, and nothing in it is available only
there. Name, stage and services are text beside it, read from
`app/_lib/projects.ts` so no fact is duplicated.

Project names are **not** links: `/works/<slug>/` pages do not exist, and the
routing rule forbids linking to a route that is not built.

### The caption rises after the film

The statement and the controls fade in and lift into place once the entrance
has finished — `translate-y-6 opacity-0` to `translate-y-0 opacity-100` over
700ms on `--ease-out`, the controls 200ms behind the statement.

It is driven by `captionVisible`, which is the rectangle's own visibility rule
one term shorter:

```
rectangleVisible = !mayLoad || coverArmed || revealDone
captionVisible   = !mayLoad              || revealDone
```

`coverArmed` is deliberately absent, so the text stays down for the whole
entrance and arrives after it rather than competing with it. **This means the
caption is now hidden during the hero's intro as well**, where before it sat
there in full while the rectangle was still transparent.

`!mayLoad` keeps it honest everywhere the animation will never run — reduced
motion, and the server render, which is also what a visitor with JavaScript off
is left with. The server-rendered markup carries `translate-y-0 opacity-100`,
so the text is simply there.

CSS transitions rather than a GSAP timeline: two elements reacting to one flag,
no sequencing to coordinate, and no JavaScript at all. `opacity` and
`translate` are named explicitly rather than using `transition-all`, which
would also catch the controls' own colour transitions and fight them. This is
the same pattern the mobile navigation already uses for its items.

### The statement beside the controls

`Your Creative Design Ally.` in `type-display-sm`. It replaced the project
name, stage and services on 7 September 2026.

It is a **paragraph, not a heading**. The page's only `<h1>` is in the intro
section, which now sits *below* the showreel in document order, so a heading
here would either give the page two `<h1>`s or put an `<h2>` before its `<h1>`.
If this is meant to be the page heading, the one below has to be demoted in the
same change.

Removing the caption does not lose the facts. The four controls name every
project and mark the current one with `aria-current`, and the selected-work
section further down carries each project's stage and services as text — which
is what keeps the `aria-hidden` on the video honest.

Type and controls use `text-text-on-accent` and `bg-surface-base`. Those were
chosen when the section's background was solid brand orange. The caption now
sits below the video, near the orange end of the hero's gradient, so the
pairing should be close to what it was — but that is reasoning from the
gradient's endpoints, **not an observed check**, and it is on the list to
confirm by eye.

`bg-action-primary` for the active control would still be a poor choice there:
at that point in the gradient it is close to the background behind it.

## Not built

- Crossfade between projects. `crossfadeAt` is recorded and unread; the build
  holds the final frame instead.
- Automatic carousel advancement.
- `tryStartCrossfade()`, specified and agreed but not written. When it is: one
  guarded function called from the active video's `timeupdate` **and** its
  `ended` **and** the incoming video's `canplay`, because after `ended` no
  further `timeupdate` fires and a transition waiting only on it would never
  start. It may begin only when the active video is due, the incoming video has
  data, `play()` on the incoming muted element **resolves**, and no transition
  is already running. Nothing fades until that promise resolves; if it rejects,
  the active frame stays.

## Verification performed

`npm run lint`, `npx tsc --noEmit`, and `npm run build` twice.

The second build was invoked as `npm run build --webpack`. Without the `--`
separator npm keeps the flag for itself, so it never reached Next.js and
Turbopack ran both times — the webpack build was not performed at the time this
was written.

**Closed on 8 September 2026.** `npm run build -- --webpack` ran against the
whole site, this feature included, and succeeded. Nothing in the showreel turned
out to be bundler-specific.

Compiled CSS checked for every utility introduced — a Tailwind class matching no
theme entry produces no CSS and no error. That check caught `type-body-sm`,
which does not exist.

Timings measured inside a real browser over the DevTools Protocol, frame
accurate: morph ends at 2800ms, exactly `ENTRANCE_MS`. Geometry confirmed as a
true circle at both breakpoints — `inset(0px 189px round 243px)` on desktop,
`inset(0px 74.8125px round 96.1875px)` on mobile. Final state leaves no inline
`clip-path`, no grid in the DOM, and no `will-change` anywhere.

Switching project mid-entrance was exercised: cover removed, clip cleared,
correct project active, no replay.
