import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import type { InterviewStepStatus } from "@/types";

type UpdateInput = {
  applicationId: string;
  stepId: string;
  status: InterviewStepStatus;
};

export function useUpdateInterviewStep() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ applicationId, stepId, status }: UpdateInput) =>
      apiClient.patch(
        `/applications/${applicationId}/interview-steps/${stepId}`,
        { status },
      ),
    onSuccess: (_, { applicationId }) => {
      queryClient.invalidateQueries({
        queryKey: ["applications", applicationId],
      });
      // Completing/uncompleting a step changes the dashboard's completed
      // interviews counter, so that query needs to be refetched too.
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
