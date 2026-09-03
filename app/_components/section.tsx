import type { ReactNode } from "react";

type SectionProps = {
  children: ReactNode;
  /** Applied to the <section> itself, for backgrounds and borders. */
  className?: string;
  id?: string;
};

/**
 * Page section using the same container, gutter and rhythm tokens as the
 * homepage sections, so inner pages stay visually consistent.
 */
export default function Section({ children, className, id }: SectionProps) {
  return (
    <section id={id} className={className}>
      <div className="mx-auto w-full max-w-page px-gutter-mobile py-section-mobile md:px-gutter-tablet md:py-section-tablet xl:px-gutter-desktop xl:py-section-desktop">
        {children}
      </div>
    </section>
  );
}
