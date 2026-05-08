import type { NormalizedVideoMetadata } from "@/types/video";
import { VideoCard } from "./video-card";
import { SearchX } from "lucide-react";

export function VideoResultsGrid({ items, resultViewMode = "combined" }: { items: NormalizedVideoMetadata[]; resultViewMode?: "combined" | "by-attempt" | "current-attempt" }) {
  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-[var(--border)] bg-[var(--surface-container-low)] p-10 text-center text-sm text-[var(--muted-foreground)]">
        <SearchX className="mx-auto mb-3 h-6 w-6 text-[var(--primary)]" aria-hidden="true" />
        <p className="font-bold text-[var(--foreground)]">No videos match the current manifest filters.</p>
        <p className="mt-1">Search and filters only inspect videos already loaded in this manifest view.</p>
      </div>
    );
  }

  return (
    <div className="grid min-w-0 grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 mt-4">
      {items.map((video) => (
        <VideoCard key={video.id} video={video} resultViewMode={resultViewMode} />
      ))}
    </div>
  );
}
