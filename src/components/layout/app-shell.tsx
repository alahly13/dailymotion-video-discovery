"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  Archive,
  Bot,
  Compass,
  Database,
  LayoutDashboard,
  Search,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { ThemeToggle } from "./theme-toggle";

const links = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Channel Explorer", href: "/channel-explorer", icon: Compass },
  { label: "Channels", href: "/channels", icon: Database },
  { label: "Search", href: "/search", icon: Search },
  { label: "AI Search", href: "/ai-search", icon: Bot },
  { label: "Saved / Library", href: "/saved", icon: Archive },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen text-[var(--foreground)] lg:grid lg:grid-cols-[17rem_minmax(0,1fr)]">
      {/* Desktop navigation owns the persistent research-terminal frame. Keep it
          outside page content so route screens can stay focused on real data. */}
      <aside className="hidden border-r border-[var(--border)] bg-[var(--surface-container-low)]/96 lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col">
        <div className="border-b border-[var(--border)] px-5 py-5">
          <Link href="/" className="group flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-md border border-[var(--border-strong)] bg-[var(--primary)] text-sm font-black text-white shadow-[var(--shadow)]">
              AI
            </span>
            <span className="min-w-0">
              <span className="block truncate text-base font-black tracking-tight text-[var(--foreground)]">
                VideoDiscovery
              </span>
              <span className="block truncate text-xs font-bold uppercase text-[var(--muted-foreground)]">
                Research Terminal
              </span>
            </span>
          </Link>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {links.map(({ label, href, icon: Icon }) => {
            const active = isActivePath(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "group flex items-center gap-3 rounded-md border border-transparent px-3 py-2.5 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--ring)]",
                  active
                    ? "border-[color-mix(in_srgb,var(--primary)_34%,transparent)] bg-[color-mix(in_srgb,var(--primary)_13%,transparent)] text-[var(--foreground)]"
                    : "text-[var(--muted-foreground)] hover:bg-[var(--surface-container-high)] hover:text-[var(--foreground)]"
                )}
              >
                <Icon className={cn("h-4 w-4", active ? "text-[var(--primary)]" : "text-[var(--muted-foreground)] group-hover:text-[var(--primary)]")} aria-hidden="true" />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-[var(--border)] p-4">
          <div className="panel-muted p-3 text-xs leading-5 text-[var(--muted-foreground)]">
            <p className="font-black uppercase text-[var(--foreground)]">Metadata only</p>
            <p className="mt-1">Public manifests, saved attempts, filters, and AI helpers stay grounded in collected video metadata.</p>
          </div>
        </div>
      </aside>

      <div className="min-w-0">
        {/* Mobile/tablet top navigation collapses the sidebar into scrollable
            chips and keeps the command actions reachable without horizontal overflow. */}
        <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--surface)]/88 backdrop-blur-xl">
          <div className="mx-auto flex max-w-[1500px] flex-col gap-3 px-4 py-3 lg:px-7">
            <div className="flex items-center justify-between gap-3">
              <Link href="/" className="flex min-w-0 items-center gap-3 lg:hidden">
                <span className="flex h-9 w-9 items-center justify-center rounded-md bg-[var(--primary)] text-xs font-black text-white">
                  AI
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-black">VideoDiscovery</span>
                  <span className="block truncate text-[11px] font-bold uppercase text-[var(--muted-foreground)]">Research Terminal</span>
                </span>
              </Link>

              <div className="hidden min-w-0 items-center gap-3 lg:flex">
                <div className="terminal-rule h-6 w-16 rounded-full" aria-hidden="true" />
                <p className="truncate text-sm font-bold text-[var(--muted-foreground)]">Public video metadata intelligence workspace</p>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <Link
                  href="/search"
                  className="hidden min-h-10 items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--surface-container-low)] px-3 text-sm font-bold text-[var(--muted-foreground)] transition hover:border-[var(--primary)] hover:text-[var(--foreground)] sm:inline-flex"
                >
                  <Search className="h-4 w-4" aria-hidden="true" />
                  Search Workspace
                </Link>
                <Link
                  href="/channel-explorer"
                  className="inline-flex min-h-10 items-center gap-2 rounded-md bg-[var(--primary)] px-3 text-sm font-black text-white transition hover:bg-[var(--accent-strong)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--ring)] max-[374px]:h-10 max-[374px]:w-10 max-[374px]:justify-center max-[374px]:px-0"
                >
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                  <span className="max-[374px]:sr-only">New Fetch</span>
                </Link>
                <ThemeToggle />
              </div>
            </div>

            <nav className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 lg:hidden">
              {links.map(({ label, href, icon: Icon }) => {
                const active = isActivePath(pathname, href);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "inline-flex min-h-9 shrink-0 items-center gap-2 rounded-md border px-3 text-xs font-black transition",
                      active
                        ? "border-[var(--primary)] bg-[color-mix(in_srgb,var(--primary)_12%,transparent)] text-[var(--foreground)]"
                        : "border-[var(--border)] bg-[var(--surface-container-low)] text-[var(--muted-foreground)]"
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                    {label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </header>

        <main className="mx-auto min-w-0 max-w-[1500px] px-4 py-6 sm:py-8 lg:px-7">{children}</main>
      </div>
    </div>
  );
}
