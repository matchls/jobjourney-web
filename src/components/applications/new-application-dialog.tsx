"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useCreateApplication } from "@/hooks/use-create-application";
import type { CreateApplicationInput } from "@/hooks/use-create-application";
import { Plus } from "lucide-react";
import { ApplicationStatus } from "@/types";

const inputClass =
  "w-full px-3 py-2 border border-border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring";

export function NewApplicationDialog({
  defaultStatus,
  trigger,
}: {
  defaultStatus?: ApplicationStatus;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const emptyForm: CreateApplicationInput & { appliedAt: string } = {
    company: "",
    position: "",
    source: "",
    offerUrl: "",
    status: defaultStatus ?? "TARGETED",
    appliedAt: "",
    location: "",
    salary: "",
    jobDescription: "",
    contactName: "",
    contactRole: "",
    contactEmail: "",
    referralNote: "",
  };
  const [form, setForm] = useState(emptyForm);

  const { mutate, isPending } = useCreateApplication();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutate(
      {
        company: form.company,
        position: form.position,
        source: form.source || undefined,
        offerUrl: form.offerUrl || undefined,
        status: form.status,
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
      { onSuccess: () => setOpen(false) },
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) {
          setForm({ ...emptyForm, status: defaultStatus ?? "TARGETED" });
        }
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm">
            <Plus size={16} className="mr-2" />
            Nouvelle candidature
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nouvelle candidature</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
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
            <label className="text-sm font-medium">
              Source <span className="text-muted-foreground">(optionnel)</span>
            </label>
            <input
              className={inputClass}
              placeholder="LinkedIn, Welcome to the Jungle..."
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
                onChange={(e) =>
                  setForm({ ...form, location: e.target.value })
                }
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
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Création..." : "Créer la candidature"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
