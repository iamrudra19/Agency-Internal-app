import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function MetricCard({
  label,
  icon: Icon,
  children,
  accent = "indigo",
  className,
}: {
  label: string;
  icon: LucideIcon;
  children: ReactNode;
  accent?: "indigo" | "cyan" | "amber" | "red" | "green";
  className?: string;
}) {
  const iconColor = {
    indigo: "text-indigo-400 bg-indigo-500/10",
    cyan: "text-cyan-400 bg-cyan-500/10",
    amber: "text-amber-400 bg-amber-500/10",
    red: "text-red-400 bg-red-500/10",
    green: "text-emerald-400 bg-emerald-500/10",
  }[accent];

  return (
    <div className={cn("glass-card glass-card-hover p-6", className)}>
      <div className="flex items-center justify-between">
        <span className="caption-label">{label}</span>
        <span className={cn("rounded-lg p-1.5", iconColor)}>
          <Icon className="h-3.5 w-3.5" />
        </span>
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
}
