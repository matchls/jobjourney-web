"use client";

import { useState } from "react";
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
  ArrowUpDown,
} from "lucide-react";
import { useApplications } from "@/hooks/use-applications";
import { useDeleteApplication } from "@/hooks/use-delete-application";
import { NewApplicationDialog } from "@/components/applications/new-application-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { Application, ApplicationStatus } from "@/types";

const STATUS_ORDER: ApplicationStatus[] = [
  "TARGETED",
  "APPLIED",
  "INTERVIEWING",
  "OFFER",
  "REJECTED",
];

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

type SortField = "statusChangedAt" | "appliedAt" | "company" | "status";
type SortOrder = "asc" | "desc";

const DEFAULT_SORT_FIELD: SortField = "statusChangedAt";
const DEFAULT_SORT_ORDER: SortOrder = "desc";

const SORT_FIELD_OPTIONS: { value: SortField; label: string }[] = [
  { value: "statusChangedAt", label: "Dernier changement" },
  { value: "appliedAt", label: "Date de candidature" },
  { value: "company", label: "Entreprise" },
  { value: "status", label: "Statut" },
];

const DATE_SORT_FIELDS: SortField[] = ["statusChangedAt", "appliedAt"];

function sortOrderLabel(field: SortField, order: SortOrder) {
  if (DATE_SORT_FIELDS.includes(field)) {
    return order === "desc" ? "Plus récent d'abord" : "Plus ancien d'abord";
  }
  return order === "asc" ? "A → Z" : "Z → A";
}

