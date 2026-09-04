"use client";

import { usePathname } from "next/navigation";

import { recordInitialPath } from "@/app/_lib/intro";

/**
 * Records the route the application was first loaded on, so the homepage
 * entrance animation can tell a direct visit from a client-side navigation.
 *
 * Mounted by the root layout, which persists for the lifetime of the Next
 * application, so this mounts once per full page load.
 *
 * The capture runs during render rather than in an effect on purpose: effects
 * run child-first, so HeroIntro's effect would fire before this component's
 * and read an empty value. `recordInitialPath` only writes once, so the double
 * render under StrictMode is harmless.
 *
 * Renders nothing.
 */
export default function IntroCoordinator() {
  const pathname = usePathname();
  recordInitialPath(pathname);
  return null;
}
