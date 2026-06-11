"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { useDashboard } from "@/hooks/use-dashboard";

export default function DashboardPage() {
  const { user } = useAuth();
  const { data, isLoading } = useDashboard();

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Chargement...</p>;
  }

  return (
    <div className="flex flex-col gap-8 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Bonjour {user?.name ?? user?.email} 👋
        </h1>
        <p className="text-muted-foreground mt-1">Voici où tu en es.</p>
      </div>

      {/* Stats */}
      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold">Candidatures</h2>
        <div className="grid grid-cols-3 gap-3">
          <div className="border border-border rounded-lg p-4">
            <p className="text-3xl font-bold">{data?.stats.total ?? 0}</p>
            <p className="text-xs text-muted-foreground mt-1">Total</p>
          </div>
          <div className="border border-border rounded-lg p-4">
            <p className="text-3xl font-bold">
              {data?.stats.byStatus.INTERVIEWING ?? 0}
            </p>
            <p className="text-xs text-muted-foreground mt-1">En entretien</p>
          </div>
          <div className="border border-border rounded-lg p-4">
            <p className="text-3xl font-bold">
              {data?.stats.byStatus.OFFER ?? 0}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Offres</p>
          </div>
        </div>
      </div>

      {/* Prochains entretiens */}
      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold">Prochains entretiens</h2>
        {data?.upcomingInterviews.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aucun entretien planifié.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {data?.upcomingInterviews.map((step) => (
              <Link
                key={step.id}
                href={`/applications/${step.application.id}`}
                className="flex items-center justify-between p-3 border border-border rounded-lg hover:border-ring transition-colors"
              >
                <div>
                  <p className="text-sm font-medium">
                    {step.application.company}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {step.title} — {step.application.position}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  {new Date(step.scheduledAt).toLocaleDateString("fr-FR")}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
