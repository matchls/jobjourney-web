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
- **Design pass — thème & UI**
  - `src/app/globals.css` — palette Material You (hex), police Inter, dark mode override
  - `src/app/layout.tsx` — Inter font, favicon logo3, classe `light`
  - `src/app/icon.png` — favicon auto-détecté par Next.js
  - `src/components/app-sidebar.tsx` — sidebar redesignée (logo, nav active, CTA)
  - `src/components/app-header.tsx` — header avec recherche, icônes, avatar
  - `src/app/(app)/layout.tsx` — layout sidebar + header
  - `src/app/(app)/dashboard/page.tsx` — dashboard avec stats, entretiens, bento grid
  - `src/components/kanban/kanban-column.tsx` — colonnes redesignées
  - `src/components/kanban/application-card.tsx` — cartes avec badges étapes
  - `src/app/(app)/applications/[id]/page.tsx` — page détail avec breadcrumb, statuts
  - `src/components/application/interview-steps.tsx` — timeline entretiens
  - `src/components/application/preparation-tasks.tsx` — tâches + jauge SVG
  - `src/app/(app)/progression/page.tsx` — coach d'apprentissage (statique V1)
- `src/hooks/use-update-profile.ts` — mutation PATCH /users/me
- `src/app/(app)/settings/page.tsx` — page paramètres (mise à jour profil)
- `src/types/index.ts` — type DashboardData ajouté
- `src/hooks/use-dashboard.ts` — hook TanStack Query pour GET /dashboard
- `src/app/(app)/dashboard/page.tsx` — dashboard avec vraies données
- `src/app/page.tsx` — redirect vers /dashboard

## 🔄 En cours

- Design pass — page Candidatures (liste) à faire

## ⏭️ Prochaine étape

1. Design pass — page `/applications` (liste des candidatures)
2. Kanban — bouton "+" par colonne (fonctionnel)
3. Détail candidature — formulaires d'ajout étapes et tâches
4. V2 — endpoint /progression backend (compétences, questions récurrentes)

## Décisions importantes

- Tailwind v4 (pas de tailwind.config.js, tout en CSS)
- shadcn/ui Radix + preset Nova (Lucide icons + Geist font)
- TanStack Query pour tous les appels API
- Google OAuth → reporté en V1.1
- Le frontend démarre après que le backend V1 soit complet ✅
