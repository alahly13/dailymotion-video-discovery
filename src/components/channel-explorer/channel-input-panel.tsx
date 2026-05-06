"use client";

import { Square, WandSparkles } from "lucide-react";
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
    <Card className="space-y-4">
      <div>
        <h2 className="text-xl font-bold">Dailymotion Channel Explorer</h2>
        <p className="mt-1 text-sm leading-6 text-[var(--muted-foreground)]">
          Paste a public channel/profile URL, username, or channel ID. The app fetches metadata only, never videos.
        </p>
      </div>
      <Input value={value} onChange={(event) => onChange(event.target.value)} placeholder="https://www.dailymotion.com/channel/news or username" />
      <div className="flex flex-wrap gap-3">
        <Button type="button" variant="secondary" onClick={onAnalyze} disabled={loading}>
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
