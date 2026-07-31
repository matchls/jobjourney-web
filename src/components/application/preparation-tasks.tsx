import { useState } from "react";
import { CheckCircle2, Circle, Plus, Trash2 } from "lucide-react";
import { useApplication } from "@/hooks/use-application";
import { useCreatePreparationTask } from "@/hooks/use-create-preparation-task";
import { useDeletePreparationTask } from "@/hooks/use-delete-preparation-task";
import { useSkills } from "@/hooks/use-skills";
import { useUpdatePreparationTask } from "@/hooks/use-update-preparation-task";
import {
  calculatePreparationScore,
  type PreparationScoreResult,
} from "@/lib/preparation-score";
import { cn } from "@/lib/utils";
import type { PreparationTask } from "@/types";

type Props = {
  tasks: PreparationTask[];
  applicationId: string;
};

function ScoreGauge({ result }: { result: PreparationScoreResult }) {
  const label =
    result.score >= 80
      ? "Excellent"
      : result.score >= 60
        ? "Bon"
        : result.score >= 30
          ? "En progrès"
          : "À améliorer";

  return (
    <div className="flex flex-col items-center p-6 bg-card border border-border rounded-xl">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-4">
        Score de préparation
      </p>
      <div className="relative w-28 h-28">
        <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
          <circle
            cx="18"
            cy="18"
            r="15.9"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            className="text-muted/40"
          />
          <circle
            cx="18"
            cy="18"
            r="15.9"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray={`${result.score} 100`}
            className="text-primary transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-foreground">
            {result.score}%
          </span>
          <span className="text-[10px] text-muted-foreground">{label}</span>
        </div>
      </div>

      <div className="w-full mt-5 space-y-2">
        {result.criteria.map((criterion) => (
          <div
            key={criterion.key}
            className="flex items-center justify-between gap-3 text-xs"
          >
            <div className="flex items-center gap-2 min-w-0">
              {criterion.isComplete ? (
                <CheckCircle2 size={14} className="text-primary shrink-0" />
              ) : (
                <Circle size={14} className="text-muted-foreground shrink-0" />
              )}
              <span className="text-foreground truncate">{criterion.label}</span>
            </div>
            <span className="font-semibold text-muted-foreground shrink-0">
              {criterion.earned}/{criterion.maximum} pts
            </span>
          </div>
        ))}
      </div>

      {result.missing.length === 0 ? (
        <p className="text-xs text-primary text-center mt-5 font-medium">
          Vous êtes prêt pour le prochain entretien.
        </p>
      ) : (
        <div className="w-full mt-5 pt-4 border-t border-border">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Pour améliorer le score
          </p>
          <ul className="space-y-1.5">
            {result.missing.map((message) => (
              <li key={message} className="text-xs text-muted-foreground">
                • {message}
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-[10px] text-muted-foreground text-center mt-4">
        Tâches 70 pts · date 15 pts · contexte 15 pts
      </p>
    </div>
  );
}

export function PreparationTasks({ tasks, applicationId }: Props) {
  const { data: application } = useApplication(applicationId);
  const { mutate: updateTask, isPending, error: updateError } =
    useUpdatePreparationTask();
  const {
    mutate: createTask,
    isPending: isCreating,
    error: createError,
  } = useCreatePreparationTask();
  const { mutate: deleteTask, error: deleteError } =
    useDeletePreparationTask();
  const { data: skills = [], error: skillsError } = useSkills();
  const [newTitle, setNewTitle] = useState("");
  const [newSkillId, setNewSkillId] = useState("");

  const scoreResult = calculatePreparationScore(
    tasks,
    application?.interviewSteps ?? [],
  );
  const mutationError = updateError ?? createError ?? deleteError ?? skillsError;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-card border border-border rounded-xl p-5">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-4">
          Checklist de préparation
        </p>
        {mutationError && (
          <p className="text-xs text-destructive mb-3">
            {mutationError.message}
          </p>
        )}
        {tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aucune tâche de préparation.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {tasks.map((task) => (
              <div key={task.id} className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={task.isCompleted}
                  disabled={isPending}
                  onChange={() =>
                    updateTask({
                      applicationId,
                      taskId: task.id,
                      isCompleted: !task.isCompleted,
                    })
                  }
                  className="mt-0.5 accent-primary w-4 h-4 shrink-0 cursor-pointer"
                  aria-label={`Marquer ${task.title} comme ${task.isCompleted ? "non terminée" : "terminée"}`}
                />
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      "text-sm font-medium",
                      task.isCompleted
                        ? "line-through text-muted-foreground"
                        : "text-foreground",
                    )}
                  >
                    {task.title}
                  </p>
                  {task.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {task.description}
                    </p>
                  )}
                  <select
                    value={task.skillId ?? ""}
                    disabled={isPending}
                    onChange={(event) =>
                      updateTask({
                        applicationId,
                        taskId: task.id,
                        skillId: event.target.value || null,
                      })
                    }
                    className="mt-2 max-w-full px-2 py-1 border border-border rounded-md bg-background text-xs text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    aria-label={`Compétence liée à ${task.title}`}
                  >
                    <option value="">Sans compétence</option>
                    {skills.map((skill) => (
                      <option key={skill.id} value={skill.id}>
                        {skill.name}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={() => deleteTask({ applicationId, taskId: task.id })}
                  className="shrink-0 text-muted-foreground hover:text-destructive transition-colors p-1"
                  aria-label={`Supprimer ${task.title}`}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
        <form
          onSubmit={(event) => {
            event.preventDefault();
            createTask(
              {
                applicationId,
                title: newTitle,
                order: tasks.length,
                skillId: newSkillId || undefined,
              },
              {
                onSuccess: () => {
                  setNewTitle("");
                  setNewSkillId("");
                },
              },
            );
          }}
          className="flex flex-col gap-2 mt-4"
        >
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              className="min-w-0 w-full sm:flex-1 px-3 py-1.5 border border-border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Nouvelle tâche..."
              value={newTitle}
              onChange={(event) => setNewTitle(event.target.value)}
              required
            />
            <button
              type="submit"
              disabled={isCreating || !newTitle}
              className="shrink-0 px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 sm:w-auto w-full flex items-center justify-center"
            >
              <Plus size={14} />
            </button>
          </div>
          <select
            value={newSkillId}
            onChange={(event) => setNewSkillId(event.target.value)}
            className="w-full px-3 py-1.5 border border-border rounded-md bg-background text-xs text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Sans compétence associée</option>
            {skills.map((skill) => (
              <option key={skill.id} value={skill.id}>
                {skill.name}
              </option>
            ))}
          </select>
        </form>
      </div>

      <ScoreGauge result={scoreResult} />
    </div>
  );
}
