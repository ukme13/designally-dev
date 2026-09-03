import type { MetadataRoute } from "next";

import { publicRoutes } from "@/app/_lib/routes";
import { siteUrl } from "@/app/_lib/site";

/**
 * Paths carry a trailing slash to match `trailingSlash: true` and the
 * canonical URL each page declares. A sitemap entry that disagrees with a
 * page's canonical is a conflicting signal, so the two must stay identical.
 */
const lastModified = new Date();

export default function sitemap(): MetadataRoute.Sitemap {
  return publicRoutes
    .filter((route) => route.indexable)
    .map((route) => ({
      url: new URL(route.path, siteUrl).href,
      lastModified,
      changeFrequency: route.changeFrequency,
      priority: route.priority,
    }));
}
