/**
 * Service content.
 *
 * The shape mirrors the Service document in docs/product/CONTENT-MODEL.md, so
 * moving this to a CMS later means replacing the data source rather than
 * rewriting the pages. Sections follow the service page requirements in
 * docs/product/WEBSITE-BRIEF.md.
 *
 * Draft content. Nothing here states a client result, a price, a duration or a
 * named reference — those need evidence and permission before publication.
 */

export type ServiceProcessStep = {
  number: string;
  title: string;
  description: string;
};

export type ServiceFaq = {
  question: string;
  answer: string;
};

export type Service = {
  slug: string;
  name: string;
  /** One-line promise, shared with the services index and the homepage. */
  shortPromise: string;
  intro: string;
  /** Business situations that make this service useful. */
  situations: string[];
  /** What Designally helps the client decide. */
  decisions: string[];
  /** What the engagement may include. */
  includes: string[];
  /** How the work happens. */
  process: ServiceProcessStep[];
  faqs: ServiceFaq[];
  seo: {
    title: string;
    description: string;
  };
  /**
   * Not populated. No engagement duration is confirmed for publication, and
   * related projects need permission and evidence review first. Both fields
   * exist so the CMS mapping is already in place.
   */
  typicalDuration?: string;
  relatedProjects?: string[];
};

