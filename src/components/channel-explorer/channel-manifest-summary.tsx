import type { ChannelManifest } from "@/types/manifest";
import { Card } from "@/components/ui/card";

export function ChannelManifestSummary({ manifest }: { manifest: ChannelManifest | null }) {
  if (!manifest) return null;
  return (
    <Card>
      <h2 className="text-lg font-bold">Current Channel Manifest</h2>
      <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
        {manifest.resolvedChannelName ?? manifest.sourceInput} - {manifest.items.length} deduplicated public metadata records -{" "}
        {manifest.isComplete ? "complete" : "partial"}
      </p>
    </Card>
  );
}
