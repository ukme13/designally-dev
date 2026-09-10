# ADR-006: Stacked scroll lists are transformed, not sticky

Date: 2026-09-10. Status: accepted.

## Context

The "What we build" list stacks: each row rises to a stop one band below the
row above, holds while you read it, and is covered by the next, so that by the
last row all five titles are on screen at once. Then the whole stack leaves
together.

`position: sticky` is the obvious tool and was the first two implementations.
It gets the stacking right and the departure wrong, in two ways that are not
tuning problems.

**The last row cannot stick at all.** A sticky box is pushed out of the flow
only until its bottom edge reaches the bottom of its containing block. The last
row's bottom already IS the bottom of the list, so the available shift is zero
and it scrolls past the other four. Adding trailing space fixes that one row.

**The stack cannot leave together.** Working out when the clamp engages for row
`i` gives

    release = listBottom − rowHeight − stop

so rows release in order of `rowHeight + stop`. That sum strictly increases down
a stack whatever the row heights are, so the BOTTOM row always runs out of room
first, then the next — the stack is eaten from below one band at a time, each
band covered by the row beneath sliding over it. The order is structural. No
arrangement of sticky rows avoids it, and trailing space delays every release by
the same amount while keeping the order.

Equalising the releases would need each row to be exactly one band SHORTER than
the row above it, which is not a layout anyone wants for other reasons.

## Decision

**A stacked scroll list is positioned by hand: one transform per row, written
from the scroll position, from three numbers.**

    held   = max(0, stop − natural)               per row; what sticky does
    depart = max(0, last row's held − STACK_HOLD)  shared by every row
    lift   = max(0, held − depart)                 what is written

`depart` being a single number shared by every row is the whole point — it is
the one thing sticky cannot express, and it is what makes the stack move as one
piece.

Two properties follow that are worth stating, because they are why this is not
merely a workaround:

- **It needs no rate.** `depart` is the last row's own `held`, which grows
  one-for-one with scroll exactly as every other row's does, so `lift` goes
  constant the moment the stack is complete. The group then travels at the
  page's speed. There is no easing or duration to tune and nothing to keep in
  step with anything else.
- **It is measured from the last row landing, not from the end of the list.**
  Keyed to the list's bottom edge, nothing moves until that edge has climbed
  most of the screen, and the section visibly ends underneath a stack that is
  still parked.

**The stops are measured, never assumed** — each from the row's top to its
title's bottom, which folds in the row's border, the row's top padding and the
title's own bottom padding. Title lengths differ, they rewrap at every width and
the display font swaps in after first paint, so a fixed number per row is wrong
somewhere; wrong means a clipped title or a strip of the row beneath showing
through. A `ResizeObserver` on the titles keeps them right.

**Nothing is written into the HTML.** The server sends a plain list in document
order and every offset is an inline style added before paint and removed on
cleanup. This is the ADR-005 rule — reveals fail to the finished state — and it
matters more here than usual, because a stylesheet-only version of a stack has
no measured stops and would pile every row in the same place.

## Consequences

- Rows are transformed on every frame the list is on screen, so they carry
  `will-change: transform` for that window only, dropped by an
  `IntersectionObserver` when the section is out of the way. Five full-width
  rows of text repainting per frame is real work; five layers held for the life
  of the page is real memory.
- The focus animation folded into the same writer rather than staying a GSAP
  tween. `ScrollTrigger` measures with `getBoundingClientRect`, which would
  include the stack's own transform and mis-site the trigger on any refresh
  away from the top of the page. So this component uses no GSAP at all, and its
  easing is a cubic ease-out written inline rather than read from `--ease-out`
  through a `CustomEase` — evaluating a token needs GSAP, and pulling it into a
  per-frame writer to soften one dim is not worth it. That is a documented
  exception to ADR-005's "easing tokens are read at runtime", not a drift from
  it.
- Stacking is gated to `lg` and up. Narrower than that, titles wrap to two and
  three lines, five bands eat the viewport, and the site header is still
  `fixed`, so a row held at the top would sit under it.
- Reduced motion keeps the stack and drops the focus: stacking moves nothing
  the scroll did not, whereas dimming and scaling a row is decoration.
- The one number left to tune is `STACK_HOLD`, how long the finished stack sits
  before riding out. It is `0`, because keying the departure to the last row is
  precisely what removed the need for it.

`position: sticky` remains right for a single element that pins and releases on
its own — the showreel stage in ADR-003, for instance. The finding here is
narrower than "avoid sticky": it is that sticky cannot release a GROUP together,
and any list that has to should be transformed instead.
