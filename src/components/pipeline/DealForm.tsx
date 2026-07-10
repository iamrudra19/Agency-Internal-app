import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Label } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useCreateDeal, useUpdateDeal } from "@/lib/queries/deals";
import { useContacts } from "@/lib/queries/contacts";
import { STAGE_LABELS } from "@/lib/constants";
import type { Deal, DealStage } from "@/types/database";

const schema = z.object({
  deal_name: z.string().min(1, "Required"),
  contact_id: z.string().min(1, "Pick a contact"),
  deal_value: z.string().optional(),
  stage: z.string(),
  expected_close_date: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function DealForm({ deal, onDone }: { deal?: Deal; onDone?: () => void }) {
  const { data: contacts } = useContacts();
  const createDeal = useCreateDeal();
  const updateDeal = useUpdateDeal();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: deal
      ? {
          deal_name: deal.deal_name,
          contact_id: deal.contact_id ?? "",
          deal_value: deal.deal_value != null ? String(deal.deal_value) : "",
          stage: deal.stage,
          expected_close_date: deal.expected_close_date ?? "",
          notes: deal.notes ?? "",
        }
      : { stage: "identified" },
  });

  async function onSubmit(values: FormValues) {
    const payload = {
      deal_name: values.deal_name,
      contact_id: values.contact_id,
      deal_value: values.deal_value ? Number(values.deal_value) : null,
      stage: values.stage as DealStage,
      expected_close_date: values.expected_close_date || null,
      notes: values.notes || null,
      ...(deal ? {} : {}),
    };
    if (deal) {
      const stageChanged = values.stage !== deal.stage;
      await updateDeal.mutateAsync({
        id: deal.id,
        ...payload,
        ...(stageChanged ? { stage_changed_at: new Date().toISOString() } : {}),
      });
    } else {
      await createDeal.mutateAsync(payload);
    }
    onDone?.();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label>Deal Name *</Label>
        <Input {...register("deal_name")} placeholder="Shilp Enquiry Validator" autoFocus />
        {errors.deal_name && <p className="mt-1 text-xs text-red-400">{errors.deal_name.message}</p>}
      </div>
      <div>
        <Label>Contact *</Label>
        <Select {...register("contact_id")}>
          <option value="">Select contact...</option>
          {contacts?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.company_name} — {c.first_name} {c.last_name ?? ""}
            </option>
          ))}
        </Select>
        {errors.contact_id && <p className="mt-1 text-xs text-red-400">{errors.contact_id.message}</p>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Value (₹)</Label>
          <Input {...register("deal_value")} type="number" placeholder="50000" />
        </div>
        <div>
          <Label>Stage</Label>
          <Select {...register("stage")}>
            {(Object.keys(STAGE_LABELS) as DealStage[]).map((s) => (
              <option key={s} value={s}>{STAGE_LABELS[s]}</option>
            ))}
          </Select>
        </div>
      </div>
      <div>
        <Label>Expected Close Date</Label>
        <Input {...register("expected_close_date")} type="date" />
      </div>
      <div>
        <Label>Notes</Label>
        <Textarea {...register("notes")} placeholder="Scope, pricing discussed..." />
      </div>
      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={isSubmitting}>
          {deal ? "Save Changes" : "Create Deal"}
        </Button>
      </div>
    </form>
  );
}
