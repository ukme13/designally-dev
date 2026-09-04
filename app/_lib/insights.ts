/**
 * Insight content.
 *
 * The recommended launch set from docs/specs/HOMEPAGE.md. These articles are
 * planned, not written, so nothing links to them yet.
 *
 * Shaped after the Insight document in docs/product/CONTENT-MODEL.md.
 */

export type Insight = {
  topic: string;
  title: string;
  summary: string;
  /** Shown in the homepage's thinking section. */
  featuredOnHome: boolean;
};

export const insights: Insight[] = [
  {
    topic: "Rebranding",
    title: "When Is It Time to Rebrand?",
    summary:
      "The signs that a business has moved forward while its brand has stayed behind.",
    featuredOnHome: true,
  },
  {
    topic: "Brand Strategy",
    title: "Brand Strategy vs Brand Identity: What Does Your Business Need First?",
    summary:
      "What each one does, how they work together, and what your business needs first.",
    featuredOnHome: true,
  },
  {
    topic: "Business & Brand",
    title: "Rebranding a Family Business Without Losing Its Heritage",
    summary:
      "How to protect what matters while preparing the brand for its next generation.",
    featuredOnHome: true,
  },
];

export const featuredInsights = insights.filter(
  (insight) => insight.featuredOnHome,
);
