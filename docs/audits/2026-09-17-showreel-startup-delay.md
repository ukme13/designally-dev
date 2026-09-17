# Showreel startup delay on iPhone — measured findings

**Status: RESOLVED.** The cause was `usePixelWipe`'s cleanup forcing a layout
per cell — see *Root cause*, below. Fixed, confirmed on the iPhone, and all
instrumentation removed. Kept as the record of how it was found.

*Originally:* cause narrowed to a ~5.3s main-thread block after hydration.

**Reported:** on refresh the homepage shows the hero gradient with an empty
rectangle for 4–6 seconds; then the video appears, then the caption. The pixel
entrance is never seen. iPhone, Safari, over LAN.

## What is measured, not assumed

A temporary probe is live in `app/_components/showreel.tsx` (search
`TEMPORARY DIAGNOSTIC`). It holds no React state — each gate's first `true` is
latched into a ref and a timer writes text directly — so it cannot perturb what
it measures. Four runs on the device, production build:

```
mount @278ms   now @9175ms
mayLoad 5628ms    visible 5628ms    cue 5628ms
ready 5748ms      playing 5750ms    failed —
armed 5750ms      done 7822ms
readyState 4  network 1  paused false
t 4.65  err -  laga.mp4
grid 8x9  cells 72
draw painted complete
frames 122  elapsed 2059ms
```

Earlier runs agree: flags at 5584 / 6087 / 5660 / 5628ms.

`mount @` is `performance.now()` at the component's first effect — the page's
own clock. Everything else is milliseconds after that.

## Ruled out, with the evidence

- **Slow media.** `readyState 4`, `network 1`, no error, and `playing` arrives
  ~120ms after the component starts loading. The first clip is 1MB over LAN.
- **The entrance being skipped.** `armed` is set and `done` follows ~2.07s
  later. `PIXEL_COVER_MAX_MS` never fires.
- **The entrance being broken or mistuned.** `draw painted complete`, 122–124
  frames, `elapsed` 2051–2059ms against `ENTRANCE_MS` ≈ 2050. The grid resolves
  to 8x9 = 72 cells, so the compact density applies and cells are ~43px with
  ~26px dots.
- **Slow hydration.** `mount @278ms`.
- **Dev-server overhead.** The failing runs are against `next start`, confirmed
  by absence of dev markers and hashed chunk names in the served HTML.

## What remains

Between **278ms** (component live) and **5628ms** (first callbacks delivered)
nothing arrives. Then three independent sources — two `IntersectionObserver`s
and the hero's cue via `subscribeShowreelCue` — all report within the same
millisecond.

Independent callbacks do not agree to 1ms unless they were queued behind a
blocked main thread and flushed together. **The task to find is whatever
occupies the main thread for ~5.3 seconds immediately after hydration.**

## Leads, unverified

The homepage mounts 19 client components. Eight hooks each dynamically import
GSAP and its plugins, then register them, build timelines and create
ScrollTriggers — each of which measures layout:

```
use-count-up.ts            gsap + CustomEase + ScrollTrigger
use-hover-cursor.ts        gsap + CustomEase
use-statement-parallax.ts  gsap
use-paper-plane-flight.ts  gsap + MotionPathPlugin + ScrollTrigger
use-hero-entrance.ts       gsap
use-pixel-wipe.ts          gsap + ScrollTrigger        (x2 on the page)
use-situation-cards.ts     gsap + CustomEase + ScrollTrigger
scroll-gradient-text.tsx   gsap + ScrollTrigger
```

Largest served chunks: 224KB, 162KB, 110KB, 69KB.

This is a hypothesis about *where* the time goes. It has not been measured, and
three previous hypotheses about this bug were wrong.

## Wrong theories already tested and disproved

Recorded so they are not repeated:

1. **The `PIXEL_COVER_MAX_MS` watchdog skips the entrance.** Disproved: `armed`
   is set, `done` follows normally, the watchdog never fires.
2. **An iOS media deadlock** — `preload="auto"` ignored, so nothing loads until
   `play()`, which is only called from the `seeked` handler. `autoPlay` was
   added to break it. Disproved: the media chain completes in ~120ms once it
   starts. **That `autoPlay` attribute should be reverted; it fixed nothing.**
3. **Dev-server cost.** Disproved: production build behaves identically.
4. **A first misreading of this probe** treated its relative clock as absolute
   and concluded hydration was late. `mount @278ms` disproves it. Any new
   reading must keep the two clocks distinct.

## Constraints

`AGENTS.md` governs. In particular: read the installed Next docs rather than
working from memory; tiered verification, with Tier 3 before committing; no dev
server or browser tooling; confirm rendered output rather than trusting a
type-check; and do not claim device verification without a device.

