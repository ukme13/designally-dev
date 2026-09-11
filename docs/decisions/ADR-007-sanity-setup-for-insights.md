# ADR-007: Sanity setup for insights — packages, Studio, shapes and colours

- Status: **Accepted**, 11 September 2026. The three site packages are
  installed and the client is wired up. The Studio is not built yet.
- Date: 11 September 2026
- Builds on: ADR-002 (Sanity is the content platform)

## Context

ADR-002 chose Sanity and left the setup open. The first content to move there
is the "Our thinking" cards. Each card has an image cut to an SVG shape, one
topic, a title and a description. The owner has decided:

1. **Colour.** A preset colour fills the shape behind the photo, showing while
   it loads, or as a solid shape when there is no photo. It is also the card's
   background.
2. **Topic.** One primary topic per card, as `CONTENT-MODEL.md` already has.
3. **Studio.** A separate app hosted by Sanity. No public `/studio` route on
   this site.
4. **Project.** A new Sanity project dedicated to this site.
5. **Shapes.** Only Administrators upload shapes. Editors choose from the
   approved library.

## Decision

### 1. The Studio lives in its own repository

It goes in a new repository, `designally-studio`, and is deployed to Sanity's
hosting. It does not go in this repository: `AGENTS.md` keeps this as one
Next.js app with no monorepo, and the Studio brings about a thousand packages
of its own. It does not go at a `/studio` route either (decision 3).

This answers ADR-002's open question 4 on hosting. Authenticated draft preview
is deferred, because this phase publishes approved content only.

### 2. The site takes three small packages, not `next-sanity`

| Package | Version | Node engines | Dependencies | Advisories |
| --- | --- | --- | --- | --- |
| `@sanity/client` | 8.6.1 | `>=22.12.0` | no peers | none |
| `@sanity/image-url` | 2.1.1 | `>=20.19.0` | no peers | none |
| `@sanity/webhook` | 4.0.4 | `>=20.0.0` | none at all, 61 KB | none |

Together with Next and React they resolve to **65 packages with zero audit
findings**. That was checked by resolving the full dependency tree into a
lockfile, without installing anything, and running `npm audit` against it.

**`next-sanity` 13.3.4 was rejected.** It lists `sanity` as a required peer
(`^5.29.0 || ^6.0.0`), not an optional one, so installing it would pull the
entire Studio into this website. That comes to 1,051 packages and 14 audit
findings (12 moderate, 2 high), all in Studio tooling the site never runs.
`npm audit`'s suggested fix is a downgrade to `next-sanity` 11.6.13, two majors
back.

The site does not lose anything by skipping it. `@sanity/client`'s README
documents passing Next's fetch options straight through, `cache` and
`next: { tags }`, which is all the tagging this design needs.
`@sanity/webhook` checks that a publish notification really came from Sanity,
so the check isn't hand-rolled.

Compatibility with this project: Node 24.18.0 (every engine range above is
met), npm 11.16.0, Next 16.3.4, React 19.2.8. None of the three packages
constrains React or Next.

### 3. The Studio's packages, with two overrides

| Package | Version | Notes |
| --- | --- | --- |
| `sanity` | 6.13.1 | Node `>=22.12`; peers React `^19.2.2` and `styled-components ^6.1.15` |
| `@sanity/vision` | 6.13.1 | The query tool for developers |
| `styled-components` | 6.5.3 | Required by the Studio |

The sibling Ferre project runs `sanity ^6.10.1`, so this is the major version
the team already knows.

As published, the tree has **14 findings: 12 moderate and 2 high**. Every one
comes through the CLI and build tooling, not the Studio editors use. Two
overrides fix the high-severity ones without changing a major version:

```json
"overrides": {
  "js-yaml": "^3.15.2",
  "smol-toml": "^1.8.0"
}
```

With them, the tree resolves cleanly to **11 moderate findings, 0 high**, from
two causes that are accepted:

- **`adm-zip` 0.6.0.** Extraction follows symlinks in a crafted archive
  (GHSA-vwc7-r8mq-g2x9). No fixed release exists; 0.6.0 is the latest. It is
  reached only through build tooling (`@module-federation/dts-plugin`), and it
  matters only if that tooling extracts a malicious archive.
- **`uuid` 10.0.0 under `typeid-js`.** A missing bounds check in v3, v5 and v6
  when a caller passes its own buffer (GHSA-w5hq-g745-h8pq). `typeid-js` pins
  `^10`, so the fix crosses a major version inside someone else's package.

