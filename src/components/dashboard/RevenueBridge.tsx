import { ChevronRight, IndianRupee } from "lucide-react";
import { cn, formatINR } from "@/lib/utils";
import type { BridgeResult, PaceStatus } from "@/lib/revenue-bridge";
import { CountUp } from "./CountUp";

const STATUS_TEXT: Record<PaceStatus, string> = {
  on_track: "text-emerald-400",
  behind: "text-amber-400",
  critical: "text-red-400",
};

const STATUS_DOT: Record<PaceStatus, string> = {
  on_track: "bg-emerald-400",
  behind: "bg-amber-400",
  critical: "bg-red-400",
};

export function RevenueBridge({ bridge }: { bridge: BridgeResult }) {
  const glow =
    bridge.paceStatus === "on_track"
      ? "glow-green"
      : bridge.paceStatus === "behind"
        ? "glow-amber"
        : "glow-red";

  const filled = Math.round(Math.min(1, bridge.pctComplete) * 10);

  return (
    <div className={cn("glass-card gradient-accent p-6", glow)}>
      <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
        <div>
          <div className="caption-label">Revenue Bridge — This Month</div>
          <div className="mt-1 flex items-baseline gap-2 font-mono">
            <span className="text-3xl font-bold text-text-primary">
              <CountUp value={bridge.achieved} format={(n) => formatINR(n)} />
            </span>
            <span className="text-lg text-text-muted">/ {formatINR(bridge.target)}</span>
          </div>
        </div>
        <div className={cn("flex items-center gap-2 text-sm font-medium", STATUS_TEXT[bridge.paceStatus])}>
          <span className={cn("h-2 w-2 rounded-full pulse-soft", STATUS_DOT[bridge.paceStatus])} />
          {bridge.paceMessage}
        </div>
      </div>

      {/* Progress meter */}
      <div className="mt-3 flex items-center gap-3 font-mono text-sm">
        <span className="tracking-widest text-indigo-300" aria-hidden>
          {"▰".repeat(filled)}
          <span className="text-white/15">{"▱".repeat(10 - filled)}</span>
        </span>
        <span className="text-text-secondary">
          {Math.round(bridge.pctComplete * 100)}% · {bridge.daysRemaining}d left
        </span>
      </div>

      {/* Pipeline nodes */}
      <div className="mt-6 -mx-2 overflow-x-auto px-2 pb-1">
        <div className="flex min-w-max items-stretch gap-1">
          {bridge.nodes.map((node, i) => (
            <div key={node.key} className="flex items-center">
              <div className="flex min-w-[104px] flex-col items-center rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2.5">
                <span className="caption-label text-center whitespace-nowrap">{node.label}</span>
                <span className={cn("mt-1 font-mono text-xl font-bold", STATUS_TEXT[node.status])}>
                  <CountUp value={node.current} />
                </span>
                <span className="font-mono text-[10px] text-text-muted">
                  need {node.required.toLocaleString("en-IN")}
                </span>
              </div>
              {i < bridge.nodes.length - 1 && (
                <ChevronRight className="mx-0.5 h-4 w-4 shrink-0 text-text-muted" />
              )}
            </div>
          ))}
          <div className="flex items-center">
            <ChevronRight className="mx-0.5 h-4 w-4 shrink-0 text-text-muted" />
            <div className="flex min-w-[120px] flex-col items-center rounded-lg border border-cyan-500/20 bg-cyan-500/5 px-3 py-2.5">
              <span className="caption-label flex items-center gap-1 text-cyan-400">
                <IndianRupee className="h-3 w-3" /> Revenue
              </span>
              <span className="mt-1 font-mono text-xl font-bold text-cyan-300">
                <CountUp value={bridge.achieved} format={(n) => formatINR(n, true)} />
              </span>
              <span className="font-mono text-[10px] text-text-muted">
                of {formatINR(bridge.target, true)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
