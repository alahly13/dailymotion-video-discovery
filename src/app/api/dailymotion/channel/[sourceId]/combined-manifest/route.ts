import { NextResponse } from "next/server";
import {
  channelDatabasePersistenceMode,
  channelPersistenceUnavailableWarning,
  getPersistedCombinedChannelManifestPage,
} from "@/lib/repositories/channel-fetch-persistence";
import type { SavedChannelManifestResponse, SavedChannelSort } from "@/types/channel-fetch";

function savedSort(value: string | null): SavedChannelSort {
  if (value === "newest" || value === "oldest" || value === "views_desc" || value === "duration_desc" || value === "title_asc") return value;
  return "first_collected";
}

export async function GET(request: Request, context: { params: Promise<{ sourceId: string }> }) {
  const { sourceId } = await context.params;
  const url = new URL(request.url);
  const query = url.searchParams.get("query") ?? "";
  const limit = Number(url.searchParams.get("limit") ?? 48);
  const offset = Number(url.searchParams.get("offset") ?? 0);
  const sort = savedSort(url.searchParams.get("sort"));
  const exactPhrase = url.searchParams.get("exactPhrase") === "true";

  try {
    const result = await getPersistedCombinedChannelManifestPage({ sourceId, query, limit, offset, sort, exactPhrase });
    return NextResponse.json({
      ok: true,
      source: result.source,
      manifest: result.manifest,
      history: result.history,
      coverage: result.coverage,
      items: result.items,
      total: result.total,
      limit: result.limit,
      offset: result.offset,
      sort: result.sort,
      query,
      persistence: channelDatabasePersistenceMode(),
      persistenceWarning: null,
    } satisfies SavedChannelManifestResponse);
  } catch (error) {
    return NextResponse.json({
      ok: false,
      source: null,
      manifest: null,
      history: [],
      coverage: null,
      items: [],
      total: 0,
      limit: 48,
      offset: 0,
      sort: "first_collected",
      query,
      persistence: "runtime-memory",
      persistenceWarning: channelPersistenceUnavailableWarning(error),
      error: error instanceof Error ? error.message : "Unable to load combined channel manifest.",
    } satisfies SavedChannelManifestResponse, { status: 400 });
  }
}
