import { useState } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CONTACT_TYPES, SOURCES, GEOGRAPHIES } from "@/lib/constants";

/** Minimal CSV parser handling quoted fields. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ",") { row.push(field); field = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field); field = "";
      if (row.some((f) => f.trim() !== "")) rows.push(row);
      row = [];
    } else field += ch;
  }
  row.push(field);
  if (row.some((f) => f.trim() !== "")) rows.push(row);
  return rows;
}

const KNOWN_COLUMNS = [
  "first_name", "last_name", "title", "company_name", "company_website",
  "email", "phone", "linkedin_url", "whatsapp", "contact_type", "source",
  "geography", "industry", "icp_score", "employee_count", "notes",
];

export function CsvImport({ onDone }: { onDone?: () => void }) {
  const [busy, setBusy] = useState(false);
  const qc = useQueryClient();

  async function handleFile(file: File) {
    setBusy(true);
    try {
      const text = await file.text();
      const rows = parseCsv(text);
      if (rows.length < 2) throw new Error("CSV needs a header row and at least one data row");
      const headers = rows[0].map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));
      const mapped = rows.slice(1).map((cells) => {
        const rec: Record<string, unknown> = {};
        headers.forEach((h, i) => {
          if (!KNOWN_COLUMNS.includes(h)) return;
          const v = cells[i]?.trim();
          if (!v) return;
          if (h === "icp_score") rec[h] = Number(v) || null;
          else if (h === "contact_type") rec[h] = (CONTACT_TYPES as readonly string[]).includes(v) ? v : "prospect";
          else if (h === "source") rec[h] = (SOURCES as readonly string[]).includes(v) ? v : "other";
          else if (h === "geography") rec[h] = (GEOGRAPHIES as readonly string[]).includes(v) ? v : "gujarat_other";
          else rec[h] = v;
        });
        return rec;
      }).filter((r) => r.first_name && r.company_name);

      if (mapped.length === 0) {
        throw new Error("No valid rows found. CSV must include first_name and company_name columns.");
      }
      const { error } = await supabase.from("contacts").insert(mapped);
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ["contacts"] });
      toast.success(`Imported ${mapped.length} contacts`);
      onDone?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Import failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-text-secondary">
        Upload a CSV with a header row. Recognized columns:{" "}
        <code className="font-mono text-xs text-indigo-300">{KNOWN_COLUMNS.join(", ")}</code>.
        Rows need at least <code className="font-mono text-xs">first_name</code> and{" "}
        <code className="font-mono text-xs">company_name</code>.
      </p>
      <label className="glass-card flex cursor-pointer flex-col items-center gap-2 border-dashed p-8 text-center hover:border-indigo-500/40">
        <Upload className="h-6 w-6 text-indigo-400" />
        <span className="text-sm">{busy ? "Importing..." : "Choose CSV file"}</span>
        <input
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          disabled={busy}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />
      </label>
      <div className="flex justify-end">
        <Button variant="ghost" onClick={onDone}>Cancel</Button>
      </div>
    </div>
  );
}
