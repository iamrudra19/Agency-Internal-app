import { useMemo, useState } from "react";
import { Calculator } from "lucide-react";
import { Input, Label } from "@/components/ui/input";
import { formatINR, daysRemainingInMonth } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { AppSettings } from "@/types/database";

export function GapCalculator({
  settings,
  achieved,
  emailsSentThisMonth,
}: {
  settings: AppSettings;
  achieved: number;
  emailsSentThisMonth: number;
}) {
  const [target, setTarget] = useState(String(settings.monthly_target));
  const [dealSize, setDealSize] = useState(String(settings.avg_deal_size));
  const [progress, setProgress] = useState(String(achieved));

  const result = useMemo(() => {
    const t = Number(target) || 150000;
    const size = Math.max(1, Number(dealSize) || 50000);
    const done = Number(progress) || 0;
    const remaining = Math.max(0, t - done);
    const days = daysRemainingInMonth();

    const deals = Math.ceil(remaining / size);
    const proposals = Math.ceil(deals / Number(settings.close_rate));
    const meetings = Math.ceil(proposals / Number(settings.proposal_rate));
    const replies = Math.ceil(meetings / Math.max(0.001, Number(settings.meeting_rate)));
    const emails = Math.ceil(replies / Math.max(0.001, Number(settings.positive_reply_rate)));
    const emailsPerDay = Math.ceil(emails / days);
    const meetingsPerWeek = Math.ceil(meetings / Math.max(1, days / 7));

    return { remaining, deals, proposals, meetings, replies, emails, emailsPerDay, meetingsPerWeek, days };
  }, [target, dealSize, progress, settings]);

  const outputs = [
    { label: "Emails / Day", value: result.emailsPerDay, hot: true },
    { label: "Meetings / Week", value: result.meetingsPerWeek },
    { label: "Proposals / Month", value: result.proposals },
    { label: "Deals to Close", value: result.deals },
  ];

  return (
    <div className="glass-card gradient-accent p-6">
      <div className="mb-4 flex items-center gap-2">
        <Calculator className="h-4 w-4 text-indigo-400" />
        <h2 className="text-base font-semibold">The Gap Calculator</h2>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <div>
            <Label>Revenue Target (₹)</Label>
            <Input type="number" value={target} onChange={(e) => setTarget(e.target.value)} className="font-mono" />
          </div>
          <div>
            <Label>Average Deal Size (₹)</Label>
            <Input type="number" value={dealSize} onChange={(e) => setDealSize(e.target.value)} className="font-mono" />
          </div>
          <div>
            <Label>Closed So Far This Month (₹)</Label>
            <Input type="number" value={progress} onChange={(e) => setProgress(e.target.value)} className="font-mono" />
          </div>
          <p className="text-[11px] text-text-muted">
            Uses your conversion assumptions from Settings: close {Math.round(Number(settings.close_rate) * 100)}%, proposal{" "}
            {Math.round(Number(settings.proposal_rate) * 100)}%, meeting {Math.round(Number(settings.meeting_rate) * 100)}%, positive reply{" "}
            {(Number(settings.positive_reply_rate) * 100).toFixed(1)}%.
          </p>
        </div>
        <div>
          <div className="mb-3 rounded-lg border border-indigo-500/20 bg-indigo-500/5 p-4 text-center">
            <div className="caption-label">To close the {formatINR(result.remaining, true)} gap in {result.days} days</div>
            <div className="mt-1 font-mono text-2xl font-bold text-indigo-300">
              Send {result.emailsPerDay} emails/day
            </div>
            <div className="mt-1 text-xs text-text-secondary">
              {emailsSentThisMonth} sent so far this month · {result.emails} more needed
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {outputs.map((o) => (
              <div
                key={o.label}
                className={cn(
                  "rounded-lg border p-3 text-center",
                  o.hot ? "border-cyan-500/25 bg-cyan-500/5" : "border-white/5 bg-white/[0.02]",
                )}
              >
                <div className={cn("font-mono text-xl font-bold", o.hot ? "text-cyan-300" : "text-text-primary")}>
                  {o.value}
                </div>
                <div className="caption-label !text-[10px]">{o.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
