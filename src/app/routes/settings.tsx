import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Download, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Label } from "@/components/ui/input";
import { useSettings, useUpdateSettings, DEFAULT_SETTINGS } from "@/lib/queries/settings";
import { supabase } from "@/lib/supabase";
import { useQueryClient } from "@tanstack/react-query";
import type { AppSettings } from "@/types/database";

interface FormValues {
  agency_name: string;
  contact_info: string;
  signature: string;
  monthly_target: string;
  avg_deal_size: string;
  close_rate: string;
  proposal_rate: string;
  meeting_rate: string;
  positive_reply_rate: string;
  email_gaps: string;
  geographies: string;
  industries: string;
}

function toForm(s: AppSettings): FormValues {
  return {
    agency_name: s.agency_name ?? "",
    contact_info: s.contact_info ?? "",
    signature: s.signature ?? "",
    monthly_target: String(s.monthly_target),
    avg_deal_size: String(s.avg_deal_size),
    close_rate: String(Math.round(Number(s.close_rate) * 100)),
    proposal_rate: String(Math.round(Number(s.proposal_rate) * 100)),
    meeting_rate: String(Math.round(Number(s.meeting_rate) * 100)),
    positive_reply_rate: String(Number(s.positive_reply_rate) * 100),
    email_gaps: (s.email_gaps ?? [0, 3, 7, 14]).join(", "),
    geographies: (s.geographies ?? []).join(", "),
    industries: (s.industries ?? []).join(", "),
  };
}

const EXPORT_TABLES = [
  "contacts", "deals", "campaigns", "outreach_sequences", "daily_activity", "tasks", "revenue_targets",
];

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    if (v == null) return "";
    const s = Array.isArray(v) ? v.join(";") : String(typeof v === "object" ? JSON.stringify(v) : v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers.join(","), ...rows.map((r) => headers.map((h) => escape(r[h])).join(","))].join("\n");
}

