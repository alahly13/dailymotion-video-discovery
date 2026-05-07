import {
  CoverageConfidence,
  CoverageStatus,
  FetchJobStatus,
  FetchPageAttemptStatus,
  FetchProfile,
  FetchWindowStatus,
  FetchWindowUnit,
  ManifestPersistenceType,
  ManifestStatus,
  ManifestType,
  Prisma,
} from "@prisma/client";
import { getFetchSafetyConfig } from "@/lib/config/env";
import { getPrismaClient } from "@/lib/prisma/client";
import { analyzeDailymotionChannelInput } from "@/lib/platforms/dailymotion/dailymotion-url-analyzer";
import type {
  ChannelCoverage,
  ChannelAttemptDetail,
  ChannelFetchJobSnapshot,
  ChannelFetchSettings,
  ChannelPersistenceMode,
  ChannelSourceSummary,
  ChannelSourceMetadata,
  FetchHistoryEntry,
  FetchPageAttemptSummary,
  SavedChannelResultScope,
  SavedChannelSort,
  FetchWindowSummary,
} from "@/types/channel-fetch";
import type { ChannelManifest, ChannelSourceType, ManifestFetchStatus } from "@/types/manifest";
import type { NormalizedVideoMetadata, VideoCollectionProvenance } from "@/types/video";

const PLATFORM = "dailymotion";
const JOB_TYPE = "channel_deep_fetch";
const PERSISTENCE_WARNING =
  "Persistence unavailable: history may reset after restart/deploy.";

type PersistedJobWithGraph = Prisma.FetchJobGetPayload<{
  include: {
    source: true;
    manifest: { include: { items: { include: { video: true; fetchWindow: true } } } };
    windows: true;
    pageAttempts: true;
  };
}>;
type PersistedManifestItemWithVideo = NonNullable<PersistedJobWithGraph["manifest"]>["items"][number];
type PersistedManifestWithGraph = Prisma.ManifestGetPayload<{
  include: {
    source: true;
    items: { include: { video: true; fetchWindow: { include: { fetchJob: true } } } };
  };
}>;
type PersistedSourceWithSummaryGraph = Prisma.VideoSourceGetPayload<{
  include: {
    catalogSnapshots: true;
    manifests: { include: { _count: { select: { items: true } } } };
    fetchJobs: true;
    _count: { select: { fetchJobs: true } };
  };
}>;
type PersistedManifestItemForSavedResults = Prisma.ManifestItemGetPayload<{
  include: { video: true; fetchWindow: { include: { fetchJob: true } } };
}>;

type SavedChannelResultsInput = {
  sourceId: string;
  scope?: SavedChannelResultScope;
  attemptId?: string | null;
  query?: string | null;
  limit?: number | null;
  offset?: number | null;
  sort?: SavedChannelSort | null;
  exactPhrase?: boolean | null;
};

function addHours(date: Date, hours: number) {
  const next = new Date(date);
  next.setUTCHours(next.getUTCHours() + hours);
  return next;
}

function toJson(value: unknown): Prisma.InputJsonValue {
  if (value === null || value === undefined) return Prisma.JsonNull as unknown as Prisma.InputJsonValue;
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function fromJsonObject<T>(value: Prisma.JsonValue | null | undefined, fallback: T): T {
  if (!value || typeof value !== "object" || Array.isArray(value)) return fallback;
  return value as T;
}

function iso(date: Date | string | null | undefined) {
  if (!date) return null;
  return typeof date === "string" ? date : date.toISOString();
}

function dateOrNull(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
}

function numberFromBigInt(value: bigint | number | null | undefined) {
  return typeof value === "bigint" ? Number(value) : value ?? 0;
}

function jsonObject(value: Prisma.JsonValue | null | undefined) {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function attemptNumberFromProgress(value: Prisma.JsonValue | null | undefined) {
  const progress = jsonObject(value);
  const attemptNumber = Number(progress?.attemptNumber ?? 0);
  return Number.isFinite(attemptNumber) && attemptNumber > 0 ? Math.trunc(attemptNumber) : null;
}

function attemptNumberFromJob(job: Pick<PersistedJobWithGraph, "progressJson">) {
  return attemptNumberFromProgress(job.progressJson) ?? 1;
}

function sourceKey(sourceType: string, externalSourceId: string) {
  return `${sourceType}:${externalSourceId}`.toLowerCase();
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value.trim());
}

function explicitSourceKeyParts(value: string) {
  const match = /^(channel|profile|username|channel_id):(.+)$/i.exec(value.trim());
  if (!match) return null;
  return {
    sourceType: match[1].toLowerCase() as ChannelSourceType,
    externalSourceId: match[2].trim().toLowerCase(),
  };
}

function sourceIdentityFromInput(input: string) {
  const analysis = analyzeDailymotionChannelInput(input);
  return {
    sourceType: analysis.sourceType,
    externalSourceId: analysis.resolvedIdentifier.toLowerCase(),
    sourceInput: analysis.sourceInput,
    sourceUrl: analysis.sourceInput.startsWith("http") ? analysis.sourceInput : null,
  };
}

function sourceIdentityFromMetadata(metadata: ChannelSourceMetadata) {
  const identity = sourceIdentityFromInput(metadata.sourceInput);
  return {
    ...identity,
    sourceType: metadata.sourceType as ChannelSourceType,
  };
}

function prismaFetchProfile(profile: ChannelFetchSettings["fetchProfile"]) {
  return profile.toUpperCase().replaceAll("-", "_") as FetchProfile;
}

function prismaFetchJobStatus(status: string) {
  return status.toUpperCase() as FetchJobStatus;
}

function prismaManifestStatus(status: ManifestFetchStatus | string) {
  const mapped = status === "fetching" ? "FETCHING" : status === "max_items_reached" ? "PARTIAL" : status.toUpperCase();
  return (ManifestStatus[mapped as keyof typeof ManifestStatus] ?? ManifestStatus.PARTIAL) as ManifestStatus;
}

function prismaCoverageStatus(status: string) {
  return status.toUpperCase() as CoverageStatus;
}

function prismaCoverageConfidence(confidence: string) {
  return confidence.toUpperCase() as CoverageConfidence;
}

function prismaWindowStatus(status: string) {
  return status.toUpperCase() as FetchWindowStatus;
}

function prismaWindowUnit(unit: string) {
  return unit.toUpperCase() as FetchWindowUnit;
}

function prismaAttemptStatus(status: FetchPageAttemptSummary["status"]) {
  return status.toUpperCase() as FetchPageAttemptStatus;
}

function channelStatus(status: FetchJobStatus | string) {
  return String(status).toLowerCase() as FetchHistoryEntry["status"];
}

function manifestFetchStatus(status: FetchJobStatus | ManifestStatus | string): ManifestFetchStatus {
  const normalized = String(status).toLowerCase();
  if (normalized === "complete") return "complete";
  if (normalized === "capped") return "capped";
  if (normalized === "stopped") return "stopped";
  if (normalized === "failed") return "failed";
  if (normalized === "max_items_reached") return "max_items_reached";
  if (normalized === "provider_limited") return "provider_limited";
  if (normalized === "auth_or_provider_limited") return "auth_or_provider_limited";
  if (normalized === "timeout_limited") return "timeout_limited";
  if (normalized === "partial") return "partial";
  return "fetching";
}

function isTerminalButResumable(status: FetchJobStatus | string, resumable: boolean) {
  const normalized = channelStatus(status);
  return resumable && ["partial", "capped", "stopped", "failed", "max_items_reached", "timeout_limited", "provider_limited", "auth_or_provider_limited"].includes(normalized);
}

function persistenceEnabled() {
  return getFetchSafetyConfig().manifestPersistenceEnabled;
}

export function channelDatabasePersistenceMode(): ChannelPersistenceMode {
  return persistenceEnabled() ? "database" : "runtime-memory";
}

export function channelPersistenceUnavailableWarning(error?: unknown) {
  if (!error) return PERSISTENCE_WARNING;
  const detail = error instanceof Error ? error.message : String(error);
  return `${PERSISTENCE_WARNING} ${detail}`;
}

function metadataForSource(source: PersistedJobWithGraph["source"]): ChannelSourceMetadata | null {
  if (!source) return null;
  return {
    platform: "dailymotion",
    sourceType: source.sourceType,
    sourceInput: source.canonicalUrl ?? source.handle ?? source.username ?? source.externalSourceId,
    externalSourceId: source.externalSourceId,
    handle: source.handle,
    username: source.username,
    displayName: source.displayName,
    canonicalUrl: source.canonicalUrl,
    thumbnailUrl: source.thumbnailUrl,
    avatarUrl: source.avatarUrl,
    description: source.description,
    country: source.country,
    language: source.language,
    reportedTotalFromApi: source.reportedTotalFromApi,
    reportedTotalFieldName: source.reportedTotalFieldName,
    reportedTotalCheckedAt: iso(source.reportedTotalCheckedAt),
    metadataJson: source.metadataJson,
    metadataUnavailableReason: null,
    persistedSourceId: source.id,
    persistence: "database",
    persistenceWarning: null,
  };
}

function sourceSummaryFromRecord(source: PersistedSourceWithSummaryGraph): ChannelSourceSummary {
  const latestSnapshot = source.catalogSnapshots[0] ?? null;
  const combinedManifest = source.manifests.find((manifest) => manifest.persistenceType === ManifestPersistenceType.DURABLE && manifest.query === "source-catalog") ?? null;
  const latestJob = source.fetchJobs[0] ?? null;
  const latestAttemptNumber = latestJob ? attemptNumberFromProgress(latestJob.progressJson) ?? 1 : null;
  const collectedUniqueVideos = latestSnapshot ? numberFromBigInt(latestSnapshot.collectedUniqueVideos) : combinedManifest?._count.items ?? 0;
  const reportedTotal = source.reportedTotalFromApi;
  const estimatedRemaining = latestSnapshot?.estimatedRemainingVideos !== null && latestSnapshot?.estimatedRemainingVideos !== undefined
    ? numberFromBigInt(latestSnapshot.estimatedRemainingVideos)
    : reportedTotal !== null
      ? Math.max(reportedTotal - collectedUniqueVideos, 0)
      : null;
  const coveragePercent = latestSnapshot?.coveragePercent !== null && latestSnapshot?.coveragePercent !== undefined
    ? Number(latestSnapshot.coveragePercent)
    : reportedTotal && reportedTotal > 0
      ? Math.min(100, Number(((collectedUniqueVideos / reportedTotal) * 100).toFixed(2)))
      : null;

  return {
    id: source.id,
    sourceKey: sourceKey(source.sourceType, source.externalSourceId),
    sourceType: source.sourceType,
    sourceInput: source.canonicalUrl ?? source.handle ?? source.username ?? `${source.sourceType}:${source.externalSourceId}`,
    externalSourceId: source.externalSourceId,
    handle: source.handle,
    username: source.username,
    displayName: source.displayName,
    canonicalUrl: source.canonicalUrl,
    thumbnailUrl: source.thumbnailUrl,
    avatarUrl: source.avatarUrl,
    reportedTotalFromApi: reportedTotal,
    reportedTotalCheckedAt: iso(source.reportedTotalCheckedAt),
    collectedUniqueVideos,
    estimatedRemainingVideos: estimatedRemaining,
    coveragePercent,
    coverageStatus: channelStatus(latestSnapshot?.coverageStatus ?? latestJob?.coverageStatusAtEnd ?? CoverageStatus.UNKNOWN) as ChannelSourceSummary["coverageStatus"],
    coverageConfidence: channelStatus(latestSnapshot?.coverageConfidence ?? CoverageConfidence.UNKNOWN) as ChannelSourceSummary["coverageConfidence"],
    totalAttempts: source._count.fetchJobs,
    lastFetchTime: iso(source.lastFetchedAt ?? latestJob?.updatedAt),
    latestAttemptId: latestJob?.id ?? null,
    latestAttemptNumber,
    latestAttemptStatus: latestJob ? channelStatus(latestJob.status) : null,
    latestResumableAttemptId: latestJob && isTerminalButResumable(latestJob.status, latestJob.resumable) ? latestJob.id : null,
    combinedManifestId: combinedManifest?.id ?? null,
    persistence: "database",
    persistenceWarning: null,
  };
}

async function findSourceSummaryRecord(sourceId: string) {
  const prisma = getPrismaClient();
  return prisma.videoSource.findFirst({
    where: { id: sourceId, platform: PLATFORM },
    include: {
      catalogSnapshots: { orderBy: { lastCheckedAt: "desc" }, take: 1 },
      manifests: {
        where: {
          manifestType: ManifestType.CHANNEL,
          persistenceType: ManifestPersistenceType.DURABLE,
          platform: PLATFORM,
          query: "source-catalog",
        },
        include: { _count: { select: { items: true } } },
      },
      fetchJobs: {
        where: { jobType: JOB_TYPE, platform: PLATFORM },
        orderBy: { updatedAt: "desc" },
        take: 1,
      },
      _count: { select: { fetchJobs: true } },
    },
  });
}

function safeLimit(value: number | null | undefined, fallback = 48, max = 200) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) return fallback;
  return Math.min(Math.trunc(number), max);
}

