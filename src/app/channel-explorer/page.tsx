"use client";

import { useMemo, useRef, useState } from "react";
import { AiHelperPanel } from "@/components/ai/ai-helper-panel";
import { ChannelFetchProgress } from "@/components/channel-explorer/channel-fetch-progress";
import { ChannelInputPanel } from "@/components/channel-explorer/channel-input-panel";
import { ChannelManifestSummary } from "@/components/channel-explorer/channel-manifest-summary";
import { ActiveFilterChips } from "@/components/filters/active-filter-chips";
import { AdvancedFilterPanel } from "@/components/filters/advanced-filter-panel";
import { VideoResultsGrid } from "@/components/video/video-results-grid";
import { applyAdvancedVideoFilters } from "@/lib/filters/apply-advanced-video-filters";
import { defaultAdvancedVideoFilters } from "@/lib/filters/filter-types";
import type { AdvancedVideoFilters } from "@/types/filters";
import type { ChannelManifest } from "@/types/manifest";

export default function ChannelExplorerPage() {
  const [input, setInput] = useState("");
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [manifest, setManifest] = useState<ChannelManifest | null>(null);
  const [filters, setFilters] = useState<AdvancedVideoFilters>(defaultAdvancedVideoFilters);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const latestRequestId = useRef<string>("");

  const filteredItems = useMemo(() => applyAdvancedVideoFilters(manifest?.items ?? [], filters), [manifest, filters]);

  async function runJson(path: string) {
    abortRef.current?.abort();
    const requestId = crypto.randomUUID();
    latestRequestId.current = requestId;
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setError(null);
    const response = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ input, requestId }), signal: controller.signal });
    const data = await response.json();
    if (!response.ok && !data?.manifest) throw new Error(data.error ?? "Request failed.");
    if (latestRequestId.current !== requestId) return null;
    return data;
  }

  async function analyze() {
    try {
      const data = await runJson("/api/dailymotion/channel/analyze");
      if (data?.analysis) setAnalysis(`${data.analysis.displayLabel} - ${data.analysis.sourceType}`);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Analyze failed.");
    } finally { setLoading(false); }
  }

  async function fetchPath(path: string) {
    try {
      const data = await runJson(path);
      if (data?.manifest) setManifest(data.manifest);
      if (data && data.ok === false && data.error) setError(data.error);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Fetch failed.");
    } finally { setLoading(false); }
  }

  function stopFetching() {
    abortRef.current?.abort();
    setLoading(false);
    setManifest((current) => current ? { ...current, fetchStatus: "partial", isPartial: true, isComplete: false, updatedAt: new Date().toISOString() } : current);
  }

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <p className="text-sm font-bold uppercase text-[var(--accent)]">Channel Explorer</p>
        <h1 className="max-w-4xl text-4xl font-black leading-tight sm:text-6xl">Build a manifest from public Dailymotion channel metadata.</h1>
        <p className="max-w-3xl text-lg leading-8 text-[var(--muted-foreground)]">
          Fetch All paginates through public API results with deduplication, stop control, stale-response prevention, and manifest-only filtering.
        </p>
      </section>
      <ChannelInputPanel value={input} loading={loading} onChange={setInput} onAnalyze={analyze} onFetchFirst={() => fetchPath("/api/dailymotion/channel/fetch")} onFetchAll={() => fetchPath("/api/dailymotion/channel/fetch-all")} onStop={stopFetching} />
      {analysis ? <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 text-sm font-semibold text-[var(--success)]">Detected: {analysis}</div> : null}
      {error ? <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 text-sm font-semibold text-[var(--danger)]">{error}</div> : null}
      <ChannelFetchProgress status={loading ? "fetching" : manifest?.fetchStatus ?? "idle"} pagesFetched={manifest?.pagesFetched ?? 0} count={manifest?.items.length ?? 0} total={manifest?.totalKnownItems ?? null} />
      <ChannelManifestSummary manifest={manifest} />
      <AdvancedFilterPanel filters={filters} onChange={setFilters} onReset={() => setFilters(defaultAdvancedVideoFilters)} />
      <ActiveFilterChips filters={filters} />
      <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-2xl font-black">Manifest Results</h2><p className="text-sm text-[var(--muted-foreground)]">{filteredItems.length} filtered / {manifest?.items.length ?? 0} original</p></div>
      <VideoResultsGrid items={filteredItems} />
      <AiHelperPanel />
    </div>
  );
}
