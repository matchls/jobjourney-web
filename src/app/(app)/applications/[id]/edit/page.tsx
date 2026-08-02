"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronRight, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useApplication } from "@/hooks/use-application";
import { useUpdateApplication } from "@/hooks/use-update-application";
import type { Application, ApplicationStatus } from "@/types";
import {
  fieldLabel,
  getUncertainFields,
  isAgentImport,
  needsImportReview,
} from "@/lib/agent-import";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";

const inputClass =
  "w-full px-3 py-2 border border-border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring";

const uncertainInputClass =
  "border-amber-300 focus:ring-amber-400 bg-amber-50/40";

const STATUS_OPTIONS: { value: ApplicationStatus; label: string }[] = [
  { value: "TARGETED", label: "À cibler" },
  { value: "APPLIED", label: "Candidaté" },
  { value: "INTERVIEWING", label: "Entretiens" },
  { value: "OFFER", label: "Offre" },
  { value: "REJECTED", label: "Refusé" },
];

export default function EditApplicationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: application, isLoading, isError } = useApplication(id);

  if (isLoading)
    return <p className="text-sm text-muted-foreground">Chargement...</p>;
  if (isError)
    return (
      <p className="text-sm text-destructive">
        Impossible de charger cette candidature.
      </p>
    );
  if (!application)
    return (
      <p className="text-sm text-muted-foreground">Candidature introuvable.</p>
    );

  // key={id} forces a remount (and a fresh useState) when navigating between
  // two different applications' edit pages, so stale field values from a
  // previously edited application can't leak into this one.
  return <EditForm key={id} id={id} application={application} />;
}

function FieldLabel({
  field,
  uncertainFields,
  children,
}: {
  field: string;
  uncertainFields: Set<string>;
  children: React.ReactNode;
}) {
  return (
    <label className="text-sm font-medium flex items-center gap-1.5 flex-wrap">
      {children}
      {uncertainFields.has(field) && (
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-1.5 py-0.5">
          <AlertCircle size={10} />
          À vérifier
        </span>
      )}
    </label>
  );
}

function fieldInputClass(field: string, uncertainFields: Set<string>) {
  return cn(inputClass, uncertainFields.has(field) && uncertainInputClass);
}

