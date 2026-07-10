import { useMemo, useState } from "react";
import { isSameMonth, isSameWeek, parseISO, subMonths, subWeeks } from "date-fns";
import { TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DailyActivity } from "@/types/database";

type Period = "week" | "month";

function sumRange(activity: DailyActivity[], period: Period, offset: 0 | 1) {
  const anchor =
    period === "week"
      ? offset === 0 ? new Date() : subWeeks(new Date(), 1)
      : offset === 0 ? new Date() : subMonths(new Date(), 1);
  const inRange = (d: string) =>
    period === "week"
      ? isSameWeek(parseISO(d), anchor, { weekStartsOn: 1 })
      : isSameMonth(parseISO(d), anchor);
  const rows = activity.filter((a) => inRange(a.log_date));
  const sum = (k: keyof DailyActivity) => rows.reduce((s, a) => s + Number(a[k] ?? 0), 0);
  const emails = sum("emails_sent");
  return {
    emails,
    e1: sum("email_1_sent"),
    e2: sum("email_2_sent"),
    e3: sum("email_3_sent"),
    e4: sum("email_4_sent"),
    replies: sum("replies_received"),
    positive: sum("positive_replies"),
    bounces: sum("bounces"),
    replyRate: emails ? (sum("replies_received") / emails) * 100 : 0,
    positiveRate: emails ? (sum("positive_replies") / emails) * 100 : 0,
    bounceRate: emails ? (sum("bounces") / emails) * 100 : 0,
  };
}

function Delta({ now, prev, suffix = "" }: { now: number; prev: number; suffix?: string }) {
  const diff = now - prev;
  if (Math.abs(diff) < 0.05) return <span className="text-xs text-text-muted">flat</span>;
  const up = diff > 0;
  return (
    <span className={cn("inline-flex items-center gap-0.5 font-mono text-xs", up ? "text-emerald-400" : "text-red-400")}>
      {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {up ? "+" : ""}{diff.toFixed(suffix === "%" ? 1 : 0)}{suffix}
    </span>
  );
}

export function OutreachReport({ activity }: { activity: DailyActivity[] }) {
  const [period, setPeriod] = useState<Period>("week");
  const { now, prev } = useMemo(
    () => ({ now: sumRange(activity, period, 0), prev: sumRange(activity, period, 1) }),
    [activity, period],
  );

  const rows = [
    { label: "Total Emails", now: now.emails, prev: prev.emails, detail: `E1 ${now.e1} · E2 ${now.e2} · E3 ${now.e3} · E4 ${now.e4}` },
    { label: "Replies", now: now.replies, prev: prev.replies },
    { label: "Reply Rate", now: now.replyRate, prev: prev.replyRate, pct: true },
    { label: "Positive Rate", now: now.positiveRate, prev: prev.positiveRate, pct: true },
    { label: "Bounce Rate", now: now.bounceRate, prev: prev.bounceRate, pct: true },
  ];

  return (
    <div className="glass-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold">Outreach Report</h2>
        <div className="flex rounded-lg border border-white/10 p-0.5">
          {(["week", "month"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                "cursor-pointer rounded-md px-3 py-1 text-xs transition-colors",
                period === p ? "bg-indigo-500/20 text-indigo-300" : "text-text-muted hover:text-text-secondary",
              )}
            >
              This {p}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {rows.map((r) => (
          <div key={r.label} className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
            <div className="caption-label !text-[10px]">{r.label}</div>
            <div className="mt-1 font-mono text-xl font-bold">
              {r.pct ? `${r.now.toFixed(1)}%` : r.now}
            </div>
            <div className="mt-0.5 flex items-center gap-1">
              <Delta now={r.now} prev={r.prev} suffix={r.pct ? "%" : ""} />
              <span className="text-[10px] text-text-muted">vs last {period}</span>
            </div>
            {r.detail && <div className="mt-1 font-mono text-[10px] text-text-muted">{r.detail}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
