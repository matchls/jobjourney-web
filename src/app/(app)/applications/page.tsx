"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  ChevronDown,
  Link2,
  Globe,
  MoreHorizontal,
  RotateCcw,
  Check,
  X,
  Leaf,
  Eye,
  Pencil,
  Trash2,
} from "lucide-react";
import { useApplications } from "@/hooks/use-applications";
import { useDeleteApplication } from "@/hooks/use-delete-application";
import { NewApplicationDialog } from "@/components/applications/new-application-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { Application, ApplicationStatus } from "@/types";

const STATUS_CONFIG: Record<
  ApplicationStatus,
  { label: string; className: string }
> = {
  TARGETED: { label: "À cibler", className: "bg-muted text-muted-foreground" },
  APPLIED: {
    label: "Candidaté",
    className: "bg-accent text-accent-foreground",
  },
  INTERVIEWING: {
    label: "Entretiens",
    className: "bg-primary/10 text-primary font-semibold",
  },
  OFFER: { label: "Offre", className: "bg-primary text-primary-foreground" },
  REJECTED: {
    label: "Refusé",
    className: "bg-destructive/10 text-destructive",
  },
};

function stepLabel(type: string, title: string) {
  if (type === "HR") return "RH";
  if (type === "TECHNICAL") return "TECH";
  if (type === "FINAL") return "FINAL";
  return title.slice(0, 4).toUpperCase();
}

function SourceBadge({ source }: { source?: string | null }) {
  const isCareer =
    source?.toLowerCase().includes("site") ||
    source?.toLowerCase().includes("carrière") ||
    source?.toLowerCase().includes("carriere");

  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      {isCareer ? (
        <Globe size={12} className="shrink-0" />
      ) : (
        <Link2 size={12} className="shrink-0" />
      )}
      <span className="truncate">{source ?? "—"}</span>
    </div>
  );
}

function StepProgress({ app }: { app: Application }) {
  const steps = (app.interviewSteps ?? []).sort((a, b) => a.order - b.order);
  const tasks = app.preparationTasks ?? [];
  const score =
    tasks.length > 0
      ? Math.round(
          (tasks.filter((t) => t.isCompleted).length / tasks.length) * 100,
        )
      : 0;

  return (
    <div className="flex flex-col gap-1 min-w-0">
      {steps.length > 0 ? (
        <div className="flex items-center gap-1.5 flex-wrap">
          {steps.map((step, i) => (
            <div key={step.id} className="flex items-center gap-1.5">
              {i > 0 && <div className="w-4 h-px bg-border" />}
              <div className="flex items-center gap-1">
                {step.status === "COMPLETED" ? (
                  <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center shrink-0">
                    <Check size={9} className="text-white" strokeWidth={3} />
                  </div>
                ) : step.status === "CANCELLED" ? (
                  <div className="w-4 h-4 rounded-full bg-destructive flex items-center justify-center shrink-0">
                    <X size={9} className="text-white" strokeWidth={3} />
                  </div>
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-border shrink-0" />
                )}
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
                  {stepLabel(step.type, step.title)}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        app.notes && (
          <p className="text-xs text-muted-foreground italic truncate">
            {app.notes}
          </p>
        )
      )}
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Préparation : {score}%
      </p>
    </div>
  );
}

export default function ApplicationsPage() {
  const { data: applications = [], isLoading } = useApplications();
  const [search, setSearch] = useState("");
  const router = useRouter();
  const { mutate: deleteApplication, error: deleteError } =
    useDeleteApplication();

  const filtered = search
    ? applications.filter((app) => {
        const q = search.toLowerCase();
        return (
          app.company.toLowerCase().includes(q) ||
          app.position.toLowerCase().includes(q)
        );
      })
    : applications;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Candidatures</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Retrouvez toutes vos candidatures et suivez leur avancement.
          </p>
        </div>
        <NewApplicationDialog />
      </div>

      {/* Filtres */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          />
          <input
            type="text"
            placeholder="Rechercher une entreprise ou un poste"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-border rounded-lg text-sm bg-card focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm font-medium bg-card hover:bg-muted transition-colors whitespace-nowrap">
          Tous les statuts
          <ChevronDown size={14} className="text-muted-foreground" />
        </button>
        <button className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm font-medium bg-card hover:bg-muted transition-colors whitespace-nowrap">
          Toutes les sources
          <ChevronDown size={14} className="text-muted-foreground" />
        </button>
      </div>

      {/* Liste */}
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Chargement...</p>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((app) => {
            const status = STATUS_CONFIG[app.status];
            const appliedDate = app.appliedAt
              ? new Date(app.appliedAt).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "short",
                })
              : null;

            return (
              <Link
                key={app.id}
                href={`/applications/${app.id}`}
                className="flex items-center gap-4 p-4 bg-card border border-border rounded-xl hover:border-primary/50 transition-colors"
              >
                {/* Icône entreprise */}
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-sm font-bold text-secondary-foreground shrink-0">
                  {app.company[0].toUpperCase()}
                </div>

                {/* Entreprise + Poste */}
                <div className="w-44 shrink-0 min-w-0">
                  <p className="font-semibold text-sm text-foreground truncate">
                    {app.company}
                  </p>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {app.position}
                  </p>
                </div>

                {/* Statut */}
                <span
                  className={cn(
                    "text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap shrink-0",
                    status.className,
                  )}
                >
                  {status.label}
                </span>

                {/* Source */}
                <div className="w-28 shrink-0">
                  <SourceBadge source={app.source} />
                </div>

                {/* Étapes + préparation */}
                <div className="flex-1 min-w-0">
                  <StepProgress app={app} />
                </div>

                {/* Date */}
                {appliedDate && (
                  <span className="text-xs text-muted-foreground shrink-0">
                    {appliedDate}
                  </span>
                )}

                {/* Menu */}
                <div
                  className="shrink-0 text-muted-foreground hover:text-foreground p-1 rounded"
                  onClick={(e) => e.preventDefault()}
                >
                  {app.status === "REJECTED" ? (
                    <RotateCcw size={16} />
                  ) : (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          aria-label="Actions"
                          className="p-1 rounded hover:bg-accent hover:text-foreground transition-colors"
                        >
                          <MoreHorizontal size={16} />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() =>
                            router.push(`/applications/${app.id}`)
                          }
                        >
                          <Eye size={14} />
                          Voir
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            router.push(`/applications/${app.id}/edit`)
                          }
                        >
                          <Pencil size={14} />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => {
                            if (confirm("Supprimer cette candidature ?")) {
                              deleteApplication(app.id);
                            }
                          }}
                        >
                          <Trash2 size={14} />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </Link>
            );
          })}

          {deleteError && (
            <p className="text-sm text-destructive">{deleteError.message}</p>
          )}

          {/* Card motivationnelle */}
          <div className="mt-2 p-8 border border-dashed border-border rounded-xl flex flex-col items-center gap-3 text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <Leaf size={22} className="text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                Cultivez votre réseau
              </p>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto leading-relaxed">
                {
                  "Continuez à enrichir votre liste pour multiplier vos chances. La régularité est la clé de la croissance professionnelle."
                }
              </p>
            </div>
            <button className="mt-1 text-xs font-semibold text-primary border border-primary/30 rounded-lg px-4 py-2 hover:bg-primary/10 transition-colors">
              {"Découvrir des opportunités"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