function safeOffset(value: number | null | undefined) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) return 0;
  return Math.trunc(number);
}

function savedResultOrderBy(sort: SavedChannelSort): Prisma.ManifestItemOrderByWithRelationInput[] {
  if (sort === "newest") return [{ video: { publishedAt: { sort: "desc", nulls: "last" } } }, { position: "asc" }];
  if (sort === "oldest") return [{ video: { publishedAt: { sort: "asc", nulls: "last" } } }, { position: "asc" }];
  if (sort === "views_desc") return [{ video: { viewsCount: { sort: "desc", nulls: "last" } } }, { position: "asc" }];
  if (sort === "duration_desc") return [{ video: { durationSeconds: { sort: "desc", nulls: "last" } } }, { position: "asc" }];
  if (sort === "title_asc") return [{ video: { title: "asc" } }, { position: "asc" }];
  return [{ position: "asc" }];
}

function searchTerms(query: string, exactPhrase: boolean) {
  const normalized = query.trim().replace(/\s+/gu, " ");
  if (!normalized) return [];
  return exactPhrase ? [normalized] : normalized.split(/\s+/u).filter(Boolean).slice(0, 8);
}

function videoSearchClause(term: string): Prisma.ManifestItemWhereInput {
  const year = /^\d{4}$/.test(term) ? Number(term) : null;
  const duration = /^\d{1,6}$/.test(term) ? Number(term) : null;
  const textFilter = { contains: term, mode: "insensitive" as const };
  const videoClauses: Prisma.VideoWhereInput[] = [
    { title: textFilter },
    { description: textFilter },
    { ownerName: textFilter },
    { channelName: textFilter },
    { ownerId: textFilter },
    { channelId: textFilter },
    { language: textFilter },
    { url: textFilter },
    { platformVideoId: textFilter },
    { tags: { has: term } },
  ];

  if (year !== null) videoClauses.push({ year });
  if (duration !== null) videoClauses.push({ durationSeconds: duration });

  return { video: { OR: videoClauses } };
}

function savedResultsWhere(manifestId: string, query: string, exactPhrase: boolean): Prisma.ManifestItemWhereInput {
  const terms = searchTerms(query, exactPhrase);
  if (terms.length === 0) return { manifestId };

  // Saved-results search stays inside the persisted manifest tables. It never
  // calls Dailymotion and keeps each term scoped to public video metadata fields
  // so multilingual Arabic/English queries can run against previously collected
  // records without changing backend authority or fetch state.
  return {
    manifestId,
    AND: terms.map((term) => videoSearchClause(term)),
  };
}

function savedVideoFromManifestItem(item: PersistedManifestItemForSavedResults, manifestScope: VideoCollectionProvenance["manifestScope"], manifestLabel: string): NormalizedVideoMetadata {
  const fetchJob = item.fetchWindow?.fetchJob ?? null;
  return videoFromManifestItem(item as unknown as PersistedManifestItemWithVideo, {
    manifestScope,
    manifestLabel,
    fetchJobId: fetchJob?.id ?? null,
    attemptNumber: fetchJob ? attemptNumberFromProgress(fetchJob.progressJson) ?? 1 : null,
    fetchProfile: fetchJob ? channelStatus(fetchJob.fetchProfile).replaceAll("_", "-") : null,
    fetchStatus: fetchJob ? channelStatus(fetchJob.status) : null,
    windowStart: iso(item.fetchWindow?.windowStart),
    windowEnd: iso(item.fetchWindow?.windowEnd),
  });
}

function provenanceFromSnapshot(value: Prisma.JsonValue | null | undefined): VideoCollectionProvenance | null {
  const snapshot = jsonObject(value);
  const provenance = jsonObject(snapshot?.collectionProvenance as Prisma.JsonValue | null | undefined);
  return provenance ? provenance as unknown as VideoCollectionProvenance : null;
}

function videoFromRecord(video: PersistedManifestItemWithVideo["video"], provenance?: VideoCollectionProvenance | null): NormalizedVideoMetadata {
  return {
    id: video.platformVideoId,
    platform: "dailymotion",
    url: video.url,
    embedUrl: video.embedUrl,
    title: video.title,
    description: video.description,
    thumbnail: video.thumbnailUrl,
    duration: video.durationSeconds,
    views: video.viewsCount === null ? null : Number(video.viewsCount),
    rating: video.rating === null ? null : Number(video.rating),
    language: video.language,
    createdAt: iso(video.publishedAt),
    year: video.year,
    channelId: video.channelId,
    channelName: video.channelName,
    ownerId: video.ownerId,
    ownerName: video.ownerName,
    tags: video.tags,
    hasThumbnail: video.hasThumbnail,
    hasDescription: video.hasDescription,
    collectionProvenance: provenance ?? undefined,
    raw: video.rawJson,
  };
}

function videoFromManifestItem(item: PersistedManifestItemWithVideo, fallbackProvenance?: Partial<VideoCollectionProvenance>): NormalizedVideoMetadata {
  const stored = provenanceFromSnapshot(item.metadataSnapshotJson);
  const provenance = stored
    ? { ...stored, ...fallbackProvenance }
    : {
        sourceId: null,
        sourceName: null,
        sourceHandle: null,
        sourceExternalId: null,
        manifestId: item.manifestId,
        manifestLabel: fallbackProvenance?.manifestLabel ?? null,
        manifestScope: fallbackProvenance?.manifestScope ?? "attempt",
        fetchJobId: fallbackProvenance?.fetchJobId ?? null,
        attemptNumber: fallbackProvenance?.attemptNumber ?? null,
        fetchProfile: fallbackProvenance?.fetchProfile ?? null,
        fetchStatus: fallbackProvenance?.fetchStatus ?? null,
        fetchWindowId: item.fetchWindowId,
        pageAttemptId: fallbackProvenance?.pageAttemptId ?? null,
        pageNumber: item.pageNumber,
        windowStart: fallbackProvenance?.windowStart ?? null,
        windowEnd: fallbackProvenance?.windowEnd ?? null,
        collectedAt: iso(item.createdAt),
        firstSeenInManifestAt: iso(item.firstSeenInManifestAt),
        duplicateStatus: fallbackProvenance?.duplicateStatus ?? "unknown",
      } satisfies VideoCollectionProvenance;

  return videoFromRecord(item.video, provenance);
}

