import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";

type DeleteInterviewStepInput = {
  applicationId: string;
  stepId: string;
};

export function useDeleteInterviewStep() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ applicationId, stepId }: DeleteInterviewStepInput) =>
      apiClient.delete(
        `/applications/${applicationId}/interview-steps/${stepId}`,
      ),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["applications", variables.applicationId],
      });
    },
  });
}
