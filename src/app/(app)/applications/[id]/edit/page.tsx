"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useApplication } from "@/hooks/use-application";
import { useUpdateApplication } from "@/hooks/use-update-application";
import type { Application, ApplicationStatus } from "@/types";

const inputClass =
  "w-full px-3 py-2 border border-border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring";

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
  const { data: application, isLoading } = useApplication(id);

  if (isLoading)
    return <p className="text-sm text-muted-foreground">Chargement...</p>;
  if (!application)
    return (
      <p className="text-sm text-muted-foreground">Candidature introuvable.</p>
    );

  return <EditForm id={id} application={application} />;
}

function EditForm({
  id,
  application,
}: {
  id: string;
  application: Application;
}) {
  const router = useRouter();
  const { mutate, isPending } = useUpdateApplication();

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

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-medium">Entreprise *</label>
          <input
            className={inputClass}
            value={form.company}
            onChange={(e) => setForm({ ...form, company: e.target.value })}
            required
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Poste *</label>
          <input
            className={inputClass}
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
          <label className="text-sm font-medium">
            Source <span className="text-muted-foreground">(optionnel)</span>
          </label>
          <input
            className={inputClass}
            value={form.source}
            onChange={(e) => setForm({ ...form, source: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">
            Lien offre{" "}
            <span className="text-muted-foreground">(optionnel)</span>
          </label>
          <input
            className={inputClass}
            type="url"
            value={form.offerUrl}
            onChange={(e) => setForm({ ...form, offerUrl: e.target.value })}
          />
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
            <label className="text-sm font-medium">
              Localisation{" "}
              <span className="text-muted-foreground">(optionnel)</span>
            </label>
            <input
              className={inputClass}
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">
              Rémunération{" "}
              <span className="text-muted-foreground">(optionnel)</span>
            </label>
            <input
              className={inputClass}
              value={form.salary}
              onChange={(e) => setForm({ ...form, salary: e.target.value })}
            />
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">
            Description du poste{" "}
            <span className="text-muted-foreground">(optionnel)</span>
          </label>
          <textarea
            className={inputClass}
            rows={3}
            value={form.jobDescription}
            onChange={(e) =>
              setForm({ ...form, jobDescription: e.target.value })
            }
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">
              Nom du contact{" "}
              <span className="text-muted-foreground">(optionnel)</span>
            </label>
            <input
              className={inputClass}
              value={form.contactName}
              onChange={(e) =>
                setForm({ ...form, contactName: e.target.value })
              }
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">
              Rôle du contact{" "}
              <span className="text-muted-foreground">(optionnel)</span>
            </label>
            <input
              className={inputClass}
              value={form.contactRole}
              onChange={(e) =>
                setForm({ ...form, contactRole: e.target.value })
              }
            />
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">
            Email du contact{" "}
            <span className="text-muted-foreground">(optionnel)</span>
          </label>
          <input
            className={inputClass}
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
          <label className="text-sm font-medium">
            Notes <span className="text-muted-foreground">(optionnel)</span>
          </label>
          <textarea
            className={inputClass}
            rows={3}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </div>
        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Enregistrement..." : "Enregistrer"}
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
