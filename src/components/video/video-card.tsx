"use client";

import { useState } from "react";
import type { NormalizedVideoMetadata } from "@/types/video";
import { Card } from "@/components/ui/card";
import { VideoHoverPreview } from "./video-hover-preview";

function formatDuration(value: number | null) {
  if (value === null) return "Unknown";
  const minutes = Math.floor(value / 60);
  const seconds = value % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function VideoCard({ video }: { video: NormalizedVideoMetadata }) {
  const [preview, setPreview] = useState(false);
  return (
    <Card className="group overflow-hidden p-0 transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_36px_-22px_rgba(40,25,10,0.6)]">
      <div className="relative aspect-video bg-[var(--background-elevated)]" onMouseEnter={() => setPreview(true)} onMouseLeave={() => setPreview(false)}>
        {video.thumbnail ? <img src={video.thumbnail} alt="" className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]" loading="lazy" /> : <div className="flex h-full items-center justify-center text-sm text-[var(--muted-foreground)]">No thumbnail</div>}
        {preview ? <VideoHoverPreview embedUrl={video.embedUrl} title={video.title} /> : null}
      </div>
      <div className="space-y-3 p-5">
        <h3 className="line-clamp-2 text-base font-semibold leading-snug tracking-tight">{video.title}</h3>
        <p className="line-clamp-2 text-sm text-[var(--muted-foreground)]">{video.description ?? "No description available."}</p>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs text-[var(--muted-foreground)]">
          <span><strong className="text-[var(--foreground)]">{video.views ?? "—"}</strong> views</span>
          <span>{formatDuration(video.duration)}</span>
          <span>{video.year ?? "Unknown year"}</span>
          <span>{video.language ?? "Any language"}</span>
        </div>
        {video.url ? <a href={video.url} target="_blank" rel="noreferrer" className="inline-flex text-sm font-semibold text-[var(--accent)] hover:underline">Open on Dailymotion</a> : null}
      </div>
    </Card>
  );
}
