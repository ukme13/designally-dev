# Implementation Status

Updated: 3 September 2026

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
- Accessibility: focus trap, scroll lock, Escape to close, focus restore,
  `aria-current` on the active page, 44px touch targets, and every animation
  disabled under `prefers-reduced-motion`.
- Scroll behaviour on navigation is corrected: Next scrolls to the top of the
  first *page* element, which lands below the in-flow header, so a layout-level
  component sends forward navigations to the document top while leaving
  browser scroll restoration alone.

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

## Next recommended task

**Organisation structured data plus an `og:image`.**

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
