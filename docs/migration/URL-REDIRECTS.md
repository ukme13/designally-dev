# URL Redirect Plan

Status: Initial proposal. Do not implement until analytics and the final sitemap are reviewed.

## Rules

- Use permanent `301` redirects for content that has a clear replacement.
- Keep existing high-value URLs when changing them provides no clear benefit.
- Never redirect every removed URL to the homepage.
- Keep query parameters used for campaign measurement unless there is a privacy reason not to.
- Remove redirected URLs from the new XML sitemap.
- Test every redirect before launch and check for chains or loops.

## Confirmed structural redirects

| Old URL | Proposed new URL | Reason |
|---|---|---|
| `/thoughts/` | `/insights/` | Rename the content area |
| `/contact-us/` | `/contact/` | Simpler new contact URL |
| `/creative-partner/` | `/services/creative-partner/` | Place service inside service architecture |

## Insight redirects

Each current root-level article should move under `/insights/` while keeping its slug.

Example:

```text
/developing-a-strong-brand-identity/
→ /insights/developing-a-strong-brand-identity/
```

Apply this rule to all nine migrated articles. If an article is merged or substantially replaced, redirect it to the most relevant replacement—not to the Insights index by default.

## Project URLs to retain

Retain these current URLs where possible:

- `/works/skytower-rebranding-and-website-projects/`
- `/works/nourigo-supplements-branding-project/`
- `/works/fatcoco-fb-website-project/`
- `/works/laga-branding-and-website-project/`
- `/works/bitazza-design-support-and-website/`
- `/works/inn-news-rebranding-and-website-projects/`

The slugs are long, but preserving established URLs is safer than changing them without evidence.

## Branding project redirects

| Old URL | Proposed English URL | Proposed Thai URL |
|---|---|---|
| `/branding/aroma-group-en/` | `/works/aroma-group/` | — |
| `/branding/aroma-group-th/` | — | `/th/works/aroma-group/` |
| `/branding/bigc-food-avenue-en/` | `/works/bigc-food-avenue/` | — |
| `/branding/bigc-food-avenue-th/` | — | `/th/works/bigc-food-avenue/` |
| `/branding/unkonscious-en/` | `/works/unkonscious/` | — |
| `/branding/unkonscious-th/` | — | `/th/works/unkonscious/` |

Do not activate the Thai destinations until reviewed Thai project pages exist.

## Website project redirects

| Old URL | Proposed new URL |
|---|---|
| `/website/mjet-thailand/` | `/works/mjet-thailand/` |
| `/website/thai-gem-centre/` | `/works/thai-gem-centre/` |
| `/website/thaisangthai/` | `/works/thaisangthai/` |
| `/website/motif-development/` | `/works/motif-development/` |

## URLs requiring business data

Do not decide these until advertising, analytics, backlink, and form data are checked:

- Branding advertisement landing pages.
- Website advertisement landing pages.
- New-brand campaign pages.
- Rebrand campaign pages.
- Rebrand form page.
- All thank-you pages.
- Online Brand Guide and Digital Brand Book pages.
- `/thoughts/knowledge/` and `/thoughts/tips/` category pages.

Possible actions are retain, rebuild, redirect, set `noindex`, or return `410 Gone`. Choose per URL.

## Launch checks

1. Export final production URLs.
2. Compare them with the complete WordPress URL list.
3. Add explicit redirects to `next.config.ts` or the hosting redirect system.
4. Test status codes and destinations.
5. Confirm canonical URLs.
6. Submit the new sitemap to Google Search Console and Bing Webmaster Tools.
7. Monitor 404 errors after launch.

