import * as React from "react";
import { cn } from "@/lib/utils/cn";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-lg border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow)] backdrop-blur", className)} {...props} />;
}
