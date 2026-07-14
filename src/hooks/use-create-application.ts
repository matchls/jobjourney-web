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
