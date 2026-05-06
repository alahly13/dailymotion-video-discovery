import { getDailymotionConfig } from "@/lib/config/env";
import { normalizeDailymotionVideos, type DailymotionRawVideo } from "./dailymotion-normalize";

const VIDEO_FIELDS = ["id","title","description","thumbnail_720_url","thumbnail_480_url","thumbnail_360_url","thumbnail_url","duration","views_total","ratings_total","language","created_time","channel","channel.name","owner","owner.screenname","tags","url"].join(",");
const USER_FIELDS = ["id", "username", "screenname", "url", "description", "country", "language", "videos_total"].join(",");

export type ExternalReason = "missing_config" | "network_error" | "rate_limited" | "invalid_response" | "unauthorized" | "unavailable" | "user_input_error" | "unknown";
export interface SafeExternalResult<T> { ok: boolean; data: T | null; error: string | null; reason: ExternalReason | null; status?: number; isPartial?: boolean; }
export interface DailymotionPageResult { items: ReturnType<typeof normalizeDailymotionVideos>; page: number; limit: number; total: number | null; hasMore: boolean; }
interface DailymotionListResponse { page?: number; limit?: number; total?: number; has_more?: boolean; list?: DailymotionRawVideo[]; error?: { message?: string; code?: string }; }
export interface DailymotionRawUser {
  id?: string;
  username?: string | null;
  screenname?: string | null;
  url?: string | null;
  description?: string | null;
  country?: string | null;
  language?: string | null;
  videos_total?: number | string | null;
  error?: { message?: string; code?: string };
}

type DailymotionParamValue = string | number | boolean | null | undefined;

function withTimeout(signal?: AbortSignal) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  const combinedSignal = signal ? AbortSignal.any([signal, controller.signal]) : controller.signal;
  return { combinedSignal, clear: () => clearTimeout(timeout) };
}

function authHeaders() {
  const config = getDailymotionConfig();
  const headers: HeadersInit = { Accept: "application/json" };
  if (config.apiKey) headers.Authorization = `Bearer ${config.apiKey}`;
  return { config, headers };
}

async function fetchList(path: string, params: Record<string, DailymotionParamValue>, signal?: AbortSignal): Promise<SafeExternalResult<DailymotionPageResult>> {
  const { config, headers } = authHeaders();
  const timeout = withTimeout(signal);
  try {
    const url = new URL(`${config.baseUrl.replace(/\/$/, "")}${path}`);
    url.searchParams.set("fields", VIDEO_FIELDS);
    for (const [key, value] of Object.entries(params)) {
      if (value !== null && value !== undefined && value !== "") url.searchParams.set(key, String(value));
    }
    const response = await fetch(url, { signal: timeout.combinedSignal, headers, cache: "no-store" });
    const status = response.status;
    if (status === 429) return { ok: false, data: null, error: "Dailymotion rate limit reached.", reason: "rate_limited", status };
    if (status === 401 || status === 403) return { ok: false, data: null, error: config.apiKey ? "Dailymotion authorization failed." : "This feature requires Dailymotion authentication.", reason: "unauthorized", status };
    if (!response.ok) return { ok: false, data: null, error: `Dailymotion request failed (${status}).`, reason: "unavailable", status };
    const data = (await response.json()) as DailymotionListResponse;
    if (data.error?.message) return { ok: false, data: null, error: data.error.message, reason: "invalid_response", status };
    return { ok: true, data: { items: normalizeDailymotionVideos(data.list ?? []), page: data.page ?? Number(params.page ?? 1), limit: data.limit ?? Number(params.limit ?? 50), total: data.total ?? null, hasMore: data.has_more === true }, error: null, reason: null, status };
  } catch (error) {
    const aborted = error instanceof DOMException && error.name === "AbortError";
    return { ok: false, data: null, error: aborted ? "Dailymotion request timed out or was canceled." : "Dailymotion network error.", reason: "network_error", status: 503 };
  } finally { timeout.clear(); }
}

export function searchDailymotionVideos(query: string, page = 1, limit = 50, signal?: AbortSignal) { return fetchList("/videos", { search: query, page, limit, sort: "recent" }, signal); }
export function fetchDailymotionChannelPage(apiPath: string, page = 1, limit = 50, signal?: AbortSignal, params: Record<string, DailymotionParamValue> = {}) {
  return fetchList(apiPath, { page, limit, sort: "recent", ...params }, signal);
}

export async function fetchDailymotionUserMetadata(profileId: string, signal?: AbortSignal): Promise<SafeExternalResult<DailymotionRawUser>> {
  const { config, headers } = authHeaders();
  const timeout = withTimeout(signal);
  try {
    const url = new URL(`${config.baseUrl.replace(/\/$/, "")}/user/${encodeURIComponent(profileId)}`);
    url.searchParams.set("fields", USER_FIELDS);
    const response = await fetch(url, { signal: timeout.combinedSignal, headers, cache: "no-store" });
    const status = response.status;
    if (status === 429) return { ok: false, data: null, error: "Dailymotion rate limit reached.", reason: "rate_limited", status };
    if (status === 401 || status === 403) return { ok: false, data: null, error: config.apiKey ? "Dailymotion authorization failed." : "This metadata endpoint is not available anonymously for this source.", reason: "unauthorized", status };
    if (!response.ok) return { ok: false, data: null, error: `Dailymotion metadata request failed (${status}).`, reason: "unavailable", status };
    const data = (await response.json()) as DailymotionRawUser;
    if (data.error?.message) return { ok: false, data: null, error: data.error.message, reason: "invalid_response", status };
    return { ok: true, data, error: null, reason: null, status };
  } catch (error) {
    const aborted = error instanceof DOMException && error.name === "AbortError";
    return { ok: false, data: null, error: aborted ? "Dailymotion metadata request timed out or was canceled." : "Dailymotion metadata network error.", reason: "network_error", status: 503 };
  } finally {
    timeout.clear();
  }
}