function compareApplications(
  a: Application,
  b: Application,
  field: SortField,
  order: SortOrder,
) {
  const direction = order === "asc" ? 1 : -1;

  if (field === "appliedAt") {
    const aTime = a.appliedAt ? new Date(a.appliedAt).getTime() : null;
    const bTime = b.appliedAt ? new Date(b.appliedAt).getTime() : null;
    if (aTime === null && bTime === null) return 0;
    if (aTime === null) return 1;
    if (bTime === null) return -1;
    return (aTime - bTime) * direction;
  }

  if (field === "statusChangedAt") {
    const aTime = new Date(a.statusChangedAt ?? a.createdAt).getTime();
    const bTime = new Date(b.statusChangedAt ?? b.createdAt).getTime();
    return (aTime - bTime) * direction;
  }

  if (field === "company") {
    return a.company.localeCompare(b.company, "fr") * direction;
  }

  return (
    (STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status)) *
    direction
  );
}

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
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | "ALL">(
    "ALL",
  );
  const [sourceFilter, setSourceFilter] = useState("ALL");
  const [sortField, setSortField] = useState<SortField>(DEFAULT_SORT_FIELD);
  const [sortOrder, setSortOrder] = useState<SortOrder>(DEFAULT_SORT_ORDER);
  const router = useRouter();
  const { mutate: deleteApplication, error: deleteError } =
    useDeleteApplication();

  const sources = Array.from(
    new Set(
      applications
        .map((app) => app.source)
        .filter((source): source is string => Boolean(source)),
    ),
  ).sort((a, b) => a.localeCompare(b, "fr"));

  const query = search.trim().toLowerCase();
  const filtered = applications.filter((app) => {
    const matchesSearch =
      query === "" ||
      [app.company, app.position, app.location, app.source].some((value) =>
        value?.toLowerCase().includes(query),
      );
    const matchesStatus =
      statusFilter === "ALL" || app.status === statusFilter;
    const matchesSource =
      sourceFilter === "ALL" || app.source === sourceFilter;
    return matchesSearch && matchesStatus && matchesSource;
  });

  const sortedApplications = [...filtered].sort((a, b) =>
    compareApplications(a, b, sortField, sortOrder),
  );

  const hasActiveFilters =
    query !== "" || statusFilter !== "ALL" || sourceFilter !== "ALL";

  function handleReset() {
    setSearch("");
    setStatusFilter("ALL");
    setSourceFilter("ALL");
  }

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
      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-[220px] relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          />
          <input
            type="text"
            placeholder="Rechercher une entreprise, un poste, une localisation ou une source"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-border rounded-lg text-sm bg-card focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm font-medium bg-card hover:bg-muted transition-colors whitespace-nowrap">
              {statusFilter === "ALL"
                ? "Tous les statuts"
                : STATUS_CONFIG[statusFilter].label}
              <ChevronDown size={14} className="text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-48">
            <DropdownMenuRadioGroup
              value={statusFilter}
              onValueChange={(value) =>
                setStatusFilter(value as ApplicationStatus | "ALL")
              }
            >
              <DropdownMenuRadioItem value="ALL">
                Tous les statuts
              </DropdownMenuRadioItem>
              {STATUS_ORDER.map((status) => (
                <DropdownMenuRadioItem key={status} value={status}>
                  {STATUS_CONFIG[status].label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm font-medium bg-card hover:bg-muted transition-colors whitespace-nowrap max-w-48">
              <span className="truncate">
                {sourceFilter === "ALL" ? "Toutes les sources" : sourceFilter}
              </span>
              <ChevronDown
                size={14}
                className="text-muted-foreground shrink-0"
              />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-48">
            <DropdownMenuRadioGroup
              value={sourceFilter}
              onValueChange={setSourceFilter}
            >
              <DropdownMenuRadioItem value="ALL">
                Toutes les sources
              </DropdownMenuRadioItem>
              {sources.map((source) => (
                <DropdownMenuRadioItem key={source} value={source}>
                  {source}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm font-medium bg-card hover:bg-muted transition-colors whitespace-nowrap">
              <ArrowUpDown size={14} className="text-muted-foreground" />
              {
                SORT_FIELD_OPTIONS.find((option) => option.value === sortField)
                  ?.label
              }
              <ChevronDown size={14} className="text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-48">
            <DropdownMenuRadioGroup
              value={sortField}
              onValueChange={(value) => setSortField(value as SortField)}
            >
              {SORT_FIELD_OPTIONS.map((option) => (
                <DropdownMenuRadioItem key={option.value} value={option.value}>
                  {option.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm font-medium bg-card hover:bg-muted transition-colors whitespace-nowrap">
              {sortOrderLabel(sortField, sortOrder)}
              <ChevronDown size={14} className="text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-48">
            <DropdownMenuRadioGroup
              value={sortOrder}
              onValueChange={(value) => setSortOrder(value as SortOrder)}
            >
              <DropdownMenuRadioItem value="asc">
                {sortOrderLabel(sortField, "asc")}
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="desc">
                {sortOrderLabel(sortField, "desc")}
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        {hasActiveFilters && (
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
          >
            <X size={14} />
            Réinitialiser
          </button>
        )}
      </div>

      {/* Liste */}
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Chargement...</p>
      ) : sortedApplications.length === 0 ? (
        <div className="p-12 border border-dashed border-border rounded-xl flex flex-col items-center gap-3 text-center">
          <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
            <Search size={20} className="text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              {hasActiveFilters
                ? "Aucune candidature ne correspond à ces filtres"
                : "Aucune candidature pour le moment"}
            </p>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto leading-relaxed">
              {hasActiveFilters
                ? "Essayez d'ajuster votre recherche ou vos filtres."
                : "Ajoutez votre première candidature pour commencer à suivre votre recherche."}
            </p>
          </div>
          {hasActiveFilters && (
            <button
              onClick={handleReset}
              className="mt-1 text-xs font-semibold text-primary border border-primary/30 rounded-lg px-4 py-2 hover:bg-primary/10 transition-colors"
            >
              Réinitialiser les filtres
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {sortedApplications.map((app) => {
            const status = STATUS_CONFIG[app.status];
            const appliedDate = app.appliedAt
              ? new Date(app.appliedAt).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "short",
                })
              : null;

            return (
              <div
                key={app.id}
                role="link"
                tabIndex={0}
                onClick={() => router.push(`/applications/${app.id}`)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    router.push(`/applications/${app.id}`);
                  }
                }}
                className="flex items-center gap-4 p-4 bg-card border border-border rounded-xl hover:border-primary/50 transition-colors cursor-pointer"
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
                  onClick={(e) => e.stopPropagation()}
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
              </div>
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
