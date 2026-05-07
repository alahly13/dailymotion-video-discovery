"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { CalendarDays, Clock3, ExternalLink, Eye, Languages, UserRound } from "lucide-react";
import type { ManifestResultViewMode, NormalizedVideoMetadata, VideoCollectionProvenance } from "@/types/video";
import { Card } from "@/components/ui/card";
import { VideoHoverPreview } from "./video-hover-preview";

const numberFormatter = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });
const dateFormatter = new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" });

function formatDuration(value: number | null) {
  if (value === null) return "Unknown duration";
  const hours = Math.floor(value / 3600);
  const minutes = Math.floor((value % 3600) / 60);
  const seconds = value % 60;
  if (hours > 0) return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function formatViews(value: number | null) {
  if (value === null) return "Unknown views";
  return `${numberFormatter.format(value)} views`;
}

function formatDate(value: string | null, year: number | null) {
  if (value) {
    const date = new Date(value);
    if (!Number.isNaN(date.valueOf())) return dateFormatter.format(date);
  }
  return year ? String(year) : "Unknown date";
}

function formatWindow(provenance: VideoCollectionProvenance | undefined) {
  if (!provenance?.windowStart && !provenance?.windowEnd) return null;
  const start = provenance.windowStart?.slice(0, 10) ?? "open";
  const end = provenance.windowEnd?.slice(0, 10) ?? "open";
  return `Window: ${start} -> ${end}`;
}

function provenanceBadgeText(provenance: VideoCollectionProvenance | undefined) {
  if (!provenance) return "Attempt unknown";
  if (provenance.duplicateStatus === "already_collected") return "Already collected";
  if (provenance.duplicateStatus === "first_seen_earlier") return "First seen earlier";
  return provenance.attemptNumber ? `Added in Attempt #${provenance.attemptNumber}` : "First seen";
}

function Badge({ children }: { children: ReactNode }) {
  return <span className="rounded-md border border-[var(--border)] bg-[var(--surface-muted)] px-2 py-1 text-[11px] font-bold text-[var(--muted-foreground)]">{children}</span>;
}

export function VideoCard({ video, resultViewMode = "combined" }: { video: NormalizedVideoMetadata; resultViewMode?: ManifestResultViewMode }) {
  const [preview, setPreview] = useState(false);
  const channel = video.channelName ?? video.ownerName ?? "Unknown channel";
  const provenance = video.collectionProvenance ? { ...video.collectionProvenance, resultViewMode } : undefined;
  const sourceLabel = provenance?.sourceName ?? provenance?.sourceHandle ?? channel;
  const windowLabel = formatWindow(provenance);
  const metadata = [
    { icon: UserRound, label: channel },
    { icon: Eye, label: formatViews(video.views) },
    { icon: Clock3, label: formatDuration(video.duration) },
    { icon: CalendarDays, label: formatDate(video.createdAt, video.year) },
    { icon: Languages, label: video.language ?? "Any language" },
  ];

  return (
    <Card className="group overflow-hidden p-0 transition duration-200 hover:-translate-y-0.5 hover:border-[var(--accent)]">
      <div
        className="relative aspect-video bg-[var(--surface-muted)]"
        onMouseEnter={() => setPreview(true)}
        onMouseLeave={() => setPreview(false)}
      >
        {video.thumbnail ? (
          <img
            src={video.thumbnail}
            alt=""
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.015]"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-[var(--muted-foreground)]">No thumbnail</div>
        )}
        {preview ? <VideoHoverPreview embedUrl={video.embedUrl} title={video.title} /> : null}
      </div>
      <div className="space-y-4 p-5">
        <div className="space-y-2">
          <h3 className="line-clamp-2 text-base font-semibold leading-snug">{video.title}</h3>
          <p className="line-clamp-2 text-sm leading-6 text-[var(--muted-foreground)]">
            {video.description ?? "No description available."}
          </p>
        </div>
        <div className="grid gap-2 text-xs text-[var(--muted-foreground)]">
          {metadata.map(({ icon: Icon, label }) => (
            <span key={`${video.id}-${label}`} className="flex min-w-0 items-center gap-2">
              <Icon className="h-3.5 w-3.5 shrink-0 text-[var(--accent)]" aria-hidden="true" />
              <span className="truncate">{label}</span>
            </span>
          ))}
        </div>
        <div className="space-y-2 rounded-md border border-[var(--border)] bg-[var(--surface-muted)] p-3">
          <p className="text-[11px] font-black uppercase text-[var(--muted-foreground)]">Fetch Provenance</p>
          <div className="flex flex-wrap gap-2">
            <Badge>{sourceLabel ? `Source: ${sourceLabel}` : "Source unknown"}</Badge>
            <Badge>{provenance?.attemptNumber ? `Attempt #${provenance.attemptNumber}` : "Attempt unknown"}</Badge>
            <Badge>{provenanceBadgeText(provenance)}</Badge>
            <Badge>{provenance?.fetchProfile ?? "Profile unknown"}</Badge>
            <Badge>{provenance?.manifestScope === "combined" ? "Combined Manifest" : provenance?.manifestLabel ?? "Attempt Manifest"}</Badge>
            <Badge>{resultViewMode === "combined" ? "Combined Results" : resultViewMode === "by-attempt" ? "By Fetch Attempt" : "Current Attempt"}</Badge>
            {windowLabel ? <Badge>{windowLabel}</Badge> : null}
            {provenance?.pageNumber ? <Badge>Page {provenance.pageNumber}</Badge> : null}
            {provenance?.collectedAt ? <Badge>Collected {provenance.collectedAt.slice(0, 10)}</Badge> : null}
          </div>
        </div>
        {video.url ? (
          <a
            href={video.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-md border border-[var(--border)] px-3 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)] hover:bg-[var(--surface-muted)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--ring)]"
          >
            Open
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
          </a>
        ) : null}
      </div>
    </Card>
  );
}
