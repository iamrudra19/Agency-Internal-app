import { useMemo } from "react";
import {
  Bar, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Cell,
} from "recharts";
import { eachMonthOfInterval, format, isSameMonth, parseISO, subMonths } from "date-fns";
import { formatINR, titleCase } from "@/lib/utils";
import { GEOGRAPHY_LABELS } from "@/lib/constants";
import type { DealWithContact, AppSettings } from "@/types/database";

const tooltipStyle = {
  background: "#1A1A25",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 8,
  fontSize: 12,
  fontFamily: "JetBrains Mono, monospace",
} as const;

export function RevenueChart({
  deals,
  settings,
}: {
  deals: DealWithContact[];
  settings: AppSettings;
}) {
  const monthly = useMemo(() => {
    const months = eachMonthOfInterval({ start: subMonths(new Date(), 5), end: new Date() });
    return months.map((m) => {
      const won = deals.filter(
        (d) => d.stage === "won" && isSameMonth(parseISO(d.stage_changed_at), m),
      );
      return {
        month: format(m, "MMM"),
        revenue: won.reduce((s, d) => s + Number(d.deal_value ?? 0), 0),
        target: Number(settings.monthly_target),
      };
    });
  }, [deals, settings]);

  const bySource = useMemo(() => {
    const map = new Map<string, number>();
    for (const d of deals.filter((d) => d.stage === "won")) {
      const src = d.contacts?.source ?? "other";
      map.set(src, (map.get(src) ?? 0) + Number(d.deal_value ?? 0));
    }
    return [...map.entries()].map(([k, v]) => ({ name: titleCase(k), value: v }));
  }, [deals]);

  const byGeo = useMemo(() => {
    const map = new Map<string, number>();
    for (const d of deals.filter((d) => d.stage === "won")) {
      const geo = d.contacts?.geography ?? "gujarat_other";
      map.set(geo, (map.get(geo) ?? 0) + Number(d.deal_value ?? 0));
    }
    return [...map.entries()].map(([k, v]) => ({
      name: GEOGRAPHY_LABELS[k as keyof typeof GEOGRAPHY_LABELS] ?? k,
      value: v,
    }));
  }, [deals]);

  return (
    <div className="space-y-4">
      <div className="glass-card gradient-accent p-6">
        <div className="caption-label mb-4">Monthly Revenue vs ₹{(Number(settings.monthly_target) / 100000).toFixed(1)}L Target</div>
        <ResponsiveContainer width="100%" height={240}>
          <ComposedChart data={monthly}>
            <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="month" tick={{ fill: "#64748B", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fill: "#64748B", fontSize: 10, fontFamily: "JetBrains Mono" }}
              tickFormatter={(v) => formatINR(v, true)}
              axisLine={false}
              tickLine={false}
              width={52}
            />
            <Tooltip contentStyle={tooltipStyle} formatter={(v) => formatINR(Number(v))} cursor={{ fill: "rgba(99,102,241,0.05)" }} />
            <Bar dataKey="revenue" radius={[6, 6, 0, 0]} maxBarSize={48}>
              {monthly.map((m, i) => (
                <Cell key={i} fill={m.revenue >= m.target ? "#10B981" : "#6366F1"} />
              ))}
            </Bar>
            <Line dataKey="target" stroke="#F59E0B" strokeDasharray="6 4" dot={false} strokeWidth={1.5} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {[{ title: "Revenue by Source", data: bySource }, { title: "Revenue by Geography", data: byGeo }].map(
          ({ title, data }) => (
            <div key={title} className="glass-card p-6">
              <div className="caption-label mb-4">{title}</div>
              {data.length === 0 ? (
                <p className="py-6 text-center text-xs text-text-muted">No won deals yet.</p>
              ) : (
                <div className="space-y-2">
                  {data
                    .sort((a, b) => b.value - a.value)
                    .map((row) => {
                      const max = Math.max(...data.map((d) => d.value));
                      return (
                        <div key={row.name}>
                          <div className="flex justify-between text-xs">
                            <span className="text-text-secondary">{row.name}</span>
                            <span className="font-mono text-text-primary">{formatINR(row.value, true)}</span>
                          </div>
                          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/5">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400"
                              style={{ width: `${(row.value / max) * 100}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          ),
        )}
      </div>
    </div>
  );
}
