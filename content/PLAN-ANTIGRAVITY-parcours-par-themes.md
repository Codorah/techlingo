# Plan Antigravity n°2 : parcours par thèmes techniques (nouveaux rôles puis rôles existants)

Lis d'abord `PRODUCT.md`, `CLAUDE.md` et surtout `content/paths/roles/README.md` (schéma, difficulté, règles). Ce plan **change l'angle** des parcours, il ne change pas le format.

## 0. Pourquoi (retour du propriétaire après test)
Les parcours actuels racontent des **situations de travail** (stand-up, revue de code). L'utilisateur connaît déjà son métier. Ce qu'il veut : **apprendre les thèmes techniques de son métier en anglais**, c'est-à-dire savoir expliquer, nommer et discuter chaque notion, pas apprendre le métier. Une unité = **un thème technique**, pas un scénario.

Exemples d'unités bien cadrées :
- Pilote : « Expliquer une check-list avant le décollage », « Lire et commenter un METAR », « Annoncer une panne à la tour ».
- Personnel navigant : « Présenter les consignes de sécurité », « Gérer un passager qui refuse d'obéir », « Prendre en charge un malaise à bord ».
- Hôtesse événementielle : « Accueillir et orienter un invité VIP », « Gérer une file d'attente et un badge refusé ».
- Organisateur : « Négocier un devis avec un prestataire », « Gérer un imprévu le jour J ».

Chaque unité doit répondre à : « Qu'est-ce que la personne saura **expliquer en anglais** à la fin ? ». Le `title_fr` nomme ce thème, `situation_fr` donne un contexte court, le `guide` explique la notion en français avec ses mots anglais.

## 1. Niveaux (obligatoire : l'app adapte le parcours au niveau)
L'app calcule le niveau d'une unité d'après le niveau des mots (`level`) de ses leçons, et masque les unités trop faciles pour l'utilisateur (au moins 2 niveaux en dessous). Donc :
- Ordre : du plus accessible au plus pointu.
- 6 à 8 unités par rôle. Au moins **2 unités à dominante C1** (leçons construites avec des mots `level: C1`), 2 à dominante B2, le reste B1 ou moins.
- Les `term_ids` d'une unité doivent donc être **homogènes en niveau** : ne mélange pas A1 et C1 dans une même unité. Vérifie le `level` de chaque mot dans `content/roles/<role>.json`.
- Les questions et productions montent aussi en exigence (C1 : nuance, registre, négociation, annonce sous pression).

## 2. Partie A : les 5 nouveaux rôles (priorité)
Pour chacun : `content/paths/roles/<role>.json` + `content/career/<role>.json`.

| Rôle | Mots disponibles | Thèmes à couvrir (adapte et complète) |
|---|---|---|
| cabin-crew | 260 (catégories cabin-safety, cabin-service, passenger-care, boarding-ground) | embarquement et accueil · consignes de sécurité · service repas et boissons · passagers difficiles · urgences médicales · évacuation et fumée · annonces à bord |
| pilot | 319 (flight-basics, aircraft-systems, cockpit-procedures, navigation, weather-aviation, atc-phraseology, abnormal-emergency) | bases du vol et instruments · check-lists · navigation et plan de vol · météo (METAR, TAF) · radio et contrôle aérien · pannes et urgences (Mayday, Pan-Pan) · coordination d'équipage (CRM) |
| event-hostess | 180 (event-reception, event-onsite) | accueil et badges · orientation et protocole · gestion des files · invités VIP · incident sur place · fin d'événement |
| event-manager | 180 (event-logistics, event-production, event-contracts, event-onsite) | cahier des charges · prestataires et devis · budget · technique et scénographie · planning rétro · jour J et gestion de crise |
| general-air-events | 120 (passenger-care, cabin-service) | service client en anglais · reformulation et politesse · gérer une plainte (mêmes règles, **5 unités** suffisent) |

Rappels du README à respecter : ids uniques commençant par l'id du rôle ; leçons avec 4 questions, 3 choix, `answer_index` varié ; explications qui disent aussi pourquoi les mauvais choix sont faux ; `production` exigeante ; 6 questions d'entretien par rôle avec `model_answer_en` de 60 à 110 mots et phrases-clés présentes mot pour mot ; `vocabulary_term_ids` existants uniquement.

**Exactitude** : phraséologie radio et consignes de sécurité = formules standard réelles. Au moindre doute, simplifie (les parcours n'ont pas de `review_note`). Pas de chiffres réglementaires présentés comme des faits.

Validation d'un rôle isolé : `npx tsx scripts/content/check-role.ts <role>`.

## 3. Partie B : réécrire les 19 parcours existants par thèmes (après la partie A)
Ne le fais **qu'après** que Claude a validé la partie A. Règles :
- **Conserve les ids des unités et leçons existants quand le thème reste le même** (la progression des utilisateurs est enregistrée par id). Si une unité change de thème, crée de nouveaux ids et ne réutilise pas les anciens.
- Un rôle à la fois, un fichier à la fois. Commence par `web-developer`, `devops-cloud`, `seo-sea`, `ecommerce`, puis les autres.
- Pour chaque rôle, vérifie d'abord la répartition des niveaux de ses mots, puis assure au moins 2 unités C1 (sinon un utilisateur C1 n'a presque rien à faire). Si les mots C1 manquent, **liste-les dans `content/NEEDS-C1-<role>.md`** plutôt que d'en inventer dans le parcours : Claude demandera un lot de mots dédié.
- Convertir plutôt que jeter : une situation bien écrite (revue de code, stand-up) peut devenir **la production finale** d'une unité thématique (« Expliquer ce qu'est une pull request » se termine par la rédaction d'un commentaire de PR).

## 4. Livraison
Un commit par rôle n'est pas nécessaire : travaille localement, lance pour chaque rôle `check-role.ts`, puis en fin de lot :
```
set -o pipefail
npm run content:validate
```
Puis rends-moi la main : je lance build et tests, je vérifie les ids, la répartition des niveaux par unité, les fuites de réponse dans les questions, et un échantillon d'exactitude.
