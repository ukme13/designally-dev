import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The WordPress site and the redirect plan in docs/migration/URL-REDIRECTS.md
  // both use trailing-slash URLs. Keep them so migrated URLs stay stable.
  trailingSlash: true,
};

export default nextConfig;
