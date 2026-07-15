import Link from "next/link";
import { CalendarDays, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRelativeTime, getColumnEntryDate, isStale } from "@/lib/relative-time";
import type { Application } from "@/types";

type Props = { application: Application };

function stepLabel(type: string, title: string) {
  if (type === "HR") return "RH";
  if (type === "TECHNICAL") return "TECH";
  if (type === "FINAL") return "FINAL";
  return title.slice(0, 5).toUpperCase();
}

export function ApplicationCard({ application }: Props) {
  const hasSteps = (application.interviewSteps?.length ?? 0) > 0;
  const columnDate = getColumnEntryDate(application);
  const stale = isStale(application.status, columnDate);

  return (
    <Link
      href={`/applications/${application.id}`}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("application/id", application.id);
        e.dataTransfer.setData("application/status", application.status);
        e.dataTransfer.effectAllowed = "move";
      }}
      className="block p-4 bg-card border border-border rounded-xl hover:border-primary transition-colors cursor-grab active:cursor-grabbing"
    >
      <p className="font-semibold text-sm text-foreground truncate">
        {application.company}
      </p>
      <p className="text-sm text-primary truncate mt-0.5">
        {application.position}
      </p>

      {application.appliedAt && (
        <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
          <CalendarDays size={12} />
          <span>
            {new Date(application.appliedAt).toLocaleDateString("fr-FR", {
              day: "2-digit",
              month: "short",
            })}
          </span>
        </div>
      )}

      <div className="flex items-center gap-1.5 mt-2 text-xs">
        <Clock
          size={12}
          className={stale ? "text-amber-500" : "text-muted-foreground"}
        />
        <span
          className={cn(
            stale ? "text-amber-600 font-medium" : "text-muted-foreground",
          )}
        >
          {formatRelativeTime(columnDate)} dans cette colonne
        </span>
        {stale && (
          <span
            className="w-1.5 h-1.5 rounded-full bg-amber-500"
            title="Cette candidature stagne dans cette colonne"
          />
        )}
      </div>

      {hasSteps && (
        <div className="flex items-center gap-1.5 mt-3 flex-wrap">
          {(application.interviewSteps ?? [])
            .sort((a, b) => a.order - b.order)
            .map((step) => (
              <span
                key={step.id}
                className={cn(
                  "text-[10px] font-semibold px-2 py-0.5 rounded-full border",
                  step.status === "COMPLETED"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-transparent text-muted-foreground border-border",
                )}
              >
                {step.status === "COMPLETED"
                  ? `✓ ${stepLabel(step.type, step.title)}`
                  : stepLabel(step.type, step.title)}
              </span>
            ))}
        </div>
      )}
    </Link>
  );
}
