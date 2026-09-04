import type { Metadata } from "next";
import {
  Caveat,
  EB_Garamond,
  IBM_Plex_Sans_Thai,
  Poppins,
} from "next/font/google";

import SiteFooter from "@/app/_components/site-footer";
import IntroCoordinator from "@/app/_components/intro-coordinator";
import ScrollToTop from "@/app/_components/scroll-to-top";
import SiteHeader from "@/app/_components/site-header";
import { siteUrl } from "@/app/_lib/site";
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
        */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              '(function(){try{if(location.pathname==="/"&&!matchMedia("(prefers-reduced-motion: reduce)").matches){document.documentElement.setAttribute("data-intro","running")}}catch(e){}})()',
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
