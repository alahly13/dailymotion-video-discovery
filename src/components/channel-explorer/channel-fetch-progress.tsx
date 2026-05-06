import { Card } from "@/components/ui/card";

export function ChannelFetchProgress({ status, pagesFetched, count, total }: { status: string; pagesFetched: number; count: number; total: number | null }) {
  return <Card className="grid gap-4 sm:grid-cols-4"><div><p className="text-xs uppercase text-slate-500">Status</p><p className="font-bold">{status}</p></div><div><p className="text-xs uppercase text-slate-500">Pages fetched</p><p className="font-bold">{pagesFetched}</p></div><div><p className="text-xs uppercase text-slate-500">Videos collected</p><p className="font-bold">{count}</p></div><div><p className="text-xs uppercase text-slate-500">API total</p><p className="font-bold">{total ?? "Unknown"}</p></div></Card>;
}
