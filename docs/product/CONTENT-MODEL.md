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
- Summary: the card's description
- Body
- Topic: one primary topic per insight, a reference to a Topic document
- Author
- Published date
- Updated date
- Featured image: a photo with a focal point (Sanity's hotspot and crop) and
  alt text, or an explicit "decorative" flag in place of alt text
- Shape: a reference to one Shape from the admin-managed library. The featured
  image is shown through it as a stencil.
- Colour: one name from the colour presets below. It fills the shape behind the
  photo, and it is the card's background.
- Featured on home
- Status: one of the completeness states below. Only `approved` insights reach
  the site.
- Related services
- Related projects
- Sources or references
- SEO fields

The homepage card shows the featured image through its shape, then the topic,
the title and the summary. With no featured image, the shape shows as a solid
block of its colour.

### Topic

The controlled list of topics for Insight. One document per topic, so renaming
a topic changes it on every insight that uses it.

- Title
- Slug

### Shape

An SVG used as a stencil for insight images. Only Administrators manage shapes;
editors choose from the approved library. See ADR-007 for how that is enforced.

- Name
- SVG file. It must be one filled area on a transparent background. No strokes,
  gradients, text or embedded images, because the stencil uses only the filled
  area.
- Its viewBox is 4:3, the card's image proportions.

### Colour presets

Not a document: a fixed list defined in code and drawn from `app/tokens.css`.
An insight stores the preset's name, never a colour value. That keeps the
palette in one file, and a CMS entry cannot introduce an off-brand colour. The
names are `orange`, `cream`, `dark` and `surface-raised`. ADR-007 lists the
token and text colour each one maps to.

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

Projects and insights use one of these internal states:

- `inventory`: imported facts only.
- `needs-input`: missing strategic story or permission.
- `draft`: being rewritten.
- `review`: ready for Designally review.
- `approved`: approved for publication.

