"use client";

import { Link2, Square, WandSparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function ChannelInputPanel({ value, loading, canStop, onChange, onAnalyze, onStop }: {
  value: string;
  loading: boolean;
  canStop: boolean;
  onChange: (value: string) => void;
  onAnalyze: () => void;
  onStop: () => void;
}) {
  return (
    <Card className="space-y-5">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-[var(--border)] bg-[color-mix(in_srgb,var(--primary)_12%,transparent)] text-[var(--primary)]">
          <Link2 className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--muted-foreground)]">Source Input / Analyze</p>
          <h2 className="mt-1 text-xl font-black">Target Channel Source</h2>
          <p className="mt-1 text-sm leading-6 text-[var(--muted-foreground)]">
            Paste a public channel/profile URL, username, or channel ID. The app fetches metadata only, never videos.
          </p>
        </div>
      </div>
      <div className="grid min-w-0 gap-3 md:grid-cols-[minmax(0,1fr)_auto_auto]">
        <Input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="https://www.dailymotion.com/channel/news or username"
          className="font-mono"
        />
        <Button type="button" onClick={onAnalyze} disabled={loading}>
          <WandSparkles className="h-4 w-4" aria-hidden="true" />
          Analyze
        </Button>
        <Button type="button" variant="danger" onClick={onStop} disabled={!canStop}>
          <Square className="h-4 w-4" aria-hidden="true" />
          Stop
        </Button>
      </div>
    </Card>
  );
}
