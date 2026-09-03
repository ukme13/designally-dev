import type { MetadataRoute } from "next";

import { serviceSlugs, servicePath } from "@/app/_lib/services";

type PublicRoute = {
  /** Path relative to the site root. Trailing slash required, see next.config.ts. */
  path: string;
  /**
   * Whether the page may appear in search results. A route marked false is
   * left out of the sitemap, and its page must also set
   * `robots: { index: false }` in its own metadata.
   *
   * It is deliberately NOT disallowed in robots.txt: a crawler has to fetch
   * the page to see the noindex directive, so blocking it would keep the page
   * indexable from external links.
   */
  indexable: boolean;
  changeFrequency: NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>;
  priority: number;
};

/** Every publicly reachable route. Add new routes here when they ship. */
export const publicRoutes: PublicRoute[] = [
  { path: "/", indexable: true, changeFrequency: "monthly", priority: 1 },
  { path: "/works/", indexable: true, changeFrequency: "monthly", priority: 0.9 },
  { path: "/services/", indexable: true, changeFrequency: "monthly", priority: 0.9 },
  { path: "/contact/", indexable: true, changeFrequency: "yearly", priority: 0.8 },
  { path: "/about/", indexable: true, changeFrequency: "yearly", priority: 0.7 },
  { path: "/insights/", indexable: true, changeFrequency: "weekly", priority: 0.7 },

  // Service detail pages, derived so a new service reaches the sitemap by
  // being added to app/_lib/services.ts and nowhere else.
  ...serviceSlugs.map((slug) => ({
    path: servicePath(slug),
    indexable: true,
    changeFrequency: "monthly" as const,
    priority: 0.8,
  })),

  // Placeholder pages with no reviewed text. Make these indexable once the
  // real policies are published, and remove the noindex from their metadata.
  { path: "/privacy-policy/", indexable: false, changeFrequency: "yearly", priority: 0.1 },
  { path: "/cookie-policy/", indexable: false, changeFrequency: "yearly", priority: 0.1 },
];
