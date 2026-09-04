/**
 * Project content.
 *
 * Facts come from docs/audits/CURRENT-SITE-INVENTORY.md and
 * docs/specs/HOMEPAGE.md. Business stage is only stated where those documents
 * state it. No outcomes, metrics or client quotations appear here — those need
 * evidence and permission first.
 *
 * Shaped after the Project document in docs/product/CONTENT-MODEL.md, so
 * moving to a CMS is a change of data source rather than a rewrite.
 * `featuredOnHome` is that model's own field.
 */

export type Project = {
  name: string;
  stage: string;
  services: string;
  industry: string;
  /** Shown in the homepage's selected-work grid. */
  featuredOnHome: boolean;
  /**
   * Placeholder treatment standing in for hero media, which is pending asset
   * selection and client permission.
   */
  background: string;
  foreground: string;
  mark: string;
};

export const projects: Project[] = [
  {
    name: "Skytower",
    stage: "Transformation",
    services: "Rebranding · Identity · Website",
    industry: "Industrial",
    featuredOnHome: true,
    background: "bg-primary-300",
    foreground: "text-white",
    mark: "S",
  },
  {
    name: "INN News",
    stage: "Transformation",
    services: "Rebranding · Verbal identity · Website",
    industry: "Media",
    featuredOnHome: true,
    background: "bg-secondary-400",
    foreground: "text-white",
    mark: "INN",
  },
  {
    name: "Laga",
    stage: "Creation",
    services: "Naming · Strategy · Identity · Packaging · Website",
    industry: "Consumer products",
    featuredOnHome: true,
    background: "bg-text-primary",
    foreground: "text-white",
    mark: "L",
  },
  {
    name: "Bitazza",
    stage: "Growth",
    services: "Creative partnership · Digital",
    industry: "Financial technology",
    featuredOnHome: true,
    background: "bg-primary-100",
    foreground: "text-text-primary",
    mark: "B",
  },
  {
    name: "Nourigo",
    stage: "Stage to be confirmed",
    services: "Brand foundation · Identity",
    industry: "Consumer products",
    featuredOnHome: false,
    background: "bg-secondary-200",
    foreground: "text-text-primary",
    mark: "N",
  },
  {
    name: "Fatcoco",
    stage: "Stage to be confirmed",
    services: "Website design · Development",
    industry: "Hospitality",
    featuredOnHome: false,
    background: "bg-neutral-150",
    foreground: "text-text-primary",
    mark: "F",
  },
];

export const featuredProjects = projects.filter(
  (project) => project.featuredOnHome,
);
