import type { InterviewStepType } from "@/types";

export const DEFAULT_INTERVIEW_STEPS: InterviewStepType[] = [
  "HR",
  "TECHNICAL",
  "FINAL",
];

export const INTERVIEW_STEP_TYPE_LABELS: Record<InterviewStepType, string> = {
  HR: "RH",
  TECHNICAL: "Technique",
  FINAL: "Final",
  CUSTOM: "Autre",
};

const INTERVIEW_STEP_TYPE_TITLES: Record<InterviewStepType, string> = {
  HR: "Entretien RH",
  TECHNICAL: "Entretien technique",
  FINAL: "Entretien final",
  CUSTOM: "Étape personnalisée",
};

function isInterviewStepType(value: unknown): value is InterviewStepType {
  return (
    value === "HR" ||
    value === "TECHNICAL" ||
    value === "FINAL" ||
    value === "CUSTOM"
  );
}

// `defaultInterviewSteps` est stocké en JSON libre côté backend : on filtre
// les valeurs invalides et on retombe sur RH → Technique → Final si la liste
// est vide, pour rester cohérent avec la valeur par défaut du backend.
export function normalizeDefaultInterviewSteps(
  steps: unknown,
): InterviewStepType[] {
  const valid = Array.isArray(steps) ? steps.filter(isInterviewStepType) : [];
  return valid.length > 0 ? valid : DEFAULT_INTERVIEW_STEPS;
}

function occurrenceAt(steps: InterviewStepType[], index: number): number {
  const type = steps[index];
  return steps.slice(0, index + 1).filter((t) => t === type).length;
}

// Un même type en double devient "Technique" puis "Technique 2".
export function getStepOccurrenceLabel(
  steps: InterviewStepType[],
  index: number,
): string {
  const occurrence = occurrenceAt(steps, index);
  const base = INTERVIEW_STEP_TYPE_LABELS[steps[index]];
  return occurrence > 1 ? `${base} ${occurrence}` : base;
}

export function getStepOccurrenceTitle(
  steps: InterviewStepType[],
  index: number,
): string {
  const occurrence = occurrenceAt(steps, index);
  const base = INTERVIEW_STEP_TYPE_TITLES[steps[index]];
  return occurrence > 1 ? `${base} ${occurrence}` : base;
}
