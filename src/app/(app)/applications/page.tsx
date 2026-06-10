"use client";

import Link from "next/link";
import { useApplications } from "@/hooks/use-applications";
import { NewApplicationDialog } from "@/components/applications/new-application-dialog";

export default function ApplicationsPage() {
  const { data: applications = [], isLoading } = useApplications();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Candidatures</h1>
        <NewApplicationDialog />
      </div>

      {isLoading && (
        <p className="text-sm text-muted-foreground">Chargement...</p>
      )}

      {!isLoading && applications.length === 0 && (
        <p className="text-sm text-muted-foreground">
          {"Aucune candidature pour l'instant."}
        </p>
      )}

      <div className="flex flex-col gap-2">
        {applications.map((app) => (
          <Link
            key={app.id}
            href={`/applications/${app.id}`}
            className="flex items-center justify-between p-4 border border-border rounded-lg hover:border-ring transition-colors"
          >
            <div>
              <p className="font-medium text-sm">{app.company}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {app.position}
              </p>
            </div>
            <span className="text-xs text-muted-foreground">{app.status}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
