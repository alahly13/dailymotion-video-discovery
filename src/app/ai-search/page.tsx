export default function AiSearchPage() {
  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <p className="text-sm font-semibold uppercase text-[var(--accent)]">AI Search</p>
        <h1 className="text-3xl font-black sm:text-5xl">Gemini-Assisted Discovery</h1>
        <p className="max-w-3xl text-base leading-7 text-[var(--muted-foreground)]">
          Server-side AI routes are ready for scoped query parsing, filter help, and manifest summaries.
        </p>
      </section>
      <div className="grid gap-5 md:grid-cols-3">
        {["Parse query", "Suggest filters", "Summarize manifest"].map((label) => (
          <div key={label} className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow)]">
            <p className="text-sm font-semibold">{label}</p>
            <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">Available when AI is configured server-side.</p>
          </div>
        ))}
      </div>
    </div>
  );
}
