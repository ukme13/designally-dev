import type { Metadata, Viewport } from "next";
import {
  Caveat,
  EB_Garamond,
  IBM_Plex_Sans_Thai,
  Poppins,
} from "next/font/google";

import SiteFooter from "@/app/_components/site-footer";
import IntroCoordinator from "@/app/_components/intro-coordinator";
import ScrollToTop from "@/app/_components/scroll-to-top";
import SmoothScroll from "@/app/_components/smooth-scroll";
import SiteHeader from "@/app/_components/site-header";
import { siteUrl, themeColor } from "@/app/_lib/site";
import "./globals.css";

/** Italic is loaded because the display face uses it as a brand accent —
 *  the hero statement and the footer headline both set a word in italic. */
const ebGaramond = EB_Garamond({
  variable: "--font-eb-garamond",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

/** The hero statement sets each line at a different weight, so the extremes
 *  are loaded too. Without them the browser synthesises the missing cuts. */
const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["100", "300", "400", "500", "600", "700"],
});

/** Complementary handwritten face. Regular and Medium only, per the brand book. */
const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const ibmPlexSansThai = IBM_Plex_Sans_Thai({
  variable: "--font-ibm-plex-sans-thai",
  subsets: ["latin", "thai"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Designally — Branding & Design Agency in Bangkok",
    template: "%s — Designally",
  },
  description:
    "Designally is a strategy-led branding and design agency based in Bangkok, Thailand.",
  openGraph: {
    type: "website",
    locale: "en",
    siteName: "Designally",
  },
};

/**
 * Browser-UI declarations for the document — and one deliberate absence.
 *
 * **`themeColor` was removed on 15 September 2026 and restored the same day.**
 * The removal tested whether declaring one was what stopped Safari 26 using
 * its translucent toolbar material — the reference site `fridaybangkok.com`
 * sends none and gets the frosted treatment. Device testing disproved it: the
 * toolbar stayed solid with the tag gone, and the real cause turned out to be
 * a sticky element reaching the bottom viewport edge (see the sticky stage note
 * in `app/page.tsx`).
 *
 * So it is back. Chrome and Android DO honour `theme-color`, and without it
 * their address bar falls back to their own default rather than the page's
 * cream — a real cost for no Safari benefit.
 *
 * What Safari 26 actually does, for whoever reads this next: it samples ONE
 * flat `background-color` per edge — from a `fixed` or `sticky` element near
 * that edge, falling back to `<body>` — and never samples a
 * `background-image`, so the homepage's gradient hero can never colour its own
 * edges. See the 15 September 2026 update, section 1.
 *
 * `viewportFit` IS available here — `ViewportLayout` in Next's
 * `extra-types.d.ts` declares `'auto' | 'cover' | 'contain'`. It is
 * deliberately not set: `viewport-fit=cover` lets content run under the notch
 * and the home indicator, and nothing in this layout compensates with
 * `env(safe-area-inset-*)`, so the fixed mobile header would slide under the
 * status bar.
 *
 * `width` and `initialScale` are left to Next's default —
 * `width=device-width, initial-scale=1`. The reference site sends
 * `width=device-width` alone, but dropping `initial-scale` changes pinch-zoom
 * behaviour, which is an accessibility change and has no place in a
 * chrome-colour test.
 */
export const viewport: Viewport = {
  themeColor,
  colorScheme: "light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${ebGaramond.variable} ${poppins.variable} ${ibmPlexSansThai.variable} ${caveat.variable} h-full antialiased`}
      /* The head script below sets `data-intro` before React hydrates, so the
         server markup and the live document differ on this element by design.
         Suppression applies to this element only, not its subtree. */
      suppressHydrationWarning
    >
      <head>
        {/*
          Hides the header before the first paint, so its background never
          flashes above the hero. The browser runs this synchronously while
          parsing, ahead of any body content.

          It runs only on a full page load of the homepage — an inline script
          cannot run on a client-side navigation, which is exactly the
          condition the intro needs. If scripting is unavailable it never runs,
          the attribute is never set, and the header renders normally.

          <html> carries suppressHydrationWarning because this attribute is
          absent from the server markup by design. See
          node_modules/next/dist/docs — guides/preventing-flash-before-hydration.

          **The `(min-width: 64rem)` test is not optional.** As of 15 September
          2026 the hero entrance is desktop only: the statement lines are not
          rendered below `lg`, and use-hero-entrance.ts skips its timeline and
          goes straight to `finish()` there. This script runs BEFORE React, so
          without that test it would still hide the header and the lines on a
          phone, and nothing would clear them until `finish()` ran — a
          headerless flash on every mobile load, on the very pass meant to make
          mobile immediate.

          64rem must stay in step with the `lg:` breakpoint used by
          STATEMENT_BLOCK in hero-intro.tsx, by the stage in page.tsx, and by
          the media query in use-hero-entrance.ts. If they disagree there is a
          band of widths where this hides chrome for an intro that never plays.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              '(function(){try{if(location.pathname==="/"&&!matchMedia("(prefers-reduced-motion: reduce)").matches&&matchMedia("(min-width: 64rem)").matches){document.documentElement.setAttribute("data-intro","running")}}catch(e){}})()',
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <a
          href="#main"
          className="sr-only rounded-pill bg-action-primary px-4 py-2 text-sm font-medium text-white focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-60"
        >
          Skip to content
        </a>
        <SmoothScroll />
        <IntroCoordinator />
        <ScrollToTop />
        <SiteHeader />
        {/* overflow-x-clip, not overflow-hidden: the homepage hero extends
            above this box, and `hidden` on one axis forces the other to `auto`,
            which would make this a scroll container. `clip` has no such rule. */}
        <main id="main" className="grow overflow-x-clip">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
