import { isSameMonth, parseISO } from "date-fns";
import { useContacts } from "@/lib/queries/contacts";
import { useDeals } from "@/lib/queries/deals";
import { useSequences, useCampaigns } from "@/lib/queries/sequences";
import { useDailyActivity } from "@/lib/queries/activity";
import { useSettings, DEFAULT_SETTINGS } from "@/lib/queries/settings";
import { RevenueChart } from "@/components/analytics/RevenueChart";
import { FunnelViz } from "@/components/analytics/FunnelViz";
import { OutreachStats } from "@/components/analytics/OutreachStats";
import { GapCalculator } from "@/components/analytics/GapCalculator";
import { Skeleton } from "@/components/ui/skeleton";

export function AnalyticsPage() {
  const { data: contacts, isLoading: l1 } = useContacts();
  const { data: deals, isLoading: l2 } = useDeals();
  const { data: sequences } = useSequences();
  const { data: campaigns } = useCampaigns();
  const { data: activity } = useDailyActivity();
  const { data: settings } = useSettings();

  if (l1 || l2) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-72 w-full" />
        <Skeleton className="h-56 w-full" />
      </div>
    );
  }

  const s = settings ?? DEFAULT_SETTINGS;
  const now = new Date();
  const achieved = (deals ?? [])
    .filter((d) => d.stage === "won" && isSameMonth(parseISO(d.stage_changed_at), now))
    .reduce((sum, d) => sum + Number(d.deal_value ?? 0), 0);
  const emailsSentThisMonth = (activity ?? [])
    .filter((a) => isSameMonth(parseISO(a.log_date), now))
    .reduce((sum, a) => sum + a.emails_sent, 0);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold tracking-tight">Revenue & Analytics</h1>

      <GapCalculator settings={s} achieved={achieved} emailsSentThisMonth={emailsSentThisMonth} />

      <RevenueChart deals={deals ?? []} settings={s} />

      <FunnelViz contacts={contacts ?? []} deals={deals ?? []} sequences={sequences ?? []} />

      <OutreachStats activity={activity ?? []} sequences={sequences ?? []} campaigns={campaigns ?? []} />
    </div>
  );
}
