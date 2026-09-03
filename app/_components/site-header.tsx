import type { CSSProperties } from "react";

import Button from "@/app/_components/button";
import HeaderShell from "@/app/_components/header-shell";
import NavLink from "@/app/_components/nav-link";
import { STAGGER_ENTER } from "@/app/_lib/motion";
import SocialLinks from "@/app/_components/social-links";
import { contactHref, mainNavigation } from "@/app/_lib/navigation";

/**
 * Site header. A Server Component: it composes every link and both logos,
 * then hands them to HeaderShell, which owns the scroll-reveal state, the
 * floating menu and the mobile drawer.
 *
 * Both marks are brand-orange fills masked by the original SVGs. The files
 * carry their own `fill`, so `currentColor` cannot reach them.
 */
const WORDMARK_SRC = "/designally-wordmark.svg";
const MONOGRAM_SRC = "/designally-monogram.svg";

function maskStyle(src: string): CSSProperties {
  return {
    maskImage: `url("${src}")`,
    WebkitMaskImage: `url("${src}")`,
    maskRepeat: "no-repeat",
    WebkitMaskRepeat: "no-repeat",
    maskSize: "100% 100%",
    WebkitMaskSize: "100% 100%",
  };
}

/**
 * Top-bar link. The underline sweeps in on hover only — including on the
 * current page, so every item behaves the same. The active page is marked by
 * colour, plus `aria-current="page"` for assistive technology.
 */
const DESKTOP_LINK =
  "relative inline-block py-2 type-label transition-colors duration-150 " +
  "after:absolute after:-bottom-0.5 after:left-0 after:h-0.5 after:w-full after:origin-left after:scale-x-0 " +
  "after:bg-action-primary after:transition-transform after:duration-700 after:ease-sweep " +
  "hover:after:scale-x-100 motion-reduce:after:transition-none";

/** Compact row for the floating menu on tablet and desktop. */
const FLOATING_LINK =
  "flex h-7 items-center justify-end py-1 pl-10 type-label " +
  "transition-colors duration-150";

/** Numbered row for the mobile drawer: small index, then the display name. */
const MENU_LINK = "flex items-start gap-4 py-2 transition-colors duration-150";
// pt-1.5 drops the index from the line-box top onto the name's cap height;
// items-start alone leaves it sitting noticeably high against a 36px name.
const MENU_INDEX = "pt-1.5 text-sm text-text-muted/50 tabular-nums";
const MENU_NAME = "type-h1-alt";

/** The menu panels list the main navigation plus Contact. */
const MENU_ITEMS = [...mainNavigation, { label: "Contact", href: contactHref }];

/** Compact list for the collapsible menus. Called once per mount point. */
function menuList() {
  return (
    <ul className="flex flex-col items-end">
      {MENU_ITEMS.map((item, index) => (
        <li
          key={item.href}
          style={{ "--stagger": `${index * 60}ms` } as CSSProperties}
          className={STAGGER_ENTER}
        >
          <NavLink
            href={item.href}
            label={item.label}
            className={FLOATING_LINK}
            activeClassName="text-action-primary"
            inactiveClassName="text-text-primary hover:text-action-primary"
          />
        </li>
      ))}
    </ul>
  );
}
export default function SiteHeader() {
  return (
    <HeaderShell
      wordmark={
        <span
          aria-hidden="true"
          className="block h-5 w-[214.398px] bg-action-primary"
          style={maskStyle(WORDMARK_SRC)}
        />
      }
      mark={
        <span
          aria-hidden="true"
          className="block size-13 bg-action-primary"
          style={maskStyle(MONOGRAM_SRC)}
        />
      }
      desktopNav={
        <ul className="flex items-center gap-8">
          {mainNavigation.map((item) => (
            <li key={item.href}>
              <NavLink
                href={item.href}
                label={item.label}
                className={DESKTOP_LINK}
                activeClassName="text-action-primary"
                inactiveClassName="text-text-primary hover:text-action-primary"
              />
            </li>
          ))}
        </ul>
      }
      desktopCta={
        <Button href={contactHref} variant="outline" className="uppercase">
          Contact us
        </Button>
      }
      topMenu={menuList()}
      floatingMenu={menuList()}
      drawerNav={
        <ul className="flex flex-col">
          {MENU_ITEMS.map((item, index) => (
            <li
              key={item.href}
              style={{ "--stagger": `${260 + index * 60}ms` } as CSSProperties}
              className={STAGGER_ENTER}
            >
              <NavLink
                href={item.href}
                label={item.label}
                index={String(index + 1).padStart(2, "0")}
                className={MENU_LINK}
                indexClassName={MENU_INDEX}
                labelClassName={MENU_NAME}
                activeClassName="text-action-primary"
                inactiveClassName="text-text-primary hover:text-action-primary"
              />
            </li>
          ))}
        </ul>
      }
      drawerFooter={<SocialLinks />}
    />
  );
}
