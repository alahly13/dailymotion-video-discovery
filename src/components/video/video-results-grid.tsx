import type { NormalizedVideoMetadata } from "@/types/video";
import { VideoCard } from "./video-card";

export function VideoResultsGrid({ items }: { items: NormalizedVideoMetadata[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-[var(--border)] bg-[var(--surface)] p-10 text-center text-sm text-[var(--muted-foreground)]">
        No videos match the current manifest filters.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {items.map((video) => (
        <VideoCard key={video.id} video={video} />
      ))}
    </div>
  );
}
