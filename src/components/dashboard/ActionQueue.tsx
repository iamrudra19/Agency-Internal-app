import { addDays, format, isBefore, isToday, parseISO, startOfDay } from "date-fns";
import { Check, Clock, Mail, CalendarClock, FileText, AlarmClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/EmptyState";
import { useUpdateSequence } from "@/lib/queries/sequences";
import { useUpdateTask } from "@/lib/queries/tasks";
import type { OutreachSequenceWithContact, Task, Contact, AppSettings } from "@/types/database";
import { EMAIL_FRAMEWORKS } from "@/lib/constants";

interface QueueItem {
  id: string;
  kind: "sequence_email" | "task";
  icon: typeof Mail;
  title: string;
  subtitle: string;
  overdue: boolean;
  seq?: OutreachSequenceWithContact;
  emailStep?: 2 | 3 | 4;
  task?: Task;
}

export function buildQueue(
  sequences: OutreachSequenceWithContact[],
  tasks: Task[],
  contacts: Contact[],
  settings: AppSettings,
): QueueItem[] {
  const items: QueueItem[] = [];
  const today = startOfDay(new Date());
  const gaps = settings.email_gaps?.length === 4 ? settings.email_gaps : [0, 3, 7, 14];
  const contactById = new Map(contacts.map((c) => [c.id, c]));

  for (const seq of sequences) {
    if (!seq.email_1_sent_at) continue;
    if (["replied_positive", "replied_negative", "bounced", "unsubscribed", "completed"].includes(seq.sequence_status)) continue;
    const base = parseISO(seq.email_1_sent_at);
    const steps: { step: 2 | 3 | 4; sentAt: string | null; gap: number }[] = [
      { step: 2, sentAt: seq.email_2_sent_at, gap: gaps[1] },
      { step: 3, sentAt: seq.email_3_sent_at, gap: gaps[2] },
      { step: 4, sentAt: seq.email_4_sent_at, gap: gaps[3] },
    ];
    const next = steps.find((s) => !s.sentAt);
    if (!next) continue;
    const dueDate = startOfDay(addDays(base, next.gap));
    if (isBefore(dueDate, today) || isToday(dueDate)) {
      const contact = seq.contact_id ? contactById.get(seq.contact_id) : undefined;
      const company = contact?.company_name ?? seq.contacts?.company_name ?? "Unknown";
      items.push({
        id: `seq-${seq.id}-${next.step}`,
        kind: "sequence_email",
        icon: Mail,
        title: `Send Email ${next.step} (${EMAIL_FRAMEWORKS[next.step - 1]}) — ${company}`,
        subtitle: `Due ${format(dueDate, "MMM d")}`,
        overdue: isBefore(dueDate, today),
        seq,
        emailStep: next.step,
      });
    }
  }

  for (const task of tasks) {
    if (task.status === "done" || task.status === "cancelled") continue;
    if (!task.due_date) continue;
    const due = startOfDay(parseISO(task.due_date));
    if (isBefore(due, today) || isToday(due)) {
      const contact = task.contact_id ? contactById.get(task.contact_id) : undefined;
      items.push({
        id: `task-${task.id}`,
        kind: "task",
        icon: task.task_type === "meeting" ? CalendarClock : task.task_type === "proposal" ? FileText : Clock,
        title: task.title,
        subtitle: `${contact ? contact.company_name + " · " : ""}Due ${format(due, "MMM d")} · ${task.priority}`,
        overdue: isBefore(due, today),
        task,
      });
    }
  }

  return items.sort((a, b) => Number(b.overdue) - Number(a.overdue));
}

export function ActionQueue({
  sequences,
  tasks,
  contacts,
  settings,
}: {
  sequences: OutreachSequenceWithContact[];
  tasks: Task[];
  contacts: Contact[];
  settings: AppSettings;
}) {
  const updateSequence = useUpdateSequence();
  const updateTask = useUpdateTask();
  const items = buildQueue(sequences, tasks, contacts, settings);

  function markDone(item: QueueItem) {
    if (item.kind === "sequence_email" && item.seq && item.emailStep) {
      updateSequence.mutate({
        id: item.seq.id,
        [`email_${item.emailStep}_sent_at`]: new Date().toISOString(),
        sequence_status: `email_${item.emailStep}_sent`,
      } as never);
    } else if (item.task) {
      updateTask.mutate({ id: item.task.id, status: "done", completed_at: new Date().toISOString() });
    }
  }

  function snooze(item: QueueItem) {
    const tomorrow = format(addDays(new Date(), 1), "yyyy-MM-dd");
    if (item.kind === "task" && item.task) {
      updateTask.mutate({ id: item.task.id, due_date: tomorrow });
    } else if (item.seq) {
      updateSequence.mutate({ id: item.seq.id, next_action_date: tomorrow, next_action: "Snoozed follow-up" });
    }
  }

  function skip(item: QueueItem) {
    if (item.kind === "sequence_email" && item.seq && item.emailStep) {
      // Skip the step: record it as sent so the sequence advances without pestering
      updateSequence.mutate({
        id: item.seq.id,
        [`email_${item.emailStep}_sent_at`]: new Date().toISOString(),
        notes: `${item.seq.notes ?? ""}\nSkipped email ${item.emailStep} on ${format(new Date(), "MMM d")}`.trim(),
      } as never);
    } else if (item.task) {
      updateTask.mutate({ id: item.task.id, status: "cancelled" });
    }
  }

  return (
    <div className="glass-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold">Today's Action Queue</h2>
        <Badge color={items.length > 0 ? "indigo" : "green"}>
          {items.length} {items.length === 1 ? "item" : "items"}
        </Badge>
      </div>
      {items.length === 0 ? (
        <EmptyState
          icon={AlarmClock}
          title="Queue clear"
          description="Nothing due today. Load more prospects or start new sequences to keep the machine fed."
        />
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex flex-col gap-2 rounded-lg border border-white/5 bg-white/[0.02] p-3 transition-colors hover:border-indigo-500/20 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className={item.overdue ? "text-red-400" : "text-indigo-400"}>
                  <item.icon className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-text-primary">{item.title}</div>
                  <div className="text-xs text-text-muted">
                    {item.overdue && <span className="text-red-400 font-medium">OVERDUE · </span>}
                    {item.subtitle}
                  </div>
                </div>
              </div>
              <div className="flex shrink-0 gap-1.5">
                <Button size="sm" variant="success" onClick={() => markDone(item)}>
                  <Check className="h-3 w-3" /> Done
                </Button>
                <Button size="sm" variant="secondary" onClick={() => snooze(item)}>
                  Snooze
                </Button>
                <Button size="sm" variant="ghost" onClick={() => skip(item)}>
                  Skip
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
