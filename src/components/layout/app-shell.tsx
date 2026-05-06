import Link from "next/link";
import type { ReactNode } from "react";

const links = [
  ["Home", "/"],
  ["Channel Explorer", "/channel-explorer"],
  ["Search", "/search"],
  ["AI Search", "/ai-search"],
  ["Saved", "/saved"],
];

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/75 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/70">
        <nav className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <Link href="/" className="text-base font-black tracking-tight">AI Public Video Discovery</Link>
          <div className="flex flex-wrap gap-2 text-sm">
            {links.map(([label, href]) => <Link key={href} href={href} className="rounded-full px-3 py-1.5 text-slate-600 transition hover:bg-slate-200/70 dark:text-slate-300 dark:hover:bg-slate-800">{label}</Link>)}
          </div>
        </nav>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 lg:px-8">{children}</main>
    </div>
  );
}
