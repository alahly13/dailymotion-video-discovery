import type { ChannelManifest } from "@/types/manifest";
import { Card } from "@/components/ui/card";
import type { ChannelPersistenceMode } from "@/types/channel-fetch";
import { FileStack } from "lucide-react";

export function ChannelManifestSummary({ manifest, persistence }: { manifest: ChannelManifest | null; persistence: ChannelPersistenceMode }) {
  if (!manifest) return null;
  return (
    <Card className="space-y-3">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-[var(--border)] bg-[color-mix(in_srgb,var(--primary)_12%,transparent)] text-[var(--primary)]">
          <FileStack className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--muted-foreground)]">Manifest Summary</p>
          <h2 className="mt-1 text-xl font-black">Current Channel Manifest</h2>
        </div>
      </div>
      <p className="text-anywhere text-sm leading-6 text-[var(--muted-foreground)]">
        {manifest.manifestScope === "combined" ? "Combined unique videos" : manifest.attemptNumber ? `Videos added in Attempt #${manifest.attemptNumber}` : "Current manifest"}:{" "}
        {manifest.resolvedChannelName ?? manifest.sourceInput} - {manifest.items.length} deduplicated public metadata records -{" "}
        {manifest.completenessStatus ?? (manifest.isComplete ? "complete" : "partial")}
      </p>
      <p className="text-sm leading-6 text-[var(--muted-foreground)]">
        Reported totals are provider metadata, not guaranteed collectable-video counts. The original manifest items are preserved when result filters change.
      </p>
      <p className="panel-muted p-3 text-sm leading-6 text-[var(--muted-foreground)]">
        This manifest is {persistence === "database" ? (manifest.manifestScope === "combined" ? "stored as the database-backed source catalog view" : "temporarily stored in the database for history and resume checkpoints") : "held in runtime memory and may reset after restart or deploy"}.
        {manifest.manifestScope === "combined" ? " Combined Results merge all unique videos collected for this channel/source across fetch attempts." : " Attempt results preserve what this specific run collected."}
      </p>
    </Card>
  );
}