function buildCoverageFromJob(job: PersistedJobWithGraph): ChannelCoverage {
  const source = job.source;
  const reportedTotal = source?.reportedTotalFromApi ?? job.sourceReportedTotalAtEnd ?? job.sourceReportedTotalAtStart ?? null;
  const progress = jsonObject(job.progressJson);
  const collectedFromProgress = Number(progress?.coverageCollectedUniqueVideos ?? NaN);
  const collected = Number.isFinite(collectedFromProgress) ? collectedFromProgress : Number(job.uniqueItemsCollected);
  const estimatedRemaining = reportedTotal !== null ? Math.max(reportedTotal - collected, 0) : null;
  const coveragePercent = reportedTotal && reportedTotal > 0 ? Math.min(100, Number(((collected / reportedTotal) * 100).toFixed(2))) : null;
  const pendingWindowCount = job.windows.filter((window) => window.status === FetchWindowStatus.PENDING || window.status === FetchWindowStatus.RUNNING).length;
  const completedWindowCount = job.windows.filter((window) => window.status === FetchWindowStatus.COMPLETE).length;
  const coverageStatus = channelStatus(job.coverageStatusAtEnd ?? job.status) as ChannelCoverage["coverageStatus"];
  const latestCheckpoint = lastSuccessfulCheckpointFromJob(job) ?? job.lastCompletedWindowId;

  return {
    reportedTotalFromApi: reportedTotal,
    reportedTotalCheckedAt: iso(source?.reportedTotalCheckedAt),
    collectedUniqueVideos: collected,
    estimatedRemainingVideos: estimatedRemaining,
    coveragePercent,
    coverageStatus,
    coverageConfidence: coverageStatus === "complete" ? (reportedTotal === null || collected >= reportedTotal ? "high" : "medium") : coverageStatus === "unknown" ? "unknown" : "low",
    cappedWindowCount: job.cappedWindowCount,
    failedWindowCount: job.failedWindowCount,
    completedWindowCount,
    pendingWindowCount,
    latestSuccessfulCheckpoint: latestCheckpoint,
    lastResumePoint: resumeWindowIdFromJob(job),
    warning: coverageStatus === "complete" ? null : "Full channel coverage is only confirmed when every planned time window completes without caps or failures.",
    persistence: "database",
    persistenceWarning: null,
    persistenceType: "temporary",
  };
}

function windowSummary(window: PersistedJobWithGraph["windows"][number]): FetchWindowSummary {
  return {
    id: window.id,
    parentWindowId: window.parentWindowId,
    status: channelStatus(window.status) as FetchWindowSummary["status"],
    windowStart: iso(window.windowStart),
    windowEnd: iso(window.windowEnd),
    unit: channelStatus(window.unit) as FetchWindowSummary["unit"],
    depth: window.depth,
    nextPageToFetch: window.nextPageToFetch,
    pagesFetched: window.pagesFetched,
    itemsFound: Number(window.itemsFound),
    uniqueItemsAdded: Number(window.uniqueItemsAdded),
    duplicateItemsFound: Number(window.duplicateItemsFound),
    reachedProviderCap: window.reachedProviderCap,
    hasMoreAtEnd: window.hasMoreAtEnd,
    errorMessage: typeof window.errorJson === "object" && window.errorJson && "message" in window.errorJson ? String(window.errorJson.message) : null,
    startedAt: iso(window.startedAt),
    completedAt: iso(window.completedAt),
  };
}

function attemptSummary(attempt: PersistedJobWithGraph["pageAttempts"][number]): FetchPageAttemptSummary {
  const requestParams = jsonObject(attempt.requestParamsJson);
  return {
    id: attempt.id,
    fetchWindowId: attempt.fetchWindowId,
    pageNumber: attempt.pageNumber,
    limit: attempt.limit,
    requestParams: requestParams as FetchPageAttemptSummary["requestParams"],
    status: channelStatus(attempt.status) as FetchPageAttemptSummary["status"],
    itemsReturned: attempt.itemsReturned,
    uniqueItemsAdded: attempt.uniqueItemsAdded,
    duplicateItemsFound: attempt.duplicateItemsFound,
    hasMore: attempt.hasMore,
    requestedAt: attempt.requestedAt.toISOString(),
    completedAt: iso(attempt.completedAt),
  };
}

function manifestFromJob(job: PersistedJobWithGraph, metadata: ChannelSourceMetadata | null): ChannelManifest {
  const attemptNumber = attemptNumberFromJob(job);
  const items = (job.manifest?.items ?? [])
    .sort((a, b) => Number(a.position - b.position))
    .map((item) => videoFromManifestItem(item, {
      manifestScope: "attempt",
      manifestLabel: `Attempt #${attemptNumber}`,
      fetchJobId: job.id,
      attemptNumber,
      fetchProfile: channelStatus(job.fetchProfile).replaceAll("_", "-"),
      fetchStatus: channelStatus(job.status),
    }));
  const settings = fromJsonObject<ChannelFetchSettings>(job.settingsJson, {} as ChannelFetchSettings);
  const analysis = sourceIdentityFromInput(job.sourceInput);
  const status = manifestFetchStatus(job.status);

  return {
    id: `dm-channel-${job.id}`,
    platform: "dailymotion",
    sourceType: analysis.sourceType,
    sourceInput: job.sourceInput,
    resolvedChannelId: job.source?.externalSourceId ?? null,
    resolvedChannelName: job.source?.displayName ?? job.source?.username ?? null,
    items,
    fetchStatus: status,
    pagesFetched: job.pagesFetched,
    totalKnownItems: job.source?.reportedTotalFromApi ?? null,
    totalWindowsProcessed: job.windowsProcessed,
    cappedWindowCount: job.cappedWindowCount,
    failedWindowCount: job.failedWindowCount,
    duplicateCount: Number(job.duplicateCount),
    completenessStatus: channelStatus(job.coverageStatusAtEnd) as ChannelManifest["completenessStatus"],
    fetchSettings: Object.keys(settings).length > 0 ? settings : null,
    sourceMetadata: metadata,
    fetchJobId: job.id,
    manifestScope: "attempt",
    attemptNumber,
    isComplete: status === "complete",
    isPartial: status !== "complete",
    createdAt: job.createdAt.toISOString(),
    updatedAt: job.updatedAt.toISOString(),
    requestId: job.id,
  };
}

function historyEntryFromJob(job: PersistedJobWithGraph, attemptNumberOverride?: number): FetchHistoryEntry {
  const checkpoint = lastSuccessfulCheckpointFromJob(job) ?? resumeWindowIdFromJob(job) ?? job.lastCompletedWindowId;
  const identity = job.source ? sourceKey(job.source.sourceType, job.source.externalSourceId) : sourceKeyFromJobInput(job.sourceInput);
  const attemptNumber = attemptNumberOverride ?? attemptNumberFromJob(job);

  return {
    id: job.id,
    sourceKey: identity,
    attemptNumber,
    fetchProfile: channelStatus(job.fetchProfile).replaceAll("_", "-") as FetchHistoryEntry["fetchProfile"],
    status: channelStatus(job.status),
    completenessStatus: channelStatus(job.coverageStatusAtEnd) as FetchHistoryEntry["completenessStatus"],
    startedAt: iso(job.startedAt),
    completedAt: iso(job.completedAt),
    stoppedAt: iso(job.stoppedAt),
    updatedAt: job.updatedAt.toISOString(),
    manifestId: job.manifestId,
    itemsCollected: Number(job.itemsCollected),
    uniqueItemsCollected: Number(job.uniqueItemsCollected),
    duplicateCount: Number(job.duplicateCount),
    pagesFetched: job.pagesFetched,
    windowsProcessed: job.windowsProcessed,
    cappedWindowCount: job.cappedWindowCount,
    failedWindowCount: job.failedWindowCount,
    resumable: isTerminalButResumable(job.status, job.resumable),
    currentResumeCheckpoint: checkpoint,
    persistence: "database",
    persistenceType: "temporary",
    persistenceWarning: null,
  };
}

function lastSuccessfulCheckpointFromJob(job: PersistedJobWithGraph) {
  if (typeof job.resumeCursorJson !== "object" || !job.resumeCursorJson || !("lastSuccessfulCheckpoint" in job.resumeCursorJson)) {
    return null;
  }

  const checkpoint = String(job.resumeCursorJson.lastSuccessfulCheckpoint ?? "");
  return checkpoint.length > 0 ? checkpoint : null;
}

function resumeWindowIdFromJob(job: PersistedJobWithGraph) {
  if (job.currentWindowId) return job.currentWindowId;

  const resumableWindowStatuses = new Set<FetchWindowStatus>([FetchWindowStatus.RUNNING, FetchWindowStatus.PENDING, FetchWindowStatus.FAILED, FetchWindowStatus.STOPPED]);
  const resumableWindow = job.windows.find((window) => resumableWindowStatuses.has(window.status));
  return resumableWindow?.id ?? null;
}

function sourceKeyFromJobInput(input: string) {
  const identity = sourceIdentityFromInput(input);
  return sourceKey(identity.sourceType, identity.externalSourceId);
}

