# Homepage Showreel

Status: Stages A–C implemented. Crossfade and auto-advance not built.
Route: `/` only, section `#showreel`
Updated: 4 September 2026

## What this is

A selected-work video carousel below the hero, with a one-time branded
entrance: a grid of orange pixels clears from the centre outward inside a true
circle, the circle holds, then it opens into the final 16:9 rounded rectangle.

The entrance runs **once per page load**. Changing project afterwards does not
replay it.

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

720p was chosen after measuring the displayed width. `--container-page` is
120rem, so a container-wide showreel would render up to 1760 CSS px. The
section is capped at `max-w-5xl` instead, giving at most 1024 CSS px.

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
| `nearViewport` | 200px | — | the fetch, and arming the pixel cover |
| `visible` | none | 0.25 | playback, and the entrance |

One observer serving both would either start the entrance while the section was
still off screen — so it would be over before anyone saw it — or delay loading
until the section was already in view.

Nothing is fetched on page load. `preload` stays `"none"` with no `src` until
`nearViewport` fires, so a visitor who never scrolls downloads zero video.

## The entrance

```
   0 - 1100ms   pixel cells clear, centre outward, inside a circular clip
1100 - 2000ms   the full circle holds
2000 - 2800ms   the circle opens into the final rounded rectangle
```

It begins only when all of these are true: the hero entrance has settled or was
skipped, the section is actually visible, the initial `startAt` seek has
completed, the element has reported real playback, motion is not reduced, and
the project is still LAGA.

`playing` rather than "play() resolved": the promise resolving only means the
request was accepted, and a reveal onto a frozen first frame is not the effect.

### The pixel grid

16 × 9 = 144 cells, matching the rectangle's proportion so each cell is exactly
square. `aria-hidden`, `pointer-events-none`, and never rendered on the server —
so without JavaScript there is nothing to remove and the poster simply shows.

Cells use `bg-primary-300`, the same class as the enclosing section rather than
the semantic `bg-action-primary`. Two names for one value today could drift into
two values tomorrow, and the seam would show.

**Order.** Each cell's place is `distance × (1 − PIXEL_SCATTER) + noise ×
PIXEL_SCATTER`, computed once at module scope. `Math.random()` is deliberately
absent — the order must be identical on the server and the client and between
reloads, so the noise is a 32-bit integer hash of the cell index. `Math.imul` is
required: plain `*` on those constants exceeds the 53-bit safe range and
silently drops the low bits that carry the randomness.

At `PIXEL_SCATTER = 0.5` the rings are gone but the centre still empties first
and the corners last — the circle is implied rather than drawn.

**Cell shape.** Each cell starts as a circle and squares up as it fades,
echoing the container's morph at pixel scale. A circle only covers a square if
its diameter is that square's diagonal, so cells start at `scale(1.42)` — just
over √2 — and shrink to exactly 1. Without the oversize, the corners of every
slot would be uncovered and the video would show through a grid of gaps before
the reveal began. Coverage was checked across the interpolation and holds at
every point.

The cost is that two half-faded neighbours briefly overlap, and their
intersection reads slightly more opaque. Lowering `PIXEL_CELL_SCALE` reduces it
and trades in small corner gaps; there is no setting that avoids both.

### Circle to rectangle

Measured from the real element when the entrance begins, never assumed:

```
diameter   = min(wrapper width, wrapper height)
sideInset  = (width  - diameter) / 2
topInset   = (height - diameter) / 2
startRadius= diameter / 2
endRadius  = getComputedStyle(shape).borderTopLeftRadius
```

`min()` rather than the height, so an unexpected ratio degrades to the largest
circle that fits rather than an ellipse. `endRadius` is read at runtime so it
tracks `--radius-lg` instead of a hardcoded 24px.

**Both clip-paths must use the two-value inset form.** Chrome's *computed*
`clip-path` collapses a four-value inset to `inset(<vertical> <horizontal>
round <r>)`. GSAP reads the start from the computed style and pairs numbers
positionally, so writing four values produced five numbers against three and put
a moving inset on the bottom edge — the video was cropped from below for the
whole morph, ending back at zero so the final frame looked correct. Three
against three interpolates cleanly.

```
circle    = inset(<topInset>px <sideInset>px round <diameter/2>px)
rectangle = inset(0px 0px round <endRadius>px)
```

The circle is applied with `gsap.set` **before the first cell moves**, while all
144 squares still cover the frame. Both writes are synchronous, so no frame can
paint the full rectangle in between. That ordering is the flash prevention.

On completion the inline clip is removed and the shape is handed back to the
stylesheet, which already describes exactly that rectangle via `rounded-lg` and
`overflow-hidden` — so removing it is invisible rather than a jump.

### Layer structure

```
position wrapper   aspect-video, reserves the space. No background, no clip —
                   outside the circle must be the section's own orange.
  shape wrapper    owns clip-path; rounded-lg + overflow-hidden ARE the
                   finished state. Holds the media.
    video          size-full object-cover, never scaled or distorted
    poster         shown until the first real frame exists
  pixel grid       OUTSIDE the shape wrapper, so it spans the whole rectangle
                   while the media beneath is only a circle