function EditForm({
  id,
  application,
}: {
  id: string;
  application: Application;
}) {
  const router = useRouter();
  const { mutate, isPending, error } = useUpdateApplication();
  const isPendingReview = needsImportReview(application);
  const uncertainFields = new Set(getUncertainFields(application));

  const [form, setForm] = useState({
    company: application.company,
    position: application.position,
    source: application.source ?? "",
    offerUrl: application.offerUrl ?? "",
    status: application.status,
    notes: application.notes ?? "",
    appliedAt: application.appliedAt ? application.appliedAt.slice(0, 10) : "",
    location: application.location ?? "",
    salary: application.salary ?? "",
    jobDescription: application.jobDescription ?? "",
    contactName: application.contactName ?? "",
    contactRole: application.contactRole ?? "",
    contactEmail: application.contactEmail ?? "",
    referralNote: application.referralNote ?? "",
    contractType: application.contractType ?? "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutate(
      {
        id,
        ...form,
        source: form.source || undefined,
        offerUrl: form.offerUrl || undefined,
        appliedAt: form.appliedAt
          ? new Date(form.appliedAt).toISOString()
          : undefined,
        location: form.location || undefined,
        salary: form.salary || undefined,
        jobDescription: form.jobDescription || undefined,
        contactName: form.contactName || undefined,
        contactRole: form.contactRole || undefined,
        contactEmail: form.contactEmail || undefined,
        referralNote: form.referralNote || undefined,
        contractType: form.contractType || undefined,
        confirmImportReview: isPendingReview ? true : undefined,
      },
      { onSuccess: () => router.push(`/applications/${id}`) },
    );
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link
          href="/applications"
          className="hover:text-foreground transition-colors"
        >
          Candidatures
        </Link>
        <ChevronRight size={14} />
        <Link
          href={`/applications/${id}`}
          className="hover:text-foreground transition-colors"
        >
          {application.position}
        </Link>
        <ChevronRight size={14} />
        <span className="text-foreground font-medium">Modifier</span>
      </nav>

      <h1 className="text-2xl font-bold">Modifier la candidature</h1>

      {isPendingReview && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">
              Candidature importée par l&apos;agent
            </p>
            <p className="text-xs text-amber-700 mt-1">
              {uncertainFields.size > 0
                ? `Vérifiez et corrigez les champs marqués « À vérifier » : ${Array.from(
                    uncertainFields,
                  )
                    .map(fieldLabel)
                    .join(", ")}. `
                : ""}
              Enregistrer valide automatiquement la revue de cette
              candidature.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <FieldLabel field="company" uncertainFields={uncertainFields}>
            Entreprise *
          </FieldLabel>
          <input
            className={fieldInputClass("company", uncertainFields)}
            value={form.company}
            onChange={(e) => setForm({ ...form, company: e.target.value })}
            required
          />
        </div>
        <div className="space-y-1">
          <FieldLabel field="position" uncertainFields={uncertainFields}>
            Poste *
          </FieldLabel>
          <input
            className={fieldInputClass("position", uncertainFields)}
            value={form.position}
            onChange={(e) => setForm({ ...form, position: e.target.value })}
            required
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Statut</label>
          <select
            className={inputClass}
            value={form.status}
            onChange={(e) =>
              setForm({ ...form, status: e.target.value as ApplicationStatus })
            }
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <FieldLabel field="source" uncertainFields={uncertainFields}>
            Source <span className="text-muted-foreground">(optionnel)</span>
          </FieldLabel>
          <input
            className={fieldInputClass("source", uncertainFields)}
            value={form.source}
            onChange={(e) => setForm({ ...form, source: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <FieldLabel field="offerUrl" uncertainFields={uncertainFields}>
            Lien offre{" "}
            <span className="text-muted-foreground">(optionnel)</span>
          </FieldLabel>
          <input
            className={fieldInputClass("offerUrl", uncertainFields)}
            type="url"
            value={form.offerUrl}
            onChange={(e) => setForm({ ...form, offerUrl: e.target.value })}
          />
          {isAgentImport(application) && !application.offerUrl && (
            <p className="text-xs text-muted-foreground">
              Offre source indisponible
            </p>
          )}
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">
            Date de candidature{" "}
            <span className="text-muted-foreground">(optionnel)</span>
          </label>
          <input
            className={inputClass}
            type="date"
            value={form.appliedAt}
            onChange={(e) => setForm({ ...form, appliedAt: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <FieldLabel field="location" uncertainFields={uncertainFields}>
              Localisation{" "}
              <span className="text-muted-foreground">(optionnel)</span>
            </FieldLabel>
            <input
              className={fieldInputClass("location", uncertainFields)}
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <FieldLabel field="salary" uncertainFields={uncertainFields}>
              Rémunération{" "}
              <span className="text-muted-foreground">(optionnel)</span>
            </FieldLabel>
            <input
              className={fieldInputClass("salary", uncertainFields)}
              value={form.salary}
              onChange={(e) => setForm({ ...form, salary: e.target.value })}
            />
          </div>
        </div>
        <div className="space-y-1">
          <FieldLabel field="contractType" uncertainFields={uncertainFields}>
            Type de contrat{" "}
            <span className="text-muted-foreground">(optionnel)</span>
          </FieldLabel>
          <input
            className={fieldInputClass("contractType", uncertainFields)}
            value={form.contractType}
            onChange={(e) =>
              setForm({ ...form, contractType: e.target.value })
            }
          />
        </div>
        <div className="space-y-1">
          <FieldLabel
            field="jobDescription"
            uncertainFields={uncertainFields}
          >
            Description du poste{" "}
            <span className="text-muted-foreground">(optionnel)</span>
          </FieldLabel>
          <textarea
            className={fieldInputClass("jobDescription", uncertainFields)}
            rows={3}
            value={form.jobDescription}
            onChange={(e) =>
              setForm({ ...form, jobDescription: e.target.value })
            }
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <FieldLabel field="contactName" uncertainFields={uncertainFields}>
              Nom du contact{" "}
              <span className="text-muted-foreground">(optionnel)</span>
            </FieldLabel>
            <input
              className={fieldInputClass("contactName", uncertainFields)}
              value={form.contactName}
              onChange={(e) =>
                setForm({ ...form, contactName: e.target.value })
              }
            />
          </div>
          <div className="space-y-1">
            <FieldLabel field="contactRole" uncertainFields={uncertainFields}>
              Rôle du contact{" "}
              <span className="text-muted-foreground">(optionnel)</span>
            </FieldLabel>
            <input
              className={fieldInputClass("contactRole", uncertainFields)}
              value={form.contactRole}
              onChange={(e) =>
                setForm({ ...form, contactRole: e.target.value })
              }
            />
          </div>
        </div>
        <div className="space-y-1">
          <FieldLabel field="contactEmail" uncertainFields={uncertainFields}>
            Email du contact{" "}
            <span className="text-muted-foreground">(optionnel)</span>
          </FieldLabel>
          <input
            className={fieldInputClass("contactEmail", uncertainFields)}
            type="email"
            value={form.contactEmail}
            onChange={(e) =>
              setForm({ ...form, contactEmail: e.target.value })
            }
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">
            Note de recommandation{" "}
            <span className="text-muted-foreground">(optionnel)</span>
          </label>
          <textarea
            className={inputClass}
            rows={2}
            value={form.referralNote}
            onChange={(e) =>
              setForm({ ...form, referralNote: e.target.value })
            }
          />
        </div>
        <div className="space-y-1">
          <FieldLabel field="notes" uncertainFields={uncertainFields}>
            Notes <span className="text-muted-foreground">(optionnel)</span>
          </FieldLabel>
          <textarea
            className={fieldInputClass("notes", uncertainFields)}
            rows={3}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </div>
        {error && (
          <p className="text-sm text-destructive">
            {error instanceof ApiError &&
            error.status === 409 &&
            error.code === "application_duplicate"
              ? "Une candidature existe déjà pour cette entreprise et ce poste. Vérifiez qu'il ne s'agit pas d'un doublon avant de valider."
              : error.message}
          </p>
        )}
        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={isPending}>
            {isPending
              ? "Enregistrement..."
              : isPendingReview
                ? "Enregistrer et valider"
                : "Enregistrer"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/applications/${id}`)}
          >
            Annuler
          </Button>
        </div>
      </form>
    </div>
  );
}
