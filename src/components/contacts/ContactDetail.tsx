import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Pencil, Mail, Phone, Linkedin, Globe, Rocket, Handshake, ListTodo, Trash2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ContactTypeBadge, StageBadge, SequenceStatusBadge, PriorityBadge } from "@/components/shared/StatusBadge";
import { ContactForm } from "./ContactForm";
import { DealForm } from "@/components/pipeline/DealForm";
import { TaskForm } from "@/components/shared/TaskForm";
import { useUpdateContact, useDeleteContact } from "@/lib/queries/contacts";
import { useDeals } from "@/lib/queries/deals";
import { useSequences, useCreateSequence } from "@/lib/queries/sequences";
import { useTasks } from "@/lib/queries/tasks";
import { GEOGRAPHY_LABELS, EMAIL_FRAMEWORKS } from "@/lib/constants";
import { titleCase, formatINR } from "@/lib/utils";
import type { Contact } from "@/types/database";

export function ContactDetail({
  contact,
  onClose,
}: {
  contact: Contact | null;
  onClose: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [dealOpen, setDealOpen] = useState(false);
  const [taskOpen, setTaskOpen] = useState(false);
  const [notes, setNotes] = useState<string | null>(null);
  const updateContact = useUpdateContact();
  const deleteContact = useDeleteContact();
  const createSequence = useCreateSequence();
  const { data: deals } = useDeals();
  const { data: sequences } = useSequences();
  const { data: tasks } = useTasks();

  const contactDeals = (deals ?? []).filter((d) => d.contact_id === contact?.id);
  const contactSeqs = (sequences ?? []).filter((s) => s.contact_id === contact?.id);
  const contactTasks = (tasks ?? []).filter(
    (t) => t.contact_id === contact?.id && t.status !== "done" && t.status !== "cancelled",
  );

  function startSequence() {
    if (!contact) return;
    createSequence.mutate({
      contact_id: contact.id,
      sequence_status: "email_1_sent",
      email_1_sent_at: new Date().toISOString(),
      next_action: "Send Email 2",
    });
  }

  return (
    <AnimatePresence>
      {contact && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="fixed inset-y-0 right-0 z-50 w-full max-w-lg overflow-y-auto border-l border-white/10 bg-surface p-6"
          >
            <div className="mb-5 flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold">{contact.company_name}</h2>
                <p className="text-sm text-text-secondary">
                  {contact.first_name} {contact.last_name ?? ""}
                  {contact.title ? ` · ${contact.title}` : ""}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <ContactTypeBadge type={contact.contact_type} />
                  <Badge color="grey">{GEOGRAPHY_LABELS[contact.geography]}</Badge>
                  <Badge color="grey">{titleCase(contact.source)}</Badge>
                  {contact.industry && <Badge color="indigo">{contact.industry}</Badge>}
                  {contact.icp_score != null && (
                    <Badge color={contact.icp_score >= 70 ? "green" : contact.icp_score >= 40 ? "amber" : "grey"}>
                      ICP {contact.icp_score}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" onClick={() => setEditing(true)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Contact info */}
            <div className="mb-5 space-y-1.5 text-sm">
              {contact.email && (
                <div className="flex items-center gap-2 text-text-secondary">
                  <Mail className="h-3.5 w-3.5 text-text-muted" /> {contact.email}
                </div>
              )}
              {contact.phone && (
                <div className="flex items-center gap-2 text-text-secondary">
                  <Phone className="h-3.5 w-3.5 text-text-muted" /> {contact.phone}
                </div>
              )}
              {contact.linkedin_url && (
                <div className="flex items-center gap-2 text-text-secondary">
                  <Linkedin className="h-3.5 w-3.5 text-text-muted" /> {contact.linkedin_url}
                </div>
              )}
              {contact.company_website && (
                <div className="flex items-center gap-2 text-text-secondary">
                  <Globe className="h-3.5 w-3.5 text-text-muted" /> {contact.company_website}
                </div>
              )}
              {contact.products && contact.products.length > 0 && (
                <div className="pt-1 text-xs text-text-muted">
                  Products: {contact.products.join(", ")}
                </div>
              )}
            </div>

            {/* Quick actions */}
            <div className="mb-6 flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" onClick={startSequence} disabled={contactSeqs.length > 0}>
                <Rocket className="h-3.5 w-3.5" /> {contactSeqs.length > 0 ? "Sequence Running" : "Start Sequence"}
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setDealOpen(true)}>
                <Handshake className="h-3.5 w-3.5" /> Create Deal
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setTaskOpen(true)}>
                <ListTodo className="h-3.5 w-3.5" /> Add Task
              </Button>
            </div>

            {/* Outreach timeline */}
            <section className="mb-6">
              <h3 className="caption-label mb-2">Outreach History</h3>
              {contactSeqs.length === 0 ? (
                <p className="text-xs text-text-muted">No sequence started yet.</p>
              ) : (
                contactSeqs.map((seq) => (
                  <div key={seq.id} className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <SequenceStatusBadge status={seq.sequence_status} />
                      {seq.campaigns && <span className="text-xs text-text-muted">{seq.campaigns.name}</span>}
                    </div>
                    <div className="space-y-1 font-mono text-xs">
                      {([1, 2, 3, 4] as const).map((n) => {
                        const sentAt = seq[`email_${n}_sent_at`];
                        return (
                          <div key={n} className="flex justify-between">
                            <span className="text-text-secondary">
                              Email {n} ({EMAIL_FRAMEWORKS[n - 1]})
                            </span>
                            <span className={sentAt ? "text-emerald-400" : "text-text-muted"}>
                              {sentAt ? `✓ ${format(parseISO(sentAt), "MMM d")}` : "○ pending"}
                            </span>
                          </div>
                        );
                      })}
                      {seq.replied_at && (
                        <div className="flex justify-between border-t border-white/5 pt-1">
                          <span className="text-text-secondary">Replied ({seq.reply_type})</span>
                          <span className="text-cyan-400">{format(parseISO(seq.replied_at), "MMM d")}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </section>

            {/* Deals */}
            <section className="mb-6">
              <h3 className="caption-label mb-2">Deals</h3>
              {contactDeals.length === 0 ? (
                <p className="text-xs text-text-muted">No deals yet.</p>
              ) : (
                <div className="space-y-2">
                  {contactDeals.map((d) => (
                    <div key={d.id} className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] p-3">
                      <div>
                        <div className="text-sm font-medium">{d.deal_name}</div>
                        <div className="font-mono text-xs text-text-muted">
                          {d.deal_value != null ? formatINR(Number(d.deal_value)) : "—"}
                        </div>
                      </div>
                      <StageBadge stage={d.stage} />
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Tasks */}
            <section className="mb-6">
              <h3 className="caption-label mb-2">Open Tasks</h3>
              {contactTasks.length === 0 ? (
                <p className="text-xs text-text-muted">No open tasks.</p>
              ) : (
                <div className="space-y-2">
                  {contactTasks.map((t) => (
                    <div key={t.id} className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] p-3">
                      <div>
                        <div className="text-sm">{t.title}</div>
                        {t.due_date && (
                          <div className="font-mono text-xs text-text-muted">
                            due {format(parseISO(t.due_date), "MMM d")}
                          </div>
                        )}
                      </div>
                      <PriorityBadge priority={t.priority} />
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Notes */}
            <section className="mb-6">
              <h3 className="caption-label mb-2">Notes</h3>
              <Textarea
                value={notes ?? contact.notes ?? ""}
                onChange={(e) => setNotes(e.target.value)}
                onBlur={() => {
                  if (notes !== null && notes !== contact.notes) {
                    updateContact.mutate({ id: contact.id, notes });
                  }
                }}
                placeholder="Context, decision-makers, ROI anchors..."
                className="min-h-28"
              />
            </section>

            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                if (confirm(`Delete ${contact.company_name}? This removes their deals and sequences too.`)) {
                  deleteContact.mutate(contact.id);
                  onClose();
                }
              }}
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete Contact
            </Button>
          </motion.aside>

          <Dialog open={editing} onOpenChange={setEditing}>
            <DialogContent>
              <DialogTitle>Edit Contact</DialogTitle>
              <ContactForm contact={contact} onDone={() => setEditing(false)} />
            </DialogContent>
          </Dialog>
          <Dialog open={dealOpen} onOpenChange={setDealOpen}>
            <DialogContent>
              <DialogTitle>New Deal — {contact.company_name}</DialogTitle>
              <DealForm onDone={() => setDealOpen(false)} />
            </DialogContent>
          </Dialog>
          <Dialog open={taskOpen} onOpenChange={setTaskOpen}>
            <DialogContent>
              <DialogTitle>New Task — {contact.company_name}</DialogTitle>
              <TaskForm contactId={contact.id} onDone={() => setTaskOpen(false)} />
            </DialogContent>
          </Dialog>
        </>
      )}
    </AnimatePresence>
  );
}
