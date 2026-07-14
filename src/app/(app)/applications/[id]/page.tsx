"use client";

import { use } from "react";
import Link from "next/link";
import {
  ChevronRight,
  Pencil,
  Share2,
  AlertTriangle,
  BookOpen,
  ExternalLink,
} from "lucide-react";
import { useApplication } from "@/hooks/use-application";
import { InterviewSteps } from "@/components/application/interview-steps";
import { PreparationTasks } from "@/components/application/preparation-tasks";
import type { ApplicationStatus } from "@/types";
import { useRouter } from "next/navigation";
import { useDeleteApplication } from "@/hooks/use-delete-application";
import { formatFrenchDate } from "@/lib/format-date";

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
  const router = useRouter();
  const { mutate: deleteApplication, isPending: isDeleting } =
    useDeleteApplication();

  if (isLoading)
    return <p className="text-sm text-muted-foreground">Chargement...</p>;
  if (!application)
    return (
      <p className="text-sm text-muted-foreground">Candidature introuvable.</p>
    );

  const status = statusConfig[application.status];
  const statusHistory = application.statusHistory ?? [];

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
      <div className="flex items-start justify-between gap-4 flex-wrap">
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
        <div className="flex items-center gap-2 flex-wrap">
          <button className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors">
            <Share2 size={14} />
            Partager
          </button>
          <button
            onClick={() => {
              if (confirm("Supprimer cette candidature ?")) {
                deleteApplication(id, {
                  onSuccess: () => router.push("/applications"),
                });
              }
            }}
            disabled={isDeleting}
            className="flex items-center gap-2 px-4 py-2 border border-destructive text-destructive rounded-lg text-sm font-medium hover:bg-destructive/10 transition-colors disabled:opacity-50"
          >
            Supprimer
          </button>
          <Link
            href={`/applications/${id}/edit`}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Pencil size={14} />
            Modifier
          </Link>
        </div>
      </div>

      {/* Informations */}
      {(application.location ||
        application.salary ||
        application.offerUrl ||
        application.jobDescription ||
        application.contactName ||
        application.contactRole ||
        application.contactEmail ||
        application.referralNote) && (
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-4">
            Informations
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-card border border-border rounded-xl p-4 space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {"Détails de l'offre"}
              </p>
              {application.location && (
                <div>
                  <p className="text-xs text-muted-foreground">Localisation</p>
                  <p className="text-sm text-foreground">
                    {application.location}
                  </p>
                </div>
              )}
              {application.salary && (
                <div>
                  <p className="text-xs text-muted-foreground">
                    Rémunération
                  </p>
                  <p className="text-sm text-foreground">
                    {application.salary}
                  </p>
                </div>
              )}
              {application.offerUrl && (
                <div>
                  <p className="text-xs text-muted-foreground">
                    {"Lien de l'offre"}
                  </p>
                  <a
                    href={application.offerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline inline-flex items-center gap-1 break-all"
                  >
                    {application.offerUrl}
                    <ExternalLink size={12} className="shrink-0" />
                  </a>
                </div>
              )}
              {application.jobDescription && (
                <div>
                  <p className="text-xs text-muted-foreground">
                    Description du poste
                  </p>
                  <p className="text-sm text-foreground whitespace-pre-line">
                    {application.jobDescription}
                  </p>
                </div>
              )}
            </div>
            <div className="bg-card border border-border rounded-xl p-4 space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Contact
              </p>
              {(application.contactName || application.contactRole) && (
                <div>
                  <p className="text-xs text-muted-foreground">Interlocuteur</p>
                  <p className="text-sm text-foreground">
                    {[application.contactName, application.contactRole]
                      .filter(Boolean)
                      .join(" — ")}
                  </p>
                </div>
              )}
              {application.contactEmail && (
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm text-foreground break-all">
                    {application.contactEmail}
                  </p>
                </div>
              )}
              {application.referralNote && (
                <div>
                  <p className="text-xs text-muted-foreground">
                    Note de recommandation
                  </p>
                  <p className="text-sm text-foreground whitespace-pre-line">
                    {application.referralNote}
                  </p>
                </div>
              )}
              {!application.contactName &&
                !application.contactRole &&
                !application.contactEmail &&
                !application.referralNote && (
                  <p className="text-sm text-muted-foreground">
                    Aucun contact renseigné.
                  </p>
                )}
            </div>
          </div>
        </section>
      )}

      {/* Dates clés */}
      <section>
        <h2 className="text-xl font-semibold text-foreground mb-4">
          Dates clés
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground">Créée le</p>
            <p className="text-sm font-medium text-foreground mt-1">
              {formatFrenchDate(application.createdAt)}
            </p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground">Candidaté le</p>
            <p className="text-sm font-medium text-foreground mt-1">
              {formatFrenchDate(application.appliedAt)}
            </p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground">
              Dernier changement de statut
            </p>
            <p className="text-sm font-medium text-foreground mt-1">
              {formatFrenchDate(application.statusChangedAt)}
            </p>
          </div>
        </div>
      </section>

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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <div className="bg-red-50/60 border border-red-100 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={13} className="text-red-500" />
              <p className="text-[10px] font-bold uppercase tracking-wider text-red-500">
                Points de vigilance
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-xs text-red-700">
                {"• Vérifiez les délais de réponse attendus."}
              </p>
              <p className="text-xs text-red-700">
                {"• Confirmez les détails logistiques avant l'entretien."}
              </p>
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3">
              Ressources
            </p>
            <div className="flex flex-col gap-2">
              {[
                { title: "Culture entreprise", sub: "Guide d'entretien" },
                { title: "Questions techniques", sub: "Fiche de révision" },
              ].map(({ title, sub }) => (
                <div
                  key={title}
                  className="flex items-center gap-3 p-2.5 bg-muted/40 rounded-lg"
                >
                  <div className="w-8 h-8 bg-secondary rounded-lg flex items-center justify-center shrink-0">
                    <BookOpen size={13} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-foreground">
                      {title}
                    </p>
                    <p className="text-[10px] text-muted-foreground">{sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Historique du statut */}
      <section>
        <h2 className="text-xl font-semibold text-foreground mb-4">
          Historique du statut
        </h2>
        {statusHistory.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aucun changement de statut enregistré pour le moment.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {statusHistory.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between text-sm bg-card border border-border rounded-lg px-4 py-2.5"
              >
                <span className="text-foreground">
                  {entry.fromStatus
                    ? statusConfig[entry.fromStatus].label
                    : "Création"}
                  {" → "}
                  <span className="font-medium">
                    {statusConfig[entry.toStatus].label}
                  </span>
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatFrenchDate(entry.changedAt)}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
