import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
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

  return (
    <Link
      href={`/applications/${application.id}`}
      className="block p-4 bg-card border border-border rounded-xl hover:border-primary transition-colors"
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
