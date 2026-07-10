import { addDays, format, isBefore, isToday, parseISO, startOfDay } from "date-fns";
import { cn } from "@/lib/utils";
import { EMAIL_FRAMEWORKS } from "@/lib/constants";
import type { OutreachSequence } from "@/types/database";

export function SequenceTimeline({
  seq,
  gaps = [0, 3, 7, 14],
}: {
  seq: OutreachSequence;
  gaps?: number[];
}) {
  const base = seq.email_1_sent_at ? parseISO(seq.email_1_sent_at) : null;
  const today = startOfDay(new Date());
  const sent = [seq.email_1_sent_at, seq.email_2_sent_at, seq.email_3_sent_at, seq.email_4_sent_at];

  return (
    <div className="flex items-center">
      {sent.map((sentAt, i) => {
        const due = base ? startOfDay(addDays(base, gaps[i])) : null;
        const isSent = !!sentAt;
        const isDueToday = !isSent && due && isToday(due);
        const isOverdue = !isSent && due && isBefore(due, today);
        return (
          <div key={i} className="flex items-center">
            {i > 0 && (
              <div className={cn("h-px w-6 sm:w-9", isSent ? "bg-indigo-500" : "bg-white/10")} />
            )}
            <div className="flex flex-col items-center" title={`Email ${i + 1} — ${EMAIL_FRAMEWORKS[i]}`}>
              <span
                className={cn(
                  "flex h-3.5 w-3.5 items-center justify-center rounded-full border text-[8px]",
                  isSent
                    ? "border-indigo-400 bg-indigo-500"
                    : isOverdue
                      ? "border-red-500 bg-red-500/20"
                      : isDueToday
                        ? "border-amber-400 bg-amber-500/20 pulse-soft"
                        : "border-white/20 bg-transparent",
                )}
              />
              <span className="mt-0.5 font-mono text-[9px] text-text-muted">
                {isSent
                  ? format(parseISO(sentAt!), "d/M")
                  : due
                    ? format(due, "d/M")
                    : EMAIL_FRAMEWORKS[i]}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
