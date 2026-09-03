# Current Site Inventory

Status: Initial audit  
Audit date: 3 September 2026

## Sources

- The `designally-clone` Next.js reconstruction of the current public website.
- The WordPress WXR XML export stored beside the clone.
- The clone's screenshots, extraction data, and visual QA notes.

The compressed WordPress database was not used for this initial audit. It may contain private data and should remain outside Git.

## Summary

The WordPress export contains 2,353 records. Most are media or WordPress system records.

| Content | Count | Notes |
|---|---:|---|
| Media attachment references | 2,161 | URLs and metadata, not the original binary files |
| Published public records reviewed | 55 | Includes pages, posts, projects, and campaign pages |
| Standard WordPress pages | 37 | 30 are published; several are campaign or thank-you pages |
| Insight posts | 9 | Published between 2023 and 2024 |
| Full `works` case studies | 6 | Include project details and service taxonomies |
| Branding records | 6 | Three projects, each with Thai and English records |
| Website records | 4 | Thai descriptions with website type and feature taxonomies |

The clone contains 238 selected public assets and approximately 152 MB of media. It does not contain all 2,161 WordPress media attachments.

## Core pages

| Current URL | Current purpose | Initial recommendation |
|---|---|---|
| `/` | Homepage | Rewrite using the 2026 strategy |
| `/services/` | Service overview | Keep URL and rebuild |
| `/works/` | Work gallery | Keep URL and rebuild around structured projects |
| `/about/` | About, values, clients | Keep URL and rewrite |
| `/thoughts/` | Article listing | Rename to Insights and redirect |
| `/contact-us/` | Contact page and form | Move to `/contact/` and redirect |
| `/privacy-policy/` | Legal | Keep and review text |
| `/cookie-policy/` | Legal | Keep and review text |

## Project candidates

### Full case studies

These records contain a client name, duration, project description, services, and images.

| Project | Current URL | Existing evidence | Migration priority |
|---|---|---|---|
| Skytower | `/works/skytower-rebranding-and-website-projects/` | Rebranding, identity, website; industrial | High |
| Nourigo | `/works/nourigo-supplements-branding-project/` | Brand foundation and identity; consumer products | Medium |
| Fatcoco | `/works/fatcoco-fb-website-project/` | Website design and development; hospitality | Medium |
| Laga | `/works/laga-branding-and-website-project/` | Naming, strategy, identity, packaging, website | High |
| Bitazza | `/works/bitazza-design-support-and-website/` | Long-term creative partner and website work | High |
| INN News | `/works/inn-news-rebranding-and-website-projects/` | Corporate rebranding, verbal identity, website | High |

The six descriptions are useful source material, but they are written as long promotional paragraphs. Rewrite them into Situation, Insight, Strategy, Execution, and Outcome. Do not invent performance results.

### Branding records

| Project | Current records | Existing content | Initial recommendation |
|---|---|---|---|
| Aroma Group | Separate `-th` and `-en` URLs | Short Thai and English descriptions | Merge into one bilingual project model |
| BigC Food Avenue | Separate `-th` and `-en` URLs | Short Thai and English descriptions | Merge into one bilingual project model |
| Unkonscious | Separate `-th` and `-en` URLs | Short Thai and English descriptions | Merge into one bilingual project model |

### Website records

| Project | Current URL | Existing evidence | Initial recommendation |
|---|---|---|---|
| MJet Thailand | `/website/mjet-thailand/` | Premium site and aviation-system integration | Migrate as a project |
| Thai Gem Centre | `/website/thai-gem-centre/` | Custom WooCommerce and payment work | Migrate if it still represents current capability |
| ThaiSangThai | `/website/thaisangthai/` | Candidate search and policy filtering | Review permission and relevance before migration |
| Motif Development | `/website/motif-development/` | Property showcase and sales support | Migrate as a project |

## Existing insight posts

1. The Power of Online Brand Guidelines: Streamlining Your Brand Identity
2. The Art of Consistent Branding: A Comprehensive Guide
3. The Basic Fundamentals of Graphic Design
4. Designing E-Commerce Websites: Strategies for Driving Sales
5. Exploring Brand Archetypes: Unveiling the Personality Behind Your Brand
6. The Art and Science of Naming: Crafting a Brand Identity Through Words
7. Annual Brand Health Check: Preparing for Success in 2024
8. Developing a Strong Brand Identity
9. Elevate Your Brand with Effective Packaging Design: Insights and Best Practices

These articles contain approximately 400–620 words each. They should be reviewed for accuracy, rewritten in the 2026 brand voice, and moved under `/insights/`. The time-specific “Preparing for Success in 2024” article needs a major update or a historical archive decision.

## Campaign and utility content

The export includes branding, website, new-brand, and rebrand advertising pages. It also contains forms and thank-you pages.

Do not migrate these automatically. For each page, check:

- Whether an advertising campaign still sends traffic to it.
- Organic visits and backlinks.
- Whether its message is still consistent with the 2026 strategy.
- Whether a current form depends on its thank-you page.

Thank-you pages should not appear in the XML sitemap and should normally use `noindex`.

## Duplicate and quality issues

- Some exported landing pages appear more than once with the same title, slug, and URL.
- Branding records use separate `-th` and `-en` slugs rather than one clean language architecture.
- The clone documentation mentions both 58 and 74 gallery items. The WordPress Works page contains 74 image references, but only a smaller set has structured project data.
- Several project records contain no normal WordPress body text because their content lives in custom fields.
- Current project titles describe deliverables instead of clearly naming the client.
- Some project descriptions claim broad benefits without evidence. Keep the idea, but replace claims with verified outcomes.
- The current contact form clone validates locally but does not submit anywhere.
- Most inner-page mobile layouts in the clone were estimated rather than measured.

## Media findings

The WordPress export references:

| Format | References |
|---|---:|
| JPG | 698 |
| PNG | 661 |
| SVG | 434 |
| WebP | 264 |
| MP4 | 52 |
| GIF | 38 |
| Other | 14 |

Before the old website is replaced, create a separate backup of the complete WordPress uploads directory. The XML export contains media URLs, not guaranteed copies of the original files.

The clone includes oversized media, including a 45 MB service video, an 18 MB hero video, and several 5–9 MB PNG files. Do not copy these directly into the new production site. Select and optimise assets first.

## Decisions still needed

1. Confirm which projects have client approval for public display.
2. Choose the 6–10 strongest launch case studies.
3. Confirm whether old campaign pages are still used by advertising.
4. Obtain analytics and Search Console data before removing public URLs.
5. Confirm whether English stays at the root and Thai uses `/th/`.
6. Confirm which project outcomes can be published.

