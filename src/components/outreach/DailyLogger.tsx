import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { useDailyActivity, useUpsertDailyActivity } from "@/lib/queries/activity";

const FIELDS = [
  { key: "email_1_sent", label: "E1" },
  { key: "email_2_sent", label: "E2" },
  { key: "email_3_sent", label: "E3" },
  { key: "email_4_sent", label: "E4" },
  { key: "replies_received", label: "Replies" },
  { key: "positive_replies", label: "Positive" },
  { key: "bounces", label: "Bounces" },
] as const;

type FieldKey = (typeof FIELDS)[number]["key"];

export function DailyLogger() {
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [values, setValues] = useState<Record<FieldKey, string>>(
    Object.fromEntries(FIELDS.map((f) => [f.key, ""])) as Record<FieldKey, string>,
  );
  const { data: activity } = useDailyActivity();
  const upsert = useUpsertDailyActivity();

  // Pre-fill when picking a date that already has a log
  useEffect(() => {
    const existing = activity?.find((a) => a.log_date === date);
    setValues(
      Object.fromEntries(
        FIELDS.map((f) => [f.key, existing ? String(existing[f.key] ?? 0) : ""]),
      ) as Record<FieldKey, string>,
    );
  }, [date, activity]);

  function save() {
    const nums = Object.fromEntries(
      FIELDS.map((f) => [f.key, Number(values[f.key]) || 0]),
    ) as Record<FieldKey, number>;
    upsert.mutate({
      log_date: date,
      ...nums,
      emails_sent: nums.email_1_sent + nums.email_2_sent + nums.email_3_sent + nums.email_4_sent,
    });
  }

  return (
    <div className="glass-card gradient-accent p-4">
      <div className="caption-label mb-3">Daily Outreach Log — one-click save</div>
      <div className="flex flex-wrap items-end gap-2">
        <div>
          <Label>Date</Label>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-36 font-mono"
          />
        </div>
        {FIELDS.map((f) => (
          <div key={f.key}>
            <Label>{f.label}</Label>
            <Input
              type="number"
              min={0}
              placeholder="0"
              value={values[f.key]}
              onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
              onKeyDown={(e) => e.key === "Enter" && save()}
              className="w-20 font-mono"
            />
          </div>
        ))}
        <Button onClick={save} disabled={upsert.isPending}>
          <Save className="h-4 w-4" /> Save
        </Button>
      </div>
    </div>
  );
}
