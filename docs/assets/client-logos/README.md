# Selected client logos — handoff for Claude

Selected on 2026-09-11 for the homepage under **05 / Proof**.
Source: [Designally's existing About page](https://designally.co/about/).
The owner requested a selection from this page and local logo files.

## Recommended selection

Use 16 logos in two rows of eight. This is an editorial recommendation based
on a mix of company sizes and industries, not a ranking of project results.

| Row | Logos, left to right |
| --- | --- |
| 1 | Marriott, SCG, Lazada, CP Land, LINE, Major Cineplex, Bangkok University, Bitazza |
| 2 | SO/ Bangkok, SC ASSET, DDProperty, StashAway, Boonthavorn, Banpu NEXT, Pomelo, Aroma Group |

The mix represents corporate, hospitality, property, education, retail,
digital services, finance, energy, and food businesses. Bitazza also connects
with the existing homepage showreel. These selections do not establish the
scope of work, a direct contract, a group-wide relationship, or a measured result.
For Marriott, preserve the source artwork's specific identity; do not substitute
a broader Marriott group mark without confirming the actual client entity.

## Files and quality

- `originals/` contains 16 unchanged JPGs downloaded from the existing page.
- `manifest.json` records each name, suggested row/order, source URL, dimensions,
  file size, retrieval date, and SHA-256 checksum (a file integrity record).
- All source files are only **174 × 123 pixels**, with no transparent background.
  The inspected Marriott image is marked as the full-size asset in the source
  HTML, with no higher-resolution image offered in that element.
- These are source/reference assets, not finished artwork for the new strip.
  No logos were redrawn, traced, recoloured, or generated.

## Implementation handoff

Read `AGENTS.md`, `docs/specs/HOMEPAGE.md`, and this manifest first.
There is already a component at `app/_components/client-logo-strip.tsx`, mounted
below Proof, and an empty list at `app/_lib/clients.ts`. Use the existing work.

The component uses each image as a CSS mask: transparency defines the visible
logo shape. These opaque JPGs would produce solid rectangles, so **do not add
them directly to the current mask implementation**. Renaming or wrapping a JPG
inside an SVG does not fix this.

Prefer matching original transparent SVGs from Designally's project files or
the client's official brand assets. Transparent PNGs also work with the mask;
SVG is not a technical requirement. Background removal from the existing JPGs
is an option if it preserves the artwork and is clear at the displayed size.
Do not invent or redraw logo details. Preserve the actual client identity and
original proportions. Put production-ready assets in `public/clients/` and
record their actual dimensions when populating the list. Update SVG-only
comments in the application if PNGs are used.

Follow the supplied reference: two static offset rows, generous spacing, similar
visual logo sizes, existing colour tokens, and soft fades at both outer edges.
Do not add cards or another heading. Verify using the repository's required tier.

## Publication record

**Permission confirmed by the Designally owner on 2026-09-11 for all 16 logos.**
See [the permission record](../../content/CLIENT-LOGO-PERMISSIONS.md).
The owner confirmed existing permission for reuse in this website redesign.
Set `approvedForPublicDisplay: true` when adding these clients, and reference
`docs/content/CLIENT-LOGO-PERMISSIONS.md — 2026-09-11` in the permission field.
Do not request permission again for this scope. Artwork preparation is the
remaining task; publication permission is no longer a blocker.

## Verification

All 16 downloads succeeded. File inspection identified each as a 174 × 123 JPEG;
JPEG start/end markers and file sizes were checked, and checksums were saved.
No visual review was run, per repository instructions. No application files
were changed. Typecheck, lint, both builds, and generated HTML checks were
skipped because this handoff adds documentation and source assets only.

## Prepared artwork — 2026-09-11

`public/clients/<slug>.png`, made from `originals/` by `prepare-masks.py` in
this folder. It uses macOS `sips` and the Python standard library, so no new
dependency. Run it from the repository root to regenerate all 16.

- **Background removal only.** White becomes transparent on a ramp: a pixel
  within 12 of white is clear, 64 or more is solid, and anti-aliased edges stay
  partial. Distance is the strongest colour channel's shortfall from white, so
  bright colours stay solid rather than fading. The empty margin around each
  logo is cropped. Nothing is redrawn, traced, upscaled or sharpened.
- **One-ink masks by design.** The files are black with transparency, and
  brand colours are not kept, because the strip paints every logo in
  `bg-text-primary`. White shapes inside a logo, such as the SCG elephant, the
  Bitazza cube and Bangkok University's facet highlights, become cut-outs.
  That is how a one-colour version of each logo reads.
- **Checked.** Every file reads back through an independent decoder (`sips`)
  with an alpha channel. Bangkok University, Bitazza, SO/ Bangkok, SCG and Major
  Cineplex were inspected after conversion.
- **Resolution is the limit.** The crops are 19 to 108 px tall. At the strip's
  desktop sizes on a 2× screen, the browser scales them up by 1.0× for the
  three square marks and by up to 2.7× for SO/ Bangkok and Banpu NEXT. Those
  two single-line wordmarks will look soft. Boonthavorn (2.0×) and Pomelo,
  CP Land and DDProperty (about 1.8×) will look slightly soft. Replace those
  first with the client's official transparent artwork when it is available,
  and update the width and height in `app/_lib/clients.ts`.
