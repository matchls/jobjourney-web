"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useUpdateProfile } from "@/hooks/use-update-profile";
import {
  SlidersHorizontal,
  Shield,
  Tag,
  ListChecks,
  ChevronRight,
  Download,
  LogOut,
  Trash2,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";

const SKILLS = [
  "React",
  "TypeScript",
  "Node.js",
  "SQL",
  "Docker",
  "System Design",
];

const inputClass =
  "w-full px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring";

function ProfileForm({
  defaultName,
  onCancel,
  onSuccess,
}: {
  defaultName: string;
  onCancel: () => void;
  onSuccess: () => void;
}) {
  const { mutate: updateProfile, isPending } = useUpdateProfile();
  const [name, setName] = useState(defaultName);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({ name: name || undefined }, { onSuccess });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 mt-4 pt-4 border-t border-border"
    >
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">
          Prénom
        </label>
        <input
          className={inputClass}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Votre prénom"
        />
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="text-xs font-semibold bg-primary text-primary-foreground rounded-lg px-4 py-2 hover:bg-primary/90 transition-colors"
        >
          {isPending ? "Enregistrement..." : "Enregistrer"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="text-xs font-semibold border border-border rounded-lg px-4 py-2 hover:bg-muted transition-colors"
        >
          Annuler
        </button>
      </div>
    </form>
  );
}

export default function SettingsPage() {
  const { user, isLoading, logout } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [notifEnabled, setNotifEnabled] = useState(true);

  if (isLoading || !user) {
    return <p className="text-sm text-muted-foreground">Chargement...</p>;
  }

  const initials = user.name
    ? user.name
        .split(" ")
        .filter(Boolean)
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : user.email.slice(0, 2).toUpperCase();

  return (
    <div className="flex flex-col gap-6 w-[80%] m-auto">
      <h1 className="text-2xl font-bold tracking-tight">Paramètres</h1>

      {/* Profil */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center text-lg font-bold shrink-0">
              {initials}
            </div>
            <div>
              <p className="font-semibold text-foreground">
                {user.name ?? "—"}
              </p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 bg-secondary text-secondary-foreground rounded-full">
                Membre
              </span>
            </div>
          </div>
          {!editMode && (
            <button
              onClick={() => setEditMode(true)}
              className="text-xs font-semibold border border-border rounded-lg px-4 py-2 hover:bg-muted transition-colors shrink-0"
            >
              Modifier le profil
            </button>
          )}
        </div>
        {editMode && (
          <ProfileForm
            defaultName={user.name ?? ""}
            onCancel={() => setEditMode(false)}
            onSuccess={() => setEditMode(false)}
          />
        )}
      </div>

      {/* Préférences */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={16} className="text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Préférences</h2>
        </div>
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div>
              <p className="text-sm font-medium text-foreground">
                {"Langue de l'interface"}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {"Choisissez votre langue préférée pour l'application."}
              </p>
            </div>
            <button className="text-xs font-semibold border border-border rounded-lg px-3 py-1.5 hover:bg-muted transition-colors">
              Français
            </button>
          </div>
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div>
              <p className="text-sm font-medium text-foreground">Apparence</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Basculez entre les modes clair et sombre.
              </p>
            </div>
            <div className="flex bg-muted p-0.5 rounded-lg text-xs font-semibold gap-0.5">
              <button className="px-3 py-1.5 bg-card rounded-md shadow-sm text-foreground">
                Clair
              </button>
              <button className="px-3 py-1.5 text-muted-foreground hover:text-foreground transition-colors">
                Sombre
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-foreground">
                Notifications Email
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {"Recevez des rappels pour vos entretiens à venir."}
              </p>
            </div>
            <button
              onClick={() => setNotifEnabled(!notifEnabled)}
              className={cn(
                "relative w-10 h-6 rounded-full transition-colors shrink-0",
                notifEnabled ? "bg-primary" : "bg-muted",
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all",
                  notifEnabled ? "left-[18px]" : "left-0.5",
                )}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Processus d'entretien */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <ListChecks size={16} className="text-primary" />
          <h2 className="text-sm font-semibold text-foreground">
            {"Processus d'entretien par défaut"}
          </h2>
        </div>
        <div className="bg-card border border-border rounded-xl p-5 flex flex-col gap-4">
          <p className="text-xs text-muted-foreground">
            {
              "Ces étapes seront appliquées automatiquement à chaque nouvelle candidature que vous créez."
            }
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            {["RH", "Technique", "Final"].map((step, i, arr) => (
              <div key={step} className="flex items-center gap-2">
                <span className="text-xs font-semibold border border-border rounded-lg px-3 py-1.5 bg-background">
                  {step}
                </span>
                {i < arr.length - 1 && (
                  <ChevronRight size={14} className="text-muted-foreground" />
                )}
              </div>
            ))}
            <button className="w-7 h-7 flex items-center justify-center border border-dashed border-border rounded-lg text-muted-foreground hover:border-primary hover:text-primary transition-colors">
              <Plus size={14} />
            </button>
          </div>
          <button className="text-xs font-semibold text-primary hover:underline text-left w-fit">
            {"Modifier les étapes par défaut →"}
          </button>
        </div>
      </div>

      {/* Tags de compétences */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Tag size={16} className="text-primary" />
          <h2 className="text-sm font-semibold text-foreground">
            Tags de compétences
          </h2>
        </div>
        <div className="bg-card border border-border rounded-xl p-5 flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            {SKILLS.map((skill) => (
              <span
                key={skill}
                className="text-xs font-medium px-3 py-1.5 bg-secondary text-secondary-foreground rounded-full border border-border"
              >
                {skill}
              </span>
            ))}
          </div>
          <button className="text-xs font-semibold border border-border rounded-lg px-4 py-2 w-fit hover:bg-muted transition-colors">
            Gérer les tags
          </button>
        </div>
      </div>

      {/* Sécurité */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Shield size={16} className="text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Sécurité</h2>
        </div>
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div>
              <p className="text-sm font-medium text-foreground">
                Mot de passe
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {"Dernière modification il y a 3 mois."}
              </p>
            </div>
            <button className="text-xs font-semibold text-primary hover:underline">
              Changer
            </button>
          </div>
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div>
              <p className="text-sm font-medium text-foreground">
                Compte Google
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{`Connecté en tant que ${user.email}`}</p>
            </div>
            <button className="text-xs font-semibold text-destructive hover:underline">
              Déconnecter
            </button>
          </div>
          <div className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-foreground">
                Sessions actives
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {"Vous êtes connecté sur plusieurs appareils."}
              </p>
            </div>
            <button className="text-xs font-semibold text-primary hover:underline">
              Voir tout
            </button>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <button className="w-full flex items-center justify-between p-4 border-b border-border hover:bg-muted/50 transition-colors text-left">
          <div className="flex items-center gap-3">
            <Download size={16} className="text-primary shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">
                Exporter mes données
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {"Téléchargez toutes vos candidatures au format JSON ou CSV."}
              </p>
            </div>
          </div>
          <ChevronRight size={16} className="text-muted-foreground shrink-0" />
        </button>
        <button
          onClick={logout}
          className="w-full flex items-center justify-between p-4 border-b border-border hover:bg-muted/50 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <LogOut size={16} className="text-muted-foreground shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">
                Se déconnecter
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {"Mettre fin à votre session actuelle."}
              </p>
            </div>
          </div>
          <ChevronRight size={16} className="text-muted-foreground shrink-0" />
        </button>
        <button className="w-full flex items-center justify-between p-4 hover:bg-red-50 transition-colors text-left">
          <div className="flex items-center gap-3">
            <Trash2 size={16} className="text-destructive shrink-0" />
            <div>
              <p className="text-sm font-medium text-destructive">
                Supprimer le compte
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {"Supprimer définitivement votre compte et toutes ses données."}
              </p>
            </div>
          </div>
          <ChevronRight size={16} className="text-muted-foreground shrink-0" />
        </button>
      </div>
    </div>
  );
}
