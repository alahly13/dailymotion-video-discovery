import { NextResponse } from "next/server";
import {
  channelDatabasePersistenceMode,
  channelPersistenceUnavailableWarning,
  getPersistedChannelSourceSummary,
  listPersistedChannelFetchHistory,
} from "@/lib/repositories/channel-fetch-persistence";

export async function GET(request: Request, context: { params: Promise<{ sourceId: string }> }) {
  const { sourceId } = await context.params;
  const url = new URL(request.url);
  const limit = Number(url.searchParams.get("limit") ?? 100);

  try {
    const [source, history] = await Promise.all([
      getPersistedChannelSourceSummary(sourceId),
      listPersistedChannelFetchHistory(sourceId, limit),
    ]);
    return NextResponse.json({
      ok: true,
      source,
      history,
      persistence: channelDatabasePersistenceMode(),
      persistenceWarning: null,
    });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      source: null,
      history: [],
      persistence: "runtime-memory",
      persistenceWarning: channelPersistenceUnavailableWarning(error),
      error: error instanceof Error ? error.message : "Unable to load channel attempts.",
    }, { status: 400 });
  }
}
