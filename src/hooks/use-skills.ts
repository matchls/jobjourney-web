import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import type { Skill } from "@/types";

export function useSkills() {
  return useQuery({
    queryKey: ["skills"],
    queryFn: () => apiClient.get<Skill[]>("/skills"),
  });
}

export function useCreateSkill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) => apiClient.post<Skill>("/skills", { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["skills"] });
    },
  });
}

export function useUpdateSkill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ skillId, name }: { skillId: string; name: string }) =>
      apiClient.patch<Skill>(`/skills/${skillId}`, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["skills"] });
      queryClient.invalidateQueries({ queryKey: ["applications"] });
    },
  });
}

export function useDeleteSkill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (skillId: string) => apiClient.delete<void>(`/skills/${skillId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["skills"] });
      queryClient.invalidateQueries({ queryKey: ["applications"] });
    },
  });
}
