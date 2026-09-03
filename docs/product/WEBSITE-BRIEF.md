# Designally Website Brief

Status: Working draft for review  
Updated: 3 September 2026

## Project

Redesign `designally.co` as the main business-development website for
Designally, a strategy-led branding and design agency based in Bangkok,
Thailand.

The website must feel like a premium creative studio while making the business
easy to understand for clients, search engines, and AI search systems.

## The business problem

The current website shows a large amount of visual work, but it does not always
explain the thinking, business situation, or result behind that work. It also
contains duplicate campaign pages, disconnected Thai and English records, and
only a small number of complete case studies.

The redesign must close the gap between the quality of Designally's work and
the way the business is understood online.

## Positioning

### Brand line

> More Than Creative. We Build What Matters.

### Clear market description

Designally is a strategy-led branding and design agency in Bangkok, Thailand.
We help businesses create, grow, and transform through brand strategy,
identity, digital experiences, and creative execution.

### Core belief

Foundation Before Output. The strongest creative work begins with a clear
understanding of the business, its audience, and what needs to change.

## Website goals

1. Generate qualified enquiries for branding, rebranding, digital, and ongoing
   creative work.
2. Position Designally as a credible partner for Thai and international
   clients.
3. Prove strategic thinking through clear, useful case studies.
4. Make Designally discoverable for relevant non-brand searches and AI-assisted
   research.
5. Make the agency easy to understand, trust, and contact.

## What the website is not

- A gallery with little explanation.
- A long list of every service Designally can provide.
- A collection of copied keyword pages for different countries or cities.
- A place for unverified results or unsupported marketing claims.
- A replacement for a sales proposal.
- A website aimed at low-budget design shopping.

## Priority audiences

### 1. Business transformation leader

They think, “We have outgrown who we were.” They need to explain and justify a
significant change to family members, a board, employees, or customers.

The website must show mature thinking, a safe process, and relevant
transformation work.

### 2. Business with growth friction

They know something is not working, but may not know whether the problem is
strategy, identity, communication, or digital experience.

The website must help them recognise the problem before presenting a service.

### 3. Corporate marketing buyer

They need a reliable agency, a clear process, predictable communication, and a
result they can defend internally.

The website must reduce career risk through evidence, clarity, and trust.

### 4. Exacting founder

They have strong instincts and want a partner who understands their ambition
without taking control away from them.

The website must feel intelligent, collaborative, and direct.

## Main user questions

The website should answer these questions without making visitors search for
them:

1. Is Designally suitable for a business like ours?
2. Do they understand business problems, not only visual design?
3. What kind of branding and digital work do they do?
4. Have they solved a situation similar to ours?
5. How do they work, and what will the process feel like?
6. Are they based in Thailand, and can they work with an international team?
7. What should we prepare before contacting them?
8. What happens after we send an enquiry?

## Message hierarchy

1. **Client reality:** the business and brand may no longer match.
2. **Brand promise:** More Than Creative. We Build What Matters.
3. **Category:** strategy-led branding and design agency in Bangkok, Thailand.
4. **Situations:** Creation, Growth, and Transformation.
5. **Method:** Foundation Before Output.
6. **Capabilities:** strategy, identity, rebranding, digital, and creative
   partnership.
7. **Evidence:** approved projects, process, people, client facts, and verified
   outcomes.
8. **Action:** tell Designally what is changing.

## Launch scope

### Required pages

- Home
- Work index
- Six to ten approved project pages
- Services overview
- Brand Strategy
- Branding and Brand Identity
- Rebranding
- Websites and Digital Experiences
- Creative Partner
- About
- Insights index
- Three to six reviewed insight articles
- Contact
- Privacy Policy
- Cookie Policy

The full URL structure is defined in [SITEMAP.md](./SITEMAP.md).

### Later pages

- Situation-specific pages for Creation, Growth, and Transformation.
- A useful “Branding Agency in Thailand” page for international buyers.
- More Thai pages as reviewed Thai content becomes ready.
- Additional case studies after permission and content review.

## Language and international approach

- Keep English at the root, for example `/services/rebranding/`.
- Publish Thai equivalents under `/th/`, for example
  `/th/services/rebranding/`.
- Use a visible language switcher. Never force a visitor to change language
  based only on location.
- Connect equivalent pages with `hreflang` annotations.
- Use reviewed, natural Thai and English. Do not publish raw automatic
  translations.
- Show the Bangkok location clearly while using language that welcomes work
  across Thailand, Southeast Asia, and international markets.

