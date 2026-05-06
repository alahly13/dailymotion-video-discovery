import { z } from "zod";
import { getFetchSafetyConfig } from "@/lib/config/env";
import type { ChannelFetchSettings, FetchProfile, FetchSafetyCaps, TimeWindowUnit } from "@/types/channel-fetch";

const fetchProfileSchema = z.enum(["quick-preview", "standard-fetch", "deep-balanced", "deep-aggressive", "recent-sync", "historical-backfill", "custom-expert"]);
const windowUnitSchema = z.enum(["all", "year", "month", "week", "day"]);
const minimumWindowUnitSchema = z.enum(["month", "week", "day"]);

const fetchSettingsInputSchema = z
  .object({
    fetchProfile: fetchProfileSchema.optional(),
    maxItems: z.coerce.number().int().positive().optional(),
    maxTotalPages: z.coerce.number().int().positive().optional(),
    maxWindows: z.coerce.number().int().positive().optional(),
    pageSize: z.coerce.number().int().positive().optional(),
    fromDate: z.string().trim().nullable().optional(),
    toDate: z.string().trim().nullable().optional(),
    initialWindowUnit: windowUnitSchema.optional(),
    minimumSplitUnit: minimumWindowUnitSchema.optional(),
    autoSplitCappedWindows: z.boolean().optional(),
    delayMs: z.coerce.number().int().nonnegative().optional(),
    stopWhenMaxItemsReached: z.boolean().optional(),
    stopOnCappedWindow: z.boolean().optional(),
    preservePartialManifest: z.boolean().optional(),
    resumeJobId: z.string().trim().nullable().optional(),
  })
  .partial();

function clamp(value: number | undefined, fallback: number, min: number, max: number) {
  const candidate = Number.isFinite(value) ? Number(value) : fallback;
  return Math.min(Math.max(candidate, min), max);
}

function cleanDate(value: string | null | undefined) {
  if (!value) return null;
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10);
}

function daysAgo(days: number) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function profileDefaults(profile: FetchProfile, caps: FetchSafetyCaps): ChannelFetchSettings {
  const base: ChannelFetchSettings = {
    fetchProfile: profile,
    maxItems: Math.min(10000, caps.maxItems),
    maxTotalPages: Math.min(caps.legacyMaxPages, caps.maxTotalPages),
    maxWindows: Math.min(250, caps.maxWindows),
    pageSize: Math.min(100, caps.maxPageSize),
    fromDate: null,
    toDate: null,
    initialWindowUnit: "all",
    minimumSplitUnit: "month",
    autoSplitCappedWindows: false,
    delayMs: Math.max(caps.defaultDelayMs, caps.minDelayMs),
    stopWhenMaxItemsReached: true,
    stopOnCappedWindow: false,
    preservePartialManifest: true,
    resumeJobId: null,
  };

  if (profile === "quick-preview") {
    return { ...base, maxItems: Math.min(1000, caps.maxItems), maxTotalPages: 1, maxWindows: 1, pageSize: Math.min(50, caps.maxPageSize), preservePartialManifest: true };
  }

  if (profile === "standard-fetch") {
    return { ...base, maxTotalPages: Math.min(caps.legacyMaxPages, caps.maxTotalPages), maxWindows: 1, preservePartialManifest: true };
  }

  if (profile === "deep-balanced") {
    return { ...base, initialWindowUnit: "year", minimumSplitUnit: "month", autoSplitCappedWindows: true, maxWindows: Math.min(500, caps.maxWindows), maxTotalPages: Math.min(1000, caps.maxTotalPages) };
  }

  if (profile === "deep-aggressive") {
    return { ...base, initialWindowUnit: "year", minimumSplitUnit: "day", autoSplitCappedWindows: true, maxWindows: Math.min(1500, caps.maxWindows), maxTotalPages: Math.min(2500, caps.maxTotalPages) };
  }

  if (profile === "recent-sync") {
    return { ...base, fromDate: daysAgo(7), toDate: today(), initialWindowUnit: "day", minimumSplitUnit: "day", autoSplitCappedWindows: false, maxWindows: Math.min(60, caps.maxWindows), maxTotalPages: Math.min(300, caps.maxTotalPages) };
  }

  if (profile === "historical-backfill") {
    return { ...base, initialWindowUnit: "year", minimumSplitUnit: "month", autoSplitCappedWindows: true, maxWindows: Math.min(1000, caps.maxWindows), maxTotalPages: Math.min(2000, caps.maxTotalPages) };
  }

  return { ...base, initialWindowUnit: "year", minimumSplitUnit: "month", autoSplitCappedWindows: true };
}

function normalizeWindowUnit(unit: TimeWindowUnit, fallback: TimeWindowUnit) {
  return unit === "all" ? fallback : unit;
}

export function getDefaultChannelFetchSettings() {
  const caps = getFetchSafetyConfig();
  return resolveChannelFetchSettings({ fetchProfile: caps.defaultProfile });
}

export function resolveChannelFetchSettings(raw: unknown): { settings: ChannelFetchSettings; caps: FetchSafetyCaps } {
  const caps = getFetchSafetyConfig();
  const parsed = fetchSettingsInputSchema.safeParse(raw ?? {});
  const input = parsed.success ? parsed.data : {};
  const profile = input.fetchProfile ?? caps.defaultProfile;
  const defaults = profileDefaults(profile, caps);

  // Server clamping is the authoritative protection layer. The UI may render
  // matching limits for usability, but every submitted value is bounded here
  // before a provider request or job state change can happen.
  const pageSize = clamp(input.pageSize, defaults.pageSize, 1, caps.maxPageSize);
  const maxItems = clamp(input.maxItems, defaults.maxItems, 1, caps.maxItems);
  const maxTotalPages = profile === "quick-preview" ? 1 : clamp(input.maxTotalPages, defaults.maxTotalPages, 1, caps.maxTotalPages);
  const maxWindows = profile === "quick-preview" || profile === "standard-fetch" ? 1 : clamp(input.maxWindows, defaults.maxWindows, 1, caps.maxWindows);
  const delayMs = clamp(input.delayMs, defaults.delayMs, caps.minDelayMs, Math.max(caps.defaultDelayMs, caps.minDelayMs, 60_000));

  return {
    caps,
    settings: {
      fetchProfile: profile,
      maxItems,
      maxTotalPages,
      maxWindows,
      pageSize,
      fromDate: cleanDate(input.fromDate) ?? defaults.fromDate,
      toDate: cleanDate(input.toDate) ?? defaults.toDate,
      initialWindowUnit: normalizeWindowUnit(input.initialWindowUnit ?? defaults.initialWindowUnit, defaults.initialWindowUnit),
      minimumSplitUnit: input.minimumSplitUnit ?? defaults.minimumSplitUnit,
      autoSplitCappedWindows: input.autoSplitCappedWindows ?? defaults.autoSplitCappedWindows,
      delayMs,
      stopWhenMaxItemsReached: input.stopWhenMaxItemsReached ?? defaults.stopWhenMaxItemsReached,
      stopOnCappedWindow: input.stopOnCappedWindow ?? defaults.stopOnCappedWindow,
      preservePartialManifest: input.preservePartialManifest ?? defaults.preservePartialManifest,
      resumeJobId: input.resumeJobId ?? null,
    },
  };
}
