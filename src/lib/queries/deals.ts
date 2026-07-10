import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Deal, DealWithContact } from "@/types/database";
import { toast } from "sonner";

export function useDeals() {
  return useQuery({
    queryKey: ["deals"],
    queryFn: async (): Promise<DealWithContact[]> => {
      const { data, error } = await supabase
        .from("deals")
        .select("*, contacts(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as DealWithContact[];
    },
  });
}

export function useCreateDeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (deal: Partial<Deal>) => {
      const { data, error } = await supabase
        .from("deals")
        .insert(deal)
        .select()
        .single();
      if (error) throw error;
      return data as Deal;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["deals"] });
      toast.success(`Deal "${data.deal_name}" created`);
    },
    onError: (e: Error) => toast.error(`Failed to create deal: ${e.message}`),
  });
}

export function useUpdateDeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Deal> & { id: string }) => {
      const { data, error } = await supabase
        .from("deals")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as Deal;
    },
    onMutate: async ({ id, ...updates }) => {
      await qc.cancelQueries({ queryKey: ["deals"] });
      const prev = qc.getQueryData<DealWithContact[]>(["deals"]);
      qc.setQueryData<DealWithContact[]>(["deals"], (old) =>
        old?.map((d) => (d.id === id ? { ...d, ...updates } : d)),
      );
      return { prev };
    },
    onError: (e: Error, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(["deals"], ctx.prev);
      toast.error(`Update failed: ${e.message}`);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["deals"] }),
  });
}

export function useDeleteDeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("deals").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["deals"] });
      toast.success("Deal deleted");
    },
    onError: (e: Error) => toast.error(`Delete failed: ${e.message}`),
  });
}
