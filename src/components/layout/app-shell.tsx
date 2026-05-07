import Link from "next/link";
import type { ReactNode } from "react";
import { ThemeToggle } from "./theme-toggle";

const links = [
  ["Dashboard", "/"],
  ["Channel Explorer", "/channel-explorer"],
  ["Channels", "/channels"],
  ["Search", "/search"],
  ["AI Search", "/ai-search"],
  ["Saved", "/saved"],
];

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen text-[var(--foreground)]">
      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[color:var(--background-elevated)]/92 backdrop-blur-xl">
        <nav className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <Link href="/" className="text-sm font-black text-[var(--foreground)]">
            AI Public Video Discovery
          </Link>
          <div className="flex flex-wrap items-center gap-1.5 text-sm">
            {links.map(([label, href]) => (
              <Link
                key={href}
                href={href}
                className="rounded-md px-3 py-2 text-[var(--muted-foreground)] transition hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--ring)]"
              >
                {label}
              </Link>
            ))}
            <ThemeToggle />
          </div>
        </nav>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-7 sm:py-9 lg:px-8">{children}</main>
    </div>
  );
}