export function SettingsPage() {
  const { data: settings } = useSettings();
  const updateSettings = useUpdateSettings();
  const qc = useQueryClient();
  const [confirmText, setConfirmText] = useState("");
  const [exporting, setExporting] = useState(false);

  const { register, handleSubmit, reset } = useForm<FormValues>({
    defaultValues: toForm(settings ?? DEFAULT_SETTINGS),
  });

  useEffect(() => {
    if (settings) reset(toForm(settings));
  }, [settings, reset]);

  function onSubmit(v: FormValues) {
    const gaps = v.email_gaps
      .split(",")
      .map((n) => parseInt(n.trim(), 10))
      .filter((n) => !Number.isNaN(n));
    updateSettings.mutate({
      agency_name: v.agency_name || "Proxim Systems",
      contact_info: v.contact_info || null,
      signature: v.signature || null,
      monthly_target: Number(v.monthly_target) || 150000,
      avg_deal_size: Number(v.avg_deal_size) || 50000,
      close_rate: (Number(v.close_rate) || 45) / 100,
      proposal_rate: (Number(v.proposal_rate) || 50) / 100,
      meeting_rate: (Number(v.meeting_rate) || 8) / 100,
      positive_reply_rate: (Number(v.positive_reply_rate) || 4) / 100,
      email_gaps: gaps.length === 4 ? gaps : [0, 3, 7, 14],
      geographies: v.geographies.split(",").map((s) => s.trim()).filter(Boolean),
      industries: v.industries.split(",").map((s) => s.trim()).filter(Boolean),
    });
  }

  async function exportAll() {
    setExporting(true);
    try {
      for (const table of EXPORT_TABLES) {
        const { data, error } = await supabase.from(table).select("*");
        if (error) throw error;
        if (!data || data.length === 0) continue;
        const blob = new Blob([toCsv(data)], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `proxim-${table}-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }
      toast.success("Export complete — check your downloads");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Export failed");
    } finally {
      setExporting(false);
    }
  }

  async function clearAllData() {
    try {
      // Order respects FK relationships
      for (const table of ["tasks", "outreach_sequences", "deals", "daily_activity", "campaigns", "revenue_targets", "contacts"]) {
        const { error } = await supabase.from(table).delete().not("id", "is", null);
        if (error) throw error;
      }
      qc.invalidateQueries();
      setConfirmText("");
      toast.success("All data cleared");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Clear failed");
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-xl font-bold tracking-tight">Settings</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <section className="glass-card p-6">
          <h2 className="mb-4 text-base font-semibold">Profile</h2>
          <div className="space-y-3">
            <div>
              <Label>Agency Name</Label>
              <Input {...register("agency_name")} />
            </div>
            <div>
              <Label>Contact Info</Label>
              <Input {...register("contact_info")} placeholder="rudra@proximsystems.in · +91 ..." />
            </div>
            <div>
              <Label>Email Signature</Label>
              <Textarea {...register("signature")} placeholder="Rudra — Proxim Systems, Surat" />
            </div>
          </div>
        </section>

        <section className="glass-card p-6">
          <h2 className="mb-1 text-base font-semibold">Revenue Target & Conversion Math</h2>
          <p className="mb-4 text-xs text-text-muted">
            These drive the Revenue Bridge and Gap Calculator. Tune them as your real rates come in.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Monthly Target (₹)</Label>
              <Input {...register("monthly_target")} type="number" className="font-mono" />
            </div>
            <div>
              <Label>Avg Deal Size (₹)</Label>
              <Input {...register("avg_deal_size")} type="number" className="font-mono" />
            </div>
            <div>
              <Label>Close Rate (%)</Label>
              <Input {...register("close_rate")} type="number" step="1" className="font-mono" />
            </div>
            <div>
              <Label>Proposal Rate (%)</Label>
              <Input {...register("proposal_rate")} type="number" step="1" className="font-mono" />
            </div>
            <div>
              <Label>Meeting Rate (%)</Label>
              <Input {...register("meeting_rate")} type="number" step="1" className="font-mono" />
            </div>
            <div>
              <Label>Positive Reply Rate (%)</Label>
              <Input {...register("positive_reply_rate")} type="number" step="0.1" className="font-mono" />
            </div>
          </div>
        </section>

        <section className="glass-card p-6">
          <h2 className="mb-4 text-base font-semibold">Sequence & Lists</h2>
          <div className="space-y-3">
            <div>
              <Label>Email Day Gaps (4 numbers)</Label>
              <Input {...register("email_gaps")} placeholder="0, 3, 7, 14" className="font-mono" />
            </div>
            <div>
              <Label>Geography Regions (comma separated)</Label>
              <Input {...register("geographies")} />
            </div>
            <div>
              <Label>Industries (comma separated)</Label>
              <Input {...register("industries")} />
            </div>
          </div>
        </section>

        <Button type="submit" disabled={updateSettings.isPending}>Save Settings</Button>
      </form>

      <section className="glass-card p-6">
        <h2 className="mb-4 text-base font-semibold">Data Export</h2>
        <p className="mb-3 text-sm text-text-secondary">
          Downloads one CSV per table: {EXPORT_TABLES.join(", ")}.
        </p>
        <Button variant="secondary" onClick={exportAll} disabled={exporting}>
          <Download className="h-4 w-4" /> {exporting ? "Exporting..." : "Export All Data (CSV)"}
        </Button>
      </section>

      <section className="glass-card border-red-500/20 p-6">
        <h2 className="mb-2 flex items-center gap-2 text-base font-semibold text-red-400">
          <AlertTriangle className="h-4 w-4" /> Danger Zone
        </h2>
        <p className="mb-3 text-sm text-text-secondary">
          Permanently deletes every contact, deal, sequence, campaign, task, and activity log. Type{" "}
          <code className="font-mono text-red-300">DELETE EVERYTHING</code> to enable.
        </p>
        <div className="flex gap-2">
          <Input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="DELETE EVERYTHING"
            className="max-w-56 font-mono"
          />
          <Button
            variant="danger"
            disabled={confirmText !== "DELETE EVERYTHING"}
            onClick={clearAllData}
          >
            Clear All Data
          </Button>
        </div>
      </section>
    </div>
  );
}
