import type { ChannelManifest } from "@/types/manifest";
import { Card } from "@/components/ui/card";
import type { ChannelPersistenceMode } from "@/types/channel-fetch";

export function ChannelManifestSummary({ manifest, persistence }: { manifest: ChannelManifest | null; persistence: ChannelPersistenceMode }) {
  if (!manifest) return null;
  return (
    <Card>
      <h2 className="text-lg font-bold">Current Channel Manifest</h2>
      <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
        {manifest.resolvedChannelName ?? manifest.sourceInput} - {manifest.items.length} deduplicated public metadata records -{" "}
        {manifest.completenessStatus ?? (manifest.isComplete ? "complete" : "partial")}
      </p>
      <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
        Reported totals are provider metadata, not guaranteed collectable-video counts. The original manifest items are preserved when result filters change.
      </p>
      <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
        This manifest is {persistence === "database" ? "temporarily stored in the database for history and resume checkpoints" : "held in runtime memory and may reset after restart or deploy"}.
      </p>
    </Card>
  );
}
