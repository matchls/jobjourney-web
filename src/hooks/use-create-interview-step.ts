import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import type { InterviewStep, InterviewStepType } from "@/types";

export type CreateInterviewStepInput = {
  applicationId: string;
  title: string;
  type: InterviewStepType;
  order: number;
};

export function useCreateInterviewStep() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ applicationId, ...data }: CreateInterviewStepInput) =>
      apiClient.post<InterviewStep>(
        `/applications/${applicationId}/interview-steps`,
        data,
      ),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["applications", variables.applicationId],
      });
    },
  });
}