## Next measurements, before any fix

1. Attribute the block. A `PerformanceObserver` on `longtask`, or timestamps
   either side of each dynamic import and each `ScrollTrigger.create`, will name
   the owner instead of inferring it.
2. Establish whether the block is parse/execute (would shift with chunking) or
   layout (would shift with the number of ScrollTriggers measuring at once).
3. Only then choose between deferring, staggering or idle-scheduling that work.

## Cleanup owed

- The probe in `showreel.tsx`, in full.
- The `autoPlay` attribute on the `<video>` element.

## Follow-up attribution trace 1

The first instrumented iPhone production trace rules out the eight GSAP hooks
as the owner of the long block:

- Initial JavaScript resources finished by **226ms**. The large initial chunks
  finished by 140ms.
- Initial GSAP imports and setup ran from 185ms to **319ms**.
- The longest import was `MotionPathPlugin`, **88ms** (225–313ms).
- The largest synchronous hook spans were the two initial pixel wipes, **20ms**
  and **21ms**.
- Every measured `ScrollTrigger` construction took **0–5ms**.
- No measured import or hook setup ran from **319ms to 5984ms**: an unowned
  **5665ms** gap.

At 5984ms, statement parallax began and the two pixel-wipe effects rebuilt.
Those are consequences of the delayed React update becoming runnable, not the
cause of the preceding gap. Their late work took 19ms in total.

Safari returned no `longtask` or `long-animation-frame` entries, so this trace
does not yet distinguish an uninstrumented JavaScript task from deferred
style/layout/paint work. A focused frame probe now starts after the latest
initial setup and reports:

1. setup end to the first `requestAnimationFrame` callback;
2. the duration of a document geometry read, which settles pending style and
   layout;
3. layout end to the following frame, which includes paint/compositing and the
   normal frame interval.

No fix or cleanup is justified until that second trace assigns the 5665ms gap
to one of those browser phases.

## Follow-up attribution trace 2 — inconclusive

The frame probe measured:

- Before the gap, frame waits were **0ms** and **12ms**.
- Forced document layout took **1ms** and **0ms**.
- After the delayed work, the frame wait was **8ms**, layout was **0ms**, and
  layout-end to the following frame was **10ms**.

The last initial setup finished at 234ms. Its requested frame never ran before
the delayed React work began at 5691ms, a **5457ms** interval. This first looked
like JavaScript before rendering, but that conclusion was too strong: setup at
234ms canceled the second-frame measurement begun after the 218ms layout probe.
That missing interval is exactly where a long paint/compositing phase would
appear. The probe is corrected so later setup can no longer erase an
already-started render measurement.

One part of the GSAP lead remains unmeasured: `ScrollTrigger.create()` schedules
a later global refresh. The installed GSAP source dispatches `refreshInit`
before that pass and `refresh` after it. The probe now records that exact
interval and the number of active triggers. This will either name the deferred
refresh as the owner or rule it out with a number; no scheduling has changed.

## Follow-up attribution trace 3

Deferred ScrollTrigger refresh is ruled out. It ran **after** the gap, from
6463ms to 6476ms, and took **13ms** for 10 triggers. In the same run:

- initial setup finished at 562ms;
- delayed work began at 6425ms, leaving a **5863ms** unowned interval;
- late layout was 0ms and the following frame interval was 9ms.

The corrected probe will preserve the render measurement that begins before
the gap. No fix is justified until that interval shows whether the owner is
render/paint or an earlier main-thread task.

## Follow-up attribution trace 4

The corrected trace records a **5810ms** render wait (372–6182ms). The first
frame's forced document layout was **0ms**, the following late frame was normal,
and no `requestAnimationFrame` or `setTimeout` callback exceeded 50ms. The
deferred ScrollTrigger refresh was **10ms**, so it is not the owner.

The initial DOM work immediately before that render contains two known large
paint candidates: the two pixel wipes start with **613 cells each (1226
transformed elements total)**, and the two scroll-gradient paragraphs promote
**526 character spans** with `will-change: opacity`. The code now also reports
font resource completion, because a late font response or decode would be a
different owner. These counts identify candidates but do not claim one is the
cause.

The owner still needs a Safari Web Inspector Timelines recording of the
372–6182ms interval, with the Rendering Frames / Layers details expanded. That
is the measurement that can name the exact painted layer or decode operation;
no behaviour-changing isolation has been performed.

The startup observer also now times `requestAnimationFrame` and `setTimeout`
callbacks during the first 15 seconds. Only callbacks lasting at least 50ms
are recorded, with their registration stack cached once per callback. This
will name the source chunk and callback if the interval is owned by scheduled
JavaScript, without logging normal frame-loop work.

