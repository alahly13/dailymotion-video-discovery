"use client";

import { Database, RefreshCw, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { ChannelCoverage, ChannelPersistenceMode, ChannelSourceMetadata } from "@/types/channel-fetch";

function display(value: string | number | null | undefined) {
  return value === null || value === undefined || value === "" ? "Unavailable" : value;
}

function formatPercent(value: number | null | undefined) {
  return value === null || value === undefined ? "Unavailable" : `${value.toFixed(2)}%`;
}

function Metric({ label, value, emphasis = false }: { label: string; value: string | number; emphasis?: boolean }) {
  return (
    <div className="metric-tile">
      <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[var(--muted-foreground)]">{label}</p>
      <p className={emphasis ? "mt-1 break-words text-lg font-black" : "mt-1 break-words text-sm font-bold"}>{value}</p>
    </div>
  );
}

export function ChannelMetadataPanel({
  metadata,
  coverage,
  loading,
  persistence,
  persistenceWarning,
  onRefresh,
}: {
  metadata: ChannelSourceMetadata | null;
  coverage: ChannelCoverage | null;
  loading: boolean;
  persistence: ChannelPersistenceMode;
  persistenceWarning: string | null;
  onRefresh: () => void;
}) {
  const persisted = persistence === "database" && !persistenceWarning;
  const persistenceCopy = persisted || (!metadata && !persistenceWarning)
    ? "Source metadata snapshots are stored in the database when manifest persistence is enabled."
    : persistenceWarning ?? "Persistence unavailable: history may reset after restart/deploy.";
  const sourceName = metadata?.displayName ?? metadata?.username ?? metadata?.handle ?? metadata?.externalSourceId ?? "Awaiting source";

  return (
    <Card className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 max-w-full items-start gap-4">
          <div className="h-12 w-12 sm:h-16 sm:w-16 shrink-0 overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface-container-high)]">
            {metadata?.avatarUrl || metadata?.thumbnailUrl ? (
              <img src={metadata.avatarUrl ?? metadata.thumbnailUrl ?? ""} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-lg font-black text-[var(--muted-foreground)]">
                {sourceName.slice(0, 1).toUpperCase()}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--muted-foreground)]">Channel Metadata</p>
            <h2 className="text-anywhere mt-1 line-clamp-2 text-xl sm:text-2xl font-black">{sourceName}</h2>
            <div className="chip-row mt-2">
              <span className="metadata-chip inline-flex items-center gap-1 rounded-md border border-[var(--border)] bg-[var(--surface-container-low)] px-2 py-1 text-[11px] font-black uppercase text-[var(--muted-foreground)]">
                <ShieldCheck className="h-3.5 w-3.5 text-[var(--success)]" aria-hidden="true" />
                Public metadata
              </span>
              <span className="metadata-chip inline-flex items-center gap-1 rounded-md border border-[var(--border)] bg-[var(--surface-container-low)] px-2 py-1 text-[11px] font-black uppercase text-[var(--muted-foreground)]">
                <Database className="h-3.5 w-3.5 text-[var(--primary)]" aria-hidden="true" />
                {persisted ? "Persisted" : persistence}
              </span>
            </div>
          </div>
        </div>
        <Button type="button" variant="secondary" onClick={onRefresh} disabled={loading}>
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Refresh Metadata
        </Button>
      </div>

      <p className="max-w-3xl text-sm leading-6 text-[var(--muted-foreground)]">
        Reported total depends on what Dailymotion exposes for this public profile. It may change over time and may not exactly match videos currently collectable through public API windows.
      </p>

      <div className="panel-muted p-3 text-sm leading-6 text-[var(--muted-foreground)]">
        {persistenceCopy}
      </div>

      {!metadata ? (
        <div className="rounded-md border border-dashed border-[var(--border)] bg-[var(--surface-container-low)] p-4 text-sm text-[var(--muted-foreground)]">
          Analyze or fetch a channel to load public source metadata.
        </div>
      ) : (
        <div className="metric-grid">
          <Metric label="Reported total" value={metadata.reportedTotalFromApi ?? "Unavailable"} emphasis />
          <Metric label="Collected unique" value={coverage?.collectedUniqueVideos ?? 0} emphasis />
          <Metric label="Estimated remaining" value={coverage?.estimatedRemainingVideos ?? "Unavailable"} emphasis />
          <Metric label="Coverage estimate" value={formatPercent(coverage?.coveragePercent)} emphasis />
          <Metric label="Profile ID" value={display(metadata.externalSourceId)} />
          <Metric label="Username" value={display(metadata.username ?? metadata.handle)} />
          <Metric label="Display name" value={display(metadata.displayName)} />
          <Metric label="Language / country" value={display([metadata.language, metadata.country].filter(Boolean).join(" / "))} />
          <div className="metric-tile">
            <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[var(--muted-foreground)]">Canonical URL</p>
            <p className="text-anywhere mt-1 text-sm font-bold">{display(metadata.canonicalUrl)}</p>
          </div>
          <Metric label="Coverage confidence" value={coverage?.coverageConfidence ?? "unknown"} />
          <Metric label="Last metadata refresh" value={display(metadata.reportedTotalCheckedAt)} />
        </div>
      )}
    </Card>
  );
}
