import { Card } from "@/components/ui/card";

export function AiHelperPanel() {
  return <Card><h2 className="text-lg font-bold">Gemini AI Helper</h2><p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Server route handlers can summarize the current Channel Manifest and suggest filters. The Gemini API key is server-only and never shipped to client components.</p></Card>;
}
