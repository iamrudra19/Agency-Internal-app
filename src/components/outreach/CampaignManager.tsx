import { useState } from "react";
import { useForm } from "react-hook-form";
import { Plus, Megaphone, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useCreateCampaign, useUpdateCampaign, useCreateSequence } from "@/lib/queries/sequences";
import { useContacts } from "@/lib/queries/contacts";
import { titleCase } from "@/lib/utils";
import type { Campaign, CampaignStatus, OutreachSequenceWithContact } from "@/types/database";

function campaignStats(campaignId: string, sequences: OutreachSequenceWithContact[]) {
  const seqs = sequences.filter((s) => s.campaign_id === campaignId);
  const totalSent = seqs.reduce(
    (n, s) =>
      n +
      [s.email_1_sent_at, s.email_2_sent_at, s.email_3_sent_at, s.email_4_sent_at].filter(Boolean).length,
    0,
  );
  const replied = seqs.filter((s) => s.replied_at).length;
  const positive = seqs.filter((s) => s.reply_type === "positive").length;
  const bounced = seqs.filter((s) => s.sequence_status === "bounced").length;
  const reached = seqs.filter((s) => s.email_1_sent_at).length;
  return {
    prospects: seqs.length,
    totalSent,
    replyRate: reached ? (replied / reached) * 100 : 0,
    positiveRate: reached ? (positive / reached) * 100 : 0,
    bounceRate: reached ? (bounced / reached) * 100 : 0,
  };
}

const STATUS_COLOR: Record<CampaignStatus, "grey" | "green" | "amber" | "indigo"> = {
  draft: "grey",
  active: "green",
  paused: "amber",
  completed: "indigo",
};

export function CampaignManager({
  campaigns,
  sequences,
}: {
  campaigns: Campaign[];
  sequences: OutreachSequenceWithContact[];
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [assignTo, setAssignTo] = useState<Campaign | null>(null);
  const createCampaign = useCreateCampaign();
  const updateCampaign = useUpdateCampaign();
  const createSequence = useCreateSequence();
  const { data: contacts } = useContacts();

  const { register, handleSubmit, reset } = useForm<{
    name: string;
    target_geography: string;
    target_industry: string;
    start_date: string;
  }>();

  const inSequence = new Set(sequences.map((s) => s.contact_id));
  const assignable = (contacts ?? []).filter(
    (c) => ["prospect", "lead"].includes(c.contact_type) && !inSequence.has(c.id),
  );
  const [selectedContact, setSelectedContact] = useState("");

  return (
    <div className="glass-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold">Campaigns</h2>
        <Button size="sm" variant="secondary" onClick={() => setCreateOpen(true)}>
          <Plus className="h-3.5 w-3.5" /> New Campaign
        </Button>
      </div>

      {campaigns.length === 0 ? (
        <div className="flex flex-col items-center py-8 text-center">
          <Megaphone className="mb-2 h-6 w-6 text-indigo-400" strokeWidth={1.25} />
          <p className="text-sm text-text-secondary">
            Group prospects into batches — "Gujarat Manufacturers Batch 1" — and track reply rates per batch.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {campaigns.map((c) => {
            const stats = campaignStats(c.id, sequences);
            return (
              <div key={c.id} className="rounded-lg border border-white/5 bg-white/[0.02] p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">{c.name}</span>
                  <div className="flex items-center gap-2">
                    <Select
                      value={c.status}
                      onChange={(e) => updateCampaign.mutate({ id: c.id, status: e.target.value as CampaignStatus })}
                      className="h-7 w-28 text-xs"
                    >
                      {(["draft", "active", "paused", "completed"] as const).map((s) => (
                        <option key={s} value={s}>{titleCase(s)}</option>
                      ))}
                    </Select>
                    <Badge color={STATUS_COLOR[c.status]} pulse={c.status === "active"}>
                      {titleCase(c.status)}
                    </Badge>
                  </div>
                </div>
                {(c.target_geography || c.target_industry) && (
                  <div className="mt-1 text-xs text-text-muted">
                    {[c.target_geography, c.target_industry].filter(Boolean).join(" · ")}
                  </div>
                )}
                <div className="mt-3 grid grid-cols-5 gap-2 font-mono text-center text-xs">
                  <div>
                    <div className="text-base font-bold text-text-primary">{stats.prospects}</div>
                    <div className="caption-label !text-[9px]">Prospects</div>
                  </div>
                  <div>
                    <div className="text-base font-bold text-text-primary">{stats.totalSent}</div>
                    <div className="caption-label !text-[9px]">Sent</div>
                  </div>
                  <div>
                    <div className="text-base font-bold text-cyan-300">{stats.replyRate.toFixed(1)}%</div>
                    <div className="caption-label !text-[9px]">Reply</div>
                  </div>
                  <div>
                    <div className="text-base font-bold text-emerald-300">{stats.positiveRate.toFixed(1)}%</div>
                    <div className="caption-label !text-[9px]">Positive</div>
                  </div>
                  <div>
                    <div className="text-base font-bold text-red-300">{stats.bounceRate.toFixed(1)}%</div>
                    <div className="caption-label !text-[9px]">Bounce</div>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="mt-3"
                  onClick={() => setAssignTo(c)}
                >
                  <UserPlus className="h-3.5 w-3.5" /> Assign prospects
                </Button>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogTitle>New Campaign</DialogTitle>
          <form
            onSubmit={handleSubmit((v) => {
              createCampaign.mutate({
                name: v.name,
                status: "active",
                target_geography: v.target_geography || null,
                target_industry: v.target_industry || null,
                start_date: v.start_date || null,
              });
              reset();
              setCreateOpen(false);
            })}
            className="space-y-4"
          >
            <div>
              <Label>Name *</Label>
              <Input {...register("name", { required: true })} placeholder="Gujarat Manufacturers Batch 1" autoFocus />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Target Geography</Label>
                <Input {...register("target_geography")} placeholder="Ahmedabad" />
              </div>
              <div>
                <Label>Target Industry</Label>
                <Input {...register("target_industry")} placeholder="tiles/ceramics" />
              </div>
            </div>
            <div>
              <Label>Start Date</Label>
              <Input {...register("start_date")} type="date" />
            </div>
            <div className="flex justify-end">
              <Button type="submit">Create Campaign</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!assignTo} onOpenChange={(o) => !o && setAssignTo(null)}>
        <DialogContent>
          <DialogTitle>Assign Prospect — {assignTo?.name}</DialogTitle>
          <DialogDescription>
            Starts a new 4-email sequence in this campaign for the chosen contact.
          </DialogDescription>
          <div className="space-y-4">
            <Select value={selectedContact} onChange={(e) => setSelectedContact(e.target.value)}>
              <option value="">Select prospect...</option>
              {assignable.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.company_name} — {c.first_name} {c.last_name ?? ""}
                </option>
              ))}
            </Select>
            <div className="flex justify-end">
              <Button
                disabled={!selectedContact}
                onClick={() => {
                  if (!assignTo || !selectedContact) return;
                  createSequence.mutate({
                    contact_id: selectedContact,
                    campaign_id: assignTo.id,
                    sequence_status: "not_started",
                    next_action: "Send Email 1 (PAS)",
                  });
                  setSelectedContact("");
                  setAssignTo(null);
                }}
              >
                Add to Campaign
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
