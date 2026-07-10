import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { AppSettings, RevenueTarget } from "@/types/database";
import { toast } from "sonner";
import { startOfMonth, format } from "date-fns";

export const DEFAULT_SETTINGS: AppSettings = {
  id: 1,
  agency_name: "Proxim Systems",
  contact_info: null,
  signature: null,
  monthly_target: 150000,
  avg_deal_size: 50000,
  close_rate: 0.45,
  proposal_rate: 0.5,
  meeting_rate: 0.08,
  positive_reply_rate: 0.04,
  email_gaps: [0, 3, 7, 14],
  geographies: [],
  industries: [],
  updated_at: new Date().toISOString(),
};

export function useSettings() {
  return useQuery({
    queryKey: ["settings"],
    queryFn: async (): Promise<AppSettings> => {
      const { data, error } = await supabase
        .from("app_settings")
        .select("*")
        .eq("id", 1)
        .maybeSingle();
      if (error) throw error;
      return (data as AppSettings) ?? DEFAULT_SETTINGS;
    },
  });
}

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (updates: Partial<AppSettings>) => {
      const { data, error } = await supabase
        .from("app_settings")
        .upsert({ id: 1, ...updates })
        .select()
        .single();
      if (error) throw error;
      return data as AppSettings;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["settings"] });
      toast.success("Settings saved");
    },
    onError: (e: Error) => toast.error(`Failed: ${e.message}`),
  });
}

export function useRevenueTarget(month = new Date()) {
  const monthKey = format(startOfMonth(month), "yyyy-MM-dd");
  return useQuery({
    queryKey: ["revenue_target", monthKey],
    queryFn: async (): Promise<RevenueTarget | null> => {
      const { data, error } = await supabase
        .from("revenue_targets")
        .select("*")
        .eq("month", monthKey)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}