export async function upsertChannelSourceMetadata(metadata: ChannelSourceMetadata) {
  if (!persistenceEnabled()) return { source: null, persistence: "runtime-memory" as const };
  const prisma = getPrismaClient();
  const identity = sourceIdentityFromMetadata(metadata);
  const now = metadata.reportedTotalCheckedAt ? new Date(metadata.reportedTotalCheckedAt) : new Date();

  // VideoSource is the durable identity anchor for Channel Explorer. We use the
  // analyzed public identifier as the unique key so history lookups by the same
  // pasted URL/username survive provider metadata shape changes.
  const source = await prisma.videoSource.upsert({
    where: {
      platform_externalSourceId_sourceType: {
        platform: PLATFORM,
        externalSourceId: identity.externalSourceId,
        sourceType: identity.sourceType,
      },
    },
    create: {
      platform: PLATFORM,
      externalSourceId: identity.externalSourceId,
      sourceType: identity.sourceType,
      handle: metadata.handle,
      username: metadata.username,
      displayName: metadata.displayName,
      canonicalUrl: metadata.canonicalUrl,
      thumbnailUrl: metadata.thumbnailUrl,
      avatarUrl: metadata.avatarUrl,
      description: metadata.description,
      country: metadata.country,
      language: metadata.language,
      reportedTotalFromApi: metadata.reportedTotalFromApi,
      reportedTotalFieldName: metadata.reportedTotalFieldName,
      reportedTotalCheckedAt: now,
      metadataJson: toJson({ provider: metadata.metadataJson, providerExternalSourceId: metadata.externalSourceId }),
      lastMetadataRefreshAt: now,
    },
    update: {
      handle: metadata.handle,
      username: metadata.username,
      displayName: metadata.displayName,
      canonicalUrl: metadata.canonicalUrl,
      thumbnailUrl: metadata.thumbnailUrl,
      avatarUrl: metadata.avatarUrl,
      description: metadata.description,
      country: metadata.country,
      language: metadata.language,
      reportedTotalFromApi: metadata.reportedTotalFromApi,
      reportedTotalFieldName: metadata.reportedTotalFieldName,
      reportedTotalCheckedAt: now,
      metadataJson: toJson({ provider: metadata.metadataJson, providerExternalSourceId: metadata.externalSourceId }),
      lastMetadataRefreshAt: now,
    },
  });

  await createSourceCatalogSnapshot(source.id, {
    reportedTotalFromApi: metadata.reportedTotalFromApi,
    reportedTotalFieldName: metadata.reportedTotalFieldName,
    reportedTotalRawJson: metadata.metadataJson,
    collectedUniqueVideos: 0,
    estimatedRemainingVideos: metadata.reportedTotalFromApi,
    coveragePercent: null,
    coverageStatus: "unknown",
    coverageConfidence: "unknown",
    cappedWindowCount: 0,
    failedWindowCount: 0,
    completedWindowCount: 0,
    pendingWindowCount: 0,
  });

  return { source, persistence: "database" as const };
}

async function createSourceCatalogSnapshot(sourceId: string, coverage: Omit<ChannelCoverage, "reportedTotalCheckedAt" | "latestSuccessfulCheckpoint" | "lastResumePoint" | "warning" | "persistence" | "persistenceWarning" | "persistenceType"> & { reportedTotalFieldName?: string | null; reportedTotalRawJson?: unknown }) {
  const prisma = getPrismaClient();
  await prisma.sourceCatalogSnapshot.create({
    data: {
      sourceId,
      platform: PLATFORM,
      reportedTotalFromApi: coverage.reportedTotalFromApi,
      reportedTotalFieldName: coverage.reportedTotalFieldName ?? null,
      reportedTotalRawJson: toJson(coverage.reportedTotalRawJson ?? null),
      collectedUniqueVideos: BigInt(coverage.collectedUniqueVideos),
      estimatedRemainingVideos: coverage.estimatedRemainingVideos === null ? null : BigInt(coverage.estimatedRemainingVideos),
      coveragePercent: coverage.coveragePercent,
      coverageStatus: prismaCoverageStatus(coverage.coverageStatus),
      coverageConfidence: prismaCoverageConfidence(coverage.coverageConfidence),
      cappedWindowCount: coverage.cappedWindowCount,
      failedWindowCount: coverage.failedWindowCount,
      completedWindowCount: coverage.completedWindowCount,
      pendingWindowCount: coverage.pendingWindowCount,
    },
  });
}

async function sourceForSnapshot(snapshot: ChannelFetchJobSnapshot) {
  const metadata = snapshot.metadata;
  if (metadata) {
    const result = await upsertChannelSourceMetadata(metadata);
    if (result.source) return result.source;
  }

  const identity = sourceIdentityFromInput(snapshot.manifest.sourceInput);
  const prisma = getPrismaClient();
  return prisma.videoSource.upsert({
    where: {
      platform_externalSourceId_sourceType: {
        platform: PLATFORM,
        externalSourceId: identity.externalSourceId,
        sourceType: identity.sourceType,
      },
    },
    create: {
      platform: PLATFORM,
      externalSourceId: identity.externalSourceId,
      sourceType: identity.sourceType,
      handle: identity.externalSourceId,
      canonicalUrl: identity.sourceUrl,
    },
    update: {
      handle: identity.externalSourceId,
      canonicalUrl: identity.sourceUrl,
    },
  });
}

async function upsertVideo(video: NormalizedVideoMetadata, sourceId: string) {
  const prisma = getPrismaClient();
  return prisma.video.upsert({
    where: {
      platform_platformVideoId: {
        platform: PLATFORM,
        platformVideoId: video.id,
      },
    },
    create: {
      platform: PLATFORM,
      platformVideoId: video.id,
      sourceId,
      url: video.url,
      embedUrl: video.embedUrl,
      title: video.title,
      description: video.description,
      thumbnailUrl: video.thumbnail,
      durationSeconds: video.duration,
      viewsCount: video.views === null ? null : BigInt(Math.trunc(video.views)),
      rating: video.rating,
      language: video.language,
      ownerId: video.ownerId,
      ownerName: video.ownerName,
      channelId: video.channelId,
      channelName: video.channelName,
      tags: video.tags,
      publishedAt: dateOrNull(video.createdAt),
      year: video.year,
      hasThumbnail: video.hasThumbnail,
      hasDescription: video.hasDescription,
      rawJson: toJson(video.raw ?? null),
      lastSeenAt: new Date(),
    },
    update: {
      sourceId,
      url: video.url,
      embedUrl: video.embedUrl,
      title: video.title,
      description: video.description,
      thumbnailUrl: video.thumbnail,
      durationSeconds: video.duration,
      viewsCount: video.views === null ? null : BigInt(Math.trunc(video.views)),
      rating: video.rating,
      language: video.language,
      ownerId: video.ownerId,
      ownerName: video.ownerName,
      channelId: video.channelId,
      channelName: video.channelName,
      tags: video.tags,
      publishedAt: dateOrNull(video.createdAt),
      year: video.year,
      hasThumbnail: video.hasThumbnail,
      hasDescription: video.hasDescription,
      rawJson: toJson(video.raw ?? null),
      lastSeenAt: new Date(),
    },
  });
}

async function ensureSourceCatalogManifest(sourceId: string, sourceInput: string, sourceUrl: string | null, snapshot: ChannelFetchJobSnapshot) {
  const prisma = getPrismaClient();
  const existing = await prisma.manifest.findFirst({
    where: {
      manifestType: ManifestType.CHANNEL,
      persistenceType: ManifestPersistenceType.DURABLE,
      platform: PLATFORM,
      sourceId,
      query: "source-catalog",
    },
  });

  if (existing) return existing;

  // The durable source catalog manifest is the channel-level collection anchor.
  // Attempt manifests can expire as operational history, but this combined
  // manifest keeps unique public metadata discoverable for the same source.
  return prisma.manifest.create({
    data: {
      manifestType: ManifestType.CHANNEL,
      persistenceType: ManifestPersistenceType.DURABLE,
      platform: PLATFORM,
      sourceId,
      sourceInput,
      sourceUrl,
      query: "source-catalog",
      status: ManifestStatus.PARTIAL,
      completenessStatus: CoverageStatus.PARTIAL,
      fetchSettingsJson: toJson({ sourceCatalog: true, createdFromFetchJobId: snapshot.id }),
      requestId: `source-catalog:${sourceId}`,
      expiresAt: null,
    },
  });
}

function provenanceForItem(
  item: NormalizedVideoMetadata,
  source: Awaited<ReturnType<typeof sourceForSnapshot>>,
  snapshot: ChannelFetchJobSnapshot,
  manifestId: string,
  manifestScope: VideoCollectionProvenance["manifestScope"],
  manifestLabel: string
): VideoCollectionProvenance {
  return {
    sourceId: source.id,
    sourceName: source.displayName ?? source.username ?? source.handle ?? null,
    sourceHandle: source.handle ?? source.username ?? null,
    sourceExternalId: source.externalSourceId,
    manifestId,
    manifestLabel,
    manifestScope,
    fetchJobId: snapshot.id,
    attemptNumber: snapshot.attemptNumber,
    fetchProfile: snapshot.settings.fetchProfile,
    fetchStatus: snapshot.status,
    fetchWindowId: item.collectionProvenance?.fetchWindowId ?? null,
    pageAttemptId: item.collectionProvenance?.pageAttemptId ?? null,
    pageNumber: item.collectionProvenance?.pageNumber ?? null,
    windowStart: item.collectionProvenance?.windowStart ?? null,
    windowEnd: item.collectionProvenance?.windowEnd ?? null,
    collectedAt: item.collectionProvenance?.collectedAt ?? new Date().toISOString(),
    firstSeenInManifestAt: item.collectionProvenance?.firstSeenInManifestAt ?? new Date().toISOString(),
    duplicateStatus: item.collectionProvenance?.duplicateStatus ?? "new_in_attempt",
  };
}

