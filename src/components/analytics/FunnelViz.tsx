import { useMemo } from "react";
import { cn } from "@/lib/utils";
import type { Contact, DealWithContact, OutreachSequenceWithContact } from "@/types/database";
import { STAGE_LABELS, PIPELINE_STAGES } from "@/lib/constants";
import { daysSince } from "@/lib/utils";

export function FunnelViz({
  contacts,
  deals,
  sequences,
}: {
  contacts: Contact[];
  deals: DealWithContact[];
  sequences: OutreachSequenceWithContact[];
}) {
  const funnel = useMemo(() => {
    const prospects = contacts.filter((c) => c.contact_type !== "disqualified").length;
    const inSequence = sequences.filter((s) => s.email_1_sent_at).length;
    const replied = sequences.filter((s) => s.replied_at).length;
    const meetings = deals.filter((d) =>
      ["meeting_booked", "proposal_sent", "negotiation", "won"].includes(d.stage),
    ).length;
    const proposals = deals.filter((d) =>
      ["proposal_sent", "negotiation", "won"].includes(d.stage),
    ).length;
    const won = deals.filter((d) => d.stage === "won").length;
    return [
      { label: "Prospects", count: prospects },
      { label: "Sequences", count: inSequence },
      { label: "Replies", count: replied },
      { label: "Meetings", count: meetings },
      { label: "Proposals", count: proposals },
      { label: "Won", count: won },
    ];
  }, [contacts, deals, sequences]);

  const max = Math.max(1, funnel[0].count);

  const timeInStage = useMemo(() => {
    return PIPELINE_STAGES.filter((s) => !["won", "lost"].includes(s)).map((stage) => {
      const inStage = deals.filter((d) => d.stage === stage);
      const avg = inStage.length
        ? inStage.reduce((s, d) => s + daysSince(d.stage_changed_at), 0) / inStage.length
        : 0;
      return { stage: STAGE_LABELS[stage], count: inStage.length, avgDays: avg };
    });
  }, [deals]);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div className="glass-card p-6">
        <div className="caption-label mb-4">Full Funnel</div>
        <div className="space-y-2">
          {funnel.map((step, i) => {
            const conv = i > 0 && funnel[i - 1].count > 0
              ? (step.count / funnel[i - 1].count) * 100
              : null;
            const width = Math.max(6, (step.count / max) * 100);
            return (
              <div key={step.label}>
                <div className="flex items-baseline justify-between text-xs">
                  <span className="text-text-secondary">{step.label}</span>
                  <span className="font-mono">
                    <span className="text-text-primary">{step.count}</span>
                    {conv != null && (
                      <span className={cn("ml-2", conv >= 30 ? "text-emerald-400" : conv >= 10 ? "text-amber-400" : "text-red-400")}>
                        {conv.toFixed(0)}%
                      </span>
                    )}
                  </span>
                </div>
                <div className="mt-1 h-5 overflow-hidden rounded bg-white/[0.03]">
                  <div
                    className="flex h-full items-center rounded bg-gradient-to-r from-indigo-500/70 to-cyan-500/40 px-2 transition-all duration-500"
                    style={{ width: `${width}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-[11px] text-text-muted">
          Percentages show stage-to-stage conversion. The biggest % drop is where prospects are falling out.
        </p>
      </div>

      <div className="glass-card p-6">
        <div className="caption-label mb-4">Time in Stage (open deals)</div>
        <div className="space-y-2.5">
          {timeInStage.map((row) => (
            <div key={row.stage} className="flex items-center justify-between text-xs">
              <span className="text-text-secondary">{row.stage}</span>
              <span className="font-mono">
                <span className="text-text-muted">{row.count} deals · </span>
                <span
                  className={cn(
                    row.avgDays >= 14 ? "text-red-400" : row.avgDays >= 7 ? "text-amber-400" : "text-emerald-400",
                  )}
                >
                  {row.avgDays.toFixed(0)}d avg
                </span>
              </span>
            </div>
          ))}
        </div>
        <p className="mt-4 text-[11px] text-text-muted">
          Deals sitting 7+ days go amber, 14+ days go red — same urgency coding as the pipeline board.
        </p>
      </div>
    </div>
  );
}
