export default function SavedPage() {
  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <p className="text-sm font-semibold uppercase text-[var(--accent)]">Library</p>
        <h1 className="text-3xl font-black sm:text-5xl">Saved Library</h1>
        <p className="max-w-3xl text-base leading-7 text-[var(--muted-foreground)]">
          Saved videos will use the same metadata card hierarchy as discovery results.
        </p>
      </section>
      <div className="rounded-lg border border-dashed border-[var(--border)] bg-[var(--surface)] p-10 text-center text-sm text-[var(--muted-foreground)]">
        Saved videos will appear here.
      </div>
    </div>
  );
}
