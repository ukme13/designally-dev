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
npm run dev       # development server
npm run build     # production build (Turbopack)
npm run lint      # ESLint
npm run typecheck # TypeScript, no emit
npm start         # serve a production build
```

## Verification

Verification is tiered. Match the tier to the change; running the whole set
after every edit wastes minutes and tokens without catching anything extra.

**Tier 0 — Markdown only.** Documentation under `docs/`, this file, or a
README. No checks. There is nothing to compile; do not run one.

**Tier 1 — copy, content data, comments — anything inside `app/`.**

```bash
npm run typecheck
```

**Tier 2 — component, styling or token changes.** Tier 1, plus:

```bash
npm run lint
npm run build          # Turbopack
```

For a new design token or utility class, also confirm it compiled — `grep`
the generated stylesheet under `.next/static/css/`. A class that matches no
theme entry produces no CSS and no error.

**Tier 3 — routing, layout, `next.config.ts`, dependencies, or anything
about to be committed.** Tier 2, plus the second bundler:

```bash
npm run build -- --webpack
```

`--webpack` is a supported flag on this version; the default bundler is
Turbopack. Building both ways catches bundler-specific breakage, but it is
slow — save it for the end of a piece of work, not for each edit.

Run each tier **once**, when the change is finished. Report the real result,
and name any check you skipped and why.

There is no test runner and no formatter configured yet. Do not look for one,
add one, or claim either ran.

Never report work as complete on the strength of a passing type-check alone.
Confirm the rendered output by reading the generated HTML in
`.next/server/app/` — `grep` for the specific string or element you changed
rather than printing the whole file.

## Working economically

Time and tokens are a real budget on this project. Spend them on the change,
not on rediscovering the repository.

- **Read narrowly.** Use `grep` or a targeted line range. Do not read a whole
  file when a symbol lookup answers the question, and do not print build
  output, `package-lock.json`, generated HTML or generated CSS in full.
- **Read one planning document, not the folder.** `docs/` is reference
  material. Open the one file the task names — the page spec, the sitemap,
  `URL-REDIRECTS.md` — and stop there.
- **Do not run visual checks.** No browser-control tools, no screenshots, no
  starting a dev server unless asked. Visual and design review is done by the
  user. When a change needs eyes on it, finish the code, state the exact URL
  or path to look at, and hand it over.
- **Do not fan out.** No subagents, parallel research agents or multi-agent
  workflows unless asked for by name.
- **Do not fix what you were not asked to fix.** If you hit a pre-existing
  failure, a lint error in untouched code, or a bug outside the current task,
  report it in one line and carry on. Do not investigate or repair it.
- **Ask before an expensive detour.** If a task turns out to need a dependency
  change, a wide refactor or a long research pass, say what it would take and
  wait, rather than spending the budget first.
- **Scale the research to the risk.** The rules below are for choosing or
  changing technology. Reusing an API already used elsewhere in this codebase
  only needs a look at that existing usage.

Servers you start belong to you: stop anything left running on ports
3000–3005 before you finish. **Never touch port 3002** — it is reserved for
an external process.

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
