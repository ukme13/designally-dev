import type { NextConfig } from "next";

/**
 * Sanity's image CDN, for insight photos through next/image. See ADR-007.
 *
 * Scoped to this site's own project and dataset, so the image optimiser cannot
 * be used to fetch other projects' images. With Sanity not configured there
 * are no Sanity images, and no remote pattern is added at all.
 */
const sanityProject = process.env.SANITY_PROJECT_ID;
const sanityDataset = process.env.SANITY_DATASET;

const nextConfig: NextConfig = {
  // The WordPress site and the redirect plan in docs/migration/URL-REDIRECTS.md
  // both use trailing-slash URLs. Keep them so migrated URLs stay stable.
  trailingSlash: true,
  images: {
    remotePatterns:
      sanityProject && sanityDataset
        ? [
            {
              protocol: "https",
              hostname: "cdn.sanity.io",
              pathname: `/images/${sanityProject}/${sanityDataset}/**`,
            },
          ]
        : [],
  },
};

export default nextConfig;
