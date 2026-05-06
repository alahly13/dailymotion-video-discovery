import * as React from "react";
import { cn } from "@/lib/utils/cn";

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn("min-h-11 w-full rounded-2xl border border-[var(--border)] bg-[var(--background-elevated)] px-4 py-2 text-sm outline-none transition placeholder:text-[var(--muted-foreground)] focus:ring-4 focus:ring-[var(--ring)]", props.className)} />;
}
