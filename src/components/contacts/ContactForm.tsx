import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Label } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useCreateContact, useUpdateContact } from "@/lib/queries/contacts";
import { CONTACT_TYPES, SOURCES, GEOGRAPHIES, GEOGRAPHY_LABELS, PITCH_TYPES } from "@/lib/constants";
import { titleCase } from "@/lib/utils";
import type { Contact } from "@/types/database";

const schema = z.object({
  first_name: z.string().min(1, "Required"),
  last_name: z.string().optional(),
  title: z.string().optional(),
  company_name: z.string().min(1, "Required"),
  company_website: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  linkedin_url: z.string().optional(),
  whatsapp: z.string().optional(),
  contact_type: z.enum(CONTACT_TYPES),
  source: z.enum(SOURCES),
  geography: z.enum(GEOGRAPHIES as [string, ...string[]]),
  industry: z.string().optional(),
  pitch_type: z.enum(PITCH_TYPES),
  employee_count: z.string().optional(),
  icp_score: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function ContactForm({
  contact,
  onDone,
}: {
  contact?: Contact;
  onDone?: () => void;
}) {
  const [fullMode, setFullMode] = useState(!!contact);
  const createContact = useCreateContact();
  const updateContact = useUpdateContact();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: contact
      ? {
          first_name: contact.first_name,
          last_name: contact.last_name ?? "",
          title: contact.title ?? "",
          company_name: contact.company_name,
          company_website: contact.company_website ?? "",
          email: contact.email ?? "",
          phone: contact.phone ?? "",
          linkedin_url: contact.linkedin_url ?? "",
          whatsapp: contact.whatsapp ?? "",
          contact_type: contact.contact_type,
          source: contact.source,
          geography: contact.geography,
          industry: contact.industry ?? "",
          pitch_type: contact.pitch_type,
          employee_count: contact.employee_count ?? "",
          icp_score: contact.icp_score != null ? String(contact.icp_score) : "",
          notes: contact.notes ?? "",
        }
      : {
          contact_type: "prospect",
          source: "cold_email",
          geography: "gujarat_other",
          pitch_type: "rfq_handler",
        },
  });

  async function onSubmit(values: FormValues) {
    const payload = {
      ...values,
      last_name: values.last_name || null,
      title: values.title || null,
      company_website: values.company_website || null,
      email: values.email || null,
      phone: values.phone || null,
      linkedin_url: values.linkedin_url || null,
      whatsapp: values.whatsapp || null,
      industry: values.industry || null,
      employee_count: values.employee_count || null,
      icp_score: values.icp_score ? Math.max(0, Math.min(100, Number(values.icp_score))) : null,
      notes: values.notes || null,
    };
    if (contact) {
      await updateContact.mutateAsync({ id: contact.id, ...payload } as Partial<Contact> & { id: string });
    } else {
      await createContact.mutateAsync(payload as Partial<Contact>);
    }
    onDone?.();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>First Name *</Label>
          <Input {...register("first_name")} placeholder="Ambar" autoFocus />
          {errors.first_name && <p className="mt-1 text-xs text-red-400">{errors.first_name.message}</p>}
        </div>
        <div>
          <Label>Last Name</Label>
          <Input {...register("last_name")} placeholder="Patel" />
        </div>
      </div>
      <div>
        <Label>Company *</Label>
        <Input {...register("company_name")} placeholder="Shilp Gravures" />
        {errors.company_name && <p className="mt-1 text-xs text-red-400">{errors.company_name.message}</p>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Email</Label>
          <Input {...register("email")} type="email" placeholder="md@company.in" />
          {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>}
        </div>
        <div>
          <Label>Geography</Label>
          <Select {...register("geography")}>
            {GEOGRAPHIES.map((g) => (
              <option key={g} value={g}>{GEOGRAPHY_LABELS[g]}</option>
            ))}
          </Select>
        </div>
      </div>

      {fullMode && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Title</Label>
              <Input {...register("title")} placeholder="Managing Director" />
            </div>
            <div>
              <Label>Phone</Label>
              <Input {...register("phone")} placeholder="+91 ..." />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Type</Label>
              <Select {...register("contact_type")}>
                {CONTACT_TYPES.map((t) => (
                  <option key={t} value={t}>{titleCase(t)}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Source</Label>
              <Select {...register("source")}>
                {SOURCES.map((s) => (
                  <option key={s} value={s}>{titleCase(s)}</option>
                ))}
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Industry</Label>
              <Input {...register("industry")} placeholder="tiles/ceramics" />
            </div>
            <div>
              <Label>Pitch Type</Label>
              <Select {...register("pitch_type")}>
                {PITCH_TYPES.map((p) => (
                  <option key={p} value={p}>{titleCase(p)}</option>
                ))}
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Website</Label>
              <Input {...register("company_website")} placeholder="https://..." />
            </div>
            <div>
              <Label>ICP Score (0-100)</Label>
              <Input {...register("icp_score")} type="number" min={0} max={100} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>LinkedIn</Label>
              <Input {...register("linkedin_url")} placeholder="linkedin.com/in/..." />
            </div>
            <div>
              <Label>Employees</Label>
              <Select {...register("employee_count")}>
                <option value="">Unknown</option>
                {["10-50", "50-200", "200-500", "500+"].map((e) => (
                  <option key={e} value={e}>{e}</option>
                ))}
              </Select>
            </div>
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea {...register("notes")} placeholder="Context, ROI anchors, decision-makers..." />
          </div>
        </>
      )}

      <div className="flex items-center justify-between pt-2">
        {!contact ? (
          <button
            type="button"
            onClick={() => setFullMode((f) => !f)}
            className="text-xs text-indigo-400 hover:text-indigo-300 cursor-pointer"
          >
            {fullMode ? "← Quick add" : "Show all fields →"}
          </button>
        ) : <span />}
        <Button type="submit" disabled={isSubmitting}>
          {contact ? "Save Changes" : "Add Contact"}
        </Button>
      </div>
    </form>
  );
}
