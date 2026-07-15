import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import type { InterviewStep, InterviewStepType } from "@/types";

export type CreateInterviewStepInput = {
  applicationId: string;
  title: string;
  type: InterviewStepType;
  order: number;
  scheduledAt?: string;
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
      // A new step can be created with a scheduledAt, which would make it
      // show up in the dashboard's upcoming interviews list.
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
