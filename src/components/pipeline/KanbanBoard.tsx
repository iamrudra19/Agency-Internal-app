import { useState } from "react";
import {
  DndContext,
  useDroppable,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { DealCard } from "./DealCard";
import { DealForm } from "./DealForm";
import { useUpdateDeal } from "@/lib/queries/deals";
import { PIPELINE_STAGES, STAGE_LABELS, LOST_REASONS } from "@/lib/constants";
import { cn, titleCase } from "@/lib/utils";
import type { DealWithContact, DealStage, PaymentStatus } from "@/types/database";

function Column({
  stage,
  deals,
  onCardClick,
}: {
  stage: DealStage;
  deals: DealWithContact[];
  onCardClick: (d: DealWithContact) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex w-64 shrink-0 flex-col rounded-xl border border-white/5 bg-surface/60 transition-colors",
        isOver && "border-indigo-500/40 bg-indigo-500/5",
      )}
    >
      <div className="flex items-center justify-between px-3 py-2.5">
        <span className="caption-label">{STAGE_LABELS[stage]}</span>
        <span className="font-mono text-xs text-text-muted">{deals.length}</span>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-2 pt-0 min-h-24">
        {deals.map((d) => (
          <DealCard key={d.id} deal={d} onClick={() => onCardClick(d)} />
        ))}
      </div>
    </div>
  );
}

function WonDialog({
  deal,
  onClose,
}: {
  deal: DealWithContact | null;
  onClose: () => void;
}) {
  const updateDeal = useUpdateDeal();
  const { register, handleSubmit } = useForm<{
    deal_value: string;
    amount_paid: string;
    payment_status: PaymentStatus;
  }>({
    defaultValues: {
      deal_value: deal?.deal_value != null ? String(deal.deal_value) : "",
      amount_paid: "0",
      payment_status: "unpaid",
    },
  });

  if (!deal) return null;
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogTitle>🎉 Deal Won — {deal.contacts?.company_name}</DialogTitle>
        <DialogDescription>Lock in the value and payment details.</DialogDescription>
        <form
          onSubmit={handleSubmit((v) => {
            updateDeal.mutate({
              id: deal.id,
              stage: "won",
              stage_changed_at: new Date().toISOString(),
              deal_value: v.deal_value ? Number(v.deal_value) : deal.deal_value,
              amount_paid: Number(v.amount_paid) || 0,
              payment_status: v.payment_status,
              project_status: "not_started",
            });
            onClose();
          })}
          className="space-y-4"
        >
          <div>
            <Label>Final Deal Value (₹)</Label>
            <Input type="number" {...register("deal_value")} autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Amount Paid (₹)</Label>
              <Input type="number" {...register("amount_paid")} />
            </div>
            <div>
              <Label>Payment Status</Label>
              <Select {...register("payment_status")}>
                {(["unpaid", "partial", "paid"] as const).map((p) => (
                  <option key={p} value={p}>{titleCase(p)}</option>
                ))}
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="success">Confirm Won</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function LostDialog({
  deal,
  onClose,
}: {
  deal: DealWithContact | null;
  onClose: () => void;
}) {
  const updateDeal = useUpdateDeal();
  const { register, handleSubmit } = useForm<{ lost_reason: string }>({
    defaultValues: { lost_reason: "went_silent" },
  });

  if (!deal) return null;
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogTitle>Deal Lost — {deal.contacts?.company_name}</DialogTitle>
        <DialogDescription>Why did it slip? This feeds your drop-off analysis.</DialogDescription>
        <form
          onSubmit={handleSubmit((v) => {
            updateDeal.mutate({
              id: deal.id,
              stage: "lost",
              stage_changed_at: new Date().toISOString(),
              lost_reason: v.lost_reason,
            });
            onClose();
          })}
          className="space-y-4"
        >
          <div>
            <Label>Lost Reason</Label>
            <Select {...register("lost_reason")}>
              {LOST_REASONS.map((r) => (
                <option key={r} value={r}>{titleCase(r)}</option>
              ))}
            </Select>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="danger">Mark Lost</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function KanbanBoard({ deals }: { deals: DealWithContact[] }) {
  const updateDeal = useUpdateDeal();
  const [wonDeal, setWonDeal] = useState<DealWithContact | null>(null);
  const [lostDeal, setLostDeal] = useState<DealWithContact | null>(null);
  const [editDeal, setEditDeal] = useState<DealWithContact | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const deal = deals.find((d) => d.id === active.id);
    const newStage = over.id as DealStage;
    if (!deal || deal.stage === newStage) return;

    if (newStage === "won") {
      setWonDeal(deal);
      return;
    }
    if (newStage === "lost") {
      setLostDeal(deal);
      return;
    }
    updateDeal.mutate({
      id: deal.id,
      stage: newStage,
      stage_changed_at: new Date().toISOString(),
    });
  }

  return (
    <>
      <DndContext sensors={sensors} onDragEnd={onDragEnd}>
        <div className="-mx-4 overflow-x-auto px-4 pb-4 md:-mx-8 md:px-8">
          <div className="flex min-w-max gap-3">
            {PIPELINE_STAGES.map((stage) => (
              <Column
                key={stage}
                stage={stage}
                deals={deals.filter((d) => d.stage === stage)}
                onCardClick={setEditDeal}
              />
            ))}
          </div>
        </div>
      </DndContext>

      <WonDialog deal={wonDeal} onClose={() => setWonDeal(null)} />
      <LostDialog deal={lostDeal} onClose={() => setLostDeal(null)} />
      {editDeal && (
        <Dialog open onOpenChange={(o) => !o && setEditDeal(null)}>
          <DialogContent>
            <DialogTitle>Edit Deal — {editDeal.deal_name}</DialogTitle>
            <DealForm deal={editDeal} onDone={() => setEditDeal(null)} />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
