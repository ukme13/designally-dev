import Link from "next/link";

import { CtaWaveShape, ScribbleUnderline } from "@/app/_components/icons";
import SocialLinks from "@/app/_components/social-links";
import {
  companyName,
  contactHref,
  legalNavigation,
} from "@/app/_lib/navigation";

/**
 * Closing block, modelled on the original designally.co page ending: the
 * orange call to action (`.elementor-element-1caafeb`) and the legal bar
 * beneath it (`.elementor-element-ae4d07f`), which share one field of colour.
 *
 * The white wave along the top edge masks the orange so the section reads as
 * a curve rising out of the page above it.
 *
 * Hover is the only interaction, so this stays a Server Component.
 */
const DUCK_SRC = "/designally-duck.svg";

export default function SiteFooter() {
  return (
    <footer className="relative w-full bg-action-primary text-white">
      {/* Top wave. Rotated so the white edge curves down into the block. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-px z-0 h-20 rotate-180 overflow-hidden text-surface-base md:h-section-tablet lg:h-40"
      >
        <CtaWaveShape className="block h-full w-[160%] max-w-none translate-x-[-18.75%]" />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-page flex-col items-center px-gutter-mobile pt-24 md:px-gutter-tablet md:pt-section-tablet lg:pt-40 xl:px-gutter-desktop">
        <p className="type-body text-center">
          Open a new perspective for your brand.
        </p>

        <h2 className="mt-2 text-center type-display text-white">
          Let&rsquo;s work toge<i>t</i>her.
        </h2>

        {/* The wrapper shrink-wraps the link, so the loop stays around the
            text at every size. */}
        <div className="relative mt-8 mb-4 inline-block">
          <ScribbleUnderline className="pointer-events-none absolute w-[140%] h-[150%] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-scribble text-white motion-reduce:animate-none" />
          <Link
            href={contactHref}
            className="relative block text-center font-body text-[clamp(1.625rem,1.3rem+1.4vw,2.6875rem)] leading-[1.2] font-medium whitespace-nowrap text-white transition-colors duration-300 hover:text-text-primary"
          >
            Click to Connect !
          </Link>
        </div>

        <div className="mt-28 flex w-full flex-col items-center">
          <SocialLinks withLabel={false} tone="inverse" />
        </div>

        {/* Flush with the container's left edge, below the social row. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={DUCK_SRC}
          alt=""
          width={120}
          height={121}
          className="mt-10 self-start"
        />
      </div>

      {/* The rule spans the viewport, so it is carried by a full-width
          wrapper rather than the max-width row inside it. */}
      <div className="relative z-10 border-t border-white/30">
        <div className="mx-auto flex w-full max-w-page flex-col-reverse items-center gap-2 px-gutter-mobile py-4 md:h-14 md:flex-row md:justify-between md:gap-0 md:px-gutter-tablet md:py-0 xl:px-gutter-desktop">
          <p className="type-body text-center md:text-start">
            © {new Date().getFullYear()} {companyName} All Rights Reserved
          </p>

          <nav aria-label="Legal" className="flex flex-row items-center gap-4">
            {legalNavigation.map((item, index) => (
              <span key={item.href} className="flex items-center gap-4">
                {index > 0 ? (
                  <span className="type-body" aria-hidden="true">
                    /
                  </span>
                ) : null}
                <Link
                  href={item.href}
                  className="type-body uppercase transition-colors duration-300 hover:text-text-primary"
                >
                  {item.label}
                </Link>
              </span>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
