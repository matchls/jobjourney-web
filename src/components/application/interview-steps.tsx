import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  XCircle,
  Lock,
  Video,
  Calendar,
  Trash2,
  Plus,
} from "lucide-react";
import { useUpdateInterviewStep } from "@/hooks/use-update-interview-step";
import { useCreateInterviewStep } from "@/hooks/use-create-interview-step";
import { useDeleteInterviewStep } from "@/hooks/use-delete-interview-step";
import type { InterviewStep, InterviewStepType } from "@/types";
import { useState } from "react";

type Props = { steps: InterviewStep[]; applicationId: string };

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  const today = new Date();
  if (date.toDateString() === today.toDateString()) {
    return `Aujourd'hui • ${date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`;
  }
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

export function InterviewSteps({ steps, applicationId }: Props) {
  const { mutate: updateStep, isPending } = useUpdateInterviewStep();
  const { mutate: createStep, isPending: isCreating } =
    useCreateInterviewStep();
  const { mutate: deleteStep } = useDeleteInterviewStep();

  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState<InterviewStepType>("HR");

  const sorted = [...steps].sort((a, b) => a.order - b.order);
  const firstPlannedIndex = sorted.findIndex((s) => s.status === "PLANNED");

  return (
    <div className="flex flex-col gap-4">
      {sorted.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Aucune étape configurée.
        </p>
      )}
      {sorted.map((step, index) => {
        const isCompleted = step.status === "COMPLETED";
        const isCancelled = step.status === "CANCELLED";
        const isActive = index === firstPlannedIndex;
        const isFuture = step.status === "PLANNED" && !isActive;

        return (
          <div
            key={step.id}
            className={cn(
              "p-5 border rounded-xl transition-colors",
              isActive && "bg-primary/5 border-primary/30",
              (isCompleted || isFuture || isCancelled) &&
                "bg-card border-border",
              (isFuture || isCancelled) && "opacity-60",
            )}
          >
            <div className="flex items-start gap-4">
              {/* Icône statut */}
              <div className="shrink-0 mt-0.5">
                {isCompleted && (
                  <CheckCircle2 size={22} className="text-primary" />
                )}
                {isActive && (
                  <div className="w-6 h-6 rounded bg-primary flex items-center justify-center shrink-0">
                    <div className="w-2 h-2 bg-white rounded-sm" />
                  </div>
                )}
                {isFuture && (
                  <Lock size={18} className="text-muted-foreground" />
                )}
                {isCancelled && (
                  <XCircle size={22} className="text-destructive" />
                )}
              </div>

              {/* Contenu */}
              <div className="flex-1 min-w-0">
                {/* Titre + badge + date */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <h3
                      className={cn(
                        "font-semibold text-sm",
                        isActive && "text-primary",
                        (isFuture || isCancelled) && "text-muted-foreground",
                      )}
                    >
                      {step.title}
                    </h3>
                    <span
                      className={cn(
                        "text-[10px] font-semibold px-2 py-0.5 rounded-full",
                        isCompleted && "bg-muted text-muted-foreground",
                        isActive && "bg-primary text-primary-foreground",
                        isFuture && "bg-muted text-muted-foreground",
                        isCancelled && "bg-destructive/10 text-destructive",
                      )}
                    >
                      {isCompleted && "TERMINÉ"}
                      {isActive && "EN COURS"}
                      {isFuture && "À PLANIFIER"}
                      {isCancelled && "ANNULÉ"}
                    </span>
                  </div>
                  {isCompleted && step.completedAt ? (
                    <span className="text-xs font-medium text-muted-foreground">
                      Terminé le {formatDate(step.completedAt)}
                    </span>
                  ) : (
                    step.scheduledAt && (
                      <span
                        className={cn(
                          "text-xs font-medium",
                          isActive ? "text-primary" : "text-muted-foreground",
                        )}
                      >
                        {formatDate(step.scheduledAt)}
                      </span>
                    )
                  )}
                </div>

                {/* Notes */}
                {step.notes && (
                  <p className="text-sm text-muted-foreground mt-2 italic">
                    {step.notes}
                  </p>
                )}

                {/* Questions à poser + Focus révision — étape active */}
                {isActive && (step.questionsAsked || step.toReview) && (
                  <div className="grid grid-cols-2 gap-3 mt-3 p-3 bg-background rounded-lg border border-border">
                    {step.questionsAsked && (
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                          Questions à poser
                        </p>
                        {step.questionsAsked
                          .split("\n")
                          .filter(Boolean)
                          .map((q, i) => (
                            <p key={i} className="text-xs text-foreground">
                              — {q}
                            </p>
                          ))}
                      </div>
                    )}
                    {step.toReview && (
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                          Focus révision
                        </p>
                        {step.toReview
                          .split("\n")
                          .filter(Boolean)
                          .map((r, i) => (
                            <p key={i} className="text-xs text-foreground">
                              — {r}
                            </p>
                          ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Questions posées + À réviser — étapes terminées */}
                {isCompleted && (step.questionsAsked || step.toReview) && (
                  <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-border">
                    {step.questionsAsked && (
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                          Questions posées
                        </p>
                        <p className="text-xs text-foreground">
                          {step.questionsAsked}
                        </p>
                      </div>
                    )}
                    {step.toReview && (
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                          À réviser
                        </p>
                        <p className="text-xs text-foreground">
                          {step.toReview}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Toggle */}
                {!isFuture && !isCancelled && (
                  <button
                    disabled={isPending}
                    onClick={() =>
                      updateStep({
                        applicationId,
                        stepId: step.id,
                        status: isCompleted ? "PLANNED" : "COMPLETED",
                      })
                    }
                    className={cn(
                      "mt-3 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-50",
                      isCompleted
                        ? "border-border text-muted-foreground hover:bg-accent"
                        : "border-primary text-primary hover:bg-primary/10",
                    )}
                  >
                    {isCompleted ? "Marquer non terminé" : "Marquer terminé"}
                  </button>
                )}
              </div>

              {/* Boutons Zoom / Date — étape active uniquement */}

              {isActive && (
                <div className="flex flex-col gap-2 shrink-0">
                  <button className="flex items-center gap-2 text-xs font-semibold bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors whitespace-nowrap">
                    <Video size={13} />
                    Démarrer Zoom
                  </button>
                  <button className="flex items-center gap-2 text-xs font-medium border border-border px-4 py-2 rounded-lg hover:bg-muted transition-colors whitespace-nowrap">
                    <Calendar size={13} />
                    Modifier date
                  </button>
                </div>
              )}
              <button
                onClick={() => deleteStep({ applicationId, stepId: step.id })}
                className="shrink-0 text-muted-foreground hover:text-destructive transition-colors p-1"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        );
      })}
      {showForm ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createStep(
              {
                applicationId,
                title: newTitle,
                type: newType,
                order: steps.length,
              },
              {
                onSuccess: () => {
                  setShowForm(false);
                  setNewTitle("");
                  setNewType("HR");
                },
              },
            );
          }}
          className="flex flex-col sm:flex-row gap-2 sm:items-center mt-2"
        >
          <input
            autoFocus
            className="min-w-0 flex-1 px-3 py-2 border border-border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Nom de l'étape"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            required
          />
          <select
            className="px-3 py-2 border border-border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            value={newType}
            onChange={(e) => setNewType(e.target.value as InterviewStepType)}
          >
            <option value="HR">RH</option>
            <option value="TECHNICAL">Technique</option>
            <option value="FINAL">Final</option>
            <option value="CUSTOM">Autre</option>
          </select>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isCreating}
              className="px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isCreating ? "..." : "Ajouter"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-3 py-2 border border-border rounded-md text-sm hover:bg-muted transition-colors"
            >
              Annuler
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mt-2"
        >
          <Plus size={14} />
          Ajouter une étape
        </button>
      )}
    </div>
  );
}
