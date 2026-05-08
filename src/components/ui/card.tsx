import * as React from "react";
import { cn } from "@/lib/utils/cn";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "min-w-0 rounded-lg border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow)] backdrop-blur-md sm:p-6",
        className
      )}
      {...props}
    />
  );
}
