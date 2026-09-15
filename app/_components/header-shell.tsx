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
  ICON_SWAP,
  ICON_SWAP_BOX,
  ICON_SWAP_IN,
  ICON_SWAP_OUT,
  MENU_PANEL,
  MENU_PANEL_CLOSED,
  MENU_PANEL_OPEN,
  TOGGLE,
} from "@/app/_components/header-styles";
import { CloseIcon, MenuBarsIcon, MenuStreamIcon } from "@/app/_components/icons";
import { STAGGER_ENTER } from "@/app/_lib/motion";
import { useDismiss } from "@/app/_lib/use-dismiss";
import { useHeaderLogoTone } from "@/app/_lib/use-header-logo-tone";
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
 * The bars and the cross, both mounted, one on top of the other.
 *
 * Whichever belongs to the current state turns upright, grows to full size and
 * fades in while the other turns away, shrinks and fades out. Swapping the two
 * class sets reverses the movement on close without a second rule.
 *
 * The wrapper is exactly the size of the icon it replaces, so the button's own
 * size, border and centring are untouched. Both icons carry aria-hidden of
 * their own; the button's sr-only label is what is announced.
 */
function ToggleIcons({ open }: { open: boolean }) {
  return (
    <span className={ICON_SWAP_BOX}>
      <MenuBarsIcon
        className={`${ICON_SWAP} ${open ? ICON_SWAP_OUT : ICON_SWAP_IN}`}
      />
      <CloseIcon
        className={`${ICON_SWAP} ${open ? ICON_SWAP_IN : ICON_SWAP_OUT}`}
      />
    </span>
  );
}

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

  const { revealed, barHidden, atTop } = useScrollState(revealAfter);
  const pathname = usePathname();

  const closeTopMenu = useCallback(() => setTopMenuOpen(false), []);
  const closeFloatingMenu = useCallback(() => setFloatingMenuOpen(false), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  useDismiss(topMenuOpen, [topMenuRef], closeTopMenu);
  useDismiss(floatingMenuOpen, [floatingRef], closeFloatingMenu);
  useModalPanel(drawerOpen, panelRef, closeDrawer, triggerRef);

  /*
    Turns the FLOATING header's monogram white over sections marked
    `data-header-tone="light"`. The top bar's wordmark stays orange, by choice.

    Suspended while the drawer is open. Today that is belt and braces — the
    drawer is `md:hidden` and the floating header `md:flex`, so the two cannot
    be on screen together — but it holds even if that pairing ever changes.
  */
  useHeaderLogoTone({ suspended: drawerOpen });

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

        **NO BACKGROUND ON THIS ELEMENT — it lives on the row inside.** Moved
        there on 15 September 2026, and it must not come back.

        The background behaviour is unchanged: transparent while the page rests
        at the top, so the homepage gradient runs unbroken behind it, and
        surface-base once the reader has scrolled and there is content for the
        nav to sit against. From md up it stays transparent either way.

        What changed is which element paints it. This one is `position: fixed`
        at the top edge, and Safari 26 picks its toolbar tint by sampling
        `background-color` from fixed and sticky elements near a viewport edge.
        An opaque background appearing here on scroll made the bottom chrome
        snap to solid white the instant the page moved — confirmed on device:
        `/` loaded as frosted glass and lost it on the first scroll, while
        `/about/` kept it, being cream-on-cream where the same switch is
        invisible.

        **This is the case static HTML cannot show.** The server render is
        always the at-rest state, so `bg-surface-base` never appears in it and
        an enumeration of the built markup will always look clean. Verify this
        one on a device.

        The row inside is `h-20` and full-width on a phone, so it paints exactly
        the same pixels this element used to.

        The slide stays here and the colour goes with the background, so the two
        transitions now sit on different elements and cannot overwrite each
        other's `transition-property`. `translate` is named explicitly because
        that is the property Tailwind v4's translate-y-* utilities set —
        `transform` alone would leave the hide-on-scroll with nothing to
        animate.
      */}
      <header
        data-site-header=""
        className={`fixed inset-x-0 top-0 z-40 transition-[transform,translate] duration-300 ease-standard motion-reduce:transition-none md:relative md:translate-y-0 ${
          barHidden ? "-translate-y-full" : "translate-y-0"
        }`}
      >
        {/* Carries the bar's background, moved off the fixed parent above —
            see the note there. `w-full` makes this the full screen width on a
            phone, and `h-20` matches the bar's height, so it paints exactly
            the surface the header used to. `md:bg-transparent` keeps tablet
            and desktop clear, as before. */}
        <div
          className={`mx-auto flex h-20 w-full max-w-page items-center justify-between gap-6 px-gutter-mobile transition-colors duration-300 ease-standard motion-reduce:transition-none md:bg-transparent md:px-gutter-tablet lg:h-section-tablet xl:px-gutter-desktop ${
            atTop ? "bg-transparent" : "bg-surface-base"
          }`}
        >
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
              <ToggleIcons open={topMenuOpen} />
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
        data-site-floating=""
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
            <ToggleIcons open={floatingMenuOpen} />
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
        data-site-drawer=""
        data-open={drawerOpen ? "" : undefined}
        /* The slide's timing is no longer expressed here. It moved to the
           `[data-site-drawer]` rules in app/globals.css on 15 September 2026,
           so that one rule owns both the slide and the visibility flip —
           closing still waits 250ms for the rows inside to finish leaving, then
           sweeps for 500ms; opening is immediate. */
        /*
          NO BACKGROUND ON THIS ELEMENT. The cream moved to the inner wrapper
          below on 15 September 2026, and it must not come back here.

          This is `position: fixed` and full-viewport, so an opaque background
          here made an off-screen drawer a tint candidate at BOTH edges, on
          every page, on every phone.

          **That was not the whole story, and the original note here was
          wrong.** It claimed Safari only samples `background-color`, so moving
          the cream off this element would settle it. The background has been
          gone since, and the drawer still locked Safari 26's bottom toolbar to
          solid the moment it was opened once — reported from device on
          15 September 2026. So it is the fixed LAYER itself, not its paint: a
          transform does not release it, and WebKit appears to keep the layer
          promoted after the first open.

          Hence the `visibility` handling in globals.css keyed on
          `[data-site-drawer]`. The transition lives there rather than here so
          one rule owns both the slide and the visibility flip; two owners of
          `transition-property` would be settled by stylesheet order.

          Painting the inner wrapper instead costs nothing: it is `h-full`
          inside this box, so it covers exactly the same pixels and the panel
          looks identical. It is not positioned, so the sampler ignores it, and
          the slide still belongs to this element alone.
        */
        className={`group fixed inset-0 z-55 md:hidden ${
          drawerOpen ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        {/* Carries the drawer's cream, moved off the fixed parent — see the
            note above. `h-full` fills the fixed box exactly, so this is the
            same surface it always was. */}
        <div className="flex h-full flex-col bg-surface-base px-gutter-mobile pt-6 pb-10">
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
