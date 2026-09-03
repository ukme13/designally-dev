"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

import {
  CIRCLE_TOGGLE,
  MENU_PANEL,
  MENU_PANEL_CLOSED,
  MENU_PANEL_OPEN,
  TOGGLE,
} from "@/app/_components/header-styles";
import { CloseIcon, MenuBarsIcon, MenuStreamIcon } from "@/app/_components/icons";
import { STAGGER_ENTER } from "@/app/_lib/motion";
import { useDismiss } from "@/app/_lib/use-dismiss";
import { useModalPanel } from "@/app/_lib/use-modal-panel";
import { useScrollState } from "@/app/_lib/use-scroll-state";

type HeaderShellProps = {
  wordmark: ReactNode;
  /** Compact mark used by the floating header. */
  mark: ReactNode;
  desktopNav: ReactNode;
  desktopCta: ReactNode;
  /**
   * Compact list for the tablet top bar's dropdown.
   *
   * `topMenu` and `floatingMenu` are two separate element trees of the same
   * markup rather than one shared node: React's key validation warns when a
   * single element instance is mounted in two places. A factory prop would be
   * tidier but functions cannot cross the Server/Client boundary.
   */
  topMenu: ReactNode;
  /** The same list again, for the floating header's dropdown. */
  floatingMenu: ReactNode;
  /** Numbered rows for the mobile drawer. */
  drawerNav: ReactNode;
  /** Rendered under the drawer rows, e.g. the Follow us row. */
  drawerFooter?: ReactNode;
  /**
   * Scroll distance in px before the floating header drops in. The original
   * site uses 1000, roughly one viewport.
   */
  revealAfter?: number;
};

/**
 * Interactive chrome for the site header.
 *
 * Desktop (>=1024px) reproduces the original two-part system: a 120px bar in
 * normal flow that scrolls away, and a separate fixed overlay that drops in
 * once the page has been scrolled. Tablet keeps the bar in flow but carries
 * its own contact button and menu. Below 768px the bar stays fixed, hiding on
 * the way down and returning on the way up, and the menu is a full drawer.
 *
 * This component owns state and composition only; the scroll, dismiss and
 * modal behaviours live in hooks under app/_lib.
 */
