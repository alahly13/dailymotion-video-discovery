import { NextResponse } from "next/server";
import {
  channelDatabasePersistenceMode,
  channelPersistenceUnavailableWarning,
  getPersistedChannelAttemptDetail,
} from "@/lib/repositories/channel-fetch-persistence";
import type { ChannelAttemptDetailResponse } from "@/types/channel-fetch";

export async function GET(request: Request, context: { params: Promise<{ attemptId: string }> }) {
  const { attemptId } = await context.params;
  const url = new URL(request.url);
  const sourceId = url.searchParams.get("sourceId");

  try {
    const attempt = await getPersistedChannelAttemptDetail(attemptId, sourceId);
    return NextResponse.json({
      ok: true,
      attempt,
      persistence: channelDatabasePersistenceMode(),
      persistenceWarning: null,
    } satisfies ChannelAttemptDetailResponse);
  } catch (error) {
    return NextResponse.json({
      ok: false,
      attempt: null,
      persistence: "runtime-memory",
      persistenceWarning: channelPersistenceUnavailableWarning(error),
      error: error instanceof Error ? error.message : "Unable to load channel attempt.",
    } satisfies ChannelAttemptDetailResponse, { status: 400 });
  }
}
