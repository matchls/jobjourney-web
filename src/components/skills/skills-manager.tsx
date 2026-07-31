"use client";

import { useState } from "react";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import {
  useCreateSkill,
  useDeleteSkill,
  useSkills,
  useUpdateSkill,
} from "@/hooks/use-skills";

const inputClass =
  "min-w-0 flex-1 px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring";

export function SkillsManager() {
  const { data: skills = [], isLoading, error } = useSkills();
  const createSkill = useCreateSkill();
  const updateSkill = useUpdateSkill();
  const deleteSkill = useDeleteSkill();
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const mutationError =
    createSkill.error ?? updateSkill.error ?? deleteSkill.error;

  return (
    <div className="flex flex-col gap-4">
      {isLoading && (
        <p className="text-xs text-muted-foreground">Chargement...</p>
      )}
      {!isLoading && skills.length === 0 && (
        <p className="text-xs text-muted-foreground">
          Aucune compétence enregistrée.
        </p>
      )}
      <div className="flex flex-col gap-2">
        {skills.map((skill) =>
          editingId === skill.id ? (
            <form
              key={skill.id}
              onSubmit={(event) => {
                event.preventDefault();
                const name = editingName.trim();
                if (!name) return;
                updateSkill.mutate(
                  { skillId: skill.id, name },
                  { onSuccess: () => setEditingId(null) },
                );
              }}
              className="flex items-center gap-2"
            >
              <input
                autoFocus
                className={inputClass}
                value={editingName}
                onChange={(event) => setEditingName(event.target.value)}
                maxLength={100}
                required
              />
              <button
                type="submit"
                disabled={updateSkill.isPending}
                className="p-2 rounded-lg bg-primary text-primary-foreground disabled:opacity-50"
                aria-label={`Enregistrer ${skill.name}`}
              >
                <Check size={14} />
              </button>
              <button
                type="button"
                onClick={() => setEditingId(null)}
                className="p-2 rounded-lg border border-border hover:bg-muted"
                aria-label="Annuler"
              >
                <X size={14} />
              </button>
            </form>
          ) : (
            <div
              key={skill.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2"
            >
              <span className="text-xs font-medium text-foreground">
                {skill.name}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(skill.id);
                    setEditingName(skill.name);
                  }}
                  className="p-1.5 text-muted-foreground hover:text-foreground"
                  aria-label={`Modifier ${skill.name}`}
                >
                  <Pencil size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => deleteSkill.mutate(skill.id)}
                  disabled={deleteSkill.isPending}
                  className="p-1.5 text-muted-foreground hover:text-destructive disabled:opacity-50"
                  aria-label={`Supprimer ${skill.name}`}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ),
        )}
      </div>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const name = newName.trim();
          if (!name) return;
          createSkill.mutate(name, { onSuccess: () => setNewName("") });
        }}
        className="flex flex-col sm:flex-row gap-2"
      >
        <input
          className={inputClass}
          value={newName}
          onChange={(event) => setNewName(event.target.value)}
          placeholder="Nouvelle compétence"
          maxLength={100}
          required
        />
        <button
          type="submit"
          disabled={createSkill.isPending || !newName.trim()}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-semibold hover:bg-primary/90 disabled:opacity-50"
        >
          <Plus size={14} />
          Ajouter
        </button>
      </form>
      {(error || mutationError) && (
        <p className="text-xs text-destructive">
          {(error ?? mutationError)?.message}
        </p>
      )}
    </div>
  );
}
