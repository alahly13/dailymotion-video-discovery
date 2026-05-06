"use client";

import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { ChannelCoverage, ChannelPersistenceMode, ChannelSourceMetadata } from "@/types/channel-fetch";

function display(value: string | number | null | undefined) {
  return value === null || value === undefined || value === "" ? "Unavailable" : value;
}

function formatPercent(value: number | null | undefined) {
  return value === null || value === undefined ? "Unavailable" : `${value.toFixed(2)}%`;
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

  return (
    <Card className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold">Channel Metadata</h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-[var(--muted-foreground)]">
            Reported total depends on what Dailymotion exposes for this public profile. It may change over time and may not exactly match videos currently collectable through public API windows.
          </p>
        </div>
        <Button type="button" variant="secondary" onClick={onRefresh} disabled={loading}>
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Refresh Metadata
        </Button>
      </div>

      <div className="rounded-md border border-[var(--border)] bg-[var(--surface-muted)] p-3 text-sm leading-6 text-[var(--muted-foreground)]">
        {persistenceCopy}
      </div>

      {!metadata ? (
        <div className="rounded-md border border-dashed border-[var(--border)] bg-[var(--surface-muted)] p-4 text-sm text-[var(--muted-foreground)]">
          Analyze or fetch a channel to load public source metadata.
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <p className="text-xs font-semibold uppercase text-[var(--muted-foreground)]">Profile ID</p>
            <p className="mt-1 break-all text-sm font-bold">{display(metadata.externalSourceId)}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-[var(--muted-foreground)]">Username</p>
            <p className="mt-1 text-sm font-bold">{display(metadata.username ?? metadata.handle)}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-[var(--muted-foreground)]">Display name</p>
            <p className="mt-1 text-sm font-bold">{display(metadata.displayName)}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-[var(--muted-foreground)]">Language / country</p>
            <p className="mt-1 text-sm font-bold">{display([metadata.language, metadata.country].filter(Boolean).join(" / "))}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-[var(--muted-foreground)]">Reported total from Dailymotion</p>
            <p className="mt-1 text-sm font-bold">{metadata.reportedTotalFromApi ?? "Reported total: unavailable"}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-[var(--muted-foreground)]">Collected unique public videos</p>
            <p className="mt-1 text-sm font-bold">{coverage?.collectedUniqueVideos ?? 0}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-[var(--muted-foreground)]">Estimated remaining</p>
            <p className="mt-1 text-sm font-bold">{coverage?.estimatedRemainingVideos ?? "Unavailable"}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-[var(--muted-foreground)]">Coverage estimate</p>
            <p className="mt-1 text-sm font-bold">{formatPercent(coverage?.coveragePercent)}</p>
          </div>
          <div className="md:col-span-2">
            <p className="text-xs font-semibold uppercase text-[var(--muted-foreground)]">Canonical URL</p>
            <p className="mt-1 break-all text-sm font-bold">{display(metadata.canonicalUrl)}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-[var(--muted-foreground)]">Coverage confidence</p>
            <p className="mt-1 text-sm font-bold">{coverage?.coverageConfidence ?? "unknown"}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-[var(--muted-foreground)]">Last metadata refresh</p>
            <p className="mt-1 text-sm font-bold">{display(metadata.reportedTotalCheckedAt)}</p>
          </div>
        </div>
      )}
    </Card>
  );
}
