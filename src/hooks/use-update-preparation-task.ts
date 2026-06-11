import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";

type UpdateInput = {
  applicationId: string;
  taskId: string;
  isCompleted: boolean;
};

export function useUpdatePreparationTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ applicationId, taskId, isCompleted }: UpdateInput) =>
      apiClient.patch(
        `/applications/${applicationId}/preparation-tasks/${taskId}`,
        { isCompleted },
      ),
    onSuccess: (_, { applicationId }) => {
      queryClient.invalidateQueries({
        queryKey: ["applications", applicationId],
      });
    },
  });
}
