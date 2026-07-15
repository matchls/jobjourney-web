import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import type { Application, ApplicationStatus } from "@/types";

export type UpdateApplicationInput = {
  id: string;
  company?: string;
  position?: string;
  source?: string;
  offerUrl?: string;
  status?: ApplicationStatus;
  notes?: string;
  appliedAt?: string;
  location?: string;
  salary?: string;
  jobDescription?: string;
  contactName?: string;
  contactRole?: string;
  contactEmail?: string;
  referralNote?: string;
};

export function useUpdateApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...data }: UpdateApplicationInput) =>
      apiClient.patch<Application>(`/applications/${id}`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      queryClient.invalidateQueries({
        queryKey: ["applications", variables.id],
      });
      // A status change (e.g. moving a card between Kanban columns) also
      // changes the dashboard's per-status counters.
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