export async function persistChannelFetchSnapshot(snapshot: ChannelFetchJobSnapshot) {
  if (!persistenceEnabled()) return { persistence: "runtime-memory" as const };

  const prisma = getPrismaClient();
  const source = await sourceForSnapshot(snapshot);
  const manifestId = snapshot.id;
  const combinedManifest = await ensureSourceCatalogManifest(source.id, snapshot.manifest.sourceInput, source.canonicalUrl, snapshot);
  const now = new Date();
  const caps = getFetchSafetyConfig();
  const expiresAt = addHours(now, Math.max(caps.jobTtlHours, caps.tempManifestTtlHours));
  const coverage = snapshot.coverage;
  const terminal = snapshot.status !== "running" && snapshot.status !== "pending";

  // Manifest, FetchJob, windows, page attempts, and manifest items are the
  // temporary operational truth for resume/history. They are upserted by stable
  // UUIDs so browser retries do not create duplicate logical jobs or windows.
  await prisma.manifest.upsert({
    where: { id: manifestId },
    create: {
      id: manifestId,
      manifestType: ManifestType.CHANNEL,
      persistenceType: ManifestPersistenceType.TEMPORARY,
      platform: PLATFORM,
      sourceId: source.id,
      sourceInput: snapshot.manifest.sourceInput,
      sourceUrl: source.canonicalUrl,
      status: prismaManifestStatus(snapshot.manifest.fetchStatus),
      completenessStatus: prismaCoverageStatus(snapshot.completenessStatus),
      itemCount: BigInt(snapshot.progress.itemsCollected),
      uniqueItemCount: BigInt(snapshot.progress.uniqueItemsCollected),
      duplicateCount: BigInt(snapshot.progress.duplicateCount),
      totalPagesFetched: snapshot.progress.pagesFetched,
      totalWindowsProcessed: snapshot.progress.windowsProcessed,
      cappedWindowCount: snapshot.progress.cappedWindowCount,
      failedWindowCount: snapshot.progress.failedWindowCount,
      fetchSettingsJson: toJson(snapshot.settings),
      requestId: snapshot.id,
      expiresAt,
      completedAt: terminal ? now : null,
    },
    update: {
      sourceId: source.id,
      sourceInput: snapshot.manifest.sourceInput,
      sourceUrl: source.canonicalUrl,
      status: prismaManifestStatus(snapshot.manifest.fetchStatus),
      completenessStatus: prismaCoverageStatus(snapshot.completenessStatus),
      itemCount: BigInt(snapshot.progress.itemsCollected),
      uniqueItemCount: BigInt(snapshot.progress.uniqueItemsCollected),
      duplicateCount: BigInt(snapshot.progress.duplicateCount),
      totalPagesFetched: snapshot.progress.pagesFetched,
      totalWindowsProcessed: snapshot.progress.windowsProcessed,
      cappedWindowCount: snapshot.progress.cappedWindowCount,
      failedWindowCount: snapshot.progress.failedWindowCount,
      fetchSettingsJson: toJson(snapshot.settings),
      completedAt: terminal ? now : null,
    },
  });

  await prisma.fetchJob.upsert({
    where: { id: snapshot.id },
    create: {
      id: snapshot.id,
      sourceId: source.id,
      manifestId,
      jobType: JOB_TYPE,
      platform: PLATFORM,
      sourceInput: snapshot.manifest.sourceInput,
      sourceUrl: source.canonicalUrl,
      fetchProfile: prismaFetchProfile(snapshot.settings.fetchProfile),
      status: prismaFetchJobStatus(snapshot.status),
      settingsJson: toJson(snapshot.settings),
      progressJson: toJson({ ...snapshot.progress, attemptNumber: snapshot.attemptNumber, coverageCollectedUniqueVideos: snapshot.coverage.collectedUniqueVideos }),
      resumeCursorJson: toJson({
        currentWindowId: snapshot.progress.currentWindow?.id ?? null,
        currentPage: snapshot.progress.currentWindow?.nextPageToFetch ?? null,
        lastSuccessfulCheckpoint: coverage.latestSuccessfulCheckpoint,
      }),
      currentWindowId: snapshot.progress.currentWindow?.id ?? null,
      currentPage: snapshot.progress.currentWindow?.nextPageToFetch ?? null,
      lastCompletedWindowId: coverage.latestSuccessfulCheckpoint?.split(":page:")[0] ?? null,
      maxItems: BigInt(snapshot.settings.maxItems),
      maxPages: snapshot.settings.maxTotalPages,
      maxWindows: snapshot.settings.maxWindows,
      pagesFetched: snapshot.progress.pagesFetched,
      windowsProcessed: snapshot.progress.windowsProcessed,
      itemsCollected: BigInt(snapshot.progress.itemsCollected),
      uniqueItemsCollected: BigInt(snapshot.progress.uniqueItemsCollected),
      duplicateCount: BigInt(snapshot.progress.duplicateCount),
      cappedWindowCount: snapshot.progress.cappedWindowCount,
      failedWindowCount: snapshot.progress.failedWindowCount,
      sourceReportedTotalAtStart: snapshot.metadata?.reportedTotalFromApi ?? null,
      sourceReportedTotalAtEnd: snapshot.metadata?.reportedTotalFromApi ?? null,
      collectedUniqueAtEnd: BigInt(snapshot.progress.uniqueItemsCollected),
      coverageStatusAtEnd: prismaCoverageStatus(snapshot.completenessStatus),
      resumable: snapshot.progress.resumable,
      stoppedAt: snapshot.status === "stopped" ? now : null,
      startedAt: now,
      completedAt: terminal ? now : null,
      expiresAt,
    },
    update: {
      sourceId: source.id,
      manifestId,
      sourceInput: snapshot.manifest.sourceInput,
      sourceUrl: source.canonicalUrl,
      fetchProfile: prismaFetchProfile(snapshot.settings.fetchProfile),
      status: prismaFetchJobStatus(snapshot.status),
      settingsJson: toJson(snapshot.settings),
      progressJson: toJson({ ...snapshot.progress, attemptNumber: snapshot.attemptNumber, coverageCollectedUniqueVideos: snapshot.coverage.collectedUniqueVideos }),
      resumeCursorJson: toJson({
        currentWindowId: snapshot.progress.currentWindow?.id ?? null,
        currentPage: snapshot.progress.currentWindow?.nextPageToFetch ?? null,
        lastSuccessfulCheckpoint: coverage.latestSuccessfulCheckpoint,
      }),
      currentWindowId: snapshot.progress.currentWindow?.id ?? null,
      currentPage: snapshot.progress.currentWindow?.nextPageToFetch ?? null,
      lastCompletedWindowId: coverage.latestSuccessfulCheckpoint?.split(":page:")[0] ?? null,
      maxItems: BigInt(snapshot.settings.maxItems),
      maxPages: snapshot.settings.maxTotalPages,
      maxWindows: snapshot.settings.maxWindows,
      pagesFetched: snapshot.progress.pagesFetched,
      windowsProcessed: snapshot.progress.windowsProcessed,
      itemsCollected: BigInt(snapshot.progress.itemsCollected),
      uniqueItemsCollected: BigInt(snapshot.progress.uniqueItemsCollected),
      duplicateCount: BigInt(snapshot.progress.duplicateCount),
      cappedWindowCount: snapshot.progress.cappedWindowCount,
      failedWindowCount: snapshot.progress.failedWindowCount,
      sourceReportedTotalAtEnd: snapshot.metadata?.reportedTotalFromApi ?? null,
      collectedUniqueAtEnd: BigInt(snapshot.progress.uniqueItemsCollected),
      coverageStatusAtEnd: prismaCoverageStatus(snapshot.completenessStatus),
      resumable: snapshot.progress.resumable,
      stoppedAt: snapshot.status === "stopped" ? now : null,
      completedAt: terminal ? now : null,
    },
  });

  await prisma.fetchJobEvent.create({
    data: {
      fetchJobId: snapshot.id,
      eventType: terminal ? `job_${snapshot.status}` : "job_progress",
      message: terminal ? `Channel fetch finished with status ${snapshot.status}.` : `Channel fetch progress persisted with status ${snapshot.status}.`,
      dataJson: toJson({
        status: snapshot.status,
        attemptNumber: snapshot.attemptNumber,
        fetchProfile: snapshot.settings.fetchProfile,
        pagesFetched: snapshot.progress.pagesFetched,
        windowsProcessed: snapshot.progress.windowsProcessed,
        uniqueItemsCollected: snapshot.progress.uniqueItemsCollected,
        currentWindowId: snapshot.progress.currentWindow?.id ?? null,
        currentPage: snapshot.progress.currentWindow?.nextPageToFetch ?? null,
        latestSuccessfulCheckpoint: coverage.latestSuccessfulCheckpoint,
        persistenceType: "temporary",
      }),
    },
  });

  for (const window of snapshot.windows) {
    await prisma.fetchWindow.upsert({
      where: { id: window.id },
      create: {
        id: window.id,
        fetchJobId: snapshot.id,
        sourceId: source.id,
        parentWindowId: window.parentWindowId,
        status: prismaWindowStatus(window.status),
        windowStart: dateOrNull(window.windowStart),
        windowEnd: dateOrNull(window.windowEnd),
        unit: prismaWindowUnit(window.unit),
        depth: window.depth,
        pageStart: 1,
        nextPageToFetch: window.nextPageToFetch,
        pagesFetched: window.pagesFetched,
        itemsFound: BigInt(window.itemsFound),
        uniqueItemsAdded: BigInt(window.uniqueItemsAdded),
        duplicateItemsFound: BigInt(window.duplicateItemsFound),
        reachedProviderCap: window.reachedProviderCap,
        hasMoreAtEnd: window.hasMoreAtEnd,
        errorJson: window.errorMessage ? toJson({ message: window.errorMessage }) : Prisma.JsonNull,
        startedAt: dateOrNull(window.startedAt),
        completedAt: dateOrNull(window.completedAt),
      },
      update: {
        sourceId: source.id,
        parentWindowId: window.parentWindowId,
        status: prismaWindowStatus(window.status),
        windowStart: dateOrNull(window.windowStart),
        windowEnd: dateOrNull(window.windowEnd),
        unit: prismaWindowUnit(window.unit),
        depth: window.depth,
        nextPageToFetch: window.nextPageToFetch,
        pagesFetched: window.pagesFetched,
        itemsFound: BigInt(window.itemsFound),
        uniqueItemsAdded: BigInt(window.uniqueItemsAdded),
        duplicateItemsFound: BigInt(window.duplicateItemsFound),
        reachedProviderCap: window.reachedProviderCap,
        hasMoreAtEnd: window.hasMoreAtEnd,
        errorJson: window.errorMessage ? toJson({ message: window.errorMessage }) : Prisma.JsonNull,
        startedAt: dateOrNull(window.startedAt),
        completedAt: dateOrNull(window.completedAt),
      },
    });
  }

  for (const attempt of snapshot.recentPageAttempts) {
    await prisma.fetchPageAttempt.upsert({
      where: { id: attempt.id },
      create: {
        id: attempt.id,
        fetchWindowId: attempt.fetchWindowId,
        fetchJobId: snapshot.id,
        pageNumber: attempt.pageNumber,
        limit: attempt.limit,
        requestParamsJson: toJson(attempt.requestParams ?? { page: attempt.pageNumber, limit: attempt.limit }),
        status: prismaAttemptStatus(attempt.status),
        itemsReturned: attempt.itemsReturned,
        uniqueItemsAdded: attempt.uniqueItemsAdded,
        duplicateItemsFound: attempt.duplicateItemsFound,
        hasMore: attempt.hasMore,
        requestedAt: new Date(attempt.requestedAt),
        completedAt: dateOrNull(attempt.completedAt),
      },
      update: {
        status: prismaAttemptStatus(attempt.status),
        requestParamsJson: toJson(attempt.requestParams ?? { page: attempt.pageNumber, limit: attempt.limit }),
        itemsReturned: attempt.itemsReturned,
        uniqueItemsAdded: attempt.uniqueItemsAdded,
        duplicateItemsFound: attempt.duplicateItemsFound,
        hasMore: attempt.hasMore,
        completedAt: dateOrNull(attempt.completedAt),
      },
    });
  }

  let nextCombinedPosition = await prisma.manifestItem.count({ where: { manifestId: combinedManifest.id } });

  for (let index = 0; index < snapshot.manifest.items.length; index += 1) {
    const item = snapshot.manifest.items[index];
    const video = await upsertVideo(item, source.id);
    const attemptProvenance = provenanceForItem(item, source, snapshot, manifestId, "attempt", `Attempt #${snapshot.attemptNumber}`);
    const combinedProvenance = { ...attemptProvenance, manifestId: combinedManifest.id, manifestScope: "combined" as const, manifestLabel: "Combined Manifest", duplicateStatus: item.collectionProvenance?.duplicateStatus ?? "new_in_attempt" };
    const attemptSnapshot = { ...item, collectionProvenance: attemptProvenance };
    const combinedSnapshot = { ...item, collectionProvenance: combinedProvenance };

    // Attempt manifest items preserve the per-run result list, while the
    // durable combined manifest dedupes every video for this source. Future
    // agents should not collapse these two links into one table row: the UI
    // needs both source-wide viewing and attempt-level auditability.
    await prisma.manifestItem.upsert({
      where: {
        manifestId_videoId: {
          manifestId,
          videoId: video.id,
        },
      },
      create: {
        manifestId,
        videoId: video.id,
        fetchWindowId: attemptProvenance.fetchWindowId,
        position: BigInt(index + 1),
        pageNumber: attemptProvenance.pageNumber,
        metadataSnapshotJson: toJson(attemptSnapshot),
      },
      update: {
        fetchWindowId: attemptProvenance.fetchWindowId,
        position: BigInt(index + 1),
        pageNumber: attemptProvenance.pageNumber,
        metadataSnapshotJson: toJson(attemptSnapshot),
      },
    });

    const existingCombinedItem = await prisma.manifestItem.findUnique({
      where: {
        manifestId_videoId: {
          manifestId: combinedManifest.id,
          videoId: video.id,
        },
      },
      select: { id: true },
    });

    if (!existingCombinedItem) {
      await prisma.manifestItem.create({
        data: {
        manifestId: combinedManifest.id,
        videoId: video.id,
        fetchWindowId: combinedProvenance.fetchWindowId,
        position: BigInt(++nextCombinedPosition),
        pageNumber: combinedProvenance.pageNumber,
        metadataSnapshotJson: toJson(combinedSnapshot),
        },
      });
    }
  }

  const combinedUniqueCount = await prisma.manifestItem.count({ where: { manifestId: combinedManifest.id } });
  await prisma.manifest.update({
    where: { id: combinedManifest.id },
    data: {
      status: prismaManifestStatus(snapshot.manifest.fetchStatus),
      completenessStatus: prismaCoverageStatus(snapshot.completenessStatus),
      itemCount: BigInt(combinedUniqueCount),
      uniqueItemCount: BigInt(combinedUniqueCount),
      duplicateCount: BigInt(snapshot.progress.duplicateCount),
      totalPagesFetched: snapshot.progress.pagesFetched,
      totalWindowsProcessed: snapshot.progress.windowsProcessed,
      cappedWindowCount: snapshot.progress.cappedWindowCount,
      failedWindowCount: snapshot.progress.failedWindowCount,
      completedAt: terminal ? now : null,
    },
  });

  if (terminal || snapshot.status === "running") {
    await createSourceCatalogSnapshot(source.id, {
      reportedTotalFromApi: coverage.reportedTotalFromApi,
      reportedTotalFieldName: snapshot.metadata?.reportedTotalFieldName ?? null,
      reportedTotalRawJson: snapshot.metadata?.metadataJson ?? null,
      collectedUniqueVideos: coverage.collectedUniqueVideos,
      estimatedRemainingVideos: coverage.estimatedRemainingVideos,
      coveragePercent: coverage.coveragePercent,
      coverageStatus: coverage.coverageStatus,
      coverageConfidence: coverage.coverageConfidence,
      cappedWindowCount: coverage.cappedWindowCount,
      failedWindowCount: coverage.failedWindowCount,
      completedWindowCount: coverage.completedWindowCount,
      pendingWindowCount: coverage.pendingWindowCount,
    });
  }

  return { persistence: "database" as const };
}

