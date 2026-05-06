import * as React from "react";
import { cn } from "@/lib/utils/cn";

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn("min-h-11 w-full rounded-2xl border border-slate-300 bg-white/80 px-4 py-2 text-sm outline-none ring-blue-500/20 transition placeholder:text-slate-400 focus:ring-4 dark:border-slate-700 dark:bg-slate-950/70", props.className)} />;
}
