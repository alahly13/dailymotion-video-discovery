import { NextResponse } from "next/server";
import {
  channelDatabasePersistenceMode,
  channelPersistenceUnavailableWarning,
  getPersistedSavedChannelResults,
} from "@/lib/repositories/channel-fetch-persistence";
import type { SavedChannelResultScope, SavedChannelSearchResponse, SavedChannelSort } from "@/types/channel-fetch";

function savedSort(value: unknown): SavedChannelSort {
  return value === "newest" || value === "oldest" || value === "views_desc" || value === "duration_desc" || value === "title_asc"
    ? value
    : "first_collected";
}

function resultScope(value: unknown): SavedChannelResultScope {
  return value === "attempt" ? "attempt" : "combined";
}

export async function POST(request: Request) {
  let body: {
    sourceId?: string;
    query?: string;
    scope?: SavedChannelResultScope;
    attemptId?: string | null;
    limit?: number;
    offset?: number;
    sort?: SavedChannelSort;
    exactPhrase?: boolean;
    fuzzy?: boolean;
  } = {};

  try {
    body = await request.json();
    if (!body.sourceId) throw new Error("sourceId is required.");

    const result = await getPersistedSavedChannelResults({
      sourceId: body.sourceId,
      scope: resultScope(body.scope),
      attemptId: body.attemptId ?? null,
      query: body.query ?? "",
      limit: body.limit ?? 48,
      offset: body.offset ?? 0,
      sort: savedSort(body.sort),
      exactPhrase: Boolean(body.exactPhrase),
    });

    return NextResponse.json({
      ok: true,
      source: result.source,
      items: result.items,
      total: result.total,
      limit: result.limit,
      offset: result.offset,
      query: body.query ?? "",
      scope: result.scope,
      attemptId: result.attemptId,
      sort: result.sort,
      exactPhrase: Boolean(body.exactPhrase),
      fuzzy: Boolean(body.fuzzy),
      mode: "server",
      persistence: channelDatabasePersistenceMode(),
      persistenceWarning: null,
    } satisfies SavedChannelSearchResponse);
  } catch (error) {
    return NextResponse.json({
      ok: false,
      source: null,
      items: [],
      total: 0,
      limit: body.limit ?? 48,
      offset: body.offset ?? 0,
      query: body.query ?? "",
      scope: resultScope(body.scope),
      attemptId: body.attemptId ?? null,
      sort: savedSort(body.sort),
      exactPhrase: Boolean(body.exactPhrase),
      fuzzy: Boolean(body.fuzzy),
      mode: "server",
      persistence: "runtime-memory",
      persistenceWarning: channelPersistenceUnavailableWarning(error),
      error: error instanceof Error ? error.message : "Unable to search saved channel results.",
    } satisfies SavedChannelSearchResponse, { status: 400 });
  }
}
