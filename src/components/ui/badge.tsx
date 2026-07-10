import * as React from "react";
import { cn } from "@/lib/utils";

const COLOR_MAP = {
  indigo: "bg-indigo-500/15 text-indigo-300 border-indigo-500/25",
  cyan: "bg-cyan-500/15 text-cyan-300 border-cyan-500/25",
  green: "bg-emerald-500/15 text-emerald-300 border-emerald-500/25",
  amber: "bg-amber-500/15 text-amber-300 border-amber-500/25",
  red: "bg-red-500/15 text-red-300 border-red-500/25",
  grey: "bg-white/5 text-slate-400 border-white/10",
  blue: "bg-blue-500/15 text-blue-300 border-blue-500/25",
} as const;

export type BadgeColor = keyof typeof COLOR_MAP;

export function Badge({
  color = "grey",
  pulse = false,
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { color?: BadgeColor; pulse?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        COLOR_MAP[color],
        pulse && "pulse-soft",
        className,
      )}
      {...props}
    />
  );
}
