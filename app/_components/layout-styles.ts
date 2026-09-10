/**
 * The page's horizontal inset: centred, capped at the page width, and guttered
 * at each breakpoint.
 *
 * Written out in `section.tsx`, `page-intro.tsx`, `showreel.tsx` and four times
 * in `page.tsx` as well. Those are left alone for now — converting them is a
 * change across four more files that has not been asked for — but anything new
 * should import this rather than add a ninth copy.
 *
 * Safe to share: Tailwind scans every source file for class-name-shaped text,
 * so the literal below compiles from here whatever imports it. `header-styles.ts`
 * has done the same since the header was built.
 */
export const PAGE_INSET =
  "mx-auto w-full max-w-page px-gutter-mobile md:px-gutter-tablet xl:px-gutter-desktop";
