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

- Lien et source préremplis depuis une URL d'offre collée (issue #29, frontend uniquement — remontée par le smoke test de `jobjourney-api#18`) :
  - Problème : coller uniquement `https://www.linkedin.com/jobs/view/...` dans le panneau d'import envoyait l'URL comme `offerText` à Groq, qui ne pouvait rien en tirer (aucun scraping) — l'UI annonçait « aucun champ prérempli » alors que le lien **et** la plateforme sont déterministes
  - `job-offer-prefill.ts` étendu (pas de module parallèle) : `detectOfferUrlOnly` (le collage est-il *uniquement* une URL http(s) sûre ?), `sourceFromOfferUrl` (mapping déterministe domaine → source), `offerUrlPrefillFields`, `buildUrlPrefillSummary`
  - Deux tables de mapping explicites plutôt qu'une abstraction : `SOURCE_BY_DOMAIN` pour les domaines fixes (`linkedin.com` → LinkedIn, `welcometothejungle.com` → Welcome to the Jungle) et `SOURCE_BY_SITE_NAME` pour les sites à extension pays variable (`indeed` → Indeed, qui couvre `indeed.fr`, `indeed.co.uk`, `fr.indeed.com`, `indeed.com.mx`…)
  - **Comparaison par étiquette DNS, jamais par sous-chaîne** : le host doit être exactement le domaine ou se terminer par `.<domaine>`. C'est ce qui fait que `evil-linkedin.com`, `linkedin.com.evil.net`, `mylinkedin.com` et `indeedjobs.com` ne récupèrent pas le nom de la plateforme. Pour Indeed, ce qui suit l'étiquette `indeed` doit en plus ressembler à un suffixe public (1 ou 2 étiquettes alphabétiques de 2-3 lettres), sinon `indeed.evil.com` passerait
  - Un schéma explicite `http://` ou `https://` est requis (les deux sont acceptés, comme dans `sanitizeOfferUrl`) : c'est ce que produisent la barre d'adresse et les boutons « copier le lien », alors qu'un `linkedin.com` nu au milieu d'un texte serait ambigu. Tout espace/retour ligne dans le collage = c'est un texte → workflow IA inchangé
  - **Aucun appel Groq sur ce chemin** : le `return` anticipé est placé après les validations (vide / trop long) mais avant la pose du verrou `parsingRef` et de la génération de session — le chemin URL est purement synchrone, aucun `fetch` n'est émis
  - Le préremplissage passe par le `mergeOfferPrefill` existant : la garantie « une saisie manuelle n'est jamais écrasée » est héritée telle quelle (et ne peut pas diverger plus tard), et `keptFields` sert directement à dire à l'utilisateur ce qui a été conservé
  - Message dédié (`buildUrlPrefillSummary`) : « Lien de l'offre reconnu : N champs préremplis… », mention explicite quand la source n'a pas pu être déduite d'un domaine inconnu, et rappel de coller le texte complet pour le reste. Le « aucun champ vide n'a pu être prérempli » de l'IA ne peut plus apparaître pour une URL valide
  - Aucune métadonnée d'extraction sur ce chemin (rien n'a été interprété, donc rien à signaler « À vérifier ») ; celles d'une analyse précédente sont réinitialisées
  - Texte d'aide et placeholder du panneau adaptés pour rendre le comportement découvrable avant l'essai
  - Aucun scraping, aucune requête réseau supplémentaire, aucun changement backend
  - 22 tests ajoutés (105 au total) : LinkedIn/WTTJ/Indeed, sous-domaines, extensions pays d'Indeed, casse du host, domaines sosies, domaine inconnu, collage mixte texte+lien, `http://` accepté au même titre que `https://`, schéma manquant refusé, `javascript:`/`ftp:`/`user:pass@`, valeurs manuelles préservées, création finale, non-régression du workflow texte complet, marqueurs d'une analyse précédente effacés, fermeture/réouverture sans état résiduel

