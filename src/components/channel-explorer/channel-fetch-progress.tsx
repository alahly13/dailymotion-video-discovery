import { Card } from "@/components/ui/card";

export function ChannelFetchProgress({ status, pagesFetched, count, total }: { status: string; pagesFetched: number; count: number; total: number | null }) {
  const stats = [
    ["Status", status],
    ["Pages fetched", pagesFetched],
    ["Videos collected", count],
    ["API total", total ?? "Unknown"],
  ];

  return (
    <Card className="grid gap-4 sm:grid-cols-4">
      {stats.map(([label, value]) => (
        <div key={label}>
          <p className="text-xs font-semibold uppercase text-[var(--muted-foreground)]">{label}</p>
          <p className="mt-1 text-lg font-bold">{value}</p>
        </div>
      ))}
    </Card>
  );
}
