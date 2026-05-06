"use client";

import { useMemo, useRef, useState } from "react";
import { AiHelperPanel } from "@/components/ai/ai-helper-panel";
import { ChannelCoveragePanel } from "@/components/channel-explorer/channel-coverage-panel";
import { ChannelFetchConfigPanel } from "@/components/channel-explorer/channel-fetch-config-panel";
import { ChannelFetchHistoryPanel } from "@/components/channel-explorer/channel-fetch-history-panel";
import { ChannelFetchProgress } from "@/components/channel-explorer/channel-fetch-progress";
import { ChannelInputPanel } from "@/components/channel-explorer/channel-input-panel";
import { ChannelManifestSummary } from "@/components/channel-explorer/channel-manifest-summary";
import { ChannelMetadataPanel } from "@/components/channel-explorer/channel-metadata-panel";
import { ActiveFilterChips } from "@/components/filters/active-filter-chips";
import { AdvancedFilterPanel } from "@/components/filters/advanced-filter-panel";
import { VideoResultsGrid } from "@/components/video/video-results-grid";
import { applyAdvancedVideoFilters } from "@/lib/filters/apply-advanced-video-filters";
import { defaultAdvancedVideoFilters } from "@/lib/filters/filter-types";
import type { ChannelCoverage, ChannelCoverageResponse, ChannelFetchJobSnapshot, ChannelFetchSettings, ChannelFetchStartResponse, ChannelHistoryResponse, ChannelMetadataResponse, ChannelPersistenceMode, ChannelSourceMetadata, FetchHistoryEntry, FetchSafetyCaps } from "@/types/channel-fetch";
import type { AdvancedVideoFilters } from "@/types/filters";
import type { ChannelManifest } from "@/types/manifest";

const defaultFetchSettings: ChannelFetchSettings = {
  fetchProfile: "deep-balanced",
  maxItems: 100000,
  maxTotalPages: 5000,
  maxWindows: 3000,
  pageSize: 100,
  fromDate: null,
  toDate: null,
  initialWindowUnit: "year",
  minimumSplitUnit: "month",
  autoSplitCappedWindows: true,
  delayMs: 250,
  stopWhenMaxItemsReached: true,
  stopOnCappedWindow: false,
  preservePartialManifest: true,
  resumeJobId: null,
};

async function readJson<T>(response: Response): Promise<T> {
  return (await response.json()) as T;
}

