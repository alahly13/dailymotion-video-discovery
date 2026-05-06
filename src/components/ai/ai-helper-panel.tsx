import { Card } from "@/components/ui/card";

export function AiHelperPanel() {
  return (
    <Card>
      <h2 className="text-lg font-bold">Gemini AI Helper</h2>
      <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
        Manifest summaries and filter suggestions run through server route handlers when Gemini is configured.
      </p>
    </Card>
  );
}
