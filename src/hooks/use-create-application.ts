import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import type { Application, ApplicationStatus } from "@/types";

export type CreateApplicationInput = {
  company: string;
  position: string;
  source?: string;
  offerUrl?: string;
  status?: ApplicationStatus;
  appliedAt?: string;
  location?: string;
  contractType?: string;
  salary?: string;
  jobDescription?: string;
  notes?: string;
  contactName?: string;
  contactRole?: string;
  contactEmail?: string;
  referralNote?: string;
};

export function useCreateApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateApplicationInput) =>
      apiClient.post<Application>("/applications", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
    },
  });
}
