"use client";

import type { CSSProperties } from "react";
import { useEffect, useRef } from "react";

import { useBeforePaint } from "@/app/_lib/use-before-paint";

/** The first characters are visible, but the paragraph is still quiet. */
const INITIAL_OPACITY = 0.2;
/**
 * The scroll range over which the characters become fully visible.
 *
 * ScrollTrigger's syntax is "<edge of the element> <position in the viewport>".
 * So the sentence starts lighting up when its top reaches 80% down the screen —
 * just up from the bottom edge — and is finished when its CENTRE meets the
 * viewport's centre.
 *
 * Ending on "center center" rather than an edge is what makes the finish
 * predictable: the last character lands exactly as the paragraph sits centred,
 * whatever its height and however fast the visitor is scrolling. Scrub maps the
 * whole tween, stagger included, across this range, so the end of the range is
 * the end of the sentence.
 */
const SCROLL_START = "top 80%";
const SCROLL_END = "center center";
/** The opacity gradient travels through the sentence character by character. */
const CHARACTER_STAGGER = 0.03;

/**
 * A paragraph whose characters become opaque as it moves through the viewport.
 *
 * The server renders the full sentence, so the copy remains available without
 * JavaScript. The client only lowers the visual opacity before paint, then
 * links each character's opacity to the scroll position with ScrollTrigger.
 */
export default function ScrollGradientText({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const rootRef = useRef<HTMLParagraphElement>(null);
  const characterRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useBeforePaint(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    for (const character of characterRefs.current) {
      character?.style.setProperty("opacity", String(INITIAL_OPACITY));
    }
  });

  useEffect(() => {
    const root = rootRef.current;
    const characters = characterRefs.current.filter(
      (character): character is HTMLSpanElement => character !== null,
    );
    if (!root || characters.length === 0) return;

    let cancelled = false;
    let revert: (() => void) | undefined;

    const run = async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);

      if (cancelled) return;

      gsap.registerPlugin(ScrollTrigger);

      const media = gsap.matchMedia();
      media.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.set(characters, {
          opacity: INITIAL_OPACITY,
          willChange: "opacity",
        });

        const animation = gsap.to(characters, {
          opacity: 1,
          duration: 1,
          ease: "none",
          stagger: CHARACTER_STAGGER,
          scrollTrigger: {
            trigger: root,
            start: SCROLL_START,
            end: SCROLL_END,
            scrub: true,
            invalidateOnRefresh: true,
          },
        });

        return () => {
          animation.scrollTrigger?.kill();
          animation.kill();
          gsap.set(characters, { clearProps: "opacity,willChange" });
        };
      });

      revert = () => media.revert();
    };

    void run();

    return () => {
      cancelled = true;
      revert?.();
    };
  }, []);

  return (
    <p ref={rootRef} className={className}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true" style={{ whiteSpace: "pre-wrap" } as CSSProperties}>
        {Array.from(text).map((character, index) => (
          <span
            key={`${character}-${index}`}
            ref={(element) => {
              characterRefs.current[index] = element;
            }}
          >
            {character}
          </span>
        ))}
      </span>
    </p>
  );
}
