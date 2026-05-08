import { Card } from "@/components/ui/card";
import { Bot, ShieldCheck } from "lucide-react";

export function AiHelperPanel() {
  return (
    <Card className="space-y-3">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-[var(--border)] bg-[color-mix(in_srgb,var(--primary)_12%,transparent)] text-[var(--primary)]">
          <Bot className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--muted-foreground)]">AI Helper</p>
          <h2 className="mt-1 text-xl font-black">Gemini AI Helper</h2>
        </div>
      </div>
      <p className="text-sm leading-6 text-[var(--muted-foreground)]">
        Manifest summaries and filter suggestions run through server route handlers when Gemini is configured.
      </p>
      <div className="panel-muted flex items-start gap-3 p-3 text-sm leading-6 text-[var(--muted-foreground)]">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[var(--success)]" aria-hidden="true" />
        AI responses stay scoped to real metadata already present in the manifest request.
      </div>
    </Card>
  );
}
