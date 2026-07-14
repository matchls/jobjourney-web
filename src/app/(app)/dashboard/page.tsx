"use client";

import Link from "next/link";
import {
  FileText,
  MessageSquare,
  CheckCircle,
  XCircle,
  CalendarDays,
  CalendarCheck2,
  BookOpen,
  CheckCircle2,
  Circle,
} from "lucide-react";
import { useDashboard } from "@/hooks/use-dashboard";

export default function DashboardPage() {
  const { data, isLoading } = useDashboard();

  if (isLoading) {
    return <p className="p-6 text-sm text-muted-foreground">Chargement...</p>;
  }

  const firstInterview = data?.upcomingInterviews[0];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Priorité du jour */}
      <section className="bg-primary/5 border border-primary/20 p-6 rounded-xl">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-primary text-lg font-bold">⊙</span>
          <h2 className="text-lg font-semibold text-foreground">
            Priorité du jour
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3 p-4 bg-card rounded-xl border border-border shadow-sm">
            <CalendarDays size={18} className="text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-sm text-foreground leading-snug">
                {firstInterview
                  ? `Préparer ${firstInterview.title} chez ${firstInterview.application.company}`
                  : "Aucun entretien imminent"}
              </p>
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide mt-1 inline-block">
                Urgent
              </span>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 bg-card rounded-xl border border-border shadow-sm">
            <BookOpen size={18} className="text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-sm text-foreground leading-snug">
                Continuez à préparer vos prochains entretiens
              </p>
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide mt-1 inline-block">
                Apprentissage
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Tableau de Bord + stats */}
      <section>
        <div className="mb-4">
          <h2 className="text-2xl font-semibold text-foreground">
            Tableau de Bord
          </h2>
          <p className="text-sm text-muted-foreground">
            {"Bienvenue, voici l'état de votre parcours aujourd'hui."}
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-card border border-border p-6 rounded-xl hover:shadow-sm transition-all">
            <div className="mb-4">
              <span className="p-2 bg-secondary rounded-lg inline-flex">
                <FileText size={18} className="text-primary" />
              </span>
            </div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Total candidatures
            </p>
            <p className="text-4xl font-bold text-foreground mt-1">
              {data?.stats.total ?? 0}
            </p>
          </div>
          <div className="bg-card border border-border p-6 rounded-xl hover:shadow-sm transition-all">
            <div className="mb-4">
              <span className="p-2 bg-secondary rounded-lg inline-flex">
                <MessageSquare size={18} className="text-primary" />
              </span>
            </div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Entretiens en cours
            </p>
            <p className="text-4xl font-bold text-foreground mt-1">
              {data?.stats.byStatus.INTERVIEWING ?? 0}
            </p>
          </div>
          <div className="bg-card border border-border p-6 rounded-xl hover:shadow-sm transition-all">
            <div className="mb-4">
              <span className="p-2 bg-secondary rounded-lg inline-flex">
                <CalendarCheck2 size={18} className="text-primary" />
              </span>
            </div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Entretiens réalisés
            </p>
            <p className="text-4xl font-bold text-foreground mt-1">
              {data?.completedInterviews.total ?? 0}
            </p>
          </div>
          <div className="bg-card border border-border p-6 rounded-xl hover:shadow-sm transition-all">
            <div className="mb-4">
              <span className="p-2 bg-secondary rounded-lg inline-flex">
                <CheckCircle size={18} className="text-primary" />
              </span>
            </div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Offres reçues
            </p>
            <p className="text-4xl font-bold text-foreground mt-1">
              {data?.stats.byStatus.OFFER ?? 0}
            </p>
          </div>
          <div className="bg-card border border-border p-6 rounded-xl hover:shadow-sm transition-all">
            <div className="mb-4">
              <span className="p-2 bg-muted rounded-lg inline-flex">
                <XCircle size={18} className="text-muted-foreground" />
              </span>
            </div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Refus
            </p>
            <p className="text-4xl font-bold text-foreground mt-1">
              {data?.stats.byStatus.REJECTED ?? 0}
            </p>
          </div>
        </div>
      </section>

      {/* Entretiens réalisés par entreprise */}
      {data?.completedInterviews.byCompany &&
        Object.keys(data.completedInterviews.byCompany).length > 0 && (
          <section>
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-foreground">
                Entretiens réalisés par entreprise
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(data.completedInterviews.byCompany).map(
                ([company, count]) => (
                  <div
                    key={company}
                    className="bg-card border border-border p-4 rounded-xl flex items-center justify-between gap-2"
                  >
                    <p className="text-sm font-medium text-foreground truncate">
                      {company}
                    </p>
                    <p className="text-lg font-bold text-primary shrink-0">
                      {count}
                    </p>
                  </div>
                ),
              )}
            </div>
          </section>
        )}

      {/* Bento grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Prochains Entretiens */}
        <div className="col-span-12 lg:col-span-8 bg-card border border-border p-6 rounded-xl">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-foreground">
              Prochains Entretiens
            </h2>
            <CalendarDays size={18} className="text-muted-foreground" />
          </div>
          <div className="space-y-3">
            {!data?.upcomingInterviews.length ? (
              <p className="text-sm text-muted-foreground">
                Aucun entretien planifié.
              </p>
            ) : (
              data.upcomingInterviews.map((step) => {
                const date = new Date(step.scheduledAt);
                const month = date
                  .toLocaleDateString("fr-FR", { month: "short" })
                  .toUpperCase()
                  .replace(".", "");
                const day = date.getDate();
                const time = date.toLocaleTimeString("fr-FR", {
                  hour: "2-digit",
                  minute: "2-digit",
                });
                return (
                  <div
                    key={step.id}
                    className="flex items-center gap-4 p-4 border border-border rounded-xl hover:border-primary transition-colors"
                  >
                    <div className="w-14 h-14 bg-secondary rounded-lg flex flex-col items-center justify-center text-primary shrink-0">
                      <span className="text-[10px] font-bold uppercase">
                        {month}
                      </span>
                      <span className="text-xl font-bold leading-tight">
                        {day}
                      </span>
                    </div>
                    <div className="grow min-w-0">
                      <p className="text-sm font-semibold text-foreground">
                        {step.application.position}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5 flex-wrap">
                        <span className="font-semibold text-foreground">
                          {step.application.company}
                        </span>
                        <span className="w-1 h-1 bg-border rounded-full shrink-0" />
                        <span>{step.title}</span>
                        <span className="w-1 h-1 bg-border rounded-full shrink-0" />
                        <span>{time}</span>
                      </div>
                    </div>
                    <Link
                      href={`/applications/${step.application.id}`}
                      className="px-4 py-2 border border-border rounded-full text-xs font-medium text-foreground hover:bg-accent transition-all shrink-0"
                    >
                      Préparer
                    </Link>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Focus Apprentissage */}
        <div className="col-span-12 lg:col-span-4 bg-card border border-border p-6 rounded-xl">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Focus Apprentissage
          </h2>
          <div className="space-y-4">
            <div className="p-4 bg-secondary rounded-xl">
              <div className="flex items-center gap-2 text-primary mb-2">
                <BookOpen size={14} />
                <span className="text-xs font-semibold">
                  Ressource Recommandée
                </span>
              </div>
              <h4 className="text-sm font-bold text-foreground mb-1">
                Architecture System Design
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Compétence fréquemment évaluée en entretien technique.
              </p>
              <div className="mt-4 w-full bg-foreground/10 h-1 rounded-full">
                <div className="bg-primary h-full w-[65%] rounded-full" />
              </div>
            </div>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-sm text-muted-foreground px-2">
                <CheckCircle2 size={18} className="text-primary shrink-0" />
                <span>Revoir les principes SOLID</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-muted-foreground px-2">
                <Circle size={18} className="shrink-0" />
                <span>Pratiquer le Live Coding</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-muted-foreground px-2">
                <Circle size={18} className="shrink-0" />
                <span>Préparer les questions STAR</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
