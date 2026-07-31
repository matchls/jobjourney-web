import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import type { InterviewStepStatus } from "@/types";

type UpdateInput = {
  applicationId: string;
  stepId: string;
  status?: InterviewStepStatus;
  scheduledAt?: string;
  skillIds?: string[];
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
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
