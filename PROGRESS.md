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

## 🔄 En cours

- Pages de l'app (dashboard, kanban, candidatures...)

## ⏭️ Prochaine étape

7. `src/app/(app)/layout.tsx` — layout protégé avec sidebar
8. `src/app/(app)/dashboard/page.tsx`
9. `src/app/(app)/kanban/page.tsx`
10. `src/app/(app)/applications/page.tsx`
11. `src/app/(app)/applications/[id]/page.tsx` — détail candidature
12. `src/app/(app)/progression/page.tsx`
13. `src/app/(app)/settings/page.tsx`

## Décisions importantes

- Tailwind v4 (pas de tailwind.config.js, tout en CSS)
- shadcn/ui Radix + preset Nova (Lucide icons + Geist font)
- TanStack Query pour tous les appels API
- Google OAuth → reporté en V1.1
- Le frontend démarre après que le backend V1 soit complet ✅
