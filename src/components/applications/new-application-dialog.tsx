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

const inputClass =
  "w-full px-3 py-2 border border-border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring";

export function NewApplicationDialog() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CreateApplicationInput>({
    company: "",
    position: "",
    source: "",
    offerUrl: "",
  });

  const { mutate, isPending } = useCreateApplication();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutate(
      {
        company: form.company,
        position: form.position,
        source: form.source || undefined,
        offerUrl: form.offerUrl || undefined,
      },
      { onSuccess: () => setOpen(false) },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus size={16} className="mr-2" />
          Nouvelle candidature
        </Button>
      </DialogTrigger>
      <DialogContent>
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
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Création..." : "Créer la candidature"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
