import Link from "next/link";
import type { ReactNode } from "react";
import { ThemeToggle } from "./theme-toggle";

const links = [["Home", "/"],["Channel Explorer", "/channel-explorer"],["Search", "/search"],["AI Search", "/ai-search"],["Saved", "/saved"]];

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen text-[var(--foreground)]">
      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[color:var(--card)]/95 backdrop-blur-xl">
        <nav className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <Link href="/" className="text-base font-black tracking-tight">AI Public Video Discovery</Link>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            {links.map(([label, href]) => <Link key={href} href={href} className="rounded-full px-3 py-1.5 text-[var(--muted-foreground)] transition hover:bg-black/5 hover:text-[var(--foreground)] dark:hover:bg-white/10">{label}</Link>)}
            <ThemeToggle />
          </div>
        </nav>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:py-10 lg:px-8">{children}</main>
    </div>
  );
}
