"use client";

import { use } from "react";
import { useApplication } from "@/hooks/use-application";
import { InterviewSteps } from "@/components/application/interview-steps";
import { PreparationTasks } from "@/components/application/preparation-tasks";

export default function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: application, isLoading } = useApplication(id);

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Chargement...</p>;
  }

  if (!application) {
    return (
      <p className="text-sm text-muted-foreground">Candidature introuvable.</p>
    );
  }

  return (
    <div className="flex flex-col gap-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {application.company}
        </h1>
        <p className="text-muted-foreground mt-1">{application.position}</p>
        <span className="inline-block mt-2 text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
          {application.status}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold">{"Étapes d'entretien"}</h2>
          <InterviewSteps
            steps={application.interviewSteps}
            applicationId={application.id}
          />
        </div>
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold">Préparation</h2>
          <PreparationTasks
            tasks={application.preparationTasks}
            applicationId={application.id}
          />
        </div>
      </div>
    </div>
  );
}
