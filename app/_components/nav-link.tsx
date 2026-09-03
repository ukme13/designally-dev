"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type NavLinkProps = {
  href: string;
  label: string;
  className?: string;
  /** Classes applied when this link matches the current route. */
  activeClassName?: string;
  /** Classes applied when it does not. */
  inactiveClassName?: string;
  /** Optional trailing mark. */
  icon?: ReactNode;
  /** Optional leading index, e.g. "01" on menu rows. */
  index?: string;
  indexClassName?: string;
  labelClassName?: string;
};

/**
 * A nav link that knows whether it is the current page. Kept as a small client
 * island so SiteHeader itself stays a Server Component.
 *
 * The original site marks the current entry in brand orange
 * (Elementor's `elementor-item-active`); this reproduces that state.
 */
export default function NavLink({
  href,
  label,
  className,
  activeClassName,
  inactiveClassName,
  icon,
  index,
  indexClassName,
  labelClassName,
}: NavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={`${className ?? ""} ${isActive ? (activeClassName ?? "") : (inactiveClassName ?? "")}`}
    >
      {index ? <span className={indexClassName}>{index}</span> : null}
      <span className={labelClassName}>{label}</span>
      {icon}
    </Link>
  );
}
