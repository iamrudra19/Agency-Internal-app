import { useState } from "react";
import { Briefcase, IndianRupee, Plus } from "lucide-react";
import { format, parseISO } from "date-fns";
import { useContacts } from "@/lib/queries/contacts";
import { useDeals, useUpdateDeal } from "@/lib/queries/deals";
import { useTasks, useUpdateTask } from "@/lib/queries/tasks";
import { ProjectStatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Input, Textarea, Label } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { TaskForm } from "@/components/shared/TaskForm";
import { CardSkeleton } from "@/components/ui/skeleton";
import { formatINR, titleCase } from "@/lib/utils";
import type { DealWithContact, ProjectStatus, PaymentStatus } from "@/types/database";

const PROJECT_STATUSES: ProjectStatus[] = [
  "not_started", "discovery", "building", "testing", "deployed", "maintenance",
];

function ClientCard({ deal }: { deal: DealWithContact }) {
  const updateDeal = useUpdateDeal();
  const { data: tasks } = useTasks();
  const updateTask = useUpdateTask();
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [taskOpen, setTaskOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [deliverables, setDeliverables] = useState<string | null>(null);

  const value = Number(deal.deal_value ?? 0);
  const paid = Number(deal.amount_paid ?? 0);
  const paidPct = value > 0 ? Math.min(100, (paid / value) * 100) : 0;
  const projectTasks = (tasks ?? []).filter((t) => t.deal_id === deal.id);

  function addPayment() {
    const amt = Number(paymentAmount);
    if (!amt) return;
    const newPaid = paid + amt;
    const status: PaymentStatus = newPaid >= value && value > 0 ? "paid" : "partial";
    updateDeal.mutate({ id: deal.id, amount_paid: newPaid, payment_status: status });
    setPaymentAmount("");
    setPaymentOpen(false);
  }

  return (
    <div className="glass-card glass-card-hover gradient-accent p-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-base font-bold">{deal.contacts?.company_name ?? deal.deal_name}</h3>
          <p className="text-xs text-text-secondary">
            {deal.contacts && `${deal.contacts.first_name} ${deal.contacts.last_name ?? ""}`}
            {deal.contacts?.title ? ` · ${deal.contacts.title}` : ""}
          </p>
          <p className="mt-0.5 text-xs text-text-muted">{deal.deal_name}</p>
        </div>
        <ProjectStatusBadge status={deal.project_status ?? "not_started"} />
      </div>

      <div className="mt-4">
        <div className="flex justify-between font-mono text-xs text-text-secondary">
          <span>{formatINR(paid)} paid</span>
          <span>{formatINR(value)} total</span>
        </div>
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/5">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all duration-700"
            style={{ width: `${paidPct}%` }}
          />
        </div>
        <div className="mt-1 text-right font-mono text-[10px] text-text-muted">
          {paidPct.toFixed(0)}% · {titleCase(deal.payment_status)}
        </div>
      </div>

      {(deal.project_start_date || deal.project_end_date) && (
        <div className="mt-2 font-mono text-xs text-text-muted">
          {deal.project_start_date && `Started ${format(parseISO(deal.project_start_date), "d MMM yy")}`}
          {deal.project_end_date && ` → due ${format(parseISO(deal.project_end_date), "d MMM yy")}`}
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Select
          value={deal.project_status ?? "not_started"}
          onChange={(e) => updateDeal.mutate({ id: deal.id, project_status: e.target.value as ProjectStatus })}
          className="h-8 w-36 text-xs"
        >
          {PROJECT_STATUSES.map((s) => (
            <option key={s} value={s}>{titleCase(s)}</option>
          ))}
        </Select>
        <Button size="sm" variant="secondary" onClick={() => setPaymentOpen(true)}>
          <IndianRupee className="h-3.5 w-3.5" /> Add Payment
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setDetailOpen(true)}>
          Details
        </Button>
      </div>

      {/* Payment dialog */}
      <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
        <DialogContent className="max-w-sm">
          <DialogTitle>Add Payment — {deal.contacts?.company_name}</DialogTitle>
          <DialogDescription>
            {formatINR(paid)} received so far of {formatINR(value)}.
          </DialogDescription>
          <div className="space-y-4">
            <div>
              <Label>Amount (₹)</Label>
              <Input
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="25000"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && addPayment()}
              />
            </div>
            <div className="flex justify-end">
              <Button onClick={addPayment}>Record Payment</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent>
          <DialogTitle>{deal.contacts?.company_name} — {deal.deal_name}</DialogTitle>
          <div className="space-y-5">
            <div>
              <Label>Deliverables / Scope</Label>
              <Textarea
                value={deliverables ?? deal.deliverables ?? ""}
                onChange={(e) => setDeliverables(e.target.value)}
                onBlur={() => {
                  if (deliverables !== null && deliverables !== deal.deliverables) {
                    updateDeal.mutate({ id: deal.id, deliverables });
                  }
                }}
                placeholder="- AI email classification&#10;- Auto-response system&#10;- Live dashboard"
                className="min-h-28"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Start Date</Label>
                <Input
                  type="date"
                  defaultValue={deal.project_start_date ?? ""}
                  onChange={(e) => updateDeal.mutate({ id: deal.id, project_start_date: e.target.value || null })}
                />
              </div>
              <div>
                <Label>Expected End</Label>
                <Input
                  type="date"
                  defaultValue={deal.project_end_date ?? ""}
                  onChange={(e) => updateDeal.mutate({ id: deal.id, project_end_date: e.target.value || null })}
                />
              </div>
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between">
                <Label className="mb-0">Project Tasks</Label>
                <Button size="sm" variant="ghost" onClick={() => setTaskOpen(true)}>
                  <Plus className="h-3 w-3" /> Add
                </Button>
              </div>
              {projectTasks.length === 0 ? (
                <p className="text-xs text-text-muted">No tasks for this project yet.</p>
              ) : (
                <div className="space-y-1.5">
                  {projectTasks.map((t) => (
                    <label key={t.id} className="flex cursor-pointer items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={t.status === "done"}
                        onChange={(e) =>
                          updateTask.mutate({
                            id: t.id,
                            status: e.target.checked ? "done" : "pending",
                            completed_at: e.target.checked ? new Date().toISOString() : null,
                          })
                        }
                        className="accent-indigo-500"
                      />
                      <span className={t.status === "done" ? "text-text-muted line-through" : "text-text-secondary"}>
                        {t.title}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={taskOpen} onOpenChange={setTaskOpen}>
        <DialogContent>
          <DialogTitle>New Project Task</DialogTitle>
          <TaskForm contactId={deal.contact_id ?? undefined} dealId={deal.id} onDone={() => setTaskOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function ClientsPage() {
  const { data: contacts, isLoading: l1 } = useContacts();
  const { data: deals, isLoading: l2 } = useDeals();

  if (l1 || l2) {
    return (
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <CardSkeleton /><CardSkeleton />
      </div>
    );
  }

  const clientIds = new Set((contacts ?? []).filter((c) => c.contact_type === "client").map((c) => c.id));
  const wonDeals = (deals ?? []).filter(
    (d) => d.stage === "won" || (d.contact_id && clientIds.has(d.contact_id)),
  );

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold tracking-tight">Clients & Projects</h1>
      {wonDeals.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No client projects yet"
          description="When a deal is dragged to Won on the pipeline, it shows up here as a live project with payment tracking and deliverables."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {wonDeals.map((d) => (
            <ClientCard key={d.id} deal={d} />
          ))}
        </div>
      )}
    </div>
  );
}
