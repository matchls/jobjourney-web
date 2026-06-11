"use client";

import { use } from "react";
import Link from "next/link";
import { ChevronRight, Pencil } from "lucide-react";
import { useApplication } from "@/hooks/use-application";
import { InterviewSteps } from "@/components/application/interview-steps";
import { PreparationTasks } from "@/components/application/preparation-tasks";
import type { ApplicationStatus } from "@/types";

const statusConfig: Record<
  ApplicationStatus,
  { label: string; className: string }
> = {
  TARGETED: { label: "À cibler", className: "bg-muted text-muted-foreground" },
  APPLIED: { label: "Candidaté", className: "bg-accent text-foreground" },
  INTERVIEWING: {
    label: "Entretiens",
    className: "bg-secondary text-primary font-semibold",
  },
  OFFER: { label: "Offre", className: "bg-primary text-primary-foreground" },
  REJECTED: {
    label: "Refusé",
    className: "bg-destructive/10 text-destructive",
  },
};

export default function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: application, isLoading } = useApplication(id);

  if (isLoading)
    return <p className="text-sm text-muted-foreground">Chargement...</p>;
  if (!application)
    return (
      <p className="text-sm text-muted-foreground">Candidature introuvable.</p>
    );

  const status = statusConfig[application.status];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link
          href="/applications"
          className="hover:text-foreground transition-colors"
        >
          Candidatures
        </Link>
        <ChevronRight size={14} />
        <span className="text-foreground font-medium">
          {application.position}
        </span>
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center text-primary font-bold text-lg shrink-0">
            {application.company[0].toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {application.position}
            </h1>
            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">
                {application.company}
              </span>
              {application.source && (
                <>
                  <span>•</span>
                  <span>{application.source}</span>
                </>
              )}
              <span
                className={`ml-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${status.className}`}
              >
                {status.label}
              </span>
            </div>
          </div>
        </div>
        <Link
          href={`/applications/${id}/edit`}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors shrink-0"
        >
          <Pencil size={14} />
          Modifier
        </Link>
      </div>

      {/* Interview Journey */}
      <section>
        <h2 className="text-xl font-semibold text-foreground mb-4">
          Interview Journey
        </h2>
        <InterviewSteps
          steps={application.interviewSteps}
          applicationId={application.id}
        />
      </section>

      {/* Préparation */}
      <section>
        <h2 className="text-xl font-semibold text-foreground mb-4">
          {"Préparation de l'entretien"}
        </h2>
        <PreparationTasks
          tasks={application.preparationTasks}
          applicationId={application.id}
        />
      </section>
    </div>
  );
}
