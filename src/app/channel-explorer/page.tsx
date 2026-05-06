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
    if (!response.ok) throw new Error(data.error ?? "Request failed.");
    if (latestRequestId.current !== requestId) return null;
    return data;
  }

  async function analyze() {
    try {
      const data = await runJson("/api/dailymotion/channel/analyze");
      if (data?.analysis) setAnalysis(`${data.analysis.displayLabel} · ${data.analysis.sourceType}`);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Analyze failed.");
    } finally { setLoading(false); }
  }

  async function fetchPath(path: string) {
    try {
      const data = await runJson(path);
      if (data?.manifest) setManifest(data.manifest);
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
      <section className="rounded-[2rem] border border-slate-200/70 bg-white/70 p-8 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/60">
        <p className="text-sm font-bold uppercase tracking-[0.25em] text-blue-600 dark:text-blue-400">Core MVP Feature</p>
        <h1 className="mt-3 max-w-4xl text-4xl font-black tracking-tight sm:text-6xl">Fetch, manifest, filter, and preview public Dailymotion channel metadata.</h1>
        <p className="mt-5 max-w-3xl text-lg text-slate-600 dark:text-slate-300">Fetch All safely paginates through public API results with deduplication, stop control, stale-response prevention, and a manifest-only filter pipeline.</p>
      </section>
      <ChannelInputPanel value={input} loading={loading} onChange={setInput} onAnalyze={analyze} onFetchFirst={() => fetchPath("/api/dailymotion/channel/fetch")} onFetchAll={() => fetchPath("/api/dailymotion/channel/fetch-all")} onStop={stopFetching} />
      {analysis ? <div className="rounded-2xl bg-emerald-100 p-4 text-sm font-semibold text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100">Detected: {analysis}</div> : null}
      {error ? <div className="rounded-2xl bg-rose-100 p-4 text-sm font-semibold text-rose-900 dark:bg-rose-950 dark:text-rose-100">{error}</div> : null}
      <ChannelFetchProgress status={loading ? "fetching" : manifest?.fetchStatus ?? "idle"} pagesFetched={manifest?.pagesFetched ?? 0} count={manifest?.items.length ?? 0} total={manifest?.totalKnownItems ?? null} />
      <ChannelManifestSummary manifest={manifest} />
      <AdvancedFilterPanel filters={filters} onChange={setFilters} onReset={() => setFilters(defaultAdvancedVideoFilters)} />
      <ActiveFilterChips filters={filters} />
      <div className="flex items-center justify-between"><h2 className="text-2xl font-black">Manifest Results</h2><p className="text-sm text-slate-500">{filteredItems.length} filtered / {manifest?.items.length ?? 0} original</p></div>
      <VideoResultsGrid items={filteredItems} />
      <AiHelperPanel />
    </div>
  );
}
