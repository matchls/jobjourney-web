import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";

type DeletePreparationTaskInput = {
  applicationId: string;
  taskId: string;
};

export function useDeletePreparationTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ applicationId, taskId }: DeletePreparationTaskInput) =>
      apiClient.delete(
        `/applications/${applicationId}/preparation-tasks/${taskId}`,
      ),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["applications", variables.applicationId],
      });
    },
  });
}
