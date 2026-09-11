import { createClient, type SanityClient } from "@sanity/client";

/**
 * The Sanity client, for server code only. See ADR-007.
 *
 * Configured from three environment variables, none of them prefixed
 * `NEXT_PUBLIC_`, so Next never writes them into code sent to the browser. The
 * read token especially must not reach it, because the dataset is private.
 *
 *   SANITY_PROJECT_ID       the project's id
 *   SANITY_DATASET          "production"
 *   SANITY_API_READ_TOKEN   a Viewer token, the lowest role that can read
 *
 * Import this only from Server Components and Route Handlers. The `server-only`
 * package would turn a mistaken client import into a build error; it is not
 * installed, because ADR-007 approved exactly three packages. The missing
 * `NEXT_PUBLIC_` prefix is the protection instead: in browser code the token
 * would read as `undefined`.
 *
 * If any variable is missing, or the client cannot be created, this is `null`
 * and every reader falls back to the static data in app/_lib/insights.ts.
 * Builds never fail for want of a CMS.
 */

/**
 * Hard-coded, as the client's documentation requires. A date computed at run
 * time would move the API version under the site without anyone deciding to.
 */
const API_VERSION = "2026-09-11";

function create(): SanityClient | null {
  const projectId = process.env.SANITY_PROJECT_ID;
  const dataset = process.env.SANITY_DATASET;
  const token = process.env.SANITY_API_READ_TOKEN;
  if (!projectId || !dataset || !token) return null;

  try {
    return createClient({
      projectId,
      dataset,
      token,
      apiVersion: API_VERSION,
      /* Next caches every read (see the `cache` and `next` options where they
         are made), so Sanity's own CDN adds nothing here. Skipping it also
         avoids relying on how a private dataset is served from it. */
      useCdn: false,
      /* Published documents only, never drafts. This is already the default
         for this API version; stated so it cannot change by accident. */
      perspective: "published",
    });
  } catch (error) {
    /* A malformed id or dataset name throws here. Log it so the build output
       shows it, and carry on with the static data. */
    console.error(
      "Sanity is configured, but the client could not be created. Using the static fallback.",
      error,
    );
    return null;
  }
}

export const sanityClient: SanityClient | null = create();
