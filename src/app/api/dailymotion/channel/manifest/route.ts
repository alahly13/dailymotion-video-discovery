import { NextResponse } from "next/server";
import {
  channelDatabasePersistenceMode,
  channelPersistenceUnavailableWarning,
  getPersistedCombinedChannelManifest,
} from "@/lib/repositories/channel-fetch-persistence";
import type { ChannelManifestResponse } from "@/types/channel-fetch";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const input = url.searchParams.get("input") ?? url.searchParams.get("sourceKey") ?? "";

  if (!input.trim()) {
    return NextResponse.json({
      ok: true,
      manifest: null,
      history: [],
      coverage: null,
      persistence: channelDatabasePersistenceMode(),
      persistenceWarning: null,
    } satisfies ChannelManifestResponse);
  }

  try {
    const result = await getPersistedCombinedChannelManifest(input);
    const persistence = channelDatabasePersistenceMode();
    return NextResponse.json({
      ok: true,
      manifest: result.manifest,
      history: result.history,
      coverage: result.coverage,
      persistence,
      persistenceWarning: null,
    } satisfies ChannelManifestResponse);
  } catch (error) {
    return NextResponse.json({
      ok: false,
      manifest: null,
      history: [],
      coverage: null,
      persistence: "runtime-memory",
      persistenceWarning: channelPersistenceUnavailableWarning(error),
      error: error instanceof Error ? error.message : "Unable to load saved channel manifest.",
    } satisfies ChannelManifestResponse, { status: 400 });
  }
}
