# Implementation Status

Updated: 7 September 2026

A snapshot of what exists in the codebase, what is placeholder, and what has
not been started. Read alongside `docs/updates/` for the record of how each
piece was built and verified.

## Complete

### Routing and layout

- Next.js App Router, TypeScript, Tailwind CSS v4. npm, single application.
- `trailingSlash: true`. Bare paths return 308 to their trailing-slash form.
- Eleven statically prerendered routes: `/`, `/works/`, `/services/`,
  five `/services/<slug>/` pages, `/about/`, `/insights/`, `/contact/`,
  `/privacy-policy/`, `/cookie-policy/`.
- Header, footer and a skip link are mounted once in the root layout.
- Every route declares its own title, description and canonical URL.
- No `#` navigation fragments remain. The only fragment on the site is the
  skip link.
- Internal link audit passes: no dead links across all routes.

### Search foundations

- `app/sitemap.ts` and `app/robots.ts`, both prerendered.
- Sitemap entries are derived from `app/_lib/routes.ts` and filtered on an
  `indexable` flag, so a page cannot be listed while declaring `noindex`.
- Every sitemap `<loc>` matches that page's declared canonical exactly.
- The two unfinished legal pages carry `noindex, follow` and are excluded from
  the sitemap. They are deliberately **not** disallowed in robots.txt: a
  crawler must fetch a page to see its noindex directive.

### Design system

- `app/tokens.css` — colour ramps, fluid type scale, spacing, radii, shadows,
  easings, and a semantic layer (`--surface-*`, `--ink-*`, `--action-*`).
- `app/typography.css` — eleven composed type utilities (`type-display`
  through `type-button`), each carrying family, weight, size, line height,
  letter spacing and case.
- Shared components: `Button` (four variants, polymorphic), `TextLink`,
  `Section`, `PageIntro`, `DraftNotice`.
- Semantic text colours use `--ink-*`. They are deliberately not in the
  `--text-*` namespace, which Tailwind reserves for font sizes.

### Navigation

Reproduces the original site's two-part system:

- Mobile: a fixed bar that hides on scroll down and returns on scroll up,
  with a full-screen drawer — numbered rows, staggered entrance, social row.
- Tablet: the bar scrolls away; it carries a contact button and a circular
  menu toggle with a compact dropdown.
- Desktop: a 120px bar in normal flow with centred navigation and an outlined
  contact button; a floating overlay drops in after 1000px of scroll.
- Below `md`, the bar is transparent while the page rests at the top — so the
  homepage gradient runs unbroken behind it — and `bg-surface-base` once
  scrolled. Derived in the header's existing scroll listener, with two
  thresholds so the colour cannot flicker at the boundary.
- The circular toggles cross-fade between the hamburger and the cross: both
  icons stay mounted and swap by opacity, rotation and scale.
- Menu rows animate out as well as in. The transition lives in the base state,
  and the panel delays its own close so the rows can be seen leaving.
- Accessibility: focus trap, scroll lock, Escape to close, focus restore,
  `aria-current` on the active page, 44px touch targets, `inert` on every
  closed panel, and every animation disabled under `prefers-reduced-motion`.
- Scroll behaviour on navigation is corrected: Next scrolls to the top of the
  first *page* element, which lands below the in-flow header, so a layout-level
  component sends forward navigations to the document top while leaving
  browser scroll restoration alone.

### Homepage entrance animation

A branded entrance on `/` only, built on GSAP core 3.15.0. The cream-to-orange
gradient and the statement lines are permanent; only the mask hiding them is
temporary. The hero runs behind the header so the reveal reaches the top edge
of the viewport. Plays on a direct load or hard refresh of the homepage, never on
client-side navigation, without cookies or storage. Reduced motion and
JavaScript failure both resolve to the finished page immediately.

Each statement line is a motion wrapper plus a paragraph of type, so the tilt
and the typography sit on an element GSAP never touches, and each line measures
its own start distance from what is painted rather than from its layout box.
Placement, size, weight, colour and tilt are all editable per line. Full
specification in `docs/specs/STARTUP-INTRO.md`.

### Homepage showreel

A selected-work video carousel **inside the hero**, sized to the page grid's
width and the viewport's height with no fixed ratio, cropped by `object-cover`.

Every film arrives through a pixel entrance: 144 cells in an SVG mask applied
to the video's own container, fading in from the centre outward, each resolving
from a circle into a square. Nothing is painted over the video — the mask
reveals it, so the rectangle is genuinely transparent until the entrance runs
and the hero's gradient shows through it. The grid is chosen from the rendered
aspect ratio, so cells stay square from a phone to a desktop.

Projects advance on each clip's own `crossfadeAt`, compared against real
`currentTime`, with a 15s fallback for a stall. A switch holds the outgoing
frame on a canvas so the rectangle never blanks. Four optimised films with real
extracted posters, 2,989,567 bytes in total (2.99 MB decimal / 2.85 MiB
binary). Playback pauses off screen. Reduced motion gets the static poster and
fetches nothing.

Full specification in `docs/specs/SHOWREEL.md`; the reasoning in `ADR-003`.

### Homepage sticky stage

The hero gradient and the three statement lines sit in a `sticky top-0 h-svh`
layer spanning the hero and the section after it. The gradient is pinned for
the length of the hero, then releases and travels up with the section below so
the two leave as one picture. The statement lines fly upward on scroll, on a
transform layer of their own.

