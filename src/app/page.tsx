import Link from "next/link";
import { Card } from "@/components/ui/card";

const stats = [
  ["Discovery mode", "Public metadata"],
  ["Core workspace", "Channel manifests"],
  ["Storage model", "Saved library ready"],
];

const routes = [
  ["Channel Explorer", "/channel-explorer", "Fetch public channel metadata into a filterable manifest."],
  ["Search", "/search", "Prepare global result sets for research review."],
  ["AI Search", "/ai-search", "Use server-side Gemini routes for query and manifest help."],
];

export default function HomePage() {
  return (
    <div className="space-y-8">
      <section className="grid gap-6 lg:grid-cols-[1.45fr_0.55fr] lg:items-end">
        <div className="space-y-5">
          <p className="text-sm font-semibold uppercase text-[var(--accent)]">Research workspace</p>
          <h1 className="max-w-4xl text-4xl font-black leading-tight sm:text-6xl">AI Public Video Discovery Platform</h1>
          <p className="max-w-3xl text-lg leading-8 text-[var(--muted-foreground)]">
            Discover, organize, filter, preview, and analyze public video metadata without downloading or rehosting videos.
          </p>
          <Link
            href="/channel-explorer"
            className="inline-flex rounded-md bg-[var(--accent)] px-5 py-3 text-sm font-bold text-[var(--accent-foreground)] transition hover:bg-[var(--accent-strong)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--ring)]"
          >
            Open Channel Explorer
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
          {stats.map(([label, value]) => (
            <Card key={label} className="p-4">
              <p className="text-xs font-semibold uppercase text-[var(--muted-foreground)]">{label}</p>
              <p className="mt-1 text-base font-bold">{value}</p>
            </Card>
          ))}
        </div>
      </section>
      <section className="grid gap-5 md:grid-cols-3">
        {routes.map(([label, href, description]) => (
          <Card key={href}>
            <h2 className="font-semibold">{label}</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">{description}</p>
            <Link href={href} className="mt-5 inline-flex text-sm font-semibold text-[var(--accent-strong)] hover:underline">
              Open
            </Link>
          </Card>
        ))}
      </section>
    </div>
  );
}
