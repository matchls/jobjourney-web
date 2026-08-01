"use client";

import { Suspense, useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { apiClient } from "@/lib/api";
import type { User } from "@/types";
import { Button } from "@/components/ui/button";
import { GoogleOAuthButton } from "@/components/auth/google-oauth-button";

const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  google_cancelled: "Connexion Google annulée.",
  invalid_state:
    "La tentative de connexion a expiré ou est invalide. Réessayez.",
  invalid_google_account: "Ce compte Google ne peut pas être utilisé.",
  account_conflict:
    "Un compte existe déjà avec cette adresse. Utilisez votre méthode de connexion habituelle.",
  google_oauth_failed: "La connexion Google a échoué. Réessayez.",
  google_not_configured: "La connexion Google n'est pas encore disponible.",
};

const GENERIC_OAUTH_ERROR = "La connexion Google a échoué. Réessayez.";

function getOAuthErrorMessage(code: string): string {
  return OAUTH_ERROR_MESSAGES[code] ?? GENERIC_OAUTH_ERROR;
}

function OAuthErrorNotice() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [oauthError] = useState<string | null>(() => {
    const code = searchParams.get("oauthError");
    return code ? getOAuthErrorMessage(code) : null;
  });

  useEffect(() => {
    if (oauthError) {
      router.replace("/login");
    }
  }, [oauthError, router]);

  if (!oauthError) return null;

  return <p className="text-sm text-destructive">{oauthError}</p>;
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    mutate: login,
    isPending,
    error,
  } = useMutation({
    mutationFn: (data: { email: string; password: string }) =>
      apiClient.post<{ user: User }>("/auth/login", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      router.push("/dashboard");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login({ email, password });
  };

  return (
    <div className="space-y-4">
      <Suspense fallback={null}>
        <OAuthErrorNotice />
      </Suspense>
      <GoogleOAuthButton />
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">ou</span>
        <div className="h-px flex-1 bg-border" />
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium">
            Mot de passe
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        {error && <p className="text-sm text-destructive">{error.message}</p>}
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "Connexion..." : "Se connecter"}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          Pas encore de compte ?{" "}
          <Link
            href="/register"
            className="text-foreground underline underline-offset-4"
          >
            {"S'inscrire"}
          </Link>
        </p>
      </form>
    </div>
  );
}
