import { env } from "@/lib/config/env";
import { normalizeDailymotionVideos, type DailymotionRawVideo } from "./dailymotion-normalize";

const VIDEO_FIELDS = [
  "id",
  "title",
  "description",
  "thumbnail_720_url",
  "thumbnail_480_url",
  "thumbnail_360_url",
  "thumbnail_url",
  "duration",
  "views_total",
  "ratings_total",
  "language",
  "created_time",
  "channel",
  "channel.name",
  "owner",
  "owner.screenname",
  "tags",
  "url",
].join(",");

export interface DailymotionPageResult {
  items: ReturnType<typeof normalizeDailymotionVideos>;
  page: number;
  limit: number;
  total: number | null;
  hasMore: boolean;
}

interface DailymotionListResponse {
  page?: number;
  limit?: number;
  total?: number;
  has_more?: boolean;
  list?: DailymotionRawVideo[];
  error?: { message?: string };
}

async function fetchList(path: string, params: Record<string, string | number>, signal?: AbortSignal): Promise<DailymotionPageResult> {
  const base = env.dailymotionApiBaseUrl.replace(/\/$/, "");
  const url = new URL(`${base}${path}`);
  url.searchParams.set("fields", VIDEO_FIELDS);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, String(value));

  const response = await fetch(url, { signal, headers: { Accept: "application/json" }, cache: "no-store" });
  if (!response.ok) throw new Error(`Dailymotion request failed with ${response.status}.`);
  const data = (await response.json()) as DailymotionListResponse;
  if (data.error?.message) throw new Error(data.error.message);

  return {
    items: normalizeDailymotionVideos(data.list ?? []),
    page: data.page ?? Number(params.page ?? 1),
    limit: data.limit ?? Number(params.limit ?? 50),
    total: data.total ?? null,
    hasMore: data.has_more === true,
  };
}

export function searchDailymotionVideos(query: string, page = 1, limit = 50, signal?: AbortSignal) {
  return fetchList("/videos", { search: query, page, limit, sort: "recent" }, signal);
}

export function fetchDailymotionChannelPage(apiPath: string, page = 1, limit = 50, signal?: AbortSignal) {
  return fetchList(apiPath, { page, limit, sort: "recent" }, signal);
}
