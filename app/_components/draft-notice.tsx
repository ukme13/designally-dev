import type { ReactNode } from "react";

type DraftNoticeProps = {
  children: ReactNode;
  /** Overrides the default "Draft content" label. */
  label?: string;
};

/**
 * Marks scaffolded content that is not approved for publication yet.
 * Every use should say what evidence or decision is still outstanding.
 */
export default function DraftNotice({
  children,
  label = "Draft content",
}: DraftNoticeProps) {
  return (
    <aside className="rounded-md border border-border-default bg-surface-raised p-6">
      <p className="type-label text-text-muted">
        {label}
      </p>
      <p className="mt-3 max-w-text type-small text-text-secondary">{children}</p>
    </aside>
  );
}
