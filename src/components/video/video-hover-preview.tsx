"use client";

export function VideoHoverPreview({ embedUrl, title }: { embedUrl: string | null; title: string }) {
  if (!embedUrl) return null;
  return <iframe title={`Muted preview for ${title}`} src={embedUrl} allow="autoplay; fullscreen; picture-in-picture" className="absolute inset-0 h-full w-full border-0" />;
}
