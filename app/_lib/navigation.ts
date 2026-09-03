export type NavLink = {
  label: string;
  href: string;
};

/** Main navigation. Labels match the original site; URLs match SITEMAP.md. */
export const mainNavigation: NavLink[] = [
  { label: "Works", href: "/works/" },
  { label: "Services", href: "/services/" },
  { label: "About", href: "/about/" },
  { label: "Insights", href: "/insights/" },
];

export const legalNavigation: NavLink[] = [
  { label: "Privacy Policy", href: "/privacy-policy/" },
  { label: "Cookie Policy", href: "/cookie-policy/" },
];

export const contactHref = "/contact/";

/**
 * Draft contact address carried over from the existing homepage.
 * Confirm before launch — see docs/product/WEBSITE-BRIEF.md.
 */
export const contactEmail = "hello@designally.co";

/**
 * Telephone number as published on the current site. Confirm before launch —
 * it must match the contact page and the public business profiles exactly.
 */
export const contactPhone = "0650055993";

/** Registered company name, as it appears in the current site's footer. */
export const companyName = "Designally Co., Ltd.";