async function findJobWithGraph(jobId: string): Promise<PersistedJobWithGraph | null> {
  const prisma = getPrismaClient();
  return prisma.fetchJob.findUnique({
    where: { id: jobId },
    include: {
      source: true,
      manifest: { include: { items: { include: { video: true, fetchWindow: true } } } },
      windows: { orderBy: [{ createdAt: "asc" }] },
      pageAttempts: { orderBy: [{ requestedAt: "asc" }] },
    },
  });
}

export async function getPersistedChannelFetchJob(jobId: string): Promise<ChannelFetchJobSnapshot | null> {
  if (!persistenceEnabled()) return null;
  const job = await findJobWithGraph(jobId);
  if (!job) return null;
  return persistedJobSnapshot(job);
}

function persistedJobSnapshot(job: PersistedJobWithGraph): ChannelFetchJobSnapshot {
  const metadata = metadataForSource(job.source);
  const windows = job.windows.map(windowSummary);
  const coverage = buildCoverageFromJob(job);
  const manifest = manifestFromJob(job, metadata);
  const historyEntry = historyEntryFromJob(job);
  const activeWindowId = resumeWindowIdFromJob(job);
  const currentWindow = activeWindowId ? windows.find((window) => window.id === activeWindowId) ?? null : null;
  const settings = fromJsonObject<ChannelFetchSettings>(job.settingsJson, {} as ChannelFetchSettings);
  const attemptNumber = attemptNumberFromJob(job);

  return {
    id: job.id,
    sourceKey: job.source ? sourceKey(job.source.sourceType, job.source.externalSourceId) : sourceKeyFromJobInput(job.sourceInput),
    attemptNumber,
    status: channelStatus(job.status),
    completenessStatus: channelStatus(job.coverageStatusAtEnd) as ChannelFetchJobSnapshot["completenessStatus"],
    settings,
    metadata,
    progress: {
      attemptNumber,
      fetchProfile: channelStatus(job.fetchProfile).replaceAll("_", "-") as ChannelFetchSettings["fetchProfile"],
      status: channelStatus(job.status),
      completenessStatus: channelStatus(job.coverageStatusAtEnd) as ChannelFetchJobSnapshot["completenessStatus"],
      pageSize: settings.pageSize ?? job.pageAttempts.at(-1)?.limit ?? 100,
      pagesFetched: job.pagesFetched,
      totalApiRequests: job.pageAttempts.length,
      currentPageNumber: job.currentPage,
      currentDateWindow: currentWindow?.windowStart || currentWindow?.windowEnd ? `${currentWindow.windowStart ?? "open"} -> ${currentWindow.windowEnd ?? "open"}` : null,
      windowsProcessed: job.windowsProcessed,
      windowsQueued: windows.filter((window) => window.status === "pending" || window.status === "running").length,
      windowsCompleted: windows.filter((window) => window.status === "complete").length,
      itemsCollected: Number(job.itemsCollected),
      uniqueItemsCollected: Number(job.uniqueItemsCollected),
      duplicateCount: Number(job.duplicateCount),
      cappedWindowCount: job.cappedWindowCount,
      failedWindowCount: job.failedWindowCount,
      currentWindow,
      lastCheckpoint: coverage.latestSuccessfulCheckpoint,
      maxItemsReached: job.status === FetchJobStatus.MAX_ITEMS_REACHED,
      partialManifestPreserved: true,
      resumable: job.resumable,
    },
    coverage,
    manifest,
    historyEntry,
    windows,
    recentPageAttempts: job.pageAttempts.slice(-10).map(attemptSummary),
    persistence: "database",
    persistenceType: "temporary",
    persistenceWarning: null,
  };
}

