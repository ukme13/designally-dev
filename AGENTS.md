<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Working guidelines for AI coding agents

These rules apply to every AI coding agent working in this repository. The
block above is managed by `next dev` — leave it in place.

## Project

The 2026 rebuild of `designally.co`, the website for a strategy-led branding
and design agency in Bangkok, Thailand.

- Single Next.js App Router application. There is no monorepo.
- Next.js 16, React 19, TypeScript, Tailwind CSS v4.
- Design tokens live in `app/tokens.css`. Shared components live in
  `app/_components/`, shared data in `app/_lib/`.
- Planning documents live in `docs/product/`, `docs/specs/`, `docs/audits/`
  and `docs/migration/`. Read the relevant one before building a page.
- **This project uses npm.** Do not run `pnpm` or `yarn`.

There is no CMS, database, form provider, authentication or analytics yet.
Do not add one without being asked.

## Commands

```bash
npm run dev      # development server
npm run build    # production build (Turbopack)
npm run lint     # ESLint
npm start        # serve a production build
```

## Verification

Run these after any code change, and report the real result:

```bash
npm run lint
npx tsc --noEmit
npm run build -- --webpack
```

`--webpack` is a supported flag on this version; the default bundler is
Turbopack. Building both ways catches bundler-specific breakage.

For routing, layout or navigation changes, also serve the build and check the
affected URLs:

```bash
npm start
```

There is no test runner and no formatter configured yet. Do not claim either
one ran. If a check is skipped or unavailable, say so plainly.

Never report work as complete on the strength of a passing type-check alone.
Confirm the rendered output — read the generated HTML in `.next/server/app/`
or load the page.

## Research before choosing or changing technology

Do not choose a library, package version, framework API, or implementation
from memory alone.

Before adding a package, updating a package, or using an unfamiliar API:

1. Read the current official documentation. For Next.js, read the installed
   copy in `node_modules/next/dist/docs/` — it matches the installed version,
   which training data may not.
2. Check the package registry and release notes for the latest stable version.
3. Check compatibility with this project's Node.js, npm, Next.js, React,
   TypeScript and Tailwind versions.
4. Check security advisories, maintenance activity and known breaking changes.
5. Inspect the installed package source or type definitions when the
   documentation and real behaviour disagree.

Use primary sources first. Blog posts, forum answers and model memory may
provide context, but they are not enough to confirm an implementation.

## Do not guess

- Confirm component props, config fields and CSS tokens against the installed
  version before using them.
- Do not invent imports, props, configuration fields, design tokens, utility
  class names, or command flags.
- Verify that a utility class actually compiles. A Tailwind class that matches
  no theme entry produces **no CSS and no error** — it fails silently. Check
  the generated stylesheet under `.next/static/css/` when introducing a new
  token or class.
- Class order inside a `class` attribute does not decide which utility wins;
  stylesheet order does. Do not write a component base class that a call site
  is expected to override with a competing utility of the same property.
- If information cannot be verified, say so. Do not present an unverified
  guess as a confirmed answer.

## Package selection

- Prefer an existing project dependency over adding a new one. This project
  deliberately runs on a very small dependency set.
- Prefer a well-maintained library with official support for the current
  stack, and the newest stable secure version compatible with it.
- Do not install alpha, beta, release-candidate or canary versions without
  clear approval.
- Explain major-version changes and likely migration work before applying
  them.
- Keep security fixes, safe patch updates and risky major upgrades in
  separate commits where practical.

## Design tokens and styling

- All colour, type, spacing, radius, shadow and easing values come from
  `app/tokens.css`. Do not introduce raw Tailwind palette colours
  (`bg-orange-500`) or hex strings in components.
- Use the semantic layer where one exists — `bg-surface-base`,
  `text-text-primary`, `border-border-default`, `bg-action-primary` — rather
  than reaching for a raw palette step.
- `--text-*`, `--tracking-*`, `--font-*`, `--color-*`, `--spacing-*`,
  `--radius-*` and `--ease-*` are **Tailwind v4 theme namespaces**. Never
  declare a value in one of those names that is not of that namespace's type.
  A colour named `--text-body` collides with the `text-body` font size and
  silently breaks it. Semantic text colours use `--ink-*` for this reason.
- Do not change the palette or token names without being asked.
- Reuse `app/_components/button.tsx` and `text-link.tsx` rather than
  hand-writing control classes.

## Content

The website's credibility is the product. Content rules are not optional.

- Never invent client results, metrics, testimonials, quotations, team
  members, office addresses, telephone numbers, response times, or legal text.
- Publish a client name, logo or outcome only where the planning documents
  record that permission and evidence exist.
- Where final content is not ready, use clearly marked draft content that
  states what decision or evidence is outstanding. `draft-notice.tsx` exists
  for this.
- Facts that appear in more than one place — contact details especially —
  belong in a single constant in `app/_lib/`.

## Routing and URLs

- `trailingSlash: true`. Every internal href ends in a slash, except `/`.
- Use `next/link` for internal navigation.
- Do not link to a route that does not exist. List a planned page as text
  instead.
- Pages, layouts and shared chrome are Server Components. Add `"use client"`
  only for genuine interactivity, in the smallest possible component.
- Every route needs its own title, description and canonical URL.
- Placeholder pages with no real content must carry `noindex`.
- URL changes must be checked against `docs/migration/URL-REDIRECTS.md`.

## Documentation

Record notable work in `docs/updates/YYYY-MM-DD.md`: what changed, why, a
**Verification** section listing the checks that actually ran, and anything
left outstanding.
