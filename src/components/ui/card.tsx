import * as React from "react";
import { cn } from "@/lib/utils/cn";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-[0_12px_30px_-18px_rgba(30,20,10,0.45)] backdrop-blur", className)} {...props} />;
}
