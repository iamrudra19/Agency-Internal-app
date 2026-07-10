import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Label } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useCreateTask } from "@/lib/queries/tasks";
import { useContacts } from "@/lib/queries/contacts";
import { titleCase } from "@/lib/utils";
import type { TaskPriority, TaskType } from "@/types/database";

const TASK_TYPES: TaskType[] = ["follow_up", "send_email", "call", "meeting", "proposal", "research", "prototype", "other"];
const PRIORITIES: TaskPriority[] = ["urgent", "high", "medium", "low"];

const schema = z.object({
  title: z.string().min(1, "Required"),
  description: z.string().optional(),
  due_date: z.string().optional(),
  priority: z.string(),
  task_type: z.string(),
  contact_id: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function TaskForm({ contactId, dealId, onDone }: { contactId?: string; dealId?: string; onDone?: () => void }) {
  const createTask = useCreateTask();
  const { data: contacts } = useContacts();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      priority: "medium",
      task_type: "follow_up",
      due_date: format(new Date(), "yyyy-MM-dd"),
      contact_id: contactId ?? "",
    },
  });

  async function onSubmit(values: FormValues) {
    await createTask.mutateAsync({
      title: values.title,
      description: values.description || null,
      due_date: values.due_date || null,
      priority: values.priority as TaskPriority,
      task_type: values.task_type as TaskType,
      contact_id: values.contact_id || null,
      deal_id: dealId ?? null,
    });
    onDone?.();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label>Title *</Label>
        <Input {...register("title")} placeholder="Follow up with Shilp on proposal" autoFocus />
        {errors.title && <p className="mt-1 text-xs text-red-400">{errors.title.message}</p>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Due Date</Label>
          <Input {...register("due_date")} type="date" />
        </div>
        <div>
          <Label>Priority</Label>
          <Select {...register("priority")}>
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>{titleCase(p)}</option>
            ))}
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Type</Label>
          <Select {...register("task_type")}>
            {TASK_TYPES.map((t) => (
              <option key={t} value={t}>{titleCase(t)}</option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Contact</Label>
          <Select {...register("contact_id")}>
            <option value="">None</option>
            {contacts?.map((c) => (
              <option key={c.id} value={c.id}>{c.company_name}</option>
            ))}
          </Select>
        </div>
      </div>
      <div>
        <Label>Description</Label>
        <Textarea {...register("description")} placeholder="Details..." />
      </div>
      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={isSubmitting}>Create Task</Button>
      </div>
    </form>
  );
}