export const services: Service[] = [
  {
    slug: "brand-strategy",
    name: "Brand Strategy",
    shortPromise:
      "Clarify the market, audience, position, and direction before making visible decisions.",
    intro:
      "Strategy is the part of the work that decides what everything else is for. It sets out who the business is for, what it stands against, and what has to be true before design can carry any of it.",
    situations: [
      "The business has changed, but the way it explains itself has not.",
      "Different people inside the company describe the business differently.",
      "Marketing produces activity without producing recognition.",
      "A decision about naming, structure or investment is waiting on a clearer direction.",
    ],
    decisions: [
      "Which audience the brand is actually built for, and who it is not for.",
      "What the business stands for, in language its own team will use.",
      "Where it sits against the alternatives a buyer is really considering.",
      "What has to change first, and what should be protected.",
    ],
    includes: [
      "Interviews with the people who run, sell and deliver the work",
      "Review of the market and the alternatives a buyer compares",
      "Audience and segment definition",
      "Positioning and the argument behind it",
      "Messaging structure and language guidance",
      "A written direction the team can act on",
    ],
    process: [
      {
        number: "01",
        title: "Understand",
        description:
          "We start inside the business — how it makes money, who it serves, and where the friction actually sits. Then we look outward.",
      },
      {
        number: "02",
        title: "Decide",
        description:
          "We put the choices in front of you plainly, with the trade-offs attached. Strategy is a set of decisions, not a document.",
      },
      {
        number: "03",
        title: "Write it down",
        description:
          "The direction is recorded in language the team can repeat without us in the room, so it survives contact with real work.",
      },
    ],
    faqs: [
      {
        question: "We already have a logo. Do we still need strategy?",
        answer:
          "Often yes. A logo settles what the business looks like, not what it means or who it is for. If the team cannot describe the business the same way twice, the gap is upstream of the identity.",
      },
      {
        question: "Is this research, or is it opinion?",
        answer:
          "Both, in that order. We gather what is actually true about the business and its market, then take a clear position on what it should do. Research without a recommendation is not much use to you.",
      },
      {
        question: "Can strategy and identity run together?",
        answer:
          "They can overlap, and often should. What we avoid is designing an identity before anyone has agreed what it is meant to express.",
      },
    ],
    seo: {
      title: "Brand Strategy",
      description:
        "Brand strategy from Designally in Bangkok: positioning, audience, and direction agreed before any visible design decision is made.",
    },
  },
  {
    slug: "branding-identity",
    name: "Branding and Brand Identity",
    shortPromise:
      "Turn strategy into a clear verbal and visual system people can recognise and use.",
    intro:
      "Identity is where the direction becomes something people can see, read and remember. The aim is a system the business can actually run — not a set of images that only works in the presentation that introduced them.",
    situations: [
      "A new business or product needs to be recognisable from the start.",
      "The current identity was assembled over time and no longer holds together.",
      "Every new piece of work restarts the same design argument.",
      "The business looks smaller or less established than it is.",
    ],
    decisions: [
      "How the brand should feel before anyone reads a word of it.",
      "What stays fixed across everything, and what is allowed to flex.",
      "How the name, voice and visual system work as one thing.",
      "What the team needs in order to apply it without us.",
    ],
    includes: [
      "Verbal identity: name usage, tone of voice, core messages",
      "Visual identity: logo system, colour, typography, layout, imagery",
      "Application across the formats the business actually uses",
      "Guidelines written for the people who will use them",
      "Working files and asset handover",
    ],
    process: [
      {
        number: "01",
        title: "Set the direction",
        description:
          "We agree the territory in words first, so the visual exploration has something to be measured against.",
      },
      {
        number: "02",
        title: "Design the system",
        description:
          "We develop the identity as a working system, tested against the real situations it has to survive.",
      },
      {
        number: "03",
        title: "Hand it over",
        description:
          "Guidelines, files and the reasoning behind the decisions, so the team can keep it consistent as it grows.",
      },
    ],
    faqs: [
      {
        question: "How many logo options will we see?",
        answer:
          "We present the directions we can argue for, usually a small number, each with the thinking attached. A long list of options tends to move the decision away from the strategy and towards personal taste.",
      },
      {
        question: "Do we get the source files?",
        answer:
          "Yes. Working files and exported assets are part of the handover.",
      },
      {
        question: "Will this work in Thai and English?",
        answer:
          "We work in both. Typography, tone and layout are considered in both languages rather than designed in English and translated afterwards.",
      },
    ],
    seo: {
      title: "Branding and Brand Identity",
      description:
        "Brand identity design from Designally in Bangkok: verbal and visual systems built to be used, not just presented.",
    },
  },
  {
    slug: "rebranding",
    name: "Rebranding",
    shortPromise:
      "Help an established business change without losing what already has value.",
    intro:
      "Rebranding is a change-management problem as much as a design one. The work is to move the business forward while keeping the recognition, relationships and meaning it has already earned.",
    situations: [
      "The business has outgrown the brand it started with.",
      "A merger, acquisition or new generation of leadership has changed what the company is.",
      "The name or identity now limits where the business can go.",
      "The brand needs to be explained to a board, a family, staff or long-standing customers.",
    ],
    decisions: [
      "What is genuinely worth carrying forward, and what is only habit.",
      "How far the change should go — evolution or a clean break.",
      "How the change is explained to the people it affects.",
      "What order things change in, and what that will cost.",
    ],
    includes: [
      "Audit of the current brand and what it is doing well",
      "Strategy and positioning for where the business is going",
      "Identity design, evolved or rebuilt as the decision requires",
      "Transition planning across the business's touchpoints",
      "Internal launch material to explain the change to staff",
      "Guidelines and handover",
    ],
    process: [
      {
        number: "01",
        title: "Find out what has value",
        description:
          "Before changing anything, we establish what the current brand is carrying that would be expensive to lose.",
      },
      {
        number: "02",
        title: "Agree the distance",
        description:
          "How much change the business needs is a decision with consequences. We make those consequences explicit before design starts.",
      },
      {
        number: "03",
        title: "Build and transition",
        description:
          "The new system is designed alongside a plan for how it replaces the old one, in an order the business can absorb.",
      },
    ],
    faqs: [
      {
        question: "Will we lose the recognition we have built?",
        answer:
          "That is the risk the work exists to manage. We identify what people actually recognise — which is often not the whole identity — and make deliberate decisions about what carries over.",
      },
      {
        question: "Do we have to change the name?",
        answer:
          "Usually not. A name change is a large, expensive decision and we only recommend it when the current name is genuinely holding the business back.",
      },
      {
        question: "How do we explain this internally?",
        answer:
          "We treat that as part of the work. A rebrand that the staff cannot explain tends not to survive its first year.",
      },
    ],
    seo: {
      title: "Rebranding",
      description:
        "Rebranding for established businesses, from Designally in Bangkok. Change the brand without losing what already has value.",
    },
  },
  {
    slug: "websites",
    name: "Websites and Digital Experiences",
    shortPromise:
      "Create useful digital experiences that express the brand and support the business.",
    intro:
      "A website is usually the first place the brand has to work without anyone there to explain it. It has to say what the business is, be genuinely usable, and be something the team can keep updated.",
    situations: [
      "The website looks dated next to the quality of the work.",
      "Visitors arrive, but nothing useful happens next.",
      "The site cannot be updated without going back to whoever built it.",
      "The business has changed and the website still describes the old one.",
    ],
    decisions: [
      "What the site is actually for, and how that will be measured.",
      "What a visitor needs to understand, in what order.",
      "What the team must be able to change themselves.",
      "Which content genuinely needs to exist, and which does not.",
    ],
    includes: [
      "Structure, content model and page planning",
      "Interface and interaction design",
      "Content writing or content direction",
      "Build, with attention to performance and accessibility",
      "Content management setup and editor training",
      "Search foundations: structure, metadata, redirects",
    ],
    process: [
      {
        number: "01",
        title: "Decide what it is for",
        description:
          "We agree the job of the site and the questions it has to answer before designing a single page.",
      },
      {
        number: "02",
        title: "Design and build",
        description:
          "Structure first, then interface, then build — tested on real content rather than placeholder text.",
      },
      {
        number: "03",
        title: "Hand over the controls",
        description:
          "The team is set up to publish and change things without depending on us for routine work.",
      },
    ],
    faqs: [
      {
        question: "Can our team update it ourselves?",
        answer:
          "That is the intention. We set up the content system around the way your team actually works, and train the people who will use it.",
      },
      {
        question: "Do you handle the writing?",
        answer:
          "We can write it, or direct and edit content your team drafts. Either way, the writing is treated as part of the design rather than something poured in afterwards.",
      },
      {
        question: "What about existing search rankings?",
        answer:
          "Existing URLs, redirects and metadata are planned before launch. Losing established URLs without a tested destination is one of the most common ways a redesign damages a business.",
      },
    ],
    seo: {
      title: "Websites and Digital Experiences",
      description:
        "Website design and development from Designally in Bangkok: digital experiences that express the brand and stay usable for the team.",
    },
  },
  {
    slug: "creative-partner",
    name: "Creative Partner",
    shortPromise:
      "Provide ongoing strategic and creative support as the brand grows and changes.",
    intro:
      "Some businesses do not need a project. They need consistent creative judgement available as things come up, from a team that already understands the brand and does not need re-briefing every time.",
    situations: [
      "There is a steady flow of creative work but no in-house team to hold the standard.",
      "The brand drifts as different suppliers interpret it differently.",
      "An internal marketing team needs senior creative support rather than more hands.",
      "The business wants continuity instead of restarting with a new agency each year.",
    ],
    decisions: [
      "Which work is worth doing, and which is not.",
      "Where to hold the line on consistency and where to allow range.",
      "What is handled internally and what comes to us.",
      "How the brand should develop as the business changes.",
    ],
    includes: [
      "An agreed scope of ongoing strategic and creative support",
      "Campaign, content and communication work",
      "Design support across digital and print",
      "Brand governance as the system is applied by others",
      "Regular working sessions with your team",
    ],
    process: [
      {
        number: "01",
        title: "Agree how we work",
        description:
          "We set the scope, the rhythm and the route in, so requests do not have to be negotiated from scratch each time.",
      },
      {
        number: "02",
        title: "Work in the open",
        description:
          "Ongoing sessions with your team, so context builds up instead of being re-explained.",
      },
      {
        number: "03",
        title: "Keep the brand coherent",
        description:
          "As more people produce work under the brand, we keep the system consistent and develop it deliberately.",
      },
    ],
    faqs: [
      {
        question: "Is this a retainer?",
        answer:
          "It is usually structured as ongoing support with an agreed scope. The right shape depends on how much work there is and how your team prefers to work, so we set it after a conversation rather than before.",
      },
      {
        question: "Can we start with a project instead?",
        answer:
          "Frequently that is the better order. Many partnerships begin as a strategy or identity project and continue from there.",
      },
      {
        question: "Do we work with your team or only with you?",
        answer:
          "With your team. The arrangement works best when it supplements the people you already have rather than replacing them.",
      },
    ],
    seo: {
      title: "Creative Partner",
      description:
        "Ongoing strategic and creative partnership from Designally in Bangkok, for businesses that need continuity rather than one-off projects.",
    },
  },
];

export const serviceSlugs = services.map((service) => service.slug);

export function getService(slug: string): Service | undefined {
  return services.find((service) => service.slug === slug);
}

export function servicePath(slug: string): string {
  return `/services/${slug}/`;
}
