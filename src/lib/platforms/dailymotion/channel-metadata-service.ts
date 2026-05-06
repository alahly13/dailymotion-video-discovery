import type { ChannelSourceMetadata } from "@/types/channel-fetch";
import { zeroSafeNumber } from "@/lib/utils/zero-safe-number";
import { fetchDailymotionUserMetadata } from "./dailymotion-client";
import type { DailymotionChannelAnalysis } from "./dailymotion-url-analyzer";

function numericTotal(value: unknown) {
  const parsed = zeroSafeNumber(value);
  return parsed !== null ? Math.trunc(parsed) : null;
}

function metadataUnavailable(analysis: DailymotionChannelAnalysis, reason: string): ChannelSourceMetadata {
  const now = new Date().toISOString();
  return {
    platform: "dailymotion",
    sourceType: analysis.sourceType,
    sourceInput: analysis.sourceInput,
    externalSourceId: analysis.resolvedIdentifier,
    handle: analysis.resolvedIdentifier,
    username: analysis.sourceType === "username" || analysis.sourceType === "profile" ? analysis.resolvedIdentifier : null,
    displayName: analysis.displayLabel,
    canonicalUrl: `https://www.dailymotion.com/${analysis.sourceType === "channel" || analysis.sourceType === "channel_id" ? "channel" : "user"}/${analysis.resolvedIdentifier}`,
    thumbnailUrl: null,
    avatarUrl: null,
    description: null,
    country: null,
    language: null,
    reportedTotalFromApi: null,
    reportedTotalFieldName: null,
    reportedTotalCheckedAt: now,
    metadataJson: null,
    metadataUnavailableReason: reason,
  };
}

export async function fetchDailymotionSourceMetadata(analysis: DailymotionChannelAnalysis, signal?: AbortSignal) {
  if (analysis.sourceType === "channel") {
    return {
      ok: true as const,
      metadata: metadataUnavailable(analysis, "Dailymotion public user/profile metadata is separate from category channel metadata."),
    };
  }

  const result = await fetchDailymotionUserMetadata(analysis.resolvedIdentifier, signal);
  if (!result.ok || !result.data) {
    return {
      ok: false as const,
      metadata: metadataUnavailable(analysis, result.error ?? "Dailymotion did not return profile metadata."),
      error: result.error ?? "Unable to fetch Dailymotion profile metadata.",
      reason: result.reason,
      status: result.status,
    };
  }

  const now = new Date().toISOString();
  const reportedTotal = numericTotal(result.data.videos_total);
  const username = result.data.username ?? analysis.resolvedIdentifier;
  const canonicalUrl = result.data.url ?? `https://www.dailymotion.com/user/${encodeURIComponent(username)}`;

  return {
    ok: true as const,
    metadata: {
      platform: "dailymotion",
      sourceType: analysis.sourceType,
      sourceInput: analysis.sourceInput,
      externalSourceId: result.data.id ?? analysis.resolvedIdentifier,
      handle: username,
      username,
      displayName: result.data.screenname ?? username,
      canonicalUrl,
      thumbnailUrl: null,
      avatarUrl: null,
      description: result.data.description ?? null,
      country: result.data.country ?? null,
      language: result.data.language ?? null,
      reportedTotalFromApi: reportedTotal,
      reportedTotalFieldName: reportedTotal !== null ? "videos_total" : null,
      reportedTotalCheckedAt: now,
      metadataJson: result.data,
      metadataUnavailableReason: null,
    } satisfies ChannelSourceMetadata,
  };
}
