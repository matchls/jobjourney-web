import type { InterviewStep, PreparationTask } from "@/types";

export type PreparationScoreCriterion = {
  key: "tasks" | "scheduledInterview" | "context";
  label: string;
  earned: number;
  maximum: number;
  isComplete: boolean;
  missingMessage?: string;
};

export type PreparationScoreResult = {
  score: number;
  criteria: PreparationScoreCriterion[];
  missing: string[];
};

function hasText(value: string | null | undefined) {
  return Boolean(value?.trim());
}

export function calculatePreparationScore(
  tasks: PreparationTask[],
  interviewSteps: InterviewStep[],
): PreparationScoreResult {
  const completedTasks = tasks.filter((task) => task.isCompleted).length;
  const taskRatio = tasks.length > 0 ? completedTasks / tasks.length : 0;
  const taskPoints = Math.round(taskRatio * 70);
  const remainingTasks = tasks.length - completedTasks;

  const hasScheduledInterview = interviewSteps.some(
    (step) => step.status === "PLANNED" && Boolean(step.scheduledAt),
  );

  const hasPreparationContext =
    tasks.some(
      (task) =>
        Boolean(task.skillId) || hasText(task.description) || hasText(task.link),
    ) ||
    interviewSteps.some(
      (step) =>
        step.skills.length > 0 ||
        hasText(step.notes) ||
        hasText(step.toReview) ||
        hasText(step.questionsAsked) ||
        hasText(step.blockers),
    );

  const criteria: PreparationScoreCriterion[] = [
    {
      key: "tasks",
      label: "Tâches complétées",
      earned: taskPoints,
      maximum: 70,
      isComplete: tasks.length > 0 && remainingTasks === 0,
      missingMessage:
        tasks.length === 0
          ? "Ajoutez au moins une tâche de préparation."
          : remainingTasks > 0
            ? `Terminez ${remainingTasks} tâche${remainingTasks > 1 ? "s" : ""} restante${remainingTasks > 1 ? "s" : ""}.`
            : undefined,
    },
    {
      key: "scheduledInterview",
      label: "Entretien planifié",
      earned: hasScheduledInterview ? 15 : 0,
      maximum: 15,
      isComplete: hasScheduledInterview,
      missingMessage: hasScheduledInterview
        ? undefined
        : "Planifiez la date du prochain entretien.",
    },
    {
      key: "context",
      label: "Contexte de préparation",
      earned: hasPreparationContext ? 15 : 0,
      maximum: 15,
      isComplete: hasPreparationContext,
      missingMessage: hasPreparationContext
        ? undefined
        : "Associez une compétence, une note ou une ressource à la préparation.",
    },
  ];

  return {
    score: criteria.reduce((total, criterion) => total + criterion.earned, 0),
    criteria,
    missing: criteria.flatMap((criterion) =>
      criterion.missingMessage ? [criterion.missingMessage] : [],
    ),
  };
}
