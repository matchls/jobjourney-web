import { cn } from "@/lib/utils";
import { useUpdatePreparationTask } from "@/hooks/use-update-preparation-task";
import type { PreparationTask } from "@/types";

type Props = { tasks: PreparationTask[]; applicationId: string };

function ScoreGauge({ score }: { score: number }) {
  const label =
    score >= 80
      ? "Excellent"
      : score >= 60
        ? "Bon"
        : score >= 30
          ? "En progrès"
          : "À améliorer";

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-card border border-border rounded-xl">
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
            strokeDasharray={`${score} 100`}
            className="text-primary transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-foreground">{score}%</span>
          <span className="text-[10px] text-muted-foreground">{label}</span>
        </div>
      </div>
      <p className="text-xs text-muted-foreground text-center mt-3 leading-relaxed">
        {score === 100
          ? "Vous êtes prêt !"
          : "Encore quelques points à réviser pour être prêt à 100%."}
      </p>
    </div>
  );
}

export function PreparationTasks({ tasks, applicationId }: Props) {
  const { mutate: updateTask, isPending } = useUpdatePreparationTask();

  const completed = tasks.filter((t) => t.isCompleted).length;
  const score =
    tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Checklist */}
      <div className="bg-card border border-border rounded-xl p-5">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-4">
          Checklist de préparation
        </p>
        {tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aucune tâche de préparation.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {tasks.map((task) => (
              <label
                key={task.id}
                className="flex items-start gap-3 cursor-pointer"
              >
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
                  className="mt-0.5 accent-primary w-4 h-4 shrink-0"
                />
                <div>
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
                </div>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Score */}
      <ScoreGauge score={score} />
    </div>
  );
}