The stage hands over to a solid `primary-300` section and then to one fading
back to the page background. All three joins depend on `primary-300` being the
same value — see `ADR-003`.

### Footer

Reproduces the original closing block: white wave divider, "Let's work
together.", a contact link circled by an animated hand-drawn scribble, the
social row, the duck illustration, and a legal bar with the copyright and
policy links.

## Draft

All of the following render, are marked as draft on the page, and contain no
invented facts.

| Area | State |
|---|---|
| `/works/` | Six audited candidates with name, stage, services and industry. No case studies, imagery, outcomes or metrics. |
| `/services/<slug>/` | Full page structure and copy for all five services, drafted from the brief. No durations, prices or named references. |
| `/about/` | Positioning and principles. `150+ brands` and `six years` carry an unconfirmed-proof footnote. No team, portraits or address. |
| `/insights/` | Three planned articles listed as text, not linked. Nine existing posts await rewriting. |
| `/contact/` | Guidance and a mailto link. No form. |
| `/privacy-policy/`, `/cookie-policy/` | Heading outline and an "awaiting legal review" notice. No policy text. |

### Facts carried over from the live site, not yet confirmed

Recovered from the current website, held in one constant each so they are
cheap to correct:

- **Client permission for the four showreel films — Laga, Nourigo, INN News,
  Bitazza.** The section publishes four client names and their media, and no
  permission record exists for any of them. The films were served from the live
  site, which is evidence of past use, not of current permission to reuse. This
  blocks launch, not development.
- `hello@designally.co` — `app/_lib/navigation.ts`
- Telephone `0650055993` — `app/_lib/navigation.ts`, not currently displayed
- Company name `Designally Co., Ltd.` — used in the footer
- Five social profile URLs — `app/_lib/social.ts`

These are current published values, which is not the same as verified. They
remain on the brief's "evidence needed before launch" list.

## Not started

- **Sanity, or any content platform.** See `ADR-002`.
- Project detail pages under `/works/<slug>/`.
- Insight article pages under `/insights/<slug>/`.
- Thai content and the `/th/` route tree. `IBM Plex Sans Thai` is loaded and a
  `:lang(th)` rule exists, but no Thai routes or language switcher are built.
- A working enquiry form. No delivery service has been chosen.
- Organisation structured data and an `og:image`. Both are launch checks in
  `docs/specs/HOMEPAGE.md`; both need confirmed company facts or an approved
  image.
- Redirect implementation from `docs/migration/URL-REDIRECTS.md`. That
  document asks for analytics data first.
- Analytics, and the cookie consent approach it depends on.
- Situation pages, and the `/branding-agency-thailand/` page. Both are phase
  two in the sitemap.
- Automated tests and a formatter. Neither is configured.

### Showreel, not built

- Crossfade between projects. A switch cuts: the outgoing frame is held still
  on a canvas while the incoming film materialises over it, which is not a
  blend. `tryStartCrossfade()` remains specified and unwritten.
- A pause control for the automatic advance. WCAG 2.2.2 asks for one where
  auto-updating content runs longer than five seconds. Reduced motion disables
  the rotation entirely, which covers the visitors most affected, but there is
  nothing for anyone else. **Launch check.**

### Homepage, outstanding

- **The first film is fetched on every homepage load.** The showreel is on
  screen at first paint now, so `preload` no longer stays `"none"` — LAGA
  (1,063,184 B) is part of the initial media cost for every visitor, where
  before only those who scrolled paid it. Not measured, no decision taken.
- Two placeholder sections after the sticky stage, carrying the literal text
  "test", "next section" and "last section". They exist to hold the colour
  handover and **must be replaced before launch**; whatever replaces them has
  to keep their backgrounds.

### Waiting on visual review

The whole sticky stage, the scroll flight of the statement lines and the
showreel's pixel entrance were tuned from arithmetic against the tokens, not
from watching them. Specific figures that are first guesses: the flight
distances (0.7 / 0.85 / 1.0 viewports), `PIXEL_CELL_SCALE`, and
`--showreel-reserve`, whose caption term assumes the statement wraps to two
lines.

The entrance animation's 250 ms hold, and the statement's size, colour,
placement and tilt, were chosen from the brief rather than from a design file.
The sequence runs 3.85 seconds, most of it the two-second navbar fade; that
length is a decision, not a constraint.

On the header: whether the navbar background's 24px/8px scroll hysteresis suits
real use, and whether the drawer's 250 ms row exit plus 500 ms sweep reads as
deliberate or slow. Neither could be judged without a device.

## Next recommended task

**Replace the three homepage placeholders.**

The sticky stage works but hands over to sections reading "test", "next
section" and "last section". They are the only invented content on the site and
the only thing on the homepage that could not ship. The colour contract they
carry is documented in `ADR-003`.

After that, **organisation structured data plus an `og:image`.**

They are the last two launch checks in `docs/specs/HOMEPAGE.md` that are
purely coding work, and both are cheap now that the company facts live in
`app/_lib/`. Structured data can be generated from the same constants the
footer already uses, which keeps the markup and the visible page in agreement
— a requirement of the brief.

That work is partly gated: the structured data should not publish an address
or telephone number until those are confirmed, and the social sharing image
needs an approved asset. Both can ship with what is confirmed and be extended.

After that, the largest remaining decision is the content platform. Nothing
further should be built on hardcoded arrays — see `ADR-002`.
