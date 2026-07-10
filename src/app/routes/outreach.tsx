import { Mail } from "lucide-react";
import { useSequences, useCampaigns } from "@/lib/queries/sequences";
import { useDailyActivity } from "@/lib/queries/activity";
import { useSettings, DEFAULT_SETTINGS } from "@/lib/queries/settings";
import { useContacts } from "@/lib/queries/contacts";
import { useCreateSequence } from "@/lib/queries/sequences";
import { DailyLogger } from "@/components/outreach/DailyLogger";
import { SequenceTable } from "@/components/outreach/SequenceTable";
import { CampaignManager } from "@/components/outreach/CampaignManager";
import { OutreachReport } from "@/components/outreach/OutreachReport";
import { EmptyState } from "@/components/shared/EmptyState";
import { TableSkeleton } from "@/components/ui/skeleton";

export function OutreachPage() {
  const { data: sequences, isLoading } = useSequences();
  const { data: campaigns } = useCampaigns();
  const { data: activity } = useDailyActivity();
  const { data: settings } = useSettings();
  const { data: contacts } = useContacts();
  const createSequence = useCreateSequence();

  const inSequence = new Set((sequences ?? []).map((s) => s.contact_id));
  const firstProspect = (contacts ?? []).find(
    (c) => ["prospect", "lead"].includes(c.contact_type) && !inSequence.has(c.id),
  );

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold tracking-tight">Outreach Tracker</h1>

      <DailyLogger />

      {isLoading ? (
        <TableSkeleton rows={6} />
      ) : (sequences ?? []).length === 0 ? (
        <EmptyState
          icon={Mail}
          title="No sequences running"
          description="The 4-email machine (PAS → BAB → AIDA → QVC over 14 days) starts here. Put your first prospect into a sequence."
          actionLabel={firstProspect ? `Start Sequence: ${firstProspect.company_name}` : undefined}
          onAction={
            firstProspect
              ? () =>
                  createSequence.mutate({
                    contact_id: firstProspect.id,
                    sequence_status: "not_started",
                    next_action: "Send Email 1 (PAS)",
                  })
              : undefined
          }
        />
      ) : (
        <SequenceTable
          sequences={sequences ?? []}
          campaigns={campaigns ?? []}
          settings={settings ?? DEFAULT_SETTINGS}
        />
      )}

      <CampaignManager campaigns={campaigns ?? []} sequences={sequences ?? []} />

      <OutreachReport activity={activity ?? []} />
    </div>
  );
}
