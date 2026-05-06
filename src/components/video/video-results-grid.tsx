import type { NormalizedVideoMetadata } from "@/types/video";
import { VideoCard } from "./video-card";

export function VideoResultsGrid({ items }: { items: NormalizedVideoMetadata[] }) {
  if (items.length === 0) return <div className="rounded-3xl border border-dashed border-slate-300 p-10 text-center text-slate-500 dark:border-slate-700">No videos match the current manifest filters.</div>;
  return <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">{items.map((video) => <VideoCard key={video.id} video={video} />)}</div>;
}
