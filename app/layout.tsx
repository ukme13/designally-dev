import type { Metadata } from "next";
import { EB_Garamond, IBM_Plex_Sans_Thai, Poppins } from "next/font/google";

import SiteFooter from "@/app/_components/site-footer";
import ScrollToTop from "@/app/_components/scroll-to-top";
import SiteHeader from "@/app/_components/site-header";
import { siteUrl } from "@/app/_lib/site";
import "./globals.css";

const ebGaramond = EB_Garamond({
  variable: "--font-eb-garamond",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
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
      className={`${ebGaramond.variable} ${poppins.variable} ${ibmPlexSansThai.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <a
          href="#main"
          className="sr-only rounded-pill bg-action-primary px-4 py-2 text-sm font-medium text-white focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-60"
        >
          Skip to content
        </a>
        <ScrollToTop />
        <SiteHeader />
        <main id="main" className="grow overflow-hidden">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
