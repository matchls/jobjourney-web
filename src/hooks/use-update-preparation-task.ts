import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";

type UpdateInput = {
  applicationId: string;
  taskId: string;
  isCompleted?: boolean;
  skillId?: string | null;
};

export function useUpdatePreparationTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ applicationId, taskId, ...data }: UpdateInput) =>
      apiClient.patch(
        `/applications/${applicationId}/preparation-tasks/${taskId}`,
        data,
      ),
    onSuccess: (_, { applicationId }) => {
      queryClient.invalidateQueries({
        queryKey: ["applications", applicationId],
      });
    },
  });
}
