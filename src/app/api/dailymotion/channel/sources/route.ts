import { NextResponse } from "next/server";
import {
  channelDatabasePersistenceMode,
  channelPersistenceUnavailableWarning,
  listPersistedChannelSources,
} from "@/lib/repositories/channel-fetch-persistence";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const limit = Number(url.searchParams.get("limit") ?? 100);

  try {
    const sources = await listPersistedChannelSources(limit);
    return NextResponse.json({
      ok: true,
      sources,
      persistence: channelDatabasePersistenceMode(),
      persistenceWarning: null,
    });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      sources: [],
      persistence: "runtime-memory",
      persistenceWarning: channelPersistenceUnavailableWarning(error),
      error: error instanceof Error ? error.message : "Unable to load saved channel sources.",
    }, { status: 400 });
  }
}
