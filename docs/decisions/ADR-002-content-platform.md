# ADR-002: Content platform

- Status: Accepted, not yet implemented
- Date: 3 September 2026

## Context

The site needs to publish projects, services, insights, people and legal
pages, in English now and Thai later. `docs/product/CONTENT-MODEL.md` already
models these as documents with references, controlled vocabularies and
per-document SEO fields.

The current site is WordPress. `docs/audits/CURRENT-SITE-INVENTORY.md` records
why it is being replaced: content living in Elementor templates rather than
fields, Thai and English held as separate disconnected records, and duplicate
campaign pages.

## Decision

**Sanity is the planned content platform** for projects, services, insights
and bilingual content, following the model already written in
`CONTENT-MODEL.md`.

**Sanity setup has not started.** There is no Studio, no schema, no dataset,
no client library and no environment variables in this repository.

**Do not create static project data in the meantime.**

## Why not hardcode content now

The temptation is to add `app/_lib/projects.ts` alongside the existing service
data and move on. That is rejected for the launch content:

- The launch case studies are not chosen, and none has client permission. A
  static file would invite writing project stories that cannot be published.
- Projects carry the most structure in the model — references to clients,
  services, industries and business stages. Reproducing that in TypeScript
  produces a second schema that then has to be migrated and reconciled.
- Bilingual content is the reason the current site is being replaced. Static
  files would repeat the mistake of holding Thai and English separately.
- The brief forbids inventing client results. A file waiting to be filled is
  where invented results appear.

`app/_lib/services.ts` is the deliberate exception. Services are a closed set
of five, their content is drafted from the brief rather than from client
evidence, and the file is shaped to match the Service document in
`CONTENT-MODEL.md` so migration is a change of data source, not a rewrite.

## Consequences

- `/works/` lists audited candidates as names, stages and services only, with
  no detail pages, until content exists in a CMS.
- `/insights/` lists planned articles as text rather than links.
- Adding `/works/<slug>/` or `/insights/<slug>/` is blocked on this decision,
  not on engineering.
- Content-shaped work that is not blocked: structured data, the sharing image,
  the enquiry form, and the Thai routing structure.

## Open questions

Carried from `docs/product/WEBSITE-BRIEF.md`:

1. Confirm the content management system before content migration begins.
2. Confirm English at `/` and Thai under `/th/`.
3. Choose the launch case studies and obtain permission.
4. Decide where Sanity Studio is hosted and how preview is authenticated.

## Alternatives considered

- **Markdown or MDX in the repository** — rejected. No editing interface for a
  non-technical team, and no natural way to hold connected Thai and English
  documents or controlled references.
- **Staying on WordPress as a headless backend** — rejected. It carries over
  the Elementor content shape and the disconnected translation records that
  the audit identifies as the core problem.
- **A different headless CMS** — not evaluated in depth. `CONTENT-MODEL.md`
  was written against Sanity's document and reference model, and the sibling
  Ferre project already runs Sanity, so the team has working knowledge.
