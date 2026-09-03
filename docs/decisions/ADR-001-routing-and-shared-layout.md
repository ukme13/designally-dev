# ADR-001: Routing and shared layout

- Status: Accepted
- Date: 3 September 2026

## Context

The 2026 rebuild replaces a WordPress and Elementor site. It needs stable
URLs, server-rendered HTML for search and AI retrieval, a small dependency
surface, and chrome that behaves identically on every page.

## Decisions

### Next.js App Router

Pages, layouts and metadata are file-system routed under `app/`. Everything is
a Server Component unless it needs browser APIs.

The brief requires important content to be visible as real HTML text and pages
to be server-rendered. All eleven routes prerender to static HTML at build
time. Four small client components exist, each for genuine interactivity:
`header-shell`, `nav-link`, `mobile-menu` behaviour, and `scroll-to-top`.

Because this Next.js version differs from what a model may recall, the
installed documentation in `node_modules/next/dist/docs/` is treated as the
reference. `AGENTS.md` makes that mandatory.

### npm

The project uses npm. There is no monorepo and no workspace tooling. The
sibling Ferre project uses pnpm and Turborepo; that is not carried over,
because this is a single application with one `package.json`.

### `trailingSlash: true`

Every internal URL ends in a slash. Bare paths return a 308 redirect.

`docs/migration/URL-REDIRECTS.md` and `docs/product/SITEMAP.md` both describe
the existing WordPress URLs with trailing slashes. Next defaults to stripping
them, which would have made every migrated URL redirect on first visit and put
the sitemap at odds with the canonicals. Matching the existing convention costs
one configuration line.

Files with extensions are exempt, so `/sitemap.xml` and `/robots.txt` serve
directly.

### Shared navbar and footer in the root layout

`SiteHeader` and `SiteFooter` are mounted once in `app/layout.tsx`, above and
below `<main id="main">`, together with a skip link. Pages render only their
own content.

The alternative — composing chrome per page — would have meant eleven places
to keep in step, and the header holds state (drawer, menus, scroll direction)
that should survive navigation rather than remount on every route change.

## Consequences

- Adding a route means one `page.tsx` plus an entry in `app/_lib/routes.ts`,
  which is what feeds the sitemap. Forgetting the second step is the most
  likely mistake; the registry exists so the sitemap cannot silently drift.
- The header persisting across navigation means panels must be closed
  explicitly on a route change. `header-shell` does this during render rather
  than in an effect.
- Because the header sits in normal flow above `<main>` from 768px up, Next's
  default scroll-on-navigation lands below it. `scroll-to-top.tsx` corrects
  forward navigations while leaving back and forward restoration alone.
- Trailing slashes must be written into every internal `href`. They are held
  in `app/_lib/navigation.ts` and `app/_lib/routes.ts` rather than inline.

## Alternatives considered

- **Pages Router** — rejected. No layouts, weaker metadata handling, and the
  installed documentation treats it as legacy.
- **Default no-trailing-slash** — rejected. It would have contradicted the
  migration plan and cost a redirect on every migrated inbound link.
- **A static export** — not chosen. Everything prerenders today, but keeping
  the Node server open leaves room for the enquiry form and, later, draft
  previews from a CMS.
