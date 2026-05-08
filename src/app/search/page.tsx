import { Filter, Search, SearchX, SlidersHorizontal } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function SearchPage() {
  return (
    <div className="space-y-8">
      <section className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--primary)]">Search</p>
          <h1 className="mt-3 text-4xl font-black leading-tight sm:text-5xl">Global Dailymotion Search</h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-[var(--muted-foreground)]">
            A future-ready public metadata search surface that will share the same manifest and filter hierarchy as Channel Explorer.
          </p>
        </div>
        <div className="rounded-md border border-[var(--border)] bg-[var(--surface-container-low)] px-3 py-2 text-xs font-black uppercase text-[var(--muted-foreground)]">
          Provider search shell
        </div>
      </section>

      <Card className="space-y-5">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-[var(--border)] bg-[color-mix(in_srgb,var(--primary)_12%,transparent)] text-[var(--primary)]">
            <Search className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-xl font-black">Search Query</h2>
            <p className="mt-1 text-sm leading-6 text-[var(--muted-foreground)]">
              This page is ready for general public metadata search. No fake result data is rendered.
            </p>
          </div>
        </div>
        <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
          <Input placeholder="Search public Dailymotion metadata..." />
          <button type="button" disabled className="min-h-11 rounded-md bg-[var(--primary)] px-5 text-sm font-black text-white opacity-60">
            Search
          </button>
        </div>
      </Card>

      <div className="grid gap-5 xl:grid-cols-[0.35fr_0.65fr]">
        <Card className="space-y-5">
          <div className="flex items-center gap-3">
            <SlidersHorizontal className="h-5 w-5 text-[var(--primary)]" aria-hidden="true" />
            <h2 className="text-xl font-black">Advanced Filters</h2>
          </div>
          <div className="grid gap-3">
            <Input placeholder="Language" />
            <Input placeholder="Owner / channel" />
            <Input type="number" placeholder="Minimum views" />
            <Input type="number" placeholder="Published year" />
            <label className="flex min-h-11 items-center gap-3 rounded-md border border-[var(--border)] bg-[var(--surface-container-low)] px-4 text-sm font-semibold text-[var(--muted-foreground)]">
              <input type="checkbox" className="h-4 w-4 accent-[var(--primary)]" />
              Has thumbnail
            </label>
          </div>
        </Card>

        <Card className="min-h-[26rem]">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <Filter className="h-5 w-5 text-[var(--primary)]" aria-hidden="true" />
              <h2 className="min-w-0 text-xl font-black">Result Grid</h2>
            </div>
            <span className="rounded-md border border-[var(--border)] bg-[var(--surface-container-low)] px-3 py-1 text-xs font-black uppercase text-[var(--muted-foreground)]">
              0 results
            </span>
          </div>
          <div className="flex min-h-[18rem] flex-col items-center justify-center rounded-lg border border-dashed border-[var(--border)] bg-[var(--surface-container-low)] p-8 text-center">
            <SearchX className="h-8 w-8 text-[var(--primary)]" aria-hidden="true" />
            <h3 className="mt-4 text-lg font-black">No search has been run</h3>
            <p className="mt-2 max-w-md text-sm leading-6 text-[var(--muted-foreground)]">
              Search results will appear here after the general search workflow is wired to the existing manifest model.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