```

## Failure behaviour

The orange cover can never be left in place. Five routes remove it, and each
also restores the finished rectangle:

- the timeline completing
- GSAP failing to load — caught, uncovered immediately
- the reveal watchdog, at `ENTRANCE_MS + 1500`
- the cover watchdog, at `ENTRANCE_MS + 3000`, timed from becoming **visible**
  rather than from arming, so waiting off screen costs nothing. This is the one
  that covers an entrance that never begins at all — autoplay refused,
  `playing` never reported, a stall
- a project switch, which cancels rather than replaying

A failed video sets both `failed` and `revealDone`, so the cover cannot sit over
the poster for good.

Without JavaScript: no grid is rendered, no `src` is set, and the poster shows
inside the final rectangle.

## Reduced motion

No pixel grid rendered at all, no morph, no autoplay, and **no video fetched** —
there is no control that could start playback, so downloading the file would be
pure waste. The approved poster shows in the final rectangle. Switching project
swaps the poster instantly.

## Coordination with the hero

The showreel's entrance waits on the hero's, but the two live in different
subtrees and mount independently. `app/_lib/intro.ts` carries a **remembered**
signal, not a one-time event:

```ts
isIntroSettled()            // the current fact
markIntroSettled()          // idempotent, raised by finish()
subscribeIntroSettled(fn)   // fires immediately if it already settled
```

Immediate notification is the whole point. On an internal navigation the hero
entrance settles synchronously, before the showreel's effects run at all — a
plain event would be missed and the showreel would wait forever.

`finish()` in `hero-intro.tsx` is the single path every real ending goes
through, so completion, reduced motion, a skipped intro, a failed import and the
watchdog are all covered by one call.

## Controls

Four project buttons, real HTML text, in a `role="group"` labelled "Choose a
project". The active one carries `aria-current="true"` and is filled rather than
outlined, so it does not rely on hue alone.

There is no play/pause control: playback is unattended, pauses when the section
leaves the viewport and resumes when it returns. The video is therefore
`aria-hidden` — it carries no controls, and nothing in it is available only
there. Name, stage and services are text beside it, read from
`app/_lib/projects.ts` so no fact is duplicated.

Project names are **not** links: `/works/<slug>/` pages do not exist, and the
routing rule forbids linking to a route that is not built.

The section sits on brand orange, so type and controls use `text-text-on-accent`
and `bg-surface-base`. `bg-action-primary` would be invisible here — it is this
section's own background.

## Not built

- Crossfade between projects. `crossfadeAt` is recorded and unread; Stage A
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

`npm run lint`, `npx tsc --noEmit`, `npm run build`, `npm run build --webpack`.

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
