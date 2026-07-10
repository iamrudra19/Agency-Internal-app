import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

const TABLE_TO_KEYS: Record<string, string[]> = {
  contacts: ["contacts"],
  deals: ["deals"],
  campaigns: ["campaigns"],
  outreach_sequences: ["sequences"],
  daily_activity: ["daily_activity"],
  tasks: ["tasks"],
  revenue_targets: ["revenue_target"],
  app_settings: ["settings"],
};

/** Subscribe to Supabase realtime for all tables; invalidate the matching query cache on change. */
export function useRealtimeSync() {
  const qc = useQueryClient();
  useEffect(() => {
    const channel = supabase
      .channel("db-changes")
      .on("postgres_changes", { event: "*", schema: "public" }, (payload) => {
        const keys = TABLE_TO_KEYS[payload.table];
        keys?.forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);
}
