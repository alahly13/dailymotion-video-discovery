"use client";

import { useState } from "react";
import { CalendarDays, Clock3, ExternalLink, Eye, Languages, UserRound } from "lucide-react";
import type { NormalizedVideoMetadata } from "@/types/video";
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

export function VideoCard({ video }: { video: NormalizedVideoMetadata }) {
  const [preview, setPreview] = useState(false);
  const channel = video.channelName ?? video.ownerName ?? "Unknown channel";
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
