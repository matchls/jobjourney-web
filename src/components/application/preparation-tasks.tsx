import { useUpdatePreparationTask } from "@/hooks/use-update-preparation-task";
import type { PreparationTask } from "@/types";

type Props = {
  tasks: PreparationTask[];
  applicationId: string;
};

export function PreparationTasks({ tasks, applicationId }: Props) {
  const { mutate: updateTask, isPending } = useUpdatePreparationTask();

  if (tasks.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Aucune tâche de préparation.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {tasks.map((task) => (
        <label
          key={task.id}
          className="flex items-start gap-3 p-3 border border-border rounded-lg cursor-pointer hover:bg-accent transition-colors"
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
            className="mt-0.5 accent-primary"
          />
          <div>
            <p
              className={`text-sm font-medium ${task.isCompleted ? "line-through text-muted-foreground" : ""}`}
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
  );
}
