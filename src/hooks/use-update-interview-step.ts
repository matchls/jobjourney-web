import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import type { InterviewStepStatus } from "@/types";

type UpdateInput = {
  applicationId: string;
  stepId: string;
  status?: InterviewStepStatus;
  scheduledAt?: string;
};

export function useUpdateInterviewStep() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ applicationId, stepId, ...data }: UpdateInput) =>
      apiClient.patch(
        `/applications/${applicationId}/interview-steps/${stepId}`,
        data,
      ),
    onSuccess: (_, { applicationId }) => {
      queryClient.invalidateQueries({
        queryKey: ["applications", applicationId],
      });
      // Completing/uncompleting a step or rescheduling it changes the
      // dashboard's completed counter and upcoming interviews list, so
      // that query needs to be refetched too.
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
