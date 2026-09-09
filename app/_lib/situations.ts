import type { Situation } from "@/app/_components/situation-cards";

/**
 * The three business situations the homepage opens with.
 *
 * Content, kept beside the other content modules rather than inside the page —
 * app/_lib/projects.ts, services.ts and insights.ts all sit here for the same
 * reason. A page should read as a layout; the words it lays out belong
 * somewhere they can be found without scrolling past a section's markup.
 *
 * Typed against the card component's own `Situation`, so a field renamed there
 * fails here rather than rendering blank.
 *
 * Nothing in this file states a fact about a client, a result or a timescale.
 * It describes what the agency does, in the agency's own words.
 */
export const situations: readonly Situation[] = [
  {
    number: "01",
    name: "Creation",
    question: "Starting something new?",
    description:
      "Turn the idea into a clear brand that people can understand, trust, and choose.",
    action: "Build the right foundation",
  },
  {
    number: "02",
    name: "Growth",
    question: "Growing, but something is not working?",
    description:
      "Find the gap between the business you have built and the way your brand is working for it.",
    action: "Find what is holding the brand back",
  },
  {
    number: "03",
    name: "Transformation",
    question: "Has the business outgrown its brand?",
    description:
      "Build a brand that reflects where the business is going next—and make the case for change.",
    action: "Prepare the brand for change",
  },
];

