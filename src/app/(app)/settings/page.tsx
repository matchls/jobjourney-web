"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useUpdateProfile } from "@/hooks/use-update-profile";
import { Button } from "@/components/ui/button";

const inputClass =
  "w-full px-3 py-2 border border-border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring";

function ProfileForm({
  defaultName,
  email,
}: {
  defaultName: string;
  email: string;
}) {
  const { mutate: updateProfile, isPending, isSuccess } = useUpdateProfile();
  const [name, setName] = useState(defaultName);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({ name: name || undefined });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <h2 className="text-sm font-semibold">Profil</h2>
      <div className="space-y-1">
        <label className="text-sm font-medium">Email</label>
        <input className={inputClass} value={email} disabled />
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium">Prénom</label>
        <input
          className={inputClass}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ton prénom"
        />
      </div>
      {isSuccess && (
        <p className="text-sm text-green-600">Profil mis à jour.</p>
      )}
      <Button type="submit" disabled={isPending}>
        {isPending ? "Enregistrement..." : "Enregistrer"}
      </Button>
    </form>
  );
}

export default function SettingsPage() {
  const { user, isLoading } = useAuth();

  return (
    <div className="flex flex-col gap-8 max-w-md">
      <h1 className="text-2xl font-bold tracking-tight">Paramètres</h1>
      {isLoading || !user ? (
        <p className="text-sm text-muted-foreground">Chargement...</p>
      ) : (
        <ProfileForm defaultName={user.name ?? ""} email={user.email} />
      )}
    </div>
  );
}
