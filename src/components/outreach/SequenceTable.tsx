import { useMemo, useState } from "react";
import { addDays, format, isBefore, isToday, parseISO, startOfDay, isThisWeek } from "date-fns";
import { Mail, Reply, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { SequenceStatusBadge } from "@/components/shared/StatusBadge";
import { SequenceTimeline } from "./SequenceTimeline";
import { useUpdateSequence } from "@/lib/queries/sequences";
import { cn } from "@/lib/utils";
import type { OutreachSequenceWithContact, Campaign, ReplyType, AppSettings } from "@/types/database";

type DueFilter = "all" | "today" | "week" | "overdue";

function nextStepInfo(seq: OutreachSequenceWithContact, gaps: number[]) {
  if (!seq.email_1_sent_at) return { step: 1 as const, due: null };
  if (["replied_positive", "replied_negative", "bounced", "unsubscribed", "completed"].includes(seq.sequence_status))
    return null;
  const base = parseISO(seq.email_1_sent_at);
  const pending = ([2, 3, 4] as const).find((n) => !seq[`email_${n}_sent_at`]);
  if (!pending) return null;
  return { step: pending, due: startOfDay(addDays(base, gaps[pending - 1])) };
}

export function SequenceTable({
  sequences,
  campaigns,
  settings,
}: {
  sequences: OutreachSequenceWithContact[];
  campaigns: Campaign[];
  settings: AppSettings;
}) {
  const [campaignFilter, setCampaignFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dueFilter, setDueFilter] = useState<DueFilter>("all");
  const updateSequence = useUpdateSequence();
  const gaps = settings.email_gaps?.length === 4 ? settings.email_gaps : [0, 3, 7, 14];
  const today = startOfDay(new Date());

  const filtered = useMemo(() => {
    return sequences.filter((s) => {
      if (campaignFilter && s.campaign_id !== campaignFilter) return false;
      if (statusFilter && s.sequence_status !== statusFilter) return false;
      if (dueFilter !== "all") {
        const info = nextStepInfo(s, gaps);
        if (!info?.due) return false;
        if (dueFilter === "today" && !isToday(info.due)) return false;
        if (dueFilter === "overdue" && !isBefore(info.due, today)) return false;
        if (dueFilter === "week" && !isThisWeek(info.due, { weekStartsOn: 1 })) return false;
      }
      return true;
    });
  }, [sequences, campaignFilter, statusFilter, dueFilter, gaps, today]);

  function markSent(seq: OutreachSequenceWithContact) {
    const info = nextStepInfo(seq, gaps);
    if (!info) return;
    updateSequence.mutate({
      id: seq.id,
      [`email_${info.step}_sent_at`]: new Date().toISOString(),
      sequence_status: `email_${info.step}_sent`,
      next_action: info.step < 4 ? `Send Email ${info.step + 1}` : "Await reply / close out",
    } as never);
  }

  function logReply(seq: OutreachSequenceWithContact, type: ReplyType) {
    updateSequence.mutate({
      id: seq.id,
      replied_at: new Date().toISOString(),
      reply_type: type,
      sequence_status:
        type === "positive" ? "replied_positive" : type === "bounce" ? "bounced" : "replied_negative",
      next_action: type === "positive" ? "Book call" : null,
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Select value={campaignFilter} onChange={(e) => setCampaignFilter(e.target.value)} className="w-48">
          <option value="">All campaigns</option>
          {campaigns.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </Select>
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-44">
          <option value="">All statuses</option>
          {["not_started", "email_1_sent", "email_2_sent", "email_3_sent", "email_4_sent", "replied_positive", "replied_negative", "bounced"].map((s) => (
            <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
          ))}
        </Select>
        <Select value={dueFilter} onChange={(e) => setDueFilter(e.target.value as DueFilter)} className="w-40">
          <option value="all">Any due date</option>
          <option value="today">Due today</option>
          <option value="week">Due this week</option>
          <option value="overdue">Overdue</option>
        </Select>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="max-h-[60vh] overflow-auto">
          <table className="data-table w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-left">
                <th className="caption-label px-4 py-3">Contact</th>
                <th className="caption-label px-4 py-3">Status</th>
                <th className="caption-label px-4 py-3">Sequence (Day 0 · 3 · 7 · 14)</th>
                <th className="caption-label hidden px-4 py-3 lg:table-cell">Next Action</th>
                <th className="caption-label px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((seq) => {
                const info = nextStepInfo(seq, gaps);
                const overdue = info?.due && isBefore(info.due, today);
                const dueToday = info?.due && isToday(info.due);
                const isBounced = seq.sequence_status === "bounced";
                return (
                  <tr key={seq.id} className="border-b border-white/[0.03]">
                    <td className={cn("px-4 py-3", isBounced && "line-through opacity-50")}>
                      <div className="font-medium text-text-primary">
                        {seq.contacts?.company_name ?? "Unknown"}
                      </div>
                      <div className="text-xs text-text-muted">
                        {seq.contacts?.first_name} {seq.contacts?.last_name ?? ""}
                        {seq.campaigns && <span> · {seq.campaigns.name}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <SequenceStatusBadge status={seq.sequence_status} />
                    </td>
                    <td className="px-4 py-3">
                      <SequenceTimeline seq={seq} gaps={gaps} />
                    </td>
                    <td className="hidden px-4 py-3 lg:table-cell">
                      <span
                        className={cn(
                          "text-xs",
                          overdue ? "text-red-400" : dueToday ? "text-amber-400" : "text-text-secondary",
                        )}
                      >
                        {info
                          ? `${seq.next_action ?? `Send Email ${info.step}`}${info.due ? ` · ${format(info.due, "d MMM")}` : ""}`
                          : seq.next_action ?? "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {info && (
                          <Button size="sm" variant="secondary" onClick={() => markSent(seq)} title={`Mark Email ${info.step} sent`}>
                            <Mail className="h-3 w-3" /> E{info.step}
                          </Button>
                        )}
                        {!seq.replied_at && seq.email_1_sent_at && (
                          <>
                            <Button size="sm" variant="success" onClick={() => logReply(seq, "positive")} title="Positive reply">
                              <Reply className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => logReply(seq, "bounce")} title="Bounced">
                              <XCircle className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-text-muted">
                    No sequences match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
