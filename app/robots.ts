import type { MetadataRoute } from "next";

import { siteUrl } from "@/app/_lib/site";

/**
 * Nothing is disallowed. The unfinished legal pages are kept out of search
 * results with a `noindex` directive on the pages themselves, which a crawler
 * can only act on if it is allowed to fetch them.
 *
 * Before deploying to a staging or preview domain, block that host instead of
 * relying on this file.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
