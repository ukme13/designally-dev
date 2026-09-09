# ADR-005: Scroll-linked motion on the homepage, and where it lives

- Status: Accepted
- Date: 9 September 2026

## Context

The homepage gained five separate pieces of motion in one pass: a paper plane
flying a fixed path, a hero gradient dissolving into solid orange, three cards
turning face-up, a pointer replaced by a circle over the showreel and the
showcase, and the work row's existing drift.

They were built one at a time, and each arrived inside the component that
rendered it. `showreel.tsx` reached 1,328 lines carrying its own entrance
timeline, its playback, its observers and its breadcrumb at once.

Two things also kept going wrong in ways that were not obvious from the code:
transforms fighting each other, and CSS easing tokens being unavailable to
JavaScript.

## Decisions

### Motion lives in a hook, markup lives in the component

Every animated component is now a pair: the component holds the markup, the
layout classes and the look; a `use-*` hook in `app/_lib/` holds the imperative
work and the constants that time it.

    hero-intro.tsx          use-statement-flight.ts, use-statement-parallax.ts,
                            use-gradient-fade.ts
    showreel.tsx            use-showreel-entrance.ts, use-showreel-strip.ts
    showcase-loop.tsx       use-showcase-drift.ts
    situation-cards.tsx     use-situation-cards.ts
    paper-plane-scroll.tsx  use-paper-plane-flight.ts
    hover-cursor.tsx        use-hover-cursor.ts

The knobs split along the same seam, and that is the part worth keeping: a
number that changes WHEN or HOW FAST something moves is in the hook; a class
that changes what it looks like is in the component. Anyone tuning motion opens
one file.

### One owner per CSS property, always

Most of the bugs in this pass were two things writing one property.

GSAP writes `transform` inline on every frame, so no animated element may also
carry a Tailwind transform utility — the hover lift on a card sits on a wrapper,
not on the element that flips. Tailwind v4 makes this sharper than it used to
be: `translate`, `rotate` and `scale` are their own properties there, so
`transition-transform` alone does not animate them.

The same rule caught `col-span-*`, which compiles to the shorthand
`grid-column: span N / span N` and silently overrode a `col-end-*` beside it.
Section placement is now stated as start and end lines throughout.

And it is why `TextLink` grew a `size` prop rather than accepting a `text-*`
class from a call site: two utilities setting `font-size` are settled by
stylesheet order, never by the order they are written.

### CSS easing tokens are read at runtime, not copied

GSAP cannot read a custom property. The choice was to copy a cubic-bezier into
each component — which the project rules forbid and which goes stale silently —
or to approximate it with a built-in.

`app/_lib/css-ease.ts` takes a third option: read the token off the document and
rebuild it as a `CustomEase`. `app/tokens.css` stays the single definition, and
a change there reaches the JavaScript animations too. CustomEase ships inside
the installed GSAP, so this adds no dependency.

Its limit is worth stating: a CSS cubic-bezier with control points inside 0-1
cannot travel past its end value, so no token can express a spring. Anything
that overshoots has to be a GSAP ease string, and should say so.

### Reveals fail to the finished state, never to nothing

Nothing animated is rendered hidden. The server sends the finished markup, at
full opacity, in its final position; the starting state is written by JavaScript
before paint and removed again on cleanup.

So a visitor with no JavaScript, a failed dynamic import, reduced motion or an
unmounted component all end up looking at the finished thing rather than at an
empty box. It is the opposite of the usual arrangement and the only one that
fails safely.

## Consequences

- Tuning motion means opening a `_lib` hook, not a component. The component's
  own comment header points at it.
- Six more files. The pairing is only worth it because each hook is genuinely
  self-contained: it takes refs and returns nothing, or returns one function.
- `css-ease.ts` couples the JavaScript animations to token NAMES. Renaming
  `--ease-out` would fall back to a built-in rather than fail loudly.
- The failure-to-finished-state rule has to be kept by hand in each new hook.
  Nothing enforces it.
