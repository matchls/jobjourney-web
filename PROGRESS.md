# Progression — Job Journey Web

## ✅ Fait

- Initialisation Next.js (App Router, TypeScript, Tailwind v4, Turbopack, src/)
- Connexion repo GitHub (origin/main)
- CLAUDE.md + règles de collaboration
- Setup shadcn/ui, TanStack Query, client HTTP, types TypeScript
- Auth : login, register, middleware de protection des routes
- `src/hooks/use-applications.ts` — GET /applications
- `src/hooks/use-create-application.ts` — POST /applications
- `src/hooks/use-application.ts` — GET /applications/:id
- `src/hooks/use-update-interview-step.ts` — PATCH statut étape
- `src/hooks/use-update-preparation-task.ts` — PATCH tâche complétée
- `src/hooks/use-update-profile.ts` — PATCH /users/me
- `src/hooks/use-dashboard.ts` — GET /dashboard
- Pages : Dashboard, Kanban, Candidatures (liste + détail), Progression, Settings
- Composants : sidebar, header, kanban columns/cards, interview-steps, preparation-tasks
- **Design pass complet** — palette Material You, Inter, favicon, toutes les pages redesignées
- Dates de candidature et historique de statut :
  - Types : `Application.statusChangedAt`, `Application.statusHistory`, nouveau type `ApplicationStatusHistory`
  - `src/lib/relative-time.ts` — `formatRelativeTime` (pastille "il y a X jours/semaines/mois"), `getColumnEntryDate` (fallback `statusChangedAt` → `appliedAt` → `createdAt`), `isStale` (seuils TARGETED>14j, APPLIED>21j, INTERVIEWING>30j)
  - Carte Kanban (`application-card.tsx`) : pastille de temps dans la colonne + point ambre discret si stagnation (pas de déplacement automatique)
  - Champ "Date de candidature" (`appliedAt`) dans le formulaire de création et le formulaire d'édition
  - Page détail candidature : section "Historique du statut" (liste des transitions avec date en français)
- Date d'entretien (`scheduledAt`) éditable :
  - Formulaire d'ajout d'étape (`interview-steps.tsx`) : champ `datetime-local` optionnel
  - Étape existante (active ou future) : bouton "Modifier date"/"Planifier une date" → formulaire inline `datetime-local`, envoyé en ISO à l'API
  - `use-create-interview-step.ts` / `use-update-interview-step.ts` : invalident désormais `["applications", id]` **et** `["dashboard"]` pour que "Prochains entretiens" se mette à jour sans rechargement manuel
