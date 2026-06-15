import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import type { PreparationTask } from "@/types";

export type CreatePreparationTaskInput = {
  applicationId: string;
  title: string;
  order: number;
};

export function useCreatePreparationTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ applicationId, ...data }: CreatePreparationTaskInput) =>
      apiClient.post<PreparationTask>(
        `/applications/${applicationId}/preparation-tasks`,
        data,
      ),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["applications", variables.applicationId],
      });
    },
  });
}
