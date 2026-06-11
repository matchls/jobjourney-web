# Progression — Job Journey Web

## ✅ Fait

- Initialisation Next.js (App Router, TypeScript, Tailwind v4, Turbopack, src/)
- Connexion repo GitHub (origin/main)
- CLAUDE.md + règles de collaboration
- Nettoyage boilerplate (page.tsx, layout.tsx, public/)
- Setup shadcn/ui (Radix + Nova preset, Tailwind v4)
- TanStack Query installé
- `src/lib/api.ts` — client HTTP (fetch + credentials + gestion d'erreur)
- `src/types/index.ts` — types TypeScript (User, Application, InterviewStep, PreparationTask, Skill)
- `src/components/providers.tsx` — QueryClientProvider (TanStack Query)
- `layout.tsx` mis à jour avec `<Providers>`
- `src/app/(auth)/layout.tsx` — layout centré pour les pages auth
- `src/lib/auth.ts` — hook useAuth (TanStack Query + /auth/me)
- `src/app/(auth)/login/page.tsx` — page de connexion
- `src/app/(auth)/register/page.tsx` — page d'inscription
- `src/middleware.ts` — protection des routes (redirect si non connecté)
- `src/components/app-sidebar.tsx` — sidebar avec navigation et logout
- `src/app/(app)/layout.tsx` — layout protégé (sidebar + contenu)
- `src/app/(app)/dashboard/page.tsx` — page dashboard (placeholder)
- Correction gestion d'erreur API (format Zod fieldErrors)
- Correction register → redirect dashboard (backend auto-login)
- `src/hooks/use-applications.ts` — hook TanStack Query (GET /applications)
- `src/components/kanban/application-card.tsx` — carte candidature
- `src/components/kanban/kanban-column.tsx` — colonne kanban
- `src/app/(app)/kanban/page.tsx` — page kanban avec les 5 colonnes
- `src/hooks/use-create-application.ts` — mutation POST /applications
- `src/components/applications/new-application-dialog.tsx` — formulaire de création
- `src/app/(app)/applications/page.tsx` — liste des candidatures
- `src/hooks/use-application.ts` — fetch une candidature par id
- `src/hooks/use-update-interview-step.ts` — mutation PATCH statut étape
- `src/hooks/use-update-preparation-task.ts` — mutation PATCH tâche complétée
- `src/components/application/interview-steps.tsx` — section étapes d'entretien
- `src/components/application/preparation-tasks.tsx` — section tâches de préparation
- `src/app/(app)/applications/[id]/page.tsx` — page détail candidature
- `src/app/(app)/progression/page.tsx` — stats candidatures par statut
- `src/hooks/use-update-profile.ts` — mutation PATCH /users/me
- `src/app/(app)/settings/page.tsx` — page paramètres (mise à jour profil)

## ⏭️ Prochaine étape

1. Dashboard — vraies données (stats + prochains entretiens)
2. Kanban — bouton "+" par colonne pour créer directement
3. Page détail — formulaire d'ajout d'étapes et de tâches
4. V2 — endpoint /progression backend (compétences, questions récurrentes)

## Décisions importantes

- Tailwind v4 (pas de tailwind.config.js, tout en CSS)
- shadcn/ui Radix + preset Nova (Lucide icons + Geist font)
- TanStack Query pour tous les appels API
- Google OAuth → reporté en V1.1
- Le frontend démarre après que le backend V1 soit complet ✅