**No `uuid` override.** One was tested and rejected: `sanity` itself requires
`uuid ^14`, so a blanket override would silently downgrade the Studio's own
copy. npm allows it, because overrides always win, which is exactly why it is
not used.

**No downgrade of `sanity` either.** `npm audit` suggests `sanity` 5.14.1, a
major back, to clear findings that are all in build tooling. Re-audit before
each Studio deploy, and drop the overrides once upstream picks up the fixed
versions.

### 4. A private dataset read with a server-only token

- One new project (decision 4) with a `production` dataset.
- **The dataset is private.** Sanity's "published" is not the same as this
  site's `approved`. On a public dataset, a document an editor has published
  but not yet approved could be read by anyone through the API.
- **The site reads with a Viewer token that stays on the server**:
  `SANITY_API_READ_TOKEN`, never prefixed `NEXT_PUBLIC_`. `projectId` and
  `dataset` are not secrets. `apiVersion` is a hard-coded date, as the client's
  README requires.
- `.env.local` holds the token and is never committed. Production keeps it in
  the host's environment settings.
- **Image files on Sanity's CDN are public** to anyone who has the URL, whatever
  the dataset setting. That is normal for a public website, but it means an
  unapproved image is not secret once its URL has been shared.

### 5. Fetching, freshness and fallback

- Queries go through `@sanity/client` with `cache: 'force-cache'` and
  `next: { tags: [...] }`, and fetch only `status == "approved"`.
- **A Route Handler receives Sanity's publish webhook.** It checks the signature
  with `@sanity/webhook` and calls `revalidateTag(tag, 'max')`. Next 16 makes
  that second argument mandatory (the single-argument form is deprecated and a
  type error), and `revalidateTag` can be called from a Route Handler. Both are
  confirmed in the installed docs. `updateTag` is for Server Actions only, so it
  does not apply here.
- **Images** go through `next/image`, with a `remotePatterns` entry for
  `https://cdn.sanity.io/images/<projectId>/<dataset>/**`. Next 16 raised the
  default `minimumCacheTTL` to four hours. That is harmless here, because a
  Sanity asset's URL changes when the asset does.
- **Fallback.** Without Sanity configured, for example locally without the
  token, the site reads the current `app/_lib/insights.ts`. Builds never fail
  for want of a CMS.

### 6. Shapes are stencils, used only as images

- A `shape` document holds a name and an SVG, in a file field that accepts
  `image/svg+xml` only.
- **On the site, a shape is only ever a CSS mask.** The server fetches the SVG
  when the page is built and inlines it as a `data:` URL in the mask, so there
  are no extra requests per card and no dependence on the CDN's cross-origin
  headers. It is the same technique as the header logo and the client logos.
- **The SVG's code is never put into the page.** Uploaded SVG can contain
  script. Used as an image, as a mask is, the browser renders it as a picture
  and does not run it. That rule is what makes accepting uploaded SVG safe, so
  a later change must not inline the markup.
- **"Administrators only" (decision 5), and how far it can be enforced.**
  According to Sanity's roles documentation:
  - Administrator and Viewer exist on every plan.
  - Editor, Developer and Contributor need the Growth plan or above.
  - Restricting a role to certain document types, enforced by Sanity's servers,
    needs custom roles, which are Enterprise-only.

  So:
  - **On Growth:** the Studio hides create, edit, publish and delete on `shape`
    for anyone who is not an Administrator. That is a guard in the editing
    screen, not a server rule. An Editor using the API directly could still
    write a shape.
  - **On Enterprise:** a custom role enforces it on Sanity's servers.
  - **On Free:** there is no Editor role at all, so everyone who edits is an
    Administrator, and the restriction means nothing.

  **Choosing the plan is the owner's decision.**

### 7. Colours are token names

- A fixed list of presets, defined in code. The Studio shows them as swatches,
  and an insight stores the preset's name.
- The site maps each name to a class that already exists in `app/tokens.css`,
  so colour values stay in one file and CMS content cannot add a new one.
- The colour fills the shape behind the photo and forms the card's background
  (decision 1).
- **Contrast is checked per preset** when the list is chosen. The card's text
  sits on this colour, so every preset needs readable ink.

### 8. One topic, from a controlled list

Insight carries one reference to a `topic` document (decision 2), so renaming a
topic updates every insight that uses it. `CONTENT-MODEL.md` is updated to
match.

## Consequences

- **The site's first content dependencies:** three packages, 65 in the tree,
  and nothing added to the client-side JavaScript beyond what the cards use.