- Description du poste repliable sur la fiche candidature (issue #30, frontend uniquement) :
  - Problème : la carte « Détails de l'offre » explosait en hauteur dès qu'une annonce importée contenait une description complète, repoussant tout le reste de la fiche. La description est le **seul** champ de longueur libre de cette carte — les autres font une ligne chacun — c'est donc elle qui est repliée
  - `src/components/application/collapsible-text.tsx` — nouveau composant : bloc borné à `12rem` avec `overflow-hidden`, vrai `<button>` « Voir plus » / « Réduire » portant `aria-expanded` et `aria-controls` (focus clavier, Entrée et Espace natifs)
  - **Décision de repli mesurée sur le DOM réel** (`scrollHeight > clientHeight`), jamais sur un seuil de caractères : la même description ne s'enroule pas pareil selon la largeur d'écran, la police et le zoom de l'utilisateur — un seuil serait faux dans les trois cas (bouton inutile, ou texte coupé alors qu'il tenait)
  - **La mesure est court-circuitée quand le bloc est déplié** : sans `max-height`, `scrollHeight === clientHeight`, la mesure conclurait « rien n'est masqué » et supprimerait le bouton « Réduire », piégeant l'utilisateur en état déplié
  - `useLayoutEffect` (via un sélecteur isomorphe local de 2 lignes, aucune dépendance ajoutée) pour mesurer avant le premier paint : le bouton n'apparaît pas une frame en retard et le bloc ne saute pas. Repli sur `useEffect` en SSR, où il n'y a aucun layout à lire
  - `ResizeObserver` sur le paragraphe pour re-mesurer au redimensionnement / passage en écran étroit ; absence de l'API gérée (jsdom, vieux navigateurs) — la première mesure couvre le cas courant
  - `overflow-hidden` et jamais `overflow-auto` : une zone scrollable imbriquée dans une page qui défile déjà capture la molette et est inutilisable au toucher. Dégradé bas (`aria-hidden`, décoratif) pour signaler la coupe là où elle se produit
  - Donnée intacte : seul l'affichage est borné, le texte complet reste dans le DOM avec son `whitespace-pre-line`. Aucune écriture, aucun appel réseau, aucun changement backend
  - 9 tests ajoutés (114 au total). jsdom ne calculant aucun layout (`scrollHeight`/`clientHeight` valent 0), `page.test.tsx` stubbe les deux getters avec une simulation minimale (lignes × hauteur de ligne, clampée par le `max-height` inline) — le composant est donc testé sur la comparaison qu'il exécute réellement en navigateur, pas sur un chemin de repli : description courte sans contrôle, longue repliée, clic → déplié, second clic → replié, clavier (Entrée/Espace), texte intégral et retours à la ligne conservés, aucune classe de scroll imbriqué, autres informations de la fiche toujours visibles
