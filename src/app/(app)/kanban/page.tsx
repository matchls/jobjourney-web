"use client";

import { useApplications } from "@/hooks/use-applications";
import { KanbanColumn } from "@/components/kanban/kanban-column";
import type { Application, ApplicationStatus } from "@/types";

const COLUMNS: { status: ApplicationStatus; label: string }[] = [
  { status: "TARGETED", label: "À cibler" },
  { status: "APPLIED", label: "Candidaté" },
  { status: "INTERVIEWING", label: "Entretiens" },
  { status: "OFFER", label: "Offre" },
  { status: "REJECTED", label: "Refusé" },
];
export default function KanbanPage() {
  const { data: applications = [], isLoading } = useApplications();

  const byStatus = (status: ApplicationStatus): Application[] =>
    applications.filter((app) => app.status === status);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map(({ status, label }) => (
          <KanbanColumn
            key={status}
            title={label}
            applications={byStatus(status)}
          />
        ))}
      </div>
    </div>
  );
}
