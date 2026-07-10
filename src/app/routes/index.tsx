import { IndianRupee, Mail, Kanban, AlertTriangle } from "lucide-react";
import { format, isToday, parseISO } from "date-fns";
import { useContacts } from "@/lib/queries/contacts";
import { useDeals } from "@/lib/queries/deals";
import { useSequences } from "@/lib/queries/sequences";
import { useTasks } from "@/lib/queries/tasks";
import { useDailyActivity } from "@/lib/queries/activity";
import { useSettings, useRevenueTarget, DEFAULT_SETTINGS } from "@/lib/queries/settings";
import { computeRevenueBridge } from "@/lib/revenue-bridge";
import { RevenueBridge } from "@/components/dashboard/RevenueBridge";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { ActionQueue } from "@/components/dashboard/ActionQueue";
import { WeeklyTrend } from "@/components/dashboard/WeeklyTrend";
import { CountUp } from "@/components/dashboard/CountUp";
import { CardSkeleton, Skeleton } from "@/components/ui/skeleton";
import { formatINR } from "@/lib/utils";

export function DashboardPage() {
  const { data: contacts, isLoading: l1 } = useContacts();
  const { data: deals, isLoading: l2 } = useDeals();
  const { data: sequences, isLoading: l3 } = useSequences();
  const { data: tasks, isLoading: l4 } = useTasks();
  const { data: activity, isLoading: l5 } = useDailyActivity();
  const { data: settings } = useSettings();
  const { data: target } = useRevenueTarget();

  const loading = l1 || l2 || l3 || l4 || l5;

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-56 w-full" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <CardSkeleton /><CardSkeleton /><CardSkeleton /><CardSkeleton />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const s = settings ?? DEFAULT_SETTINGS;
  const bridge = computeRevenueBridge({
    settings: s,
    target: target ?? null,
    contacts: contacts ?? [],
    deals: deals ?? [],
    sequences: sequences ?? [],
    activity: activity ?? [],
  });

  const todayLog = activity?.find((a) => isToday(parseISO(a.log_date)));
  const activePipeline = (deals ?? []).filter((d) =>
    ["replied", "meeting_booked", "proposal_sent", "negotiation"].includes(d.stage),
  );
  const activePipelineValue = activePipeline.reduce((sum, d) => sum + Number(d.deal_value ?? 0), 0);
  const overdueTasks = (tasks ?? []).filter(
    (t) =>
      (t.status === "pending" || t.status === "in_progress") &&
      t.due_date &&
      parseISO(t.due_date) < new Date(new Date().toDateString()),
  );

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between">
        <h1 className="text-xl font-bold tracking-tight">Command Center</h1>
        <span className="font-mono text-xs text-text-muted">{format(new Date(), "EEEE, d MMM yyyy")}</span>
      </div>

      <RevenueBridge bridge={bridge} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="This Month's Revenue" icon={IndianRupee} accent="cyan">
          <div className="font-mono text-2xl font-bold text-cyan-300">
            <CountUp value={bridge.achieved} format={(n) => formatINR(n)} />
          </div>
          <div className="mt-1 text-xs text-text-secondary">
            {Math.round(bridge.pctComplete * 100)}% of {formatINR(bridge.target, true)} ·{" "}
            <span className="font-mono">{bridge.daysRemaining}d</span> remaining
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-700"
              style={{ width: `${Math.min(100, bridge.pctComplete * 100)}%` }}
            />
          </div>
        </MetricCard>

        <MetricCard label="Today's Outreach" icon={Mail} accent="indigo">
          <div className="font-mono text-2xl font-bold">
            <CountUp value={todayLog?.emails_sent ?? 0} />
            <span className="text-sm font-normal text-text-muted"> emails</span>
          </div>
          <div className="mt-1 font-mono text-xs text-text-secondary">
            E1 {todayLog?.email_1_sent ?? 0} · E2 {todayLog?.email_2_sent ?? 0} · E3{" "}
            {todayLog?.email_3_sent ?? 0} · E4 {todayLog?.email_4_sent ?? 0}
          </div>
          <div className="mt-1 text-xs text-text-muted">
            {todayLog?.replies_received ?? 0} replies today
          </div>
        </MetricCard>

        <MetricCard label="Active Pipeline" icon={Kanban} accent="green">
          <div className="font-mono text-2xl font-bold text-emerald-300">
            <CountUp value={activePipelineValue} format={(n) => formatINR(n, true)} />
          </div>
          <div className="mt-1 text-xs text-text-secondary">
            <span className="font-mono">{activePipeline.length}</span> deals from replied → negotiation
          </div>
        </MetricCard>

        <MetricCard label="Overdue Tasks" icon={AlertTriangle} accent={overdueTasks.length > 0 ? "red" : "green"}>
          <div className="font-mono text-2xl font-bold">
            <CountUp value={overdueTasks.length} />
          </div>
          <div className="mt-1 truncate text-xs text-text-secondary">
            {overdueTasks.length > 0 ? `Most urgent: ${overdueTasks[0].title}` : "All caught up"}
          </div>
        </MetricCard>
      </div>

      <ActionQueue
        sequences={sequences ?? []}
        tasks={tasks ?? []}
        contacts={contacts ?? []}
        settings={s}
      />

      <WeeklyTrend activity={activity ?? []} />
    </div>
  );
}
