"use client";

import { useState } from "react";
import type { NormalizedVideoMetadata } from "@/types/video";
import { Card } from "@/components/ui/card";
import { VideoHoverPreview } from "./video-hover-preview";

function formatDuration(value: number | null) {
  if (value === null) return "Unknown duration";
  const minutes = Math.floor(value / 60);
  const seconds = value % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function VideoCard({ video }: { video: NormalizedVideoMetadata }) {
  const [preview, setPreview] = useState(false);
  return (
    <Card className="overflow-hidden p-0">
      <div className="relative aspect-video bg-slate-200 dark:bg-slate-900" onMouseEnter={() => setPreview(true)} onMouseLeave={() => setPreview(false)}>
        {video.thumbnail ? <img src={video.thumbnail} alt="" className="h-full w-full object-cover" loading="lazy" /> : <div className="flex h-full items-center justify-center text-sm text-slate-500">No thumbnail</div>}
        {preview ? <VideoHoverPreview embedUrl={video.embedUrl} title={video.title} /> : null}
      </div>
      <div className="space-y-3 p-5">
        <h3 className="line-clamp-2 text-base font-bold leading-snug">{video.title}</h3>
        <p className="line-clamp-3 text-sm text-slate-600 dark:text-slate-400">{video.description ?? "No description available."}</p>
        <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span>{video.views ?? "—"} views</span>
          <span>{formatDuration(video.duration)}</span>
          <span>{video.year ?? "Unknown year"}</span>
          <span>{video.language ?? "Any language"}</span>
        </div>
        {video.url ? <a href={video.url} target="_blank" rel="noreferrer" className="inline-flex text-sm font-semibold text-blue-600 dark:text-blue-400">Open on Dailymotion</a> : null}
      </div>
    </Card>
  );
}
