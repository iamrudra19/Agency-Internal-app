import { useMemo } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { eachDayOfInterval, format, isSameMonth, parseISO, subDays } from "date-fns";
import type { DailyActivity } from "@/types/database";
import { formatINR } from "@/lib/utils";

function Sparkline({
  title,
  data,
  dataKey,
  color,
  valueFormatter = (v: number) => String(v),
}: {
  title: string;
  data: Record<string, unknown>[];
  dataKey: string;
  color: string;
  valueFormatter?: (v: number) => string;
}) {
  return (
    <div className="glass-card glass-card-hover p-4">
      <div className="caption-label mb-2">{title}</div>
      <ResponsiveContainer width="100%" height={70}>
        <AreaChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`grad-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.3} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="day" hide />
          <Tooltip
            contentStyle={{
              background: "#1A1A25",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 8,
              fontSize: 12,
              fontFamily: "JetBrains Mono, monospace",
            }}
            labelStyle={{ color: "#94A3B8" }}
            formatter={(v) => [valueFormatter(Number(v)), title]}
          />
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={2}
            fill={`url(#grad-${dataKey})`}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function WeeklyTrend({ activity }: { activity: DailyActivity[] }) {
  const { last7, cumulative } = useMemo(() => {
    const days = eachDayOfInterval({ start: subDays(new Date(), 6), end: new Date() });
    const byDate = new Map(activity.map((a) => [a.log_date, a]));
    const last7 = days.map((d) => {
      const key = format(d, "yyyy-MM-dd");
      const a = byDate.get(key);
      return {
        day: format(d, "EEE"),
        emails: a?.emails_sent ?? 0,
        replies: a?.replies_received ?? 0,
      };
    });
    let running = 0;
    const now = new Date();
    const cumulative = activity
      .filter((a) => isSameMonth(parseISO(a.log_date), now))
      .map((a) => {
        running += Number(a.revenue_closed);
        return { day: format(parseISO(a.log_date), "d MMM"), revenue: running };
      });
    return { last7, cumulative: cumulative.length ? cumulative : [{ day: "—", revenue: 0 }] };
  }, [activity]);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <Sparkline title="Emails / Day (7d)" data={last7} dataKey="emails" color="#6366F1" />
      <Sparkline title="Replies / Day (7d)" data={last7} dataKey="replies" color="#22D3EE" />
      <Sparkline
        title="Revenue (Month, Cumulative)"
        data={cumulative}
        dataKey="revenue"
        color="#10B981"
        valueFormatter={(v) => formatINR(v)}
      />
    </div>
  );
}
