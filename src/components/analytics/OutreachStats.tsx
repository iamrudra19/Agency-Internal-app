import { useMemo } from "react";
import {
  Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { eachDayOfInterval, format, getDay, parseISO, subDays } from "date-fns";
import type { DailyActivity, OutreachSequenceWithContact, Campaign } from "@/types/database";

const tooltipStyle = {
  background: "#1A1A25",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 8,
  fontSize: 12,
  fontFamily: "JetBrains Mono, monospace",
} as const;

const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function OutreachStats({
  activity,
  sequences,
  campaigns,
}: {
  activity: DailyActivity[];
  sequences: OutreachSequenceWithContact[];
  campaigns: Campaign[];
}) {
  const daily = useMemo(() => {
    const days = eachDayOfInterval({ start: subDays(new Date(), 29), end: new Date() });
    const byDate = new Map(activity.map((a) => [a.log_date, a]));
    return days.map((d) => {
      const a = byDate.get(format(d, "yyyy-MM-dd"));
      const emails = a?.emails_sent ?? 0;
      return {
        day: format(d, "d/M"),
        E1: a?.email_1_sent ?? 0,
        E2: a?.email_2_sent ?? 0,
        E3: a?.email_3_sent ?? 0,
        E4: a?.email_4_sent ?? 0,
        replyRate: emails > 0 ? ((a?.replies_received ?? 0) / emails) * 100 : null,
      };
    });
  }, [activity]);

  const bestDow = useMemo(() => {
    const buckets = new Map<number, { replies: number; days: number }>();
    for (const a of activity) {
      if (a.replies_received === 0 && a.emails_sent === 0) continue;
      const dow = getDay(parseISO(a.log_date));
      const b = buckets.get(dow) ?? { replies: 0, days: 0 };
      b.replies += a.replies_received;
      b.days += 1;
      buckets.set(dow, b);
    }
    let best: { dow: number; avg: number } | null = null;
    for (const [dow, b] of buckets) {
      const avg = b.replies / b.days;
      if (!best || avg > best.avg) best = { dow, avg };
    }
    return best;
  }, [activity]);

  const campaignRows = useMemo(() => {
    return campaigns.map((c) => {
      const seqs = sequences.filter((s) => s.campaign_id === c.id);
      const reached = seqs.filter((s) => s.email_1_sent_at).length;
      const sent = seqs.reduce(
        (n, s) => n + [s.email_1_sent_at, s.email_2_sent_at, s.email_3_sent_at, s.email_4_sent_at].filter(Boolean).length,
        0,
      );
      const replied = seqs.filter((s) => s.replied_at).length;
      const positive = seqs.filter((s) => s.reply_type === "positive").length;
      return {
        name: c.name,
        prospects: seqs.length,
        sent,
        replyRate: reached ? (replied / reached) * 100 : 0,
        positiveRate: reached ? (positive / reached) * 100 : 0,
      };
    });
  }, [campaigns, sequences]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="glass-card p-6">
          <div className="caption-label mb-4">Daily Email Volume (30d, stacked by step)</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={daily}>
              <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="day" tick={{ fill: "#64748B", fontSize: 9 }} axisLine={false} tickLine={false} interval={4} />
              <YAxis tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} width={28} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(99,102,241,0.05)" }} />
              <Bar dataKey="E1" stackId="a" fill="#6366F1" />
              <Bar dataKey="E2" stackId="a" fill="#818CF8" />
              <Bar dataKey="E3" stackId="a" fill="#22D3EE" />
              <Bar dataKey="E4" stackId="a" fill="#67E8F9" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <span className="caption-label">Reply Rate Trend (30d)</span>
            {bestDow && (
              <span className="text-xs text-text-secondary">
                Best day: <span className="font-mono text-cyan-300">{DOW[bestDow.dow]}</span>
                <span className="font-mono text-text-muted"> ({bestDow.avg.toFixed(1)} replies avg)</span>
              </span>
            )}
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={daily}>
              <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="day" tick={{ fill: "#64748B", fontSize: 9 }} axisLine={false} tickLine={false} interval={4} />
              <YAxis tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} width={32} unit="%" />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${Number(v).toFixed(1)}%`, "Reply rate"]} />
              <Line dataKey="replyRate" stroke="#22D3EE" strokeWidth={2} dot={false} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {campaignRows.length > 0 && (
        <div className="glass-card overflow-hidden">
          <div className="caption-label px-6 pt-5 pb-3">Campaign Comparison</div>
          <table className="data-table w-full text-sm">
            <thead>
              <tr className="border-t border-white/5 text-left">
                <th className="caption-label px-6 py-2.5">Campaign</th>
                <th className="caption-label px-4 py-2.5 text-right">Prospects</th>
                <th className="caption-label px-4 py-2.5 text-right">Emails Sent</th>
                <th className="caption-label px-4 py-2.5 text-right">Reply Rate</th>
                <th className="caption-label px-6 py-2.5 text-right">Positive Rate</th>
              </tr>
            </thead>
            <tbody>
              {campaignRows.map((r) => (
                <tr key={r.name} className="border-t border-white/[0.03]">
                  <td className="px-6 py-2.5 font-medium">{r.name}</td>
                  <td className="px-4 py-2.5 text-right font-mono">{r.prospects}</td>
                  <td className="px-4 py-2.5 text-right font-mono">{r.sent}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-cyan-300">{r.replyRate.toFixed(1)}%</td>
                  <td className="px-6 py-2.5 text-right font-mono text-emerald-300">{r.positiveRate.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
