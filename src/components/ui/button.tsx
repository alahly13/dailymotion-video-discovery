import * as React from "react";
import { cn } from "@/lib/utils/cn";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" | "danger"; };

const variants = {
  primary: "bg-[var(--accent)] text-[var(--accent-foreground)] hover:brightness-95",
  secondary: "border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] hover:bg-black/5 dark:hover:bg-white/10",
  ghost: "text-[var(--muted-foreground)] hover:bg-black/5 hover:text-[var(--foreground)] dark:hover:bg-white/10",
  danger: "bg-rose-600 text-white hover:bg-rose-700",
};

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  return <button className={cn("inline-flex min-h-10 items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--ring)] disabled:cursor-not-allowed disabled:opacity-50", variants[variant], className)} {...props} />;
}
