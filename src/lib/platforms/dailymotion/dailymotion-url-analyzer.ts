import type { ChannelSourceType } from "@/types/manifest";

export interface DailymotionChannelAnalysis {
  sourceType: ChannelSourceType;
  sourceInput: string;
  resolvedIdentifier: string;
  apiPath: string;
  displayLabel: string;
}

function cleanIdentifier(value: string) {
  return value.trim().replace(/^@/, "").replace(/^\/+|\/+$/g, "");
}

export function analyzeDailymotionChannelInput(input: string): DailymotionChannelAnalysis {
  const sourceInput = input.trim();
  if (!sourceInput) throw new Error("Enter a Dailymotion channel URL, profile URL, username, or channel ID.");

  let url: URL | null = null;
  try {
    url = new URL(sourceInput.startsWith("http") ? sourceInput : `https://www.dailymotion.com/${sourceInput}`);
  } catch {
    url = null;
  }

  if (url && /(^|\.)dailymotion\.com$/i.test(url.hostname)) {
    const segments = url.pathname.split("/").filter(Boolean).map(decodeURIComponent);
    const first = segments[0] ?? "";
    const second = segments[1] ?? "";
    if (first === "channel" && second) {
      const id = cleanIdentifier(second);
      return { sourceType: "channel", sourceInput, resolvedIdentifier: id, apiPath: `/channel/${encodeURIComponent(id)}/videos`, displayLabel: `Channel ${id}` };
    }
    if ((first === "user" || first === "profile") && second) {
      const id = cleanIdentifier(second);
      return { sourceType: "profile", sourceInput, resolvedIdentifier: id, apiPath: `/user/${encodeURIComponent(id)}/videos`, displayLabel: `Profile ${id}` };
    }
    if (first && first !== "video") {
      const id = cleanIdentifier(first);
      return { sourceType: "username", sourceInput, resolvedIdentifier: id, apiPath: `/user/${encodeURIComponent(id)}/videos`, displayLabel: `Username ${id}` };
    }
  }

  const id = cleanIdentifier(sourceInput);
  if (/^x[a-z0-9]+$/i.test(id) || /^channel[:/]/i.test(id)) {
    const channelId = id.replace(/^channel[:/]/i, "");
    return { sourceType: "channel_id", sourceInput, resolvedIdentifier: channelId, apiPath: `/channel/${encodeURIComponent(channelId)}/videos`, displayLabel: `Channel ID ${channelId}` };
  }

  return { sourceType: "username", sourceInput, resolvedIdentifier: id, apiPath: `/user/${encodeURIComponent(id)}/videos`, displayLabel: `Username ${id}` };
}
