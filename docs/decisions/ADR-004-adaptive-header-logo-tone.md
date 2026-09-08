# ADR-004: Adaptive header logo tone

- Status: Accepted
- Date: 8 September 2026

## Context

The floating header is a bare overlay. It has no background of its own at any
width, so it sits directly over whatever section is passing beneath it — and
several of those sections are `primary-300`, the same brand orange the logo is
painted in. Over those, the monogram all but disappears.

The obvious fix is to read the colour behind the logo and choose a contrasting
one. That does not work here. Sampling pixels means rendering the page to a
canvas, which cannot see cross-origin images and is defeated by every gradient
on this site anyway — and the hero, which is the worst offender, is a gradient
under a video.

## Decisions

### Sections declare their own tone; nothing is sampled

A section that needs a white logo carries `data-header-tone="light"`. The
attribute is a statement about that section's own background, made by the person
who chose that background, at the place where it is set. Nothing infers it.

The attribute works on any element, not only a `<section>`. The showcase band
fades from `primary-300` to `surface-base` down its height, so marking the whole
section would leave a white logo over the pale end. It carries a positioned,
`aria-hidden` marker over its top third instead.

### The result is a DOM attribute, not React state

`useHeaderLogoTone` compares rectangles on a scroll listener coalesced to one
pass per frame, and writes `data-logo-tone="light"` straight to the header
element.

React state was rejected on two counts. The tone can change on any frame of a
scroll, and re-rendering the whole header that often is waste. More importantly,
the server renders no tone at all — which is the correct default — and an
attribute written before paint by `useBeforePaint` cannot cause a hydration
mismatch, where a state value chosen during render could.

### `.site-logo` owns the colour outright

Both marks are brand-orange fills seen through an SVG mask, so what decides the
logo's colour is its `background-color`. The `bg-action-primary` utility was
removed from the marks and the colour declared once on `.site-logo`.

This is the project rule about competing utilities, applied. Two rules setting
one property are settled by stylesheet order, not by the order the class names
are written, so leaving a utility in place and overriding it from a stylesheet
would have been a coin toss. One owner, plus a higher-specificity override.

### The top bar is deliberately excluded

Only `[data-site-floating]` is in scope. The top bar's wordmark reads well in
orange and is left that way by choice.

That exclusion is also what keeps the hook simple. The top bar is
`md:bg-transparent`, but below `md` it turns solid `surface-base` as soon as the
page leaves the top — at which point its logo is over the bar's own light
background rather than over the section, and would have to go back to orange.
Including it means tracking that state; excluding it means the hook only ever
asks one question.

The mobile drawer needs no special case at all. It is a sibling of both header
elements, so it is out of reach of the selector.

## Consequences

- Adding a light-logo section is one attribute. No import, no registration, no
  list to keep in step.
- A section that changes its background must remember to change its marker.
  Nothing detects the mismatch, and the failure is silent and visual.
- The showcase band's one-third marker is a judgement about where its fade stops
  carrying white. It is not derived from the gradient and will not follow it if
  the stops change.
- Bringing the top bar in later means adding its selector to the rule in
  `globals.css` and to `HEADER_SELECTOR`, plus the solid-background state the
  hook currently has no need to track.
