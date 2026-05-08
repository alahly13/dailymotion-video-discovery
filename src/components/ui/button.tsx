import * as React from "react";
import { cn } from "@/lib/utils/cn";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "success" | "info";
  size?: "sm" | "md" | "icon";
};

const variants = {
  primary: "border border-transparent bg-[var(--primary)] text-white shadow-[0_10px_30px_-20px_var(--primary)] hover:bg-[var(--accent-strong)]",
  secondary: "border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] hover:border-[var(--border-strong)] hover:bg-[var(--surface-muted)]",
  ghost: "border border-transparent text-[var(--muted-foreground)] hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)]",
  danger: "border border-transparent bg-[var(--error)] text-white hover:brightness-95",
  success: "border border-transparent bg-[var(--success)] text-slate-950 hover:brightness-95",
  info: "border border-[color-mix(in_srgb,var(--info)_36%,transparent)] bg-[color-mix(in_srgb,var(--info)_12%,transparent)] text-[var(--info)] hover:bg-[color-mix(in_srgb,var(--info)_18%,transparent)]",
};

const sizes = {
  sm: "min-h-9 px-3 py-1.5 text-xs",
  md: "min-h-10 px-4 py-2 text-sm",
  icon: "h-10 w-10 p-0",
};

export function Button({ className, variant = "primary", size = "md", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex max-w-full min-w-0 items-center justify-center gap-2 rounded-md text-center font-bold leading-snug transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--ring)] disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  );
}