export default function HeaderShell({
  wordmark,
  mark,
  desktopNav,
  desktopCta,
  topMenu,
  floatingMenu,
  drawerNav,
  drawerFooter,
  revealAfter = 1000,
}: HeaderShellProps) {
  // The tablet bar and the floating header each own a menu. They are never on
  // screen together, but separate state keeps their close rules independent:
  // only the floating one should close when the page scrolls back to the top.
  const [topMenuOpen, setTopMenuOpen] = useState(false);
  const [floatingMenuOpen, setFloatingMenuOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const floatingRef = useRef<HTMLDivElement>(null);
  const topMenuRef = useRef<HTMLDivElement>(null);

  const { revealed, barHidden } = useScrollState(revealAfter);
  const pathname = usePathname();

  const closeTopMenu = useCallback(() => setTopMenuOpen(false), []);
  const closeFloatingMenu = useCallback(() => setFloatingMenuOpen(false), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  useDismiss(topMenuOpen, [topMenuRef], closeTopMenu);
  useDismiss(floatingMenuOpen, [floatingRef], closeFloatingMenu);
  useModalPanel(drawerOpen, panelRef, closeDrawer, triggerRef);

  // Both panels close on a route change, and the compact menu closes when the
  // floating header retreats out of view. Adjusted during render rather than
  // in an effect, which would cascade an extra render.
  const [lastPathname, setLastPathname] = useState(pathname);
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setDrawerOpen(false);
    setTopMenuOpen(false);
    setFloatingMenuOpen(false);
  }
  if (!revealed && floatingMenuOpen) {
    setFloatingMenuOpen(false);
  }

  // Crossing the tablet breakpoint closes whichever panel no longer applies.
  useEffect(() => {
    const query = window.matchMedia("(min-width: 48rem)");
    const onChange = (event: MediaQueryListEvent) => {
      if (event.matches) setDrawerOpen(false);
      else setTopMenuOpen(false);
    };
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  return (
    <>
      {/*
        Top bar. Fixed below 768px, where it hides on the way down and returns
        on the way up; in normal flow above that, where it scrolls away and the
        floating header takes over.
      */}
      <header
        className={`fixed inset-x-0 top-0 z-40 bg-surface-base transition-transform duration-300 ease-standard motion-reduce:transition-none md:static md:translate-y-0 md:bg-transparent ${
          barHidden ? "-translate-y-full" : "translate-y-0"
        }`}
      >
        <div className="mx-auto flex h-20 w-full max-w-page items-center justify-between gap-6 px-gutter-mobile md:px-gutter-tablet lg:h-30 xl:px-gutter-desktop">
          <Link href="/" aria-label="Designally home" className="flex shrink-0 items-center">
            {wordmark}
          </Link>

          <nav aria-label="Main navigation" className="hidden lg:block">
            {desktopNav}
          </nav>

          <div ref={topMenuRef} className="relative hidden shrink-0 items-center gap-4 md:flex">
            {desktopCta}

            {/* Tablet only: the top bar carries its own circle toggle, so the
                page is navigable before the floating header is revealed. */}
            <button
              type="button"
              onClick={() => setTopMenuOpen((open) => !open)}
              aria-expanded={topMenuOpen}
              aria-controls="top-menu"
              className={`${CIRCLE_TOGGLE} lg:hidden`}
            >
              {topMenuOpen ? <CloseIcon className="size-6" /> : <MenuBarsIcon className="size-6" />}
              <span className="sr-only">{topMenuOpen ? "Close menu" : "Open menu"}</span>
            </button>

            <nav
              id="top-menu"
              aria-label="Main navigation"
              inert={!topMenuOpen}
              data-open={topMenuOpen ? "" : undefined}
              className={`${MENU_PANEL} absolute top-full right-0 mt-4 lg:hidden ${
                topMenuOpen ? MENU_PANEL_OPEN : MENU_PANEL_CLOSED
              }`}
            >
              {topMenu}
            </nav>
          </div>

          <button
            ref={triggerRef}
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-expanded={drawerOpen}
            aria-controls="site-menu"
            className={`${TOGGLE} md:hidden`}
          >
            <MenuStreamIcon className="size-6 shrink-0" />
            MENU
          </button>
        </div>
      </header>

      {/* Reserves the fixed mobile bar. Not needed once the bar is in flow. */}
      <div aria-hidden="true" className="h-20 md:hidden" />

      {/*
        Floating header. A separate overlay that drops in after the page has
        been scrolled — the original site's "header-2".
      */}
      <div
        ref={floatingRef}
        className={`fixed top-0 left-0 z-50 hidden w-full items-start justify-between px-gutter-tablet py-10 transition-all duration-300 ease-standard motion-reduce:transition-none md:flex xl:px-gutter-desktop ${
          revealed
            ? "visible translate-y-0 opacity-100"
            : "pointer-events-none invisible -translate-y-34 opacity-0"
        }`}
      >
        <Link
          href="/"
          aria-label="Designally home"
          tabIndex={revealed ? undefined : -1}
          className="inline-block size-13 shrink-0"
        >
          {mark}
        </Link>

        <div className="flex flex-col items-end">
          <button
            type="button"
            onClick={() => setFloatingMenuOpen((open) => !open)}
            aria-expanded={floatingMenuOpen}
            aria-controls="floating-menu"
            tabIndex={revealed ? undefined : -1}
            className={CIRCLE_TOGGLE}
          >
            {floatingMenuOpen ? <CloseIcon className="size-6" /> : <MenuBarsIcon className="size-6" />}
            <span className="sr-only">{floatingMenuOpen ? "Close menu" : "Open menu"}</span>
          </button>

          <nav
            id="floating-menu"
            aria-label="Floating navigation"
            inert={!floatingMenuOpen}
            data-open={floatingMenuOpen ? "" : undefined}
            className={`${MENU_PANEL} mt-4 ${floatingMenuOpen ? MENU_PANEL_OPEN : MENU_PANEL_CLOSED}`}
          >
            {floatingMenu}
          </nav>
        </div>
      </div>

      {/* Mobile drawer. Sweeps down from above, then its rows arrive in turn. */}
      <div
        id="site-menu"
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Site menu"
        inert={!drawerOpen}
        data-open={drawerOpen ? "" : undefined}
        className={`group fixed inset-0 z-55 bg-surface-base transition-transform duration-500 ease-out motion-reduce:transition-none md:hidden ${
          drawerOpen ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <div className="flex h-full flex-col px-gutter-mobile pt-6 pb-10">
          <div className="flex h-11 items-center justify-between">
            <Link href="/" aria-label="Designally home" className="flex items-center">
              {wordmark}
            </Link>
            <button type="button" onClick={closeDrawer} className={TOGGLE}>
              <CloseIcon className="size-5 shrink-0" />
              CLOSE
            </button>
          </div>

          {/* flex-1 claims the space between the close row and the Follow us
              row; justify-center centres the list within it. */}
          <nav aria-label="Main navigation" className="flex flex-1 flex-col justify-center">
            {drawerNav}
          </nav>

          {drawerFooter ? (
            <div style={{ "--stagger": "560ms" } as CSSProperties} className={`mt-8 ${STAGGER_ENTER}`}>
              {drawerFooter}
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}
