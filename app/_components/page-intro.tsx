import type { ReactNode } from "react";

type PageIntroProps = {
  eyebrow: string;
  title: string;
  intro: string;
  /** Optional actions rendered under the introduction. */
  children?: ReactNode;
};

/** Shared hero for inner pages. Carries the single <h1> for the route. */
export default function PageIntro({
  eyebrow,
  title,
  intro,
  children,
}: PageIntroProps) {
  return (
    <section className="border-b border-border-default">
      <div className="mx-auto w-full max-w-page px-gutter-mobile pt-16 pb-section-mobile md:px-gutter-tablet md:pt-24 md:pb-section-tablet xl:px-gutter-desktop">
        <p className="type-label text-text-muted">
          {eyebrow}
        </p>
        <h1 className="mt-8 max-w-4xl type-display-sm text-text-primary text-balance">
          {title}
        </h1>
        <p className="mt-8 max-w-text type-body-lg text-text-body">{intro}</p>
        {children ? (
          <div className="mt-10 flex flex-wrap gap-4">{children}</div>
        ) : null}
      </div>
    </section>
  );
}
