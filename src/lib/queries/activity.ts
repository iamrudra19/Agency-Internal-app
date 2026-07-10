import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { DailyActivity } from "@/types/database";
import { toast } from "sonner";

export function useDailyActivity(days = 90) {
  return useQuery({
    queryKey: ["daily_activity", days],
    queryFn: async (): Promise<DailyActivity[]> => {
      const since = new Date();
      since.setDate(since.getDate() - days);
      const { data, error } = await supabase
        .from("daily_activity")
        .select("*")
        .gte("log_date", since.toISOString().slice(0, 10))
        .order("log_date", { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

export function useUpsertDailyActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (entry: Partial<DailyActivity> & { log_date: string }) => {
      const { data, error } = await supabase
        .from("daily_activity")
        .upsert(entry, { onConflict: "log_date" })
        .select()
        .single();
      if (error) throw error;
      return data as DailyActivity;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["daily_activity"] });
      toast.success("Daily activity logged");
    },
    onError: (e: Error) => toast.error(`Failed to log: ${e.message}`),
  });
}