## Content standards

### Case studies

Every launch case study should include as much of this structure as the evidence
allows:

1. Situation
2. Challenge
3. What Designally learned
4. Strategy
5. Creative idea
6. Execution
7. Outcome
8. Verified result or a clear statement that no public metric is available

Do not invent metrics. Confirm client permission before publishing names,
quotes, internal information, or results.

### Service pages

Each service page must explain:

- The business situations that make the service useful.
- What Designally helps the client decide.
- What the engagement may include.
- How the work happens.
- Relevant proof.
- Common questions in plain language.
- A clear next step.

### Insights

Insights should provide original experience, a clear point of view, useful
examples, and an author or reviewer. Avoid generic articles that repeat common
advice without adding Designally's knowledge.

## Conversion plan

### Primary action

**Tell us what's changing.**

This should lead to the contact page or enquiry form.

### Secondary action

**View selected work.**

### Contact form information

Keep the first contact simple:

- Name
- Work email
- Company
- What is changing or not working?
- Service of interest, optional
- Expected timing, optional
- Budget range, if Designally decides it is useful for qualification
- Consent to the privacy policy

After submission, explain the response time and next step. The form must have a
real delivery service and failure handling before launch.

## Search and AI visibility requirements

Search engine optimisation (SEO), answer engine optimisation (AEO), and
generative engine optimisation (GEO) should use the same foundation:

- Important content must be visible as real HTML text.
- Each page must have one clear purpose, title, description, heading structure,
  and canonical URL.
- Pages must link naturally to related services, projects, and insights.
- Facts about the company must be consistent across the website and public
  business profiles.
- Structured data must match visible page content.
- Images need useful alternative text when they communicate information.
- Videos need a poster and a short written description or transcript where
  appropriate.
- Maintain an XML sitemap and correct index/noindex rules.
- Do not add `llms.txt`, special “AI schema,” or large blocks of artificial
  question content only to target AI systems.

Google states that its existing SEO guidance still applies to AI search
features and that no special AI markup is required.

## Technical and experience requirements

- Responsive layouts from small mobile screens to wide desktop screens.
- Semantic HTML and keyboard access.
- Visible focus states and meaningful alternative text.
- Respect reduced-motion settings.
- Strong Core Web Vitals, with special attention to image and video weight.
- Server-render important page content.
- Optimise selected media instead of copying all WordPress assets.
- Avoid adding a dependency unless it solves a clear project need.
- Provide useful error, empty, loading, and form-success states.

## Measurement

Configure analytics only after the privacy and cookie approach is agreed.
Measure:

- Qualified enquiry submissions.
- Visits from non-brand organic searches.
- Visits to service and case-study pages before an enquiry.
- Which case studies support enquiries.
- English and Thai page performance.
- Visitor country at an aggregated level.
- Search queries and indexing through Google Search Console.
- Core Web Vitals and important form errors.

Do not treat raw page views or time on site as the main business result.

## Evidence needed before launch

- Client approval for every public case study.
- Final selection of six to ten launch projects.
- Verified outcomes, dates, services, and credits.
- Current team information and approved portraits.
- Correct office address, phone number, email, and social profiles.
- Confirmation of “6 years” and “150+ brands,” or updated proof points.
- Current legal and cookie text.
- Analytics and Search Console data for redirect decisions.

## Open decisions

1. Confirm English at `/` and Thai under `/th/`.
2. Choose the launch case studies.
3. Choose which proof points can be published.
4. Confirm whether the website launches English-first or bilingual.
5. Confirm the contact form destination and expected response time.
6. Confirm the content management system before content migration begins.

## Definition of launch-ready

The website is ready to launch when:

- All required pages have approved English content.
- Every public claim and case study has been checked.
- Important old URLs have a tested destination.
- Metadata, canonical URLs, language annotations, robots rules, and the sitemap
  are correct.
- The contact form delivers successfully and handles errors.
- Accessibility, responsive layouts, performance, and browser behaviour have
  been tested.
- Analytics, Search Console, and post-launch monitoring are prepared.

## Current guidance used

- [Google: AI features and your website](https://developers.google.com/search/docs/appearance/ai-features)
- [Google: Optimising for generative AI features](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide)
- [Google: Localised versions of pages](https://developers.google.com/search/docs/specialty/international/localized-versions)
- [Google: Organisation structured data](https://developers.google.com/search/docs/appearance/structured-data/organization)

