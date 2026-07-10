import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { OutreachSequence, OutreachSequenceWithContact, Campaign } from "@/types/database";
import { toast } from "sonner";

export function useSequences() {
  return useQuery({
    queryKey: ["sequences"],
    queryFn: async (): Promise<OutreachSequenceWithContact[]> => {
      const { data, error } = await supabase
        .from("outreach_sequences")
        .select("*, contacts(*), campaigns(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as OutreachSequenceWithContact[];
    },
  });
}

export function useCreateSequence() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (seq: Partial<OutreachSequence>) => {
      const { data, error } = await supabase
        .from("outreach_sequences")
        .insert(seq)
        .select()
        .single();
      if (error) throw error;
      return data as OutreachSequence;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sequences"] });
      toast.success("Sequence started");
    },
    onError: (e: Error) => toast.error(`Failed: ${e.message}`),
  });
}

export function useUpdateSequence() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<OutreachSequence> & { id: string }) => {
      const { data, error } = await supabase
        .from("outreach_sequences")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as OutreachSequence;
    },
    onMutate: async ({ id, ...updates }) => {
      await qc.cancelQueries({ queryKey: ["sequences"] });
      const prev = qc.getQueryData<OutreachSequenceWithContact[]>(["sequences"]);
      qc.setQueryData<OutreachSequenceWithContact[]>(["sequences"], (old) =>
        old?.map((s) => (s.id === id ? { ...s, ...updates } : s)),
      );
      return { prev };
    },
    onError: (e: Error, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(["sequences"], ctx.prev);
      toast.error(`Update failed: ${e.message}`);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["sequences"] }),
  });
}

export function useCampaigns() {
  return useQuery({
    queryKey: ["campaigns"],
    queryFn: async (): Promise<Campaign[]> => {
      const { data, error } = await supabase
        .from("campaigns")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (c: Partial<Campaign>) => {
      const { data, error } = await supabase
        .from("campaigns")
        .insert(c)
        .select()
        .single();
      if (error) throw error;
      return data as Campaign;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["campaigns"] });
      toast.success(`Campaign "${data.name}" created`);
    },
    onError: (e: Error) => toast.error(`Failed: ${e.message}`),
  });
}

export function useUpdateCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Campaign> & { id: string }) => {
      const { data, error } = await supabase
        .from("campaigns")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as Campaign;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["campaigns"] }),
    onError: (e: Error) => toast.error(`Update failed: ${e.message}`),
  });
}
