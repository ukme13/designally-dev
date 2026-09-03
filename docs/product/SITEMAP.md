# Designally 2026 Sitemap

Status: Proposed for review

## Language recommendation

Keep English as the default language at the root. Add Thai pages under `/th/` when reviewed Thai content is ready.

This preserves the strongest current URLs and supports international visitors without moving every English page under `/en/`.

Rules:

- Provide a visible language switcher.
- Add `hreflang` for English, Thai, and `x-default`.
- Do not redirect visitors based only on their IP address.
- Do not publish incomplete or automatic Thai translations.

## Launch sitemap

```text
/
├── works/
│   └── [project-slug]/
├── services/
│   ├── brand-strategy/
│   ├── branding-identity/
│   ├── rebranding/
│   ├── websites/
│   └── creative-partner/
├── about/
├── insights/
│   └── [article-slug]/
├── contact/
├── privacy-policy/
└── cookie-policy/
```

The navigation label can be “Work” while the existing `/works/` URL is retained.

## Page responsibilities

| Page | Main job | Primary evidence | Main action |
|---|---|---|---|
| Home | Explain the position and direct visitors | Selected work, 150+ brands, approach | Start a conversation |
| Works | Prove capability through real projects | Case-study index and filters | View a case study |
| Project | Explain the problem, thinking, work, and outcome | Client facts, process, media, result | Discuss a similar need |
| Services | Introduce the capability system | Strategy, identity, digital, partnership | Choose a service |
| Service detail | Answer commercial questions | Method, deliverables, examples | Discuss a project |
| About | Establish trust and identity | People, principles, clients, Bangkok base | Meet Designally |
| Insights | Organise useful thinking | Original articles | Read an article |
| Contact | Make enquiry simple | Contact methods and expectations | Submit an enquiry |

## Homepage order

1. Hero: “More Than Creative. We Build What Matters.”
2. Situation: Creation, Growth, Transformation.
3. Selected work.
4. Point of view: Foundation Before Output.
5. Capabilities.
6. Proof and company credibility.
7. Selected insights.

The closing contact action is no longer a homepage section. It is part of the
global footer, so every route ends with it — matching the current site, where
the orange call-to-action block precedes the legal bar on every page. Two
consecutive orange blocks was the reason it was removed from the homepage.

## Phase two

Add these only when there is enough original content:

- `/situations/creating-a-new-brand/`
- `/situations/growing-beyond-your-brand/`
- `/situations/business-transformation/`
- `/branding-agency-thailand/`
- Thai versions under `/th/`

Do not create copied location pages for Singapore, the UK, the US, or other markets.

## Not in public navigation

- Form thank-you pages.
- Active advertising landing pages.
- Sanity Studio.
- Preview routes.

These pages require suitable `noindex`, authentication, or both.

