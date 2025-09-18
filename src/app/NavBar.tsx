"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

function classNames(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

type MatchMode = "exact" | "section";

type NavLink = {
  href: string;
  label: string;
  testid: string;
  match: MatchMode;
  sectionBase?: string; // only when match === 'section' and base differs from href
};

const links: readonly NavLink[] = [
  { href: "/", label: "Home", testid: "nav-link-home-2", match: "exact" },
  { href: "/inventory", label: "Inventory", testid: "nav-link-inventory", match: "section" },
  { href: "/playground", label: "Playground", testid: "nav-link-playground", match: "exact" },
  // Link to a concrete studio route to avoid 404 on "/studio" root, but keep section-based active state
  { href: "/studio/123", label: "Studio", testid: "nav-link-studio", match: "section", sectionBase: "/studio" },
  { href: "/library", label: "Library", testid: "nav-link-library", match: "section" },
  { href: "/templates", label: "Templates", testid: "nav-link-templates", match: "section" },
] as const;

export default function NavBar() {
  const pathname = usePathname() || "/";
  const [open, setOpen] = React.useState(false);

  const isActive = (link: NavLink) => {
    if (link.match === "exact") {
      return pathname === link.href;
    }
    const base = link.sectionBase ?? link.href;
    return pathname === base || pathname.startsWith(base + "/");
  };

  const onNavClick = () => setOpen(false);

  return (
    <div className="relative">
      {/* Mobile toggle */}
      <button
        type="button"
        className="md:hidden inline-flex items-center justify-center rounded-md p-2 text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label="Toggle navigation"
        aria-controls="primary-nav"
        aria-expanded={open ? "true" : "false"}
        data-testid="nav-mobile-toggle"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? (
          // X icon
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
            <path fillRule="evenodd" d="M6.225 4.811a1 1 0 0 1 1.414 0L12 9.172l4.361-4.361a1 1 0 1 1 1.414 1.414L13.414 10.586l4.361 4.361a1 1 0 1 1-1.414 1.414L12 12l-4.361 4.361a1 1 0 0 1-1.414-1.414l4.361-4.361-4.361-4.361a1 1 0 0 1 0-1.414Z" clipRule="evenodd" />
          </svg>
        ) : (
          // Hamburger icon
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
            <path fillRule="evenodd" d="M3.75 6.75A.75.75 0 0 1 4.5 6h15a.75.75 0 0 1 0 1.5h-15a.75.75 0 0 1-.75-.75Zm0 5.25a.75.75 0 0 1 .75-.75h15a.75.75 0 0 1 0 1.5h-15a.75.75 0 0 1-.75-.75Zm.75 4.5a.75.75 0 0 0 0 1.5h15a.75.75 0 0 0 0-1.5h-15Z" clipRule="evenodd" />
          </svg>
        )}
      </button>

      <nav
        id="primary-nav"
        className={classNames(
          "items-center gap-6 text-sm",
          open ?
            "absolute left-0 right-0 top-12 z-50 flex flex-col bg-white dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800 p-4 shadow-sm" :
            "hidden",
          "md:static md:flex md:flex-row md:bg-transparent md:border-0 md:p-0 md:shadow-none"
        )}
        aria-label="Primary"
        data-testid="app-nav"
      >
        {links.map((link) => {
          const active = isActive(link);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={classNames(
                "transition-colors hover:text-blue-600",
                // visible focus styles for keyboard navigation
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:rounded",
                active && "text-blue-700 dark:text-blue-400 font-medium underline underline-offset-4"
              )}
              data-testid={link.testid}
              aria-current={active ? "page" : undefined}
              onClick={onNavClick}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}