import { CheckCircle2, XCircle, Lock, Video, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUpdateInterviewStep } from "@/hooks/use-update-interview-step";
import type { InterviewStep } from "@/types";

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

  if (steps.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">Aucune étape configurée.</p>
    );
  }

  const sorted = [...steps].sort((a, b) => a.order - b.order);
  const firstPlannedIndex = sorted.findIndex((s) => s.status === "PLANNED");

  return (
    <div className="flex flex-col gap-4">
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
                  {step.scheduledAt && (
                    <span
                      className={cn(
                        "text-xs font-medium",
                        isActive ? "text-primary" : "text-muted-foreground",
                      )}
                    >
                      {formatDate(step.scheduledAt)}
                    </span>
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
            </div>
          </div>
        );
      })}
    </div>
  );
}
