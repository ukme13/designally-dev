import type { ComponentType, SVGProps } from "react";

import {
  FacebookIcon,
  InstagramIcon,
  LineIcon,
  PinterestIcon,
  SpotifyIcon,
} from "@/app/_components/social-icons";

export type SocialProfile = {
  label: string;
  /**
   * Profile URL, carried over from the current live site. Still listed under
   * "Evidence needed before launch" in docs/product/WEBSITE-BRIEF.md, so these
   * want confirming before launch. An entry with no href renders as a
   * non-interactive icon rather than a dead link.
   */
  href: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
};

export const socialProfiles: SocialProfile[] = [
  { label: "LINE", href: "https://line.me/ti/p/%40designally", Icon: LineIcon },
  {
    label: "Facebook",
    href: "https://www.facebook.com/designallyco",
    Icon: FacebookIcon,
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/designally.co",
    Icon: InstagramIcon,
  },
  {
    label: "Pinterest",
    href: "https://www.pinterest.com/Designallyco/",
    Icon: PinterestIcon,
  },
  {
    label: "Spotify",
    href: "https://open.spotify.com/user/p4985b7mufaslr8c1cborig78",
    Icon: SpotifyIcon,
  },
];

/** Only profiles with a confirmed URL. */
export const publishedSocialProfiles = socialProfiles.filter(
  (profile) => profile.href.length > 0,
);