- New environment variables, a webhook Route Handler, and a `remotePatterns`
  entry in `next.config.ts`. Each is Tier 3 under `AGENTS.md`.
- A second repository to create and deploy, `designally-studio`, with its own
  audit routine: re-audit before each deploy.
- `/insights/<slug>/` is no longer blocked by ADR-002 once content exists in
  Sanity.
- `app/_lib/insights.ts` stays, as the fallback and as the seed content for the
  first import.

## The owner's decisions on the open questions

Settled on 11 September 2026, when the ADR was accepted.

1. **Sanity plan: Free, for now.** Free has only Administrator and Viewer, so
   everyone who edits is an Administrator. Accepted as a starting point.
   - Decision 6's shape restriction therefore has nothing to enforce against:
     neither the Studio-side guard nor a server rule applies while every editor
     is an Administrator.
   - Until then, shapes stay approved-only by team practice.
   - Upgrade to Growth to bring in an Editor role and the Studio-side guard.
2. **Colour presets:** four names, each mapped to an existing token with a
   text colour chosen for contrast. They are defined in `app/_lib/swatches.ts`.

   | Name | Surface token | Ink | Contrast |
   | --- | --- | --- | --- |
   | `orange` | `primary-300` #f56341 | `--ink-on-accent` #ffffff | 3.1:1 |
   | `cream` | `surface-base` #faf9f5 | `--ink-primary` #212121 | 15.3:1 |
   | `dark` | `surface-inverse` #11100e | `--ink-on-accent` | 19.0:1 |
   | `surface-raised` | `surface-raised` #ffffff | `--ink-primary` | 16.1:1 |

   **Orange takes white, by the owner's choice (11 Sept 2026), and it fails AA
   for small text.**
   - At 3.1:1 it passes for the large title, which needs 3:1.
   - It fails for the topic, date and summary, which need 4.5:1.
   - Dark ink (5.2:1) would pass. The card first shipped with it, and the
     owner changed it to white, accepting the shortfall.

   The shape on an orange card with no photo is white too, matching its text,
   as on every preset: the shape takes the ink colour.
3. **Card image proportions: 4:3.** Every shape's viewBox is 4:3, and the site
   asks Sanity for 4:3 crops centred on the editor's focal point.
4. **Preview of unpublished content:** still deferred.

Two implementation notes that follow from the approval:

- **`server-only` is not installed.** Next's docs describe it as a separate
  package, and ADR-007 approved three. The token's protection is that its
  variable has no `NEXT_PUBLIC_` prefix, and the client is imported only by
  server code.
- **The client uses `useCdn: false` and `perspective: 'published'`.** Next
  already caches every read, so Sanity's CDN adds nothing, and skipping it
  avoids relying on how a private dataset is served from it. `published`
  guarantees drafts never reach the site.

## Implementation note: a shape with no photo

Decision 1 has the swatch fill the shape behind the photo and form the card's
background. With no photo, a shape in the background's own colour cannot be
seen. The card therefore fills a photo-less shape with the swatch's ink colour,
so it shows as a solid graphic. **Confirmed by the owner on 11 September
2026.** It is one `fill` value per swatch in `app/_lib/swatches.ts`.

## Research record

Run on 11 September 2026. Nothing was installed. The audits resolved full
dependency trees into lockfiles in a scratch folder (`--package-lock-only
--ignore-scripts`), so no `node_modules` were created and no install scripts
ran.

- Registry metadata: `npm view` for versions, engines, peer dependencies,
  licences (all MIT) and last-modified dates.
- npm's bulk advisory database, queried for the exact candidate versions.
  None was affected.
- `npm audit` on four trees: site with `next-sanity` (1,051 packages, 14
  findings), site with the plain client (65 packages, 0), Studio (1,013
  packages, 14), and Studio with the two overrides (11 moderate, 0 high).
- Next.js docs, as installed with 16.3.4:
  `01-app/01-getting-started/09-revalidating.md`,
  `01-app/02-guides/upgrading/version-16.md`,
  `01-app/03-api-reference/04-functions/revalidateTag.md`, and
  `01-app/01-getting-started/12-images.md`.
- The `@sanity/client` 8.6.1 README, for fetch-option pass-through, `useCdn`
  and the token.
- Sanity's roles documentation (`sanity.io/docs/roles`), read through a
  fetching tool that summarises pages, so the plan details in decision 6 should
  be confirmed on Sanity's own pricing page before a plan is bought.
- Ferre's Studio `package.json`, for the version the team already runs.
