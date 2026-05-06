export default function SearchPage() {
  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <p className="text-sm font-semibold uppercase text-[var(--accent)]">Search</p>
        <h1 className="text-3xl font-black sm:text-5xl">Global Dailymotion Search</h1>
        <p className="max-w-3xl text-base leading-7 text-[var(--muted-foreground)]">
          Query-wide discovery shares the same calm result system as channel manifests.
        </p>
      </section>
      <div className="grid gap-5 lg:grid-cols-[0.35fr_0.65fr]">
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-5">
          <p className="text-sm font-semibold">Filters</p>
          <div className="mt-4 space-y-3">
            <div className="h-10 rounded-md border border-[var(--border)] bg-[var(--background-elevated)]" />
            <div className="h-10 rounded-md border border-[var(--border)] bg-[var(--background-elevated)]" />
            <div className="h-10 rounded-md border border-[var(--border)] bg-[var(--background-elevated)]" />
          </div>
        </div>
        <div className="rounded-lg border border-dashed border-[var(--border)] bg-[var(--surface)] p-10 text-center text-sm text-[var(--muted-foreground)]">
          Search results will appear here.
        </div>
      </div>
    </div>
  );
}
