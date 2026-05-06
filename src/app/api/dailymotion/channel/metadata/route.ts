import { NextResponse } from "next/server";
import { getFetchSafetyConfig } from "@/lib/config/env";
import { fetchDailymotionSourceMetadata } from "@/lib/platforms/dailymotion/channel-metadata-service";
import { analyzeDailymotionChannelInput } from "@/lib/platforms/dailymotion/dailymotion-url-analyzer";
import { channelDatabasePersistenceMode, channelPersistenceUnavailableWarning, decorateMetadataWithPersistence, upsertChannelSourceMetadata } from "@/lib/repositories/channel-fetch-persistence";
import type { ChannelMetadataResponse } from "@/types/channel-fetch";

export async function POST(request: Request) {
  try {
    const { input } = (await request.json()) as { input?: string };
    const analysis = analyzeDailymotionChannelInput(input ?? "");
    const result = await fetchDailymotionSourceMetadata(analysis, request.signal);
    let metadata = result.metadata;
    let persistence = channelDatabasePersistenceMode();
    let persistenceWarning: string | null = persistence === "database" ? null : "Persistence unavailable: history may reset after restart/deploy.";

    if (metadata && persistence === "database") {
      try {
        const persisted = await upsertChannelSourceMetadata(metadata);
        metadata = decorateMetadataWithPersistence(metadata, persisted.source?.id ?? null, null);
      } catch (error) {
        persistence = "runtime-memory";
        persistenceWarning = channelPersistenceUnavailableWarning(error);
        metadata = decorateMetadataWithPersistence(metadata, null, persistenceWarning);
      }
    } else if (metadata) {
      metadata = decorateMetadataWithPersistence(metadata, null, persistenceWarning);
    }

    const status = result.ok ? 200 : result.status ?? 502;
    return NextResponse.json(
      {
        ok: result.ok,
        metadata,
        safetyCaps: getFetchSafetyConfig(),
        persistence,
        persistenceWarning,
        error: result.ok ? undefined : result.error,
        reason: result.ok ? null : result.reason,
      } satisfies ChannelMetadataResponse,
      { status }
    );
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unable to fetch channel metadata.", reason: "user_input_error" }, { status: 400 });
  }
}