export default function ChannelExplorerPage() {
  const [input, setInput] = useState("");
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<ChannelSourceMetadata | null>(null);
  const [manifest, setManifest] = useState<ChannelManifest | null>(null);
  const [activeJob, setActiveJob] = useState<ChannelFetchJobSnapshot | null>(null);
  const [coverage, setCoverage] = useState<ChannelCoverage | null>(null);
  const [history, setHistory] = useState<FetchHistoryEntry[]>([]);
  const [persistenceMode, setPersistenceMode] = useState<ChannelPersistenceMode>("runtime-memory");
  const [persistenceWarning, setPersistenceWarning] = useState<string | null>(null);
  const [safetyCaps, setSafetyCaps] = useState<FetchSafetyCaps | null>(null);
  const [fetchSettings, setFetchSettings] = useState<ChannelFetchSettings>(defaultFetchSettings);
  const [filters, setFilters] = useState<AdvancedVideoFilters>(defaultAdvancedVideoFilters);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const stopRequestedRef = useRef(false);

  const filteredItems = useMemo(() => applyAdvancedVideoFilters(manifest?.items ?? [], filters), [manifest, filters]);

  function applyJobSnapshot(job: ChannelFetchJobSnapshot) {
    setActiveJob(job);
    setManifest(job.manifest);
    setMetadata(job.metadata);
    setCoverage(job.coverage);
    setPersistenceMode(job.persistence);
    setPersistenceWarning(job.persistenceWarning ?? job.coverage.persistenceWarning ?? null);
  }

  async function refreshHistory(sourceInput = input) {
    if (!sourceInput.trim()) return;
    const response = await fetch(`/api/dailymotion/channel/history?input=${encodeURIComponent(sourceInput)}`, { cache: "no-store" });
    const data = await readJson<ChannelHistoryResponse>(response);
    if (data.ok) {
      setHistory(data.history);
      setPersistenceMode(data.persistence);
      setPersistenceWarning(data.persistenceWarning ?? data.history.find((entry) => entry.persistenceWarning)?.persistenceWarning ?? null);
    }
  }

  async function refreshCoverage(sourceInput = input) {
    if (!sourceInput.trim()) return;
    const response = await fetch(`/api/dailymotion/channel/coverage?input=${encodeURIComponent(sourceInput)}`, { cache: "no-store" });
    const data = await readJson<ChannelCoverageResponse>(response);
    if (data.ok) {
      setCoverage(data.coverage);
      setPersistenceMode(data.persistence);
      setPersistenceWarning(data.persistenceWarning ?? data.coverage?.persistenceWarning ?? null);
    }
  }

  async function analyze() {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/dailymotion/channel/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ input }) });
      const data = await readJson<{ analysis?: { displayLabel: string; sourceType: string }; error?: string }>(response);
      if (!response.ok) throw new Error(data.error ?? "Analyze failed.");
      if (data.analysis) setAnalysis(`${data.analysis.displayLabel} - ${data.analysis.sourceType}`);
      await refreshMetadata();
      await refreshHistory();
      await refreshCoverage();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analyze failed.");
    } finally {
      setLoading(false);
    }
  }

  async function refreshMetadata() {
    if (!input.trim()) return;
    const response = await fetch("/api/dailymotion/channel/metadata", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ input }) });
    const data = await readJson<ChannelMetadataResponse>(response);
    if (data.safetyCaps) setSafetyCaps(data.safetyCaps);
    if (data.persistence) setPersistenceMode(data.persistence);
    setPersistenceWarning(data.persistenceWarning ?? data.metadata?.persistenceWarning ?? null);
    if (!response.ok && !data.metadata) throw new Error(data.error ?? "Metadata refresh failed.");
    if (data.metadata) setMetadata(data.metadata);
  }

  async function continueJob(jobId: string, controller: AbortController) {
    let latest: ChannelFetchJobSnapshot | null = null;

    // The browser orchestrates small route-handler chunks so long channel
    // fetches are resumable and less likely to hit Vercel request duration
    // limits. Result filters are not involved in this loop.
    while (!stopRequestedRef.current) {
      const response = await fetch("/api/dailymotion/channel/jobs/next", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId }),
        signal: controller.signal,
      });
      const data = await readJson<{ ok: boolean; job?: ChannelFetchJobSnapshot; done?: boolean; error?: string }>(response);
      if (!response.ok || !data.ok || !data.job) throw new Error(data.error ?? "Fetch job failed.");
      latest = data.job;
      applyJobSnapshot(data.job);
      if (data.done || data.job.status !== "running") break;
    }

    return latest;
  }

  async function startFetch(resumeJobId: string | null = null) {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    stopRequestedRef.current = false;
    setLoading(true);
    setError(null);

    try {
      const requestId = crypto.randomUUID();
      const response = await fetch("/api/dailymotion/channel/jobs/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input, requestId, settings: { ...fetchSettings, resumeJobId } }),
        signal: controller.signal,
      });
      const data = await readJson<ChannelFetchStartResponse>(response);
      if (data.safetyCaps) setSafetyCaps(data.safetyCaps);
      if (data.persistence) setPersistenceMode(data.persistence);
      setPersistenceWarning(data.persistenceWarning ?? data.job?.persistenceWarning ?? null);
      if (!response.ok || !data.ok || !data.job) throw new Error(data.error ?? "Unable to start fetch.");
      applyJobSnapshot(data.job);
      const latest = data.job.status === "running" ? await continueJob(data.job.id, controller) : data.job;
      if (latest) applyJobSnapshot(latest);
      await refreshHistory(input);
      await refreshCoverage(input);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Fetch failed.");
    } finally {
      setLoading(false);
    }
  }

  async function stopFetching() {
    stopRequestedRef.current = true;
    abortRef.current?.abort();
    const jobId = activeJob?.id;
    setLoading(false);
    if (!jobId) {
      setManifest((current) => current ? { ...current, fetchStatus: "stopped", isPartial: true, isComplete: false, updatedAt: new Date().toISOString() } : current);
      return;
    }
    const response = await fetch("/api/dailymotion/channel/jobs/stop", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ jobId }) });
    const data = await readJson<{ ok: boolean; job?: ChannelFetchJobSnapshot; error?: string }>(response);
    if (data.ok && data.job) applyJobSnapshot(data.job);
    await refreshHistory(input);
  }

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <p className="text-sm font-bold uppercase text-[var(--accent)]">Channel Explorer</p>
        <h1 className="max-w-4xl text-4xl font-black leading-tight sm:text-6xl">Build a public Dailymotion metadata catalog.</h1>
        <p className="max-w-3xl text-lg leading-8 text-[var(--muted-foreground)]">
          Collect public channel metadata through explicit fetch profiles, track database checkpoints when persistence is enabled, preserve partial manifests, and filter only what has already been collected.
        </p>
      </section>

      <ChannelInputPanel value={input} loading={loading} canStop={loading || activeJob?.status === "running"} onChange={setInput} onAnalyze={analyze} onStop={stopFetching} />
      {analysis ? <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 text-sm font-semibold text-[var(--success)]">Detected: {analysis}</div> : null}
      {error ? <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 text-sm font-semibold text-[var(--danger)]">{error}</div> : null}

      <ChannelMetadataPanel metadata={metadata} coverage={coverage} loading={loading} persistence={persistenceMode} persistenceWarning={persistenceWarning} onRefresh={refreshMetadata} />
      <ChannelFetchConfigPanel settings={fetchSettings} safetyCaps={safetyCaps} loading={loading} onChange={setFetchSettings} onStart={() => startFetch()} onReset={() => setFetchSettings(defaultFetchSettings)} />
      <ChannelFetchProgress status={activeJob?.status ?? (loading ? "fetching" : manifest?.fetchStatus ?? "idle")} pagesFetched={activeJob?.progress.pagesFetched ?? manifest?.pagesFetched ?? 0} count={manifest?.items.length ?? 0} total={metadata?.reportedTotalFromApi ?? manifest?.totalKnownItems ?? null} progress={activeJob?.progress ?? null} persistence={persistenceMode} persistenceWarning={persistenceWarning} />
      <ChannelFetchHistoryPanel history={history} activeJobId={activeJob?.id ?? null} loading={loading} persistence={persistenceMode} persistenceWarning={persistenceWarning} onResume={(jobId) => startFetch(jobId)} />
      <ChannelCoveragePanel coverage={coverage} persistence={persistenceMode} persistenceWarning={persistenceWarning} />
      <ChannelManifestSummary manifest={manifest} persistence={activeJob?.persistence ?? persistenceMode} />
      <AdvancedFilterPanel filters={filters} onChange={setFilters} onReset={() => setFilters(defaultAdvancedVideoFilters)} />
      <ActiveFilterChips filters={filters} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-black">Manifest Results</h2>
        <p className="text-sm text-[var(--muted-foreground)]">{filteredItems.length} filtered / {manifest?.items.length ?? 0} original</p>
      </div>
      <VideoResultsGrid items={filteredItems} />
      <AiHelperPanel />
    </div>
  );
}
