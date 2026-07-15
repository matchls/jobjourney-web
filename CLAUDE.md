# Job Journey — Web (Next.js)

## Règles de collaboration

- Avance fichier par fichier. Si un fichier est long, décompose-le en morceaux et explique chaque partie.
- Explique le pourquoi de chaque décision avant que le développeur écrive la moindre ligne.
- Pour chaque fichier : expliquer son rôle dans l'architecture ET sa logique de construction (comment il est organisé, dans quel ordre ça s'exécute) — sans décortiquer ligne par ligne, mais en donnant la vision d'ensemble avant les points clés.
- Réponds en français.
- **Niveau développeur : junior** (bootcamp fullstack 10 semaines). Les explications doivent être concises ET claires, accessibles à un débutant. Tu es expert, il est élève. Pas de jargon sans définition, pas d'étape sautée.
- **Fin de chaque feature commitable :** mettre à jour `PROGRESS.md` (✅ Fait, 🔄 En cours, ⏭️ Prochaine étape, décisions importantes), puis signaler exactement quand commiter avec le message formaté et la liste des fichiers concernés.

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS
- shadcn/ui
- TanStack Query
- JWT (cookies httpOnly) + Google OAuth

## Structure du projet

- `src/app/` — routes App Router
- `src/components/` — composants UI
- `src/lib/` — utilitaires, config API client

## Commandes utiles

```bash
npm run dev       # démarre le serveur de développement (Turbopack)
npm run build     # build de production
npm run lint      # lint ESLint
```