- Message clair sur une candidature en doublon (issue #34, suite de `jobjourney-api#21`) :
  - L'API refuse désormais `POST /applications` avec `409` + `{ "error": { "code": "application_duplicate" } }`. Sans traitement dédié, la modale affichait le message générique « Erreur API », incompréhensible pour l'utilisateur
  - `src/lib/application-errors.ts` — nouvelle fonction pure `createApplicationErrorMessage()`, sur le même modèle que `parseOfferErrorMessage()` : la règle est testable seule et la modale reste une couche d'affichage
  - **Interception volontairement étroite** : le statut `409` **et** le code `application_duplicate` doivent tous deux correspondre. Le code seul ne suffit pas, et le statut seul serait bien trop large — `409` sert aussi à `idempotency_conflict`, qui doit garder son propre message
  - **Les autres erreurs sont renvoyées telles quelles** (`return error.message`) : la fonction n'ajoute qu'un cas, elle n'en remappe aucun. C'est ce qui garantit qu'aucun message existant ne change
  - Modale maintenue ouverte et champs conservés : **c'était déjà le comportement**, `setOpen(false)` et la réinitialisation du formulaire n'étant atteints qu'après un `await` réussi dans `handleSubmit`. Aucun code ajouté pour ça — mais des tests le verrouillent désormais, pour qu'un futur remaniement du `catch` ne casse pas la garantie en silence
  - Couvre aussi le flux de préremplissage IA sans ligne supplémentaire : les deux passent par le même `POST /applications`
  - Aucun changement backend, aucun changement du contrat API, `src/lib/api.ts` inchangé (`ApiError` exposait déjà `status` et `code`)
  - 17 tests ajoutés (131 au total) : 10 unitaires sur la règle (bon couple statut+code, mauvais statut, autre code `409`, `409` sans code, sosie non-`ApiError`, valeurs non-erreur, message serveur jamais réutilisé, passe-plat des autres erreurs) et 7 d'intégration sur la modale (message dédié, modale ouverte + 5 champs conservés, correction puis nouvel envoi réussi, autre erreur inchangée, autre code `409` inchangé, succès inchangé avec formulaire vidé, flux IA)
  - **Point ouvert signalé** : la page d'édition (`applications/[id]/edit`) intercepte déjà le même couple `409` + `application_duplicate`, en ligne et avec un libellé différent (vouvoyé). Hors périmètre de #34, mais la duplication de prédicat et l'écart de ton mériteraient d'être unifiés
- Fiabilisation de la limite de taille de l'offre (issue #28, trouvée pendant l'audit `jobjourney-api#18`) :
  - `MAX_OFFER_TEXT_LENGTH = 20000` est écrit en dur ici, la même limite vient de `MAX_LONG_TEXT` côté API, et **rien ne relie les deux dépôts**. Si l'API abaisse sa limite, le frontend laisse partir la requête et l'utilisateur lit « L'offre envoyée n'est pas valide » au lieu de « L'offre est trop longue »
  - **Option retenue parmi les trois de l'issue** : traiter le refus serveur comme source de vérité. Aucune coordination entre dépôts, aucun package partagé, aucun appel supplémentaire au chargement — contrairement aux options « exposer la limite par l'API » et « documenter le couplage », qui laissent la divergence possible ou coûtent un aller-retour
  - La validation locale à 20 000 **reste en place** : elle évite un aller-retour inutile dans le cas normal. Son commentaire dit désormais explicitement qu'elle est un garde-fou UX et **pas** la source de vérité, et le test qui fige la valeur a été renommé en conséquence (il gelait « l'alignement avec le backend », un alignement que rien ne garantit)
  - `isOfferLengthError()` couvre les trois formes du contrat actuel : `413`, code `payload_too_large`, et `validation_error` nommant `offerText`. Les deux premières étaient **déjà** correctement mappées ; le seul trou réel était la troisième
  - **Détection structurelle, jamais textuelle** : on regarde *quel champ* le serveur incrimine, jamais la phrase du validateur (« Too big… », « String must contain at most… »). Matcher ce texte remplacerait le couplage silencieux de l'issue par un couplage plus fragile encore, cassé par une montée de version de Zod ou un changement de langue. Un test passe quatre formulations différentes, dont une en français et une vide, pour verrouiller cette indépendance
  - Lecture saine parce que les garde-fous locaux excluent les autres causes d'un rejet de `offerText` : le texte est trimmé et refusé s'il est vide avant tout appel réseau, et c'est toujours une chaîne. Il ne reste que la longueur
  - `src/lib/api.ts` — `ApiError` porte désormais `fieldErrors` en plus de `status`/`code`. Ajout purement additif : la construction du `message` est inchangée, donc aucun message existant ne bouge
  - Aucun changement du contrat `POST /applications/parse-offer`, aucun changement backend, aucune dépendance ajoutée
  - 17 tests ajoutés (148 au total) : 11 unitaires (les trois formes de refus, indépendance à la formulation, autre champ ignoré, `fieldErrors` vide ou absent, autres erreurs, non-`ApiError`) et 6 d'intégration passant par le vrai client API — donc couvrant aussi la propagation des `fieldErrors` — dont le garde-fou local qui bloque toujours sans appel réseau et un texte pile à la limite qui part bien

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