export async function listPersistedChannelFetchHistory(inputOrSourceKey?: string | null, limit = 25): Promise<FetchHistoryEntry[]> {
  if (!persistenceEnabled()) return [];
  const prisma = getPrismaClient();
  let sourceFilter: Prisma.FetchJobWhereInput | undefined;

  if (inputOrSourceKey) {
    const raw = inputOrSourceKey.trim();
    const parsedKey = explicitSourceKeyParts(raw);
    if (isUuid(raw)) {
      sourceFilter = { sourceId: raw };
    } else if (parsedKey) {
      sourceFilter = {
        source: {
          platform: PLATFORM,
          sourceType: parsedKey.sourceType,
          externalSourceId: parsedKey.externalSourceId,
        },
      };
    } else {
      const identity = sourceIdentityFromInput(raw);
      sourceFilter = {
        OR: [
          { sourceInput: raw },
          {
            source: {
              platform: PLATFORM,
              sourceType: identity.sourceType,
              externalSourceId: identity.externalSourceId,
            },
          },
        ],
      };
    }
  }

  const jobs = await prisma.fetchJob.findMany({
    where: { jobType: JOB_TYPE, platform: PLATFORM, ...sourceFilter },
    include: {
      source: true,
      manifest: { include: { items: { include: { video: true, fetchWindow: true } } } },
      windows: true,
      pageAttempts: true,
    },
    orderBy: { updatedAt: "desc" },
    take: limit,
  });

  const attemptNumberById = new Map(
    [...jobs]
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .map((job, index) => [job.id, attemptNumberFromProgress(job.progressJson) ?? index + 1])
  );

  return jobs.map((job) => historyEntryFromJob(job, attemptNumberById.get(job.id)));
}

async function findSourceByInputOrKey(inputOrSourceKey: string) {
  const prisma = getPrismaClient();
  const raw = inputOrSourceKey.trim();
  if (isUuid(raw)) {
    return prisma.videoSource.findUnique({ where: { id: raw } });
  }

  const parsedKey = explicitSourceKeyParts(raw);
  if (parsedKey) {
    return prisma.videoSource.findUnique({
      where: {
        platform_externalSourceId_sourceType: {
          platform: PLATFORM,
          sourceType: parsedKey.sourceType,
          externalSourceId: parsedKey.externalSourceId,
        },
      },
    });
  }

  const identity = sourceIdentityFromInput(raw);
  return prisma.videoSource.findUnique({
    where: {
      platform_externalSourceId_sourceType: {
        platform: PLATFORM,
        sourceType: identity.sourceType,
        externalSourceId: identity.externalSourceId,
      },
    },
  });
}

