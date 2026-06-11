import { useUpdateInterviewStep } from "@/hooks/use-update-interview-step";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, XCircle } from "lucide-react";
import type { InterviewStep } from "@/types";

type Props = {
  steps: InterviewStep[];
  applicationId: string;
};

const statusIcon = {
  PLANNED: <Circle size={16} className="text-muted-foreground" />,
  COMPLETED: <CheckCircle2 size={16} className="text-green-600" />,
  CANCELLED: <XCircle size={16} className="text-destructive" />,
};

const typeLabel: Record<string, string> = {
  HR: "RH",
  TECHNICAL: "Technique",
  FINAL: "Final",
  CUSTOM: "Autre",
};

export function InterviewSteps({ steps, applicationId }: Props) {
  const { mutate: updateStep, isPending } = useUpdateInterviewStep();

  if (steps.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">Aucune étape configurée.</p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {steps.map((step) => (
        <div
          key={step.id}
          className="flex items-center justify-between p-3 border border-border rounded-lg"
        >
          <div className="flex items-center gap-3">
            {statusIcon[step.status]}
            <div>
              <p className="text-sm font-medium">{step.title}</p>
              <p className="text-xs text-muted-foreground">
                {typeLabel[step.type] ?? step.type}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            disabled={isPending}
            onClick={() =>
              updateStep({
                applicationId,
                stepId: step.id,
                status: step.status === "COMPLETED" ? "PLANNED" : "COMPLETED",
              })
            }
          >
            {step.status === "COMPLETED" ? "Annuler" : "Marquer fait"}
          </Button>
        </div>
      ))}
    </div>
  );
}
