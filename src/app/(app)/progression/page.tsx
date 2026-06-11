"use client";

import { useApplications } from "@/hooks/use-applications";
import type { ApplicationStatus } from "@/types";

const STATUSES: { status: ApplicationStatus; label: string }[] = [
  { status: "TARGETED", label: "À cibler" },
  { status: "APPLIED", label: "Candidaté" },
  { status: "INTERVIEWING", label: "Entretiens" },
  { status: "OFFER", label: "Offre" },
  { status: "REJECTED", label: "Refusé" },
];

export default function ProgressionPage() {
  const { data: applications = [], isLoading } = useApplications();

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Chargement...</p>;
  }

  const total = applications.length;
  const offers = applications.filter((a) => a.status === "OFFER").length;
  const rate = total > 0 ? Math.round((offers / total) * 100) : 0;

  return (
    <div className="flex flex-col gap-8 max-w-2xl">
      <h1 className="text-2xl font-bold tracking-tight">Progression</h1>

      <div className="grid grid-cols-3 gap-4">
        <div className="border border-border rounded-lg p-4">
          <p className="text-3xl font-bold">{total}</p>
          <p className="text-sm text-muted-foreground mt-1">Candidatures</p>
        </div>
        <div className="border border-border rounded-lg p-4">
          <p className="text-3xl font-bold">{offers}</p>
          <p className="text-sm text-muted-foreground mt-1">Offres reçues</p>
        </div>
        <div className="border border-border rounded-lg p-4">
          <p className="text-3xl font-bold">{rate}%</p>
          <p className="text-sm text-muted-foreground mt-1">Taux de succès</p>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold">Par statut</h2>
        {STATUSES.map(({ status, label }) => {
          const count = applications.filter((a) => a.status === status).length;
          return (
            <div
              key={status}
              className="flex items-center justify-between p-3 border border-border rounded-lg"
            >
              <p className="text-sm">{label}</p>
              <span className="text-sm font-medium">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
