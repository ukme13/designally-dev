# Designally Content Model

Status: Initial model for Sanity planning

## Principles

- Model Designally's business, not WordPress's “pages and posts.”
- Store facts once and reference them from other documents.
- Keep English and Thai content connected in one editing workflow.
- Do not require every project to use every field.
- Important content must render as readable HTML text.
- Separate verified facts from promotional copy.

## Core document types

### Project

Required fields:

- Name
- Slug
- Short summary
- Client reference
- Business stage: Creation, Growth, or Transformation
- Services
- Industry
- Country
- Year
- Hero media
- Publication status

Story fields:

- Situation
- Challenge
- What we found
- Strategy
- Creative idea
- Execution
- Outcome
- Verified result metrics
- Client quotation

Supporting fields:

- Gallery
- Video
- Credits
- Duration
- External project URL
- Related projects
- Related insights
- Featured-on-home flag

SEO fields:

- SEO title
- Meta description
- Social sharing image
- Canonical override, used only when necessary
- Indexing control

### Client

- Name
- Slug
- Logo
- Website
- Industry
- Country
- Short description
- Approved-for-public-display flag

### Service

- Name
- Slug
- Short promise
- Client situations
- What it includes
- Deliverables
- Process
- Typical duration
- Questions and answers
- Related projects
- Related insights
- SEO fields

Initial services:

1. Brand Strategy
2. Branding and Brand Identity
3. Rebranding
4. Websites and Digital Experiences
5. Creative Partner

### Insight

- Title
- Slug
- Summary
- Body
- Topic
- Author
- Published date
- Updated date
- Featured image
- Related services
- Related projects
- Sources or references
- SEO fields

### Person

- Name
- Role
- Biography
- Portrait
- Languages
- Expertise
- Social profile links

### Standard Page

Use for About, Contact, Privacy Policy, Cookie Policy, and limited campaign pages.

- Title
- Slug
- Page sections
- SEO fields
- Publication and indexing settings

### Site Settings

- Company name
- Business description
- Address
- Telephone
- Email
- Social links
- Default SEO metadata
- Navigation
- Footer
- Default social image
- Contact form recipients

## Reusable objects

- Localised text
- SEO metadata
- Image with alternative text and caption
- Video with poster and transcript or description
- Call to action
- Quote
- Result metric
- Question and answer
- Content section
- Link

## Controlled references

Use referenced documents for:

- Client
- Service
- Industry
- Business stage
- Person

Do not store long comma-separated lists when an editor should select a controlled option.

## WordPress migration mapping

| WordPress source | New model |
|---|---|
| `works` | Project |
| `branding` | Project with connected English and Thai content |
| `website` | Project |
| `post` | Insight |
| Core `page` records | Standard Page or dedicated page document |
| Elementor templates | Do not migrate as content |
| Campaign pages | Standard Page only if still active |
| Attachments | Sanity asset plus metadata after selection |

## Content completeness states

Projects should use one of these internal states:

- `inventory`: imported facts only.
- `needs-input`: missing strategic story or permission.
- `draft`: being rewritten.
- `review`: ready for Designally review.
- `approved`: approved for publication.

