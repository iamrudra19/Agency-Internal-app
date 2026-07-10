import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { ArrowUpDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ContactTypeBadge } from "@/components/shared/StatusBadge";
import { GEOGRAPHY_LABELS, CONTACT_TYPES, SOURCES } from "@/lib/constants";
import { cn, titleCase } from "@/lib/utils";
import type { Contact } from "@/types/database";

type SortKey = "name" | "company" | "created" | "icp";

export function ContactList({
  contacts,
  search,
  onSelect,
}: {
  contacts: Contact[];
  search: string;
  onSelect: (c: Contact) => void;
}) {
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [geoFilter, setGeoFilter] = useState<string | null>(null);
  const [sourceFilter, setSourceFilter] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("created");
  const [sortAsc, setSortAsc] = useState(false);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    let rows = contacts.filter((c) => {
      const hay = `${c.first_name} ${c.last_name ?? ""} ${c.company_name} ${c.email ?? ""}`.toLowerCase();
      if (q && !hay.includes(q)) return false;
      if (typeFilter && c.contact_type !== typeFilter) return false;
      if (geoFilter && c.geography !== geoFilter) return false;
      if (sourceFilter && c.source !== sourceFilter) return false;
      return true;
    });
    rows = rows.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "name":
          cmp = a.first_name.localeCompare(b.first_name);
          break;
        case "company":
          cmp = a.company_name.localeCompare(b.company_name);
          break;
        case "icp":
          cmp = (a.icp_score ?? -1) - (b.icp_score ?? -1);
          break;
        default:
          cmp = a.created_at.localeCompare(b.created_at);
      }
      return sortAsc ? cmp : -cmp;
    });
    return rows;
  }, [contacts, search, typeFilter, geoFilter, sourceFilter, sortKey, sortAsc]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc((a) => !a);
    else {
      setSortKey(key);
      setSortAsc(true);
    }
  }

  const chip = (active: boolean) =>
    cn(
      "cursor-pointer rounded-full border px-2.5 py-1 text-xs transition-colors",
      active
        ? "border-indigo-500/50 bg-indigo-500/15 text-indigo-300"
        : "border-white/10 text-text-muted hover:text-text-secondary",
    );

  const SortHeader = ({ label, k }: { label: string; k: SortKey }) => (
    <button onClick={() => toggleSort(k)} className="inline-flex cursor-pointer items-center gap-1 hover:text-text-primary">
      {label} <ArrowUpDown className="h-3 w-3" />
    </button>
  );

  return (
    <div className="space-y-4">
      {/* Filter chips */}
      <div className="flex flex-wrap gap-1.5">
        {CONTACT_TYPES.map((t) => (
          <button key={t} className={chip(typeFilter === t)} onClick={() => setTypeFilter(typeFilter === t ? null : t)}>
            {titleCase(t)}
          </button>
        ))}
        <span className="mx-1 w-px bg-white/10" />
        {Object.entries(GEOGRAPHY_LABELS).map(([k, label]) => (
          <button key={k} className={chip(geoFilter === k)} onClick={() => setGeoFilter(geoFilter === k ? null : k)}>
            {label}
          </button>
        ))}
        <span className="mx-1 w-px bg-white/10" />
        {SOURCES.map((s) => (
          <button key={s} className={chip(sourceFilter === s)} onClick={() => setSourceFilter(sourceFilter === s ? null : s)}>
            {titleCase(s)}
          </button>
        ))}
      </div>

      <div className="glass-card overflow-hidden">
        <div className="max-h-[65vh] overflow-auto">
          <table className="data-table w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-left">
                <th className="caption-label px-4 py-3"><SortHeader label="Name" k="name" /></th>
                <th className="caption-label px-4 py-3"><SortHeader label="Company" k="company" /></th>
                <th className="caption-label px-4 py-3">Type</th>
                <th className="caption-label hidden px-4 py-3 md:table-cell">Geography</th>
                <th className="caption-label hidden px-4 py-3 lg:table-cell">Source</th>
                <th className="caption-label px-4 py-3"><SortHeader label="ICP" k="icp" /></th>
                <th className="caption-label hidden px-4 py-3 md:table-cell"><SortHeader label="Added" k="created" /></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => onSelect(c)}
                  className="cursor-pointer border-b border-white/[0.03] transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-text-primary">
                    {c.first_name} {c.last_name ?? ""}
                    {c.title && <div className="text-xs font-normal text-text-muted">{c.title}</div>}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{c.company_name}</td>
                  <td className="px-4 py-3"><ContactTypeBadge type={c.contact_type} /></td>
                  <td className="hidden px-4 py-3 text-text-secondary md:table-cell">
                    {GEOGRAPHY_LABELS[c.geography]}
                  </td>
                  <td className="hidden px-4 py-3 lg:table-cell">
                    <Badge color="grey">{titleCase(c.source)}</Badge>
                  </td>
                  <td className="px-4 py-3 font-mono text-text-secondary">{c.icp_score ?? "—"}</td>
                  <td className="hidden px-4 py-3 font-mono text-xs text-text-muted md:table-cell">
                    {format(parseISO(c.created_at), "d MMM yy")}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-text-muted">
                    No contacts match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <p className="font-mono text-xs text-text-muted">{filtered.length} of {contacts.length} contacts</p>
    </div>
  );
}
