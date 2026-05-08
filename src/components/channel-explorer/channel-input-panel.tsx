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
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="https://www.dailymotion.com/channel/news or username"
          className="font-mono flex-1 min-w-0"
        />
        <div className="flex shrink-0 flex-wrap gap-3">
          <Button type="button" onClick={onAnalyze} disabled={loading} className="flex-1 sm:flex-none">
            <WandSparkles className="h-4 w-4" aria-hidden="true" />
            Analyze
          </Button>
          <Button type="button" variant="danger" onClick={onStop} disabled={!canStop} className="flex-1 sm:flex-none">
            <Square className="h-4 w-4" aria-hidden="true" />
            Stop
          </Button>
        </div>
      </div>
    </Card>
  );
}
