import { useState } from "react";
import { Kanban, Plus, List } from "lucide-react";
import { isSameMonth, parseISO } from "date-fns";
import { useDeals } from "@/lib/queries/deals";
import { KanbanBoard } from "@/components/pipeline/KanbanBoard";
import { DealForm } from "@/components/pipeline/DealForm";
import { EmptyState } from "@/components/shared/EmptyState";
import { StageBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { STAGE_PROBABILITY } from "@/lib/constants";
import { formatINR, cn, daysSince } from "@/lib/utils";
import type { DealWithContact } from "@/types/database";

export function PipelinePage() {
  const { data: deals, isLoading } = useDeals();
  const [addOpen, setAddOpen] = useState(false);
  const [mobileList, setMobileList] = useState(true);
  const [editDeal, setEditDeal] = useState<DealWithContact | null>(null);

  const open = (deals ?? []).filter((d) => !["won", "lost", "stalled"].includes(d.stage));
  const totalValue = open.reduce((s, d) => s + Number(d.deal_value ?? 0), 0);
  const weighted = open.reduce(
    (s, d) => s + Number(d.deal_value ?? 0) * STAGE_PROBABILITY[d.stage],
    0,
  );
  const expectedThisMonth = open
    .filter((d) => d.expected_close_date && isSameMonth(parseISO(d.expected_close_date), new Date()))
    .reduce((s, d) => s + Number(d.deal_value ?? 0) * STAGE_PROBABILITY[d.stage], 0);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight">Pipeline</h1>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            className="md:hidden"
            onClick={() => setMobileList((v) => !v)}
          >
            {mobileList ? <Kanban className="h-4 w-4" /> : <List className="h-4 w-4" />}
          </Button>
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4" /> New Deal
          </Button>
        </div>
      </div>

      {/* Summary bar */}
      <div className="glass-card gradient-accent grid grid-cols-1 divide-y divide-white/5 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <div className="p-4">
          <div className="caption-label">Total Pipeline</div>
          <div className="mt-1 font-mono text-xl font-bold">{formatINR(totalValue)}</div>
        </div>
        <div className="p-4">
          <div className="caption-label">Weighted Pipeline</div>
          <div className="mt-1 font-mono text-xl font-bold text-indigo-300">{formatINR(Math.round(weighted))}</div>
        </div>
        <div className="p-4">
          <div className="caption-label">Expected This Month</div>
          <div className="mt-1 font-mono text-xl font-bold text-cyan-300">{formatINR(Math.round(expectedThisMonth))}</div>
        </div>
      </div>

      {(deals ?? []).length === 0 ? (
        <EmptyState
          icon={Kanban}
          title="Pipeline is empty"
          description="Every deal starts as an identified prospect. Create your first deal and drag it through the stages as it progresses."
          actionLabel="Create First Deal"
          onAction={() => setAddOpen(true)}
        />
      ) : (
        <>
          {/* Mobile: list view */}
          <div className={cn("space-y-2 md:hidden", !mobileList && "hidden")}>
            {(deals ?? []).map((d) => (
              <button
                key={d.id}
                onClick={() => setEditDeal(d)}
                className="glass-card flex w-full items-center justify-between p-3 text-left"
              >
                <div>
                  <div className="text-sm font-semibold">{d.contacts?.company_name ?? d.deal_name}</div>
                  <div className="font-mono text-xs text-text-muted">
                    {d.deal_value != null ? formatINR(Number(d.deal_value), true) : "—"} · {daysSince(d.stage_changed_at)}d in stage
                  </div>
                </div>
                <StageBadge stage={d.stage} />
              </button>
            ))}
          </div>
          {/* Desktop: kanban (also mobile if toggled) */}
          <div className={cn("hidden md:block", !mobileList && "block")}>
            <KanbanBoard deals={deals ?? []} />
          </div>
        </>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogTitle>New Deal</DialogTitle>
          <DealForm onDone={() => setAddOpen(false)} />
        </DialogContent>
      </Dialog>
      {editDeal && (
        <Dialog open onOpenChange={(o) => !o && setEditDeal(null)}>
          <DialogContent>
            <DialogTitle>Edit Deal — {editDeal.deal_name}</DialogTitle>
            <DealForm deal={editDeal} onDone={() => setEditDeal(null)} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
