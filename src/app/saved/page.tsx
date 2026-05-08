import Link from "next/link";
import { Archive, ArrowRight, Database, SearchX } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function SavedPage() {
  return (
    <div className="space-y-8">
      <section className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--primary)]">Saved / Library</p>
          <h1 className="mt-3 text-4xl font-black leading-tight sm:text-5xl">Saved Library</h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-[var(--muted-foreground)]">
            Saved manifests, source catalogs, and future saved-video collections share the same metadata card hierarchy.
          </p>
        </div>
        <Link
          href="/channels"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[var(--primary)] px-5 text-sm font-black text-white transition hover:bg-[var(--accent-strong)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--ring)]"
        >
          Open Saved Channels
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </section>

      <Card className="space-y-5">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-[var(--border)] bg-[color-mix(in_srgb,var(--primary)_12%,transparent)] text-[var(--primary)]">
            <Archive className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-xl font-black">Library Search</h2>
            <p className="mt-1 text-sm leading-6 text-[var(--muted-foreground)]">
              Saved channel manifests are available under Channels. Saved-video collections are not wired yet.
            </p>
          </div>
        </div>
        <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
          <Input placeholder="Search saved items..." />
          <button type="button" disabled className="min-h-11 rounded-md border border-[var(--border)] bg-[var(--surface-container-low)] px-5 text-sm font-black text-[var(--muted-foreground)]">
            Filter
          </button>
        </div>
      </Card>

      <div className="grid gap-5 md:grid-cols-2">
        <Card>
          <Database className="h-6 w-6 text-[var(--primary)]" aria-hidden="true" />
          <h2 className="mt-4 text-xl font-black">Saved Channel Catalogs</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
            Persisted source-level combined manifests, attempts, and resume checkpoints live in the Channels workspace.
          </p>
          <Link href="/channels" className="mt-5 inline-flex items-center gap-2 text-sm font-black text-[var(--primary)] hover:underline">
            Browse channels
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </Card>

        <Card>
          <SearchX className="h-6 w-6 text-[var(--primary)]" aria-hidden="true" />
          <h2 className="mt-4 text-xl font-black">No Saved Videos Yet</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
            Per-user saved-video workflows are not active in the current UI, so no fake saved items are shown.
          </p>
        </Card>
      </div>
    </div>
  );
}
