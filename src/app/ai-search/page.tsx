import { Bot, FileSearch, Sparkles, WandSparkles } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function AiSearchPage() {
  return (
    <div className="space-y-8">
      <section>
        <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--primary)]">AI Search</p>
        <h1 className="mt-3 text-4xl font-black leading-tight sm:text-5xl">Gemini-Assisted Discovery</h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-[var(--muted-foreground)]">
          AI helpers are scoped to real metadata supplied by server routes. This page does not render invented videos or fake interpretations.
        </p>
      </section>

      <div className="grid gap-5 xl:grid-cols-[0.58fr_0.42fr]">
        <Card className="space-y-5">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-[var(--border)] bg-[color-mix(in_srgb,var(--primary)_12%,transparent)] text-[var(--primary)]">
              <WandSparkles className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-xl font-black">Prompt Workspace</h2>
              <p className="mt-1 text-sm leading-6 text-[var(--muted-foreground)]">
                Draft metadata questions, filter intent, or manifest summary requests.
              </p>
            </div>
          </div>
          <textarea
            className="min-h-40 w-full resize-y rounded-md border border-[var(--border)] bg-[var(--surface-container-low)] p-4 text-sm outline-none transition placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--ring)]"
            placeholder="Ask about a loaded manifest, filter intent, or metadata pattern..."
          />
          <button type="button" disabled className="min-h-11 w-full rounded-md bg-[var(--primary)] px-5 text-sm font-black text-white opacity-60 sm:w-auto">
            Interpret with AI
          </button>
        </Card>

        <Card className="space-y-5">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-[var(--border)] bg-[color-mix(in_srgb,var(--info)_12%,transparent)] text-[var(--info)]">
              <Bot className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-xl font-black">AI Interpretation</h2>
              <p className="mt-1 text-sm leading-6 text-[var(--muted-foreground)]">
                Responses appear only after a real manifest-aware request is connected.
              </p>
            </div>
          </div>
          <div className="flex min-h-52 flex-col justify-center rounded-lg border border-dashed border-[var(--border)] bg-[var(--surface-container-low)] p-6 text-center">
            <Sparkles className="mx-auto h-7 w-7 text-[var(--primary)]" aria-hidden="true" />
            <h3 className="mt-4 text-lg font-black">No AI output yet</h3>
            <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
              AI output must stay grounded in collected or supplied metadata.
            </p>
          </div>
        </Card>
      </div>

      <section className="grid gap-5 md:grid-cols-3">
        {[
          ["Parse query", "Convert research wording into safe filter intent."],
          ["Suggest filters", "Recommend refinements against an actual manifest summary."],
          ["Summarize manifest", "Summarize real collected metadata without inventing videos."],
        ].map(([label, copy]) => (
          <Card key={label}>
            <FileSearch className="h-5 w-5 text-[var(--primary)]" aria-hidden="true" />
            <h2 className="mt-4 font-black">{label}</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">{copy}</p>
          </Card>
        ))}
      </section>
    </div>
  );
}