export async function listPersistedChannelSources(limit = 100): Promise<ChannelSourceSummary[]> {
  if (!persistenceEnabled()) return [];
  const prisma = getPrismaClient();
  const sources = await prisma.videoSource.findMany({
    where: {
      platform: PLATFORM,
      fetchJobs: { some: { jobType: JOB_TYPE, platform: PLATFORM } },
    },
    include: {
      catalogSnapshots: { orderBy: { lastCheckedAt: "desc" }, take: 1 },
      manifests: {
        where: {
          manifestType: ManifestType.CHANNEL,
          persistenceType: ManifestPersistenceType.DURABLE,
          platform: PLATFORM,
          query: "source-catalog",
        },
        include: { _count: { select: { items: true } } },
      },
      fetchJobs: {
        where: { jobType: JOB_TYPE, platform: PLATFORM },
        orderBy: { updatedAt: "desc" },
        take: 1,
      },
      _count: { select: { fetchJobs: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: safeLimit(limit, 100, 250),
  });

  return sources.map(sourceSummaryFromRecord);
}

export async function getPersistedChannelSourceSummary(sourceId: string): Promise<ChannelSourceSummary | null> {
  if (!persistenceEnabled()) return null;
  const source = await findSourceSummaryRecord(sourceId);
  return source ? sourceSummaryFromRecord(source) : null;
}

function manifestFromPersistedCatalog(manifest: PersistedManifestWithGraph, history: FetchHistoryEntry[], coverage: ChannelCoverage | null): ChannelManifest {
  const metadata = manifest.source
    ? {
        platform: "dailymotion" as const,
        sourceType: manifest.source.sourceType,
        sourceInput: manifest.source.canonicalUrl ?? manifest.source.handle ?? manifest.source.username ?? manifest.source.externalSourceId,
        externalSourceId: manifest.source.externalSourceId,
        handle: manifest.source.handle,
        username: manifest.source.username,
        displayName: manifest.source.displayName,
        canonicalUrl: manifest.source.canonicalUrl,
        thumbnailUrl: manifest.source.thumbnailUrl,
        avatarUrl: manifest.source.avatarUrl,
        description: manifest.source.description,
        country: manifest.source.country,
        language: manifest.source.language,
        reportedTotalFromApi: manifest.source.reportedTotalFromApi,
        reportedTotalFieldName: manifest.source.reportedTotalFieldName,
        reportedTotalCheckedAt: iso(manifest.source.reportedTotalCheckedAt),
        metadataJson: manifest.source.metadataJson,
        metadataUnavailableReason: null,
        persistedSourceId: manifest.source.id,
        persistence: "database" as const,
        persistenceWarning: null,
      }
    : null;

  const items = manifest.items
    .sort((a, b) => Number(a.position - b.position))
    .map((item) => videoFromManifestItem(item as PersistedManifestItemWithVideo, {
      manifestScope: "combined",
      manifestLabel: "Combined Manifest",
      sourceId: manifest.sourceId,
      sourceName: manifest.source?.displayName ?? manifest.source?.username ?? manifest.source?.handle ?? null,
      sourceHandle: manifest.source?.handle ?? manifest.source?.username ?? null,
      sourceExternalId: manifest.source?.externalSourceId ?? null,
    }));
  const analysis = sourceIdentityFromInput(manifest.sourceInput ?? metadata?.sourceInput ?? manifest.source?.externalSourceId ?? "unknown");

  return {
    id: manifest.id,
    platform: "dailymotion",
    sourceType: analysis.sourceType,
    sourceInput: manifest.sourceInput ?? metadata?.sourceInput ?? "",
    resolvedChannelId: manifest.source?.externalSourceId ?? null,
    resolvedChannelName: manifest.source?.displayName ?? manifest.source?.username ?? null,
    items,
    fetchStatus: manifestFetchStatus(manifest.status),
    pagesFetched: manifest.totalPagesFetched,
    totalKnownItems: manifest.source?.reportedTotalFromApi ?? null,
    totalWindowsProcessed: manifest.totalWindowsProcessed,
    cappedWindowCount: manifest.cappedWindowCount,
    failedWindowCount: manifest.failedWindowCount,
    duplicateCount: Number(manifest.duplicateCount),
    completenessStatus: channelStatus(manifest.completenessStatus) as ChannelManifest["completenessStatus"],
    fetchSettings: null,
    sourceMetadata: metadata,
    fetchJobId: history[0]?.id ?? null,
    manifestScope: "combined",
    attemptNumber: null,
    isComplete: coverage?.coverageStatus === "complete",
    isPartial: coverage?.coverageStatus !== "complete",
    createdAt: manifest.createdAt.toISOString(),
    updatedAt: manifest.updatedAt.toISOString(),
    requestId: manifest.requestId ?? manifest.id,
  };
}

export async function getPersistedCombinedChannelManifest(inputOrSourceKey: string) {
  if (!persistenceEnabled()) return { manifest: null, history: [], coverage: null };
  const prisma = getPrismaClient();
  const source = await findSourceByInputOrKey(inputOrSourceKey);
  if (!source) return { manifest: null, history: [], coverage: null };
  const [manifest, history, coverage] = await Promise.all([
    prisma.manifest.findFirst({
      where: {
        manifestType: ManifestType.CHANNEL,
        persistenceType: ManifestPersistenceType.DURABLE,
        platform: PLATFORM,
        sourceId: source.id,
        query: "source-catalog",
      },
      include: {
        source: true,
        items: {
          include: { video: true, fetchWindow: { include: { fetchJob: true } } },
          orderBy: { position: "asc" },
        },
      },
    }),
    listPersistedChannelFetchHistory(inputOrSourceKey, 100),
    getLatestPersistedChannelCoverage(inputOrSourceKey),
  ]);

  return {
    manifest: manifest ? manifestFromPersistedCatalog(manifest, history, coverage) : null,
    history,
    coverage,
  };
}

export async function getPersistedSavedChannelResults(input: SavedChannelResultsInput) {
  if (!persistenceEnabled()) {
    return {
      source: null,
      items: [],
      total: 0,
      limit: safeLimit(input.limit),
      offset: safeOffset(input.offset),
      sort: input.sort ?? "first_collected",
      scope: input.scope ?? "combined",
      attemptId: input.attemptId ?? null,
      manifestId: null,
    };
  }

  const prisma = getPrismaClient();
  const source = await getPersistedChannelSourceSummary(input.sourceId);
  if (!source) {
    return {
      source: null,
      items: [],
      total: 0,
      limit: safeLimit(input.limit),
      offset: safeOffset(input.offset),
      sort: input.sort ?? "first_collected",
      scope: input.scope ?? "combined",
      attemptId: input.attemptId ?? null,
      manifestId: null,
    };
  }

  const scope = input.scope ?? "combined";
  const limit = safeLimit(input.limit);
  const offset = safeOffset(input.offset);
  const sort = input.sort ?? "first_collected";
  const query = input.query?.trim() ?? "";
  const exactPhrase = Boolean(input.exactPhrase);
  let manifestId: string | null = null;
  let manifestScope: VideoCollectionProvenance["manifestScope"] = "combined";
  let manifestLabel = "Combined Manifest";
  let resolvedAttemptId: string | null = input.attemptId ?? null;

  if (scope === "attempt") {
    const job = await prisma.fetchJob.findFirst({
      where: {
        id: input.attemptId ?? undefined,
        sourceId: input.sourceId,
        jobType: JOB_TYPE,
        platform: PLATFORM,
      },
      orderBy: { updatedAt: "desc" },
    });
    manifestId = job?.manifestId ?? null;
    resolvedAttemptId = job?.id ?? null;
    manifestScope = "attempt";
    manifestLabel = job ? `Attempt #${attemptNumberFromProgress(job.progressJson) ?? 1}` : "Attempt Manifest";
  } else {
    const manifest = await prisma.manifest.findFirst({
      where: {
        manifestType: ManifestType.CHANNEL,
        persistenceType: ManifestPersistenceType.DURABLE,
        platform: PLATFORM,
        sourceId: input.sourceId,
        query: "source-catalog",
      },
      select: { id: true },
    });
    manifestId = manifest?.id ?? null;
  }

  if (!manifestId) {
    return {
      source,
      items: [],
      total: 0,
      limit,
      offset,
      sort,
      scope,
      attemptId: resolvedAttemptId,
      manifestId: null,
    };
  }

  const where = savedResultsWhere(manifestId, query, exactPhrase);
  const [total, items] = await Promise.all([
    prisma.manifestItem.count({ where }),
    prisma.manifestItem.findMany({
      where,
      include: { video: true, fetchWindow: { include: { fetchJob: true } } },
      orderBy: savedResultOrderBy(sort),
      skip: offset,
      take: limit,
    }),
  ]);

  return {
    source,
    items: items.map((item) => savedVideoFromManifestItem(item, manifestScope, manifestLabel)),
    total,
    limit,
    offset,
    sort,
    scope,
    attemptId: resolvedAttemptId,
    manifestId,
  };
}

export async function getPersistedCombinedChannelManifestPage(input: Omit<SavedChannelResultsInput, "scope" | "attemptId">) {
  if (!persistenceEnabled()) return { source: null, manifest: null, history: [], coverage: null, items: [], total: 0, limit: safeLimit(input.limit), offset: safeOffset(input.offset), sort: input.sort ?? "first_collected" };
  const prisma = getPrismaClient();
  const source = await getPersistedChannelSourceSummary(input.sourceId);
  if (!source) return { source: null, manifest: null, history: [], coverage: null, items: [], total: 0, limit: safeLimit(input.limit), offset: safeOffset(input.offset), sort: input.sort ?? "first_collected" };

  const results = await getPersistedSavedChannelResults({ ...input, scope: "combined" });
  const [manifest, history, coverage] = await Promise.all([
    results.manifestId
      ? prisma.manifest.findUnique({
          where: { id: results.manifestId },
          include: {
            source: true,
            items: {
              where: savedResultsWhere(results.manifestId, input.query?.trim() ?? "", Boolean(input.exactPhrase)),
              include: { video: true, fetchWindow: { include: { fetchJob: true } } },
              orderBy: savedResultOrderBy(results.sort),
              skip: results.offset,
              take: results.limit,
            },
          },
        })
      : null,
    listPersistedChannelFetchHistory(input.sourceId, 100),
    getLatestPersistedChannelCoverage(input.sourceId),
  ]);

  return {
    source,
    manifest: manifest ? manifestFromPersistedCatalog(manifest, history, coverage) : null,
    history,
    coverage,
    items: results.items,
    total: results.total,
    limit: results.limit,
    offset: results.offset,
    sort: results.sort,
  };
}

export async function getPersistedChannelAttemptDetail(attemptId: string, sourceId?: string | null): Promise<ChannelAttemptDetail | null> {
  if (!persistenceEnabled()) return null;
  const job = await findJobWithGraph(attemptId);
  if (!job || !job.sourceId) return null;
  if (sourceId && job.sourceId !== sourceId) return null;
  const source = await getPersistedChannelSourceSummary(job.sourceId);
  if (!source) return null;
  const snapshot = persistedJobSnapshot(job);

  return {
    source,
    job: snapshot,
    windows: job.windows.map(windowSummary),
    pageAttempts: job.pageAttempts.map(attemptSummary),
    items: snapshot.manifest.items,
  };
}

export async function getPersistedSourceContinuationState(inputOrSourceKey: string) {
  if (!persistenceEnabled()) return null;
  const prisma = getPrismaClient();
  const source = await findSourceByInputOrKey(inputOrSourceKey);
  if (!source) return null;
  const resumableWindowStatuses = [FetchWindowStatus.PENDING, FetchWindowStatus.RUNNING, FetchWindowStatus.FAILED, FetchWindowStatus.STOPPED];
  const [videos, completedWindows, latestResumeJob] = await Promise.all([
    prisma.video.findMany({
      where: { sourceId: source.id, platform: PLATFORM },
      select: { platformVideoId: true },
    }),
    prisma.fetchWindow.findMany({
      where: {
        sourceId: source.id,
        status: { in: [FetchWindowStatus.COMPLETE, FetchWindowStatus.SPLIT] },
      },
      select: {
        windowStart: true,
        windowEnd: true,
        unit: true,
      },
    }),
    prisma.fetchJob.findFirst({
      where: {
        sourceId: source.id,
        platform: PLATFORM,
        jobType: JOB_TYPE,
        windows: {
          some: {
            status: { in: resumableWindowStatuses },
          },
        },
      },
      include: {
        windows: {
          where: {
            status: { in: resumableWindowStatuses },
          },
          orderBy: [{ createdAt: "asc" }],
        },
      },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  return {
    sourceId: source.id,
    existingVideoIds: videos.map((video) => video.platformVideoId),
    completedWindowKeys: completedWindows.map((window) => `${channelStatus(window.unit)}:${iso(window.windowStart) ?? "open"}:${iso(window.windowEnd) ?? "open"}`),
    // Continue Fetch creates a new numbered attempt, but the page cursor comes
    // from the latest unfinished DB window for this same source. This avoids
    // replaying completed API pages while still keeping each attempt's windows
    // and page attempts separately auditable.
    resumeWindows: latestResumeJob?.windows.map((window) => ({
      unit: channelStatus(window.unit) as FetchWindowSummary["unit"],
      windowStart: iso(window.windowStart),
      windowEnd: iso(window.windowEnd),
      depth: window.depth,
      nextPageToFetch: Math.max(1, window.nextPageToFetch),
    })) ?? [],
  };
}

export async function getLatestPersistedChannelCoverage(inputOrSourceKey: string): Promise<ChannelCoverage | null> {
  if (!persistenceEnabled()) return null;
  const history = await listPersistedChannelFetchHistory(inputOrSourceKey, 1);
  if (history.length === 0) {
    const identity = explicitSourceKeyParts(inputOrSourceKey) ? null : sourceIdentityFromInput(inputOrSourceKey);
    const prisma = getPrismaClient();
    const source = identity
      ? await prisma.videoSource.findUnique({
          where: {
            platform_externalSourceId_sourceType: {
              platform: PLATFORM,
              externalSourceId: identity.externalSourceId,
              sourceType: identity.sourceType,
            },
          },
        })
      : null;
    if (!source) return null;
    return {
      reportedTotalFromApi: source.reportedTotalFromApi,
      reportedTotalCheckedAt: iso(source.reportedTotalCheckedAt),
      collectedUniqueVideos: 0,
      estimatedRemainingVideos: source.reportedTotalFromApi,
      coveragePercent: null,
      coverageStatus: "unknown",
      coverageConfidence: "unknown",
      cappedWindowCount: 0,
      failedWindowCount: 0,
      completedWindowCount: 0,
      pendingWindowCount: 0,
      latestSuccessfulCheckpoint: null,
      lastResumePoint: null,
      warning: "Full channel coverage is only confirmed when every planned time window completes without caps or failures.",
      persistence: "database",
      persistenceType: "temporary",
      persistenceWarning: null,
    };
  }

  const job = await findJobWithGraph(history[0].id);
  return job ? buildCoverageFromJob(job) : null;
}

export async function getPersistedRuntimeJobData(jobId: string) {
  if (!persistenceEnabled()) return null;
  const job = await findJobWithGraph(jobId);
  if (!job) return null;
  const snapshot = persistedJobSnapshot(job);
  return {
    job,
    snapshot,
    metadata: metadataForSource(job.source),
    items: snapshot.manifest.items,
    windows: snapshot.windows,
    pageAttempts: snapshot.recentPageAttempts,
    settings: snapshot.settings,
  };
}

export function decorateMetadataWithPersistence(metadata: ChannelSourceMetadata, persistedSourceId: string | null, warning: string | null): ChannelSourceMetadata {
  return {
    ...metadata,
    persistedSourceId,
    persistence: warning ? "runtime-memory" : "database",
    persistenceWarning: warning,
  };
}

export function decorateCoverageFallback(coverage: ChannelCoverage | null, warning: string): ChannelCoverage | null {
  if (!coverage) return null;
  return {
    ...coverage,
    persistence: "runtime-memory",
    persistenceWarning: warning,
  };
}