- Filtres page Candidatures (V1.1, issue #6) :
  - Recherche texte (entreprise, poste, localisation, source), filtre statut, filtre source (dérivé des données), bouton "Réinitialiser", état vide dédié
  - 100% client-side sur les données déjà chargées par `useApplications()` — aucun changement backend, pas de pagination serveur
  - Réutilisation de `DropdownMenuRadioGroup`/`DropdownMenuRadioItem` (déjà présents dans `dropdown-menu.tsx`, non utilisés jusqu'ici)
- Tri page Candidatures (V1.1, issue #7) :
  - Tri par : dernier changement de statut (`statusChangedAt`), date de candidature (`appliedAt`), entreprise (`company`), statut (`status`) — croissant/décroissant
  - Tri par défaut : dernier changement de statut décroissant (fallback `createdAt` si `statusChangedAt` absent)
  - Tri par statut basé sur l'ordre du pipeline (`STATUS_ORDER`), pas alphabétique — cohérent avec le Kanban
  - `appliedAt` absent → toujours trié en dernier, quel que soit le sens (évite qu'une candidature sans date de candidature remonte en tête en tri croissant)
  - Appliqué après les filtres existants (recherche/statut/source), sur une copie du tableau filtré (`[...filtered].sort(...)`)
  - Deux dropdowns cohérents avec les filtres existants ("Trier par" + "Ordre"), tri actif affiché directement dans les boutons
- Processus d'entretien par défaut dans Settings (V1.1, issue #8) :
  - Backend déjà prêt : `User.defaultInterviewSteps` (`GET /auth/me`, `GET`/`PATCH /users/me`), défaut `["HR","TECHNICAL","FINAL"]` — aucun changement backend nécessaire
  - `src/lib/interview-steps.ts` — helper partagé : normalisation (fallback RH → Technique → Final si vide/invalide), libellés FR, titres générés, gestion des doublons ("Technique" → "Technique 2")
  - Section Settings existante rendue dynamique (chips ajout/suppression RH/Technique/Final/Autre, doublons autorisés pour un 2e tour technique) + `use-update-profile.ts` étendu avec `defaultInterviewSteps`
  - `new-application-dialog.tsx` : après création de la candidature, crée automatiquement les étapes du processus par défaut de l'utilisateur (`POST /applications/:id/interview-steps` en boucle, best-effort via `Promise.allSettled` — un échec d'étape ne bloque pas la candidature déjà créée)
  - Aucun impact sur les candidatures existantes (logique uniquement au moment de la création)
- Revue des candidatures importées par agent (V1.1, issue #14, frontend uniquement — dépend de l'issue backend `jobjourney-api#6`) :
  - Types : `Application.creationSource` (`MANUAL`/`AGENT_IMPORT`), `importReviewStatus` (`NOT_REQUIRED`/`PENDING`/`REVIEWED`), `uncertainFields`, `agentImportMetadata`, `contractType`, `reviewedAt` — tous optionnels/nullables côté frontend, le backend ne garantit pas leur présence sur chaque candidature
  - `src/lib/agent-import.ts` — libellés FR partagés pour les noms de champs (`fieldLabel`, avec fallback humanisé pour les champs inconnus) et helpers de lecture sûrs : `isAgentImport`, `needsImportReview` (exige `creationSource === "AGENT_IMPORT"` **et** `importReviewStatus === "PENDING"`), `getUncertainFields` (fallback `[]`)
  - `src/components/applications/agent-import-badge.tsx` — `AgentSourceTag` (indication discrète "Import agent") et `ImportReviewBadge` (pastille ambre "À vérifier"), tous deux basés sur ces helpers
  - Page liste (`applications/page.tsx`) : badges dans chaque ligne, bouton de filtre "Imports à vérifier" (compteur des imports en attente), état d'erreur dédié, message d'état vide spécifique à ce filtre
  - Fiche candidature (`applications/[id]/page.tsx`) : bannière "à vérifier" avec CTA "Vérifier et valider", indicateur "Offre source indisponible" (affiché dès que l'offre est absente, même sans `agentImportMetadata`), section "Détails de l'import" (résumé, stack, score de confiance 0-100, champs incertains avec confiance par champ, date de revue), état d'erreur dédié
  - Formulaire d'édition (`applications/[id]/edit/page.tsx`) : champs incertains surlignés (bordure ambre + pastille "À vérifier"), nouveau champ "Type de contrat", le bouton "Enregistrer" devient "Enregistrer et valider" pour une candidature en attente de revue et envoie `confirmImportReview: true` dans le même PATCH (une seule action pour corriger + valider) — message dédié si le backend renvoie un 409 `application_duplicate`
  - `src/lib/api.ts` — nouvelle classe `ApiError` (message, `status`, `code`) pour distinguer les erreurs API par code plutôt que par message
  - `use-update-application.ts` étendu avec `contractType` et `confirmImportReview?: true` dans `UpdateApplicationInput` (le backend n'autorise pas la modification directe de `importReviewStatus`/`creationSource`/`uncertainFields`/`agentImportMetadata`/`reviewedAt` ; c'est lui qui gère la transition `PENDING` → `REVIEWED` et fixe `reviewedAt`)
  - Candidatures manuelles/Huntr non affectées : les badges/sections liés à l'import ne s'affichent que via `isAgentImport`/`needsImportReview`
- Import d'une offre avec l'IA dans la modale Nouvelle candidature (issue #23, dépend de `jobjourney-api#17` livré) :
  - Outillage de test frontend créé pour l'occasion (le projet n'en avait aucun) : Vitest + Testing Library + jsdom, `vitest.config.mts`, `vitest.setup.ts`, scripts `npm test` / `npm run test:watch`
  - `src/lib/job-offer-prefill.ts` — cœur testable de la fonctionnalité : liste blanche des 12 champs extractibles, `mergeOfferPrefill` (stratégie V1 : l'IA ne remplit **que** les champs vides, une saisie utilisateur n'est jamais écrasée), `buildPrefillSummary` (récap texte de ce qui a été prérempli/conservé), `parseOfferErrorMessage` (traduction des codes backend en messages simples, le message brut du serveur n'est jamais réaffiché), `sanitizeOfferUrl`
  - `src/hooks/use-parse-offer.ts` — `POST /applications/parse-offer` via le client API existant (cookie httpOnly) ; aucune invalidation de cache : l'endpoint ne persiste rien
  - `new-application-dialog.tsx` : action secondaire « Importer une offre avec l'IA » (pattern disclosure, `aria-expanded`), panneau avec textarea labellisé, mention explicite de l'analyse par IA, bouton « Traiter l'offre » (`aria-busy`, désactivé pendant l'appel, verrou `useRef` contre le double appel), `role="status"` pour le chargement/succès et `role="alert"` pour l'erreur
  - Le lien et la source déjà saisis sont transmis comme contexte (`offerUrl`/`sourceHint`), une URL inutilisable est retirée au lieu de faire échouer l'extraction
  - Champs « Type de contrat » et « Notes » ajoutés au formulaire de création (déjà acceptés par `POST /applications`, sinon l'extraction les aurait perdus) + `labels` désormais associés aux inputs (`htmlFor`/`id`)
  - Métadonnées d'extraction (`confidenceByField`, `uncertainFields`, `warnings`) volontairement non exploitées et jamais envoyées à la création : l'affichage est le périmètre de l'issue #24
  - Réponse tardive neutralisée : chaque extraction capture une génération de session (`useRef`) avant l'`await` ; fermer la modale incrémente cette génération, remet le verrou à zéro et appelle `reset()` sur la mutation. Une réponse **ou** une erreur qui arrive après la fermeture est ignorée (pas de `setForm`, pas de message, pas de déplacement de focus), donc la réouverture part toujours d'un formulaire vide
  - Confidentialité : le texte de l'offre ne vit que dans l'état de la modale (aucun `localStorage`/`sessionStorage`, aucun log, aucun analytics), aucune clé fournisseur côté frontend, aucun appel direct au fournisseur IA
  - 43 tests (parcours manuel inchangé, ouverture/fermeture sans perte, offre vide refusée avant appel réseau, loading, double appel bloqué, contrat d'appel, préremplissage complet/partiel, non-écrasement, champs utilisateur jamais préremplis, erreur API sans perte, aucune création pendant l'analyse, création finale avec les valeurs corrigées, réponse et erreur tardives ignorées après fermeture)

- Vérification des champs extraits par IA avant création (issue #24, suite de #23) :
  - Métadonnées exploitées côté modale uniquement : `uncertainFields` et `warnings` (le `confidenceByField` est volontairement ignoré — un pourcentage affiché à côté d'un champ se lit comme un fait sur l'offre, alors que `uncertainFields` porte déjà le signal utile)
  - `job-offer-prefill.ts` étendu (pas de structure parallèle) : `normalizeUncertainFields` filtre les noms reçus contre la liste blanche existante `OFFER_PREFILL_FIELDS` — un nom inconnu est ignoré au lieu de casser le rendu —, `normalizeExtractionWarnings` nettoie/dédoublonne, et `buildPrefillSummary` annonce en plus le nombre de champs à vérifier et de points signalés (lecteur d'écran)
  - Indicateur textuel « À vérifier » placé dans le `label` du champ concerné : il fait donc partie du nom accessible annoncé avec le champ, et le texte porte le sens (la pastille ambre et l'icône ne sont que du renfort). Le champ reste valide et n'empêche jamais la création
  - Encart « Points signalés par l'analyse » au-dessus du formulaire, non bloquant et visuellement distinct de l'erreur système ; masqué si la liste est vide
  - Champ considéré comme revu : toute saisie humaine passe par `updateField()`, qui met à jour la valeur **et** marque le champ revu. Un préremplissage IA passe par `setForm` et ne compte donc jamais comme une validation humaine. Le retrait est local au champ édité, sans nouvel appel IA
  - Fermeture de la modale : champs incertains, champs revus et warnings sont réinitialisés comme le reste de l'état d'import ; le mécanisme anti-réponse-tardive de #23 protège aussi ces métadonnées
  - Aucune persistance : les métadonnées ne sont ni envoyées à `POST /applications`, ni ajoutées au modèle `Application`, ni stockées

- Type de contrat et notes sur la fiche candidature (issue #27, remontée par l'audit `jobjourney-api#18`) :
  - `contractType` affiché dans la carte « Détails de l'offre », juste après la localisation
  - `notes` affichées dans une carte dédiée en pleine largeur (`sm:col-span-2`) avec `whitespace-pre-line` : ce sont des notes personnelles sur la candidature, pas un détail de l'annonce, d'où une carte à part
  - Condition d'affichage de la section « Informations » étendue à ces deux champs — sans ça, une candidature n'ayant que des notes gardait la section masquée
  - Premiers tests de rendu de la fiche (`page.test.tsx`) : hooks de données et sections entretiens/préparation mockés, `use(params)` résolu via un `act` awaité

## ⏭️ Plan V1 — Fonctionnalités manquantes

### 1. Bouton "+" Kanban (30 min)

- Passer `defaultStatus` prop au composant `NewApplicationDialog`
- Le dialog pré-sélectionne le statut de la colonne à l'ouverture
- Fichiers : `new-application-dialog.tsx`, `kanban-column.tsx`

### 2. Modifier une candidature (~2h)

- **Vérifier d'abord** que l'endpoint `PATCH /applications/:id` existe côté backend
- `src/hooks/use-update-application.ts` — mutation PATCH
- `src/app/(app)/applications/[id]/edit/page.tsx` — formulaire pré-rempli
  - Champs : company, position, source, status, notes, appliedAt
  - Même structure que le formulaire de création
- Fichiers : nouveau hook + nouvelle page

### 3. Ajouter / supprimer une étape d'entretien (~3h)

- **Vérifier d'abord** que les endpoints `POST /applications/:id/steps` et `DELETE /steps/:id` existent
- `src/hooks/use-create-interview-step.ts` — mutation POST
- `src/hooks/use-delete-interview-step.ts` — mutation DELETE
- Bouton "Ajouter une étape" dans `interview-steps.tsx` → ouvre un modal
  - Champs : title, type (HR/TECHNICAL/FINAL/CUSTOM), scheduledAt
- Bouton supprimer sur chaque étape (icône poubelle)
- Fichiers : 2 nouveaux hooks + modification `interview-steps.tsx`

### 4. Ajouter / supprimer une tâche de préparation (~2h)

- **Vérifier d'abord** que les endpoints `POST /applications/:id/tasks` et `DELETE /tasks/:id` existent
- `src/hooks/use-create-preparation-task.ts` — mutation POST
- `src/hooks/use-delete-preparation-task.ts` — mutation DELETE
- Formulaire inline sous la checklist : champ texte + bouton ajouter
- Bouton supprimer sur chaque tâche
- Fichiers : 2 nouveaux hooks + modification `preparation-tasks.tsx`

### 5. Supprimer une candidature (~1h)

- **Vérifier d'abord** que l'endpoint `DELETE /applications/:id` existe
- `src/hooks/use-delete-application.ts` — mutation DELETE
- Bouton "Supprimer" dans la page détail (avec confirmation)
- Après suppression : redirect vers `/applications`
- Fichiers : nouveau hook + modification `[id]/page.tsx`

---

**Total estimé : ~8-9h guidées**
**Ordre recommandé : 1 → 2 → 3 → 4 → 5**
**Pré-requis : vérifier les endpoints backend avant chaque feature**

## 🔄 En cours

- (rien)

## ⛔ Bloqué — dépendance backend

### Tags de compétences exploitables (V1.1, issue #9)

Investigation faite le 2026-07-31 sur `jobjourney-api` (branche `main` à jour, commit `ae0dc55`) : **l'API skills n'existe pas**, alors que le schéma Prisma modélise déjà la donnée. Aucun code métier frontend écrit sur `feature/usable-skills-tags` pour éviter de bricoler un faux stockage local — voir la PR de l'issue #9 pour le détail. Ce qui existe déjà côté backend vs ce qui manque :

**Déjà en place (schéma uniquement, `prisma/schema.prisma`) :**
- `model Skill { id, name, userId, interviewSteps InterviewStep[], preparationTasks PreparationTask[] }`
- Relation many-to-many `InterviewStep.skills <-> Skill.interviewSteps`
- `PreparationTask.skillId` (FK optionnelle vers `Skill`)

**Manquant côté backend (bloque tout le frontend) :**
1. Aucune route `/skills` montée dans `src/app.ts` — pas de `GET/POST/PATCH/DELETE /skills`, pas de controller/service/validator dédiés (à créer sur le modèle de `user.controller.ts` : `select: { id, name, userId, createdAt, updatedAt }` filtré par `userId` du token).
2. `interview-step.validator.ts` n'a aucun champ `skillIds` — impossible de rattacher une compétence à une étape d'entretien (ni en création ni en modification). `interview-step.service.ts` ne fait jamais de `connect`/`set` sur `skills`, et `getInterviewSteps`/`getApplicationById` n'incluent jamais `skills` dans la requête Prisma (`include`), donc même si la relation existait en DB elle ne serait pas renvoyée par l'API.
3. `preparation-task.validator.ts` accepte déjà `skillId` en création/modification (`z.string().optional()`), mais c'est inexploitable en pratique : `application.service.ts#getApplicationById` récupère `preparationTasks` sans `include: { skill: true }`, donc le frontend ne reçoit que l'id brut, jamais le nom de la compétence — et sans endpoint `/skills`, impossible de résoudre cet id côté client.

**Travail backend nécessaire avant de reprendre le frontend :**
- Créer `skill.routes.ts` + `skill.controller.ts` + `skill.service.ts` (+ validator zod) : CRUD complet scoping sur `userId`, monté sur `/skills` dans `app.ts`.
- Étendre `interview-step.validator.ts`/`.service.ts` pour accepter `skillIds: string[]` en création/modification et faire `connect`/`set` sur la relation `skills`.
- Ajouter `include: { skills: true }` sur les requêtes Prisma d'`interview-step.service.ts` qui retournent des steps.
- Ajouter `include: { skill: true }` sur `preparationTasks` dans `application.service.ts#getApplicationById` (et partout où une tâche de préparation est renvoyée) pour exposer le nom de la compétence liée.

Une fois ces 4 points livrés côté `jobjourney-api`, le frontend pourra implémenter l'issue #9 sans contournement : afficher/créer/modifier/supprimer des compétences dans Settings, les rattacher à une étape d'entretien et à une tâche de préparation.

## 🔮 V1.1 (après V1 déployée)

- Google OAuth
- Score de préparation amélioré
- Analytics enrichis
- Bouton "Partager" fonctionnel
- Bouton "Démarrer Zoom" fonctionnel
- Endpoint `/progression` backend (compétences, questions récurrentes, historique)

## 🔮 V2 (vision long terme)

- IA d'analyse des notes d'entretien
- Suggestions de révision
- Application mobile
- Import automatique d'offres

## Décisions importantes

- Tailwind v4 (pas de tailwind.config.js, tout en CSS)
- shadcn/ui Radix + preset Nova (Lucide icons)
- TanStack Query pour tous les appels API
- Police : Inter (remplace Geist)
- Palette : Material You tokens extraits des maquettes Stitch (hex)
- Dark mode désactivé volontairement (override CSS)
- Google OAuth → reporté en V1.1
- Pas de librairie de dates ajoutée (date-fns, dayjs...) pour le temps relatif — fonction maison suffisante pour le besoin (jours/semaines/mois)
