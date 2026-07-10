import { useDraggable } from "@dnd-kit/core";
import { parseISO, format } from "date-fns";
import { cn, daysSince, formatINR } from "@/lib/utils";
import type { DealWithContact } from "@/types/database";

export function DealCard({
  deal,
  onClick,
}: {
  deal: DealWithContact;
  onClick?: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: deal.id,
  });

  const stale = daysSince(deal.stage_changed_at);
  const urgency =
    deal.stage === "won" || deal.stage === "lost"
      ? "border-white/5"
      : stale >= 14
        ? "border-red-500/40"
        : stale >= 7
          ? "border-amber-500/40"
          : "border-emerald-500/20";

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={onClick}
      style={
        transform
          ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
          : undefined
      }
      className={cn(
        "cursor-grab rounded-lg border bg-elevated p-3 text-left shadow-sm transition-shadow active:cursor-grabbing",
        urgency,
        isDragging && "z-50 opacity-90 shadow-2xl shadow-indigo-500/20",
      )}
    >
      <div className="text-sm font-semibold text-text-primary">
        {deal.contacts?.company_name ?? "No contact"}
      </div>
      <div className="text-xs text-text-secondary">
        {deal.contacts ? `${deal.contacts.first_name} ${deal.contacts.last_name ?? ""}` : deal.deal_name}
      </div>
      <div className="mt-2 flex items-center justify-between">
        <span className="font-mono text-sm font-medium text-cyan-300">
          {deal.deal_value != null ? formatINR(Number(deal.deal_value), true) : "—"}
        </span>
        <span
          className={cn(
            "font-mono text-[10px]",
            stale >= 14 ? "text-red-400" : stale >= 7 ? "text-amber-400" : "text-text-muted",
          )}
        >
          {stale}d in stage
        </span>
      </div>
      {deal.expected_close_date && (
        <div className="mt-1 font-mono text-[10px] text-text-muted">
          close by {format(parseISO(deal.expected_close_date), "d MMM")}
        </div>
      )}
    </div>
  );
}