---

## ROOT CAUSE — found from a Safari timeline recording

A Safari Web Inspector Timelines export (about 270MB, not committed) of a reload on
the device against the production build.

### The stall, as recorded

From 545.85s to 552.10s — about 6.25 seconds:

- CPU at ~100%.
- **Zero** paints, composites, screenshots or animation frames.
- The only activity: `invalidate-styles` → `recalculate-styles` →
  `invalidate-layout` → `forced-layout`, in lockstep, about 230 cycles a second.

That is layout thrashing in one long synchronous task. It is also why the
probe saw two IntersectionObservers and the hero cue land in the same
millisecond: their callbacks are delivered on rendering steps, and there were
none until the task ended.

### Who is doing it

**97% of CPU samples — 9,729 of about 10,081 — are in one function:** GSAP
CSSPlugin's `_getComputedProperty`, i.e. `getComputedStyle(el)`. Resolved
against the rebuilt chunk (GSAP 3.15.0 reproduces byte-identically), the path is:

```
React commit → an effect → usePixelWipe's cleanup
  → gsap.set(cells, { clearProps: "all" })
    → CSSPlugin render → prop cleanup → _parseTransform → _getMatrix
      → getComputedStyle(cell)            ← forced style + layout, per cell
```

For each cell GSAP writes `cssText = ""`, then immediately re-reads that
element's computed transform — and `_getMatrix` may also detach and reattach it
to measure. A write followed by a read forces a full-page recalc and layout.
One per cell, back to back.

### Why it runs during page load at all

The effect depends on `columns` and `rows`. The wipe builds a timeline, then its
grid changes after measurement, so React tears that timeline down — running this
cleanup — and builds another. The Codex profile shows exactly that:
`pixel-wipe#1/#2` built at ~300ms, `#3/#4` at ~6150ms. The page pays for
reverting a timeline it built moments earlier.

### The arithmetic

At the unmeasured 16x9 default a wipe has 314 cells, and the page has two:
**628 cells, ~1,256 forced layouts** across the setup-and-revert pair. At the
recorded ~4.3ms per forced layout on the phone, that is ~5.4s — the stall.

### This also answers the reported symptoms

- **The freeze** is this task, not the showreel.
- **"No circle-to-square"** is not a showreel fault either: the entrance ran
  correctly every time (122–124 frames, ~2050ms), but only AFTER six seconds of
  a frozen screen, by which point it read as the video simply appearing.

### The fix, in order of value

1. **Do not clear the cells through GSAP on this cleanup.** Remove GSAP's inline
   properties with plain style writes and drop its per-element cache (`_gsap`).
   Writes alone are batched by the browser into ONE layout instead of one per
   cell. This is the change that removes the stall.
2. **Stop the rebuild on load.** Settle the grid before the first timeline is
   built, so the first one is never torn down.
3. Only then consider the element count itself.

**Verify with the same recording method**: the 545.85–552.10 plateau should be
gone, paints should continue through startup, and `mayLoad` / `visible` / `cue`
in the probe should land within a few hundred milliseconds of mount.

### Cleanup now owed — larger than before

- The showreel probe (search `TEMPORARY DIAGNOSTIC`).
- The `autoPlay` attribute on the `<video>`.
- **Codex's startup profiling**, which is uncommitted in the tree:
  `app/_lib/startup-performance.ts`, `instrumentation-client.ts`, and
  `profileImport` / `startStartupSpan` / `nextStartupInstance` calls in nine
  hooks and components.

---

## Closed — 17 September 2026

- **Fix applied** in `app/_lib/use-pixel-wipe.ts`: the cleanup removes GSAP's
  inline properties with plain `removeProperty` calls and drops the `_gsap`
  cache, instead of `gsap.set(cells, { clearProps: "all" })`.
- **Confirmed on the iPhone** against `npm start`: the ~5.4s freeze is gone and
  the entrance plays immediately.
- **Cleanup done**: the showreel probe, the `autoPlay` attribute, and all of
  Codex's startup profiling are removed. Every instrumented file was restored
  from `HEAD` after its diff was read and confirmed to hold nothing else.
- Recorded in `docs/updates/2026-09-17.md`.

**Superseded later the same day.** The pixel wipe was rewritten to draw on a
canvas, so the per-cell cleanup this fix corrected no longer exists in any form
— there are no per-cell styles left to clear. The finding still stands as the
record of why the page froze. See `docs/updates/2026-09-17.md`, *The pixel
wipe, redrawn on a canvas*.
