import Link from "next/link";
import { ArrowRight, Bot, Compass, Database, Library, Search, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";

const stats = [
  ["Platform mode", "Public metadata"],
  ["Primary workspace", "Channel Explorer"],
  ["Persistence", "Saved manifests"],
  ["Provider", "Dailymotion"],
];

const routes = [
  { label: "Channel Explorer", href: "/channel-explorer", icon: Compass, description: "Analyze sources, run bounded fetch profiles, track progress, and filter collected manifests." },
  { label: "Channels", href: "/channels", icon: Database, description: "Review persisted sources, combined manifests, fetch attempts, and resumable checkpoints." },
  { label: "Search", href: "/search", icon: Search, description: "A future-ready public metadata search workspace with filters and result-grid structure." },
  { label: "AI Search", href: "/ai-search", icon: Bot, description: "Prompt and interpretation surfaces for metadata-grounded AI discovery workflows." },
  { label: "Saved / Library", href: "/saved", icon: Library, description: "Library shell for saved manifests, channels, and future saved-video collections." },
];

export default function HomePage() {
  return (
    <div className="space-y-8">
      <section className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr] xl:items-stretch">
        <div className="relative overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow)] sm:p-8">
          <div className="terminal-rule mb-6 h-1 w-32 rounded-full" aria-hidden="true" />
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--primary)]">Research workspace</p>
          <h1 className="mt-3 max-w-4xl text-4xl font-black leading-tight sm:text-6xl">AI Public Video Discovery Platform</h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-[var(--muted-foreground)] sm:text-lg">
            Discover, organize, filter, preview, and analyze public video metadata without downloading or rehosting videos.
          </p>
          <div className="action-row mt-6">
            <Link
              href="/channel-explorer"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[var(--primary)] px-5 text-sm font-black text-white transition hover:bg-[var(--accent-strong)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--ring)]"
            >
              Open Channel Explorer
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              href="/channels"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-[var(--border)] bg-[var(--surface-container-low)] px-5 text-sm font-bold transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-container-high)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--ring)]"
            >
              Browse Channels
            </Link>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {stats.map(([label, value]) => (
            <Card key={label} className="flex min-h-32 flex-col justify-between">
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--muted-foreground)]">{label}</p>
              <p className="mt-4 text-2xl font-black">{value}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-2 2xl:grid-cols-5">
        {routes.map(({ label, href, description, icon: Icon }) => (
          <Card key={href} className="flex flex-col">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-md border border-[var(--border)] bg-[color-mix(in_srgb,var(--primary)_12%,transparent)] text-[var(--primary)]">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <h2 className="min-w-0 break-words font-black">{label}</h2>
            </div>
            <p className="mt-4 flex-1 text-sm leading-6 text-[var(--muted-foreground)]">{description}</p>
            <Link href={href} className="mt-5 inline-flex items-center gap-2 text-sm font-black text-[var(--primary)] hover:underline">
              Open
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Card>
        ))}
      </section>

      <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[var(--success)]" aria-hidden="true" />
          <p className="text-sm leading-6 text-[var(--muted-foreground)]">
            The platform is metadata-only: no downloading, no rehosting, no private stream scraping, and no client-side fake truth for protected state.
          </p>
        </div>
      </Card>
    </div>
  );
}
