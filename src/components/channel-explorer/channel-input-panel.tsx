"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function ChannelInputPanel({ value, loading, onChange, onAnalyze, onFetchFirst, onFetchAll, onStop }: {
  value: string;
  loading: boolean;
  onChange: (value: string) => void;
  onAnalyze: () => void;
  onFetchFirst: () => void;
  onFetchAll: () => void;
  onStop: () => void;
}) {
  return (
    <Card className="space-y-4">
      <div>
        <h2 className="text-xl font-bold">Dailymotion Channel Explorer</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Paste a public channel/profile URL, username, or channel ID. The app fetches metadata only—never videos.</p>
      </div>
      <Input value={value} onChange={(event) => onChange(event.target.value)} placeholder="https://www.dailymotion.com/channel/news or username" />
      <div className="flex flex-wrap gap-3">
        <Button type="button" variant="secondary" onClick={onAnalyze} disabled={loading}>Analyze Channel</Button>
        <Button type="button" onClick={onFetchFirst} disabled={loading}>Fetch First Page</Button>
        <Button type="button" onClick={onFetchAll} disabled={loading}>Fetch All Public Results</Button>
        <Button type="button" variant="danger" onClick={onStop} disabled={!loading}>Stop Fetching</Button>
      </div>
    </Card>
  );
}
