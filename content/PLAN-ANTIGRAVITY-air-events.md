# Plan Antigravity : domaine « Aéronautique et événementiel » (environ 1000 mots)

Lis d'abord `PRODUCT.md`, `CLAUDE.md` et `content/paths/roles/README.md`. Ce plan ne demande que du **contenu** : aucun changement de code. Claude relira ensuite (validate, build, qualité).

## 0. Principe pédagogique (important)
Le public connaît déjà son métier et le fait en français. TechLingo lui apprend **les thèmes techniques de son métier en anglais** : comment on nomme, explique et discute chaque notion, pas le métier lui-même. Chaque mot doit donc :
- être un terme réellement utilisé dans le métier (jamais inventé) ;
- avoir une `explanation_fr` qui dit ce que c'est **sans répéter le terme anglais entre parenthèses** dans `translation_fr` (l'app a longtemps donné la réponse ainsi : écris `consigne`, pas `consigne (prompt)`) ;
- avoir des exemples `ex1/ex2` où le terme apparaît **tel quel** dans la phrase anglaise (l'app en fait des phrases à trous) ;
- viser un niveau précis : voir répartition ci-dessous.

## 1. Niveaux (l'app adapte le parcours au niveau du profil)
Répartition cible par rôle, sinon un utilisateur C1 n'a rien à apprendre :
A1 5 % · A2 15 % · B1 30 % · B2 30 % · C1 20 %.
`level` = difficulté du **mot** pour un francophone du métier (A1 : `seat belt`; C1 : `unruly passenger protocol`, `force majeure clause`).

## 2. Domaine et rôles à créer
Ajouter dans `content/domains.json` : `{ "id": "air-events", "name_fr": "Aéronautique et événementiel", "name_en": "Aviation & Events", "icon": "Plane", "description_fr": "Personnel navigant, pilotage, accueil et événementiel", "generalRole": "general-air-events" }`.

Ajouter dans `content/roles.json` (domain `air-events`) :

| id | name_fr | mots |
|---|---|---|
| general-air-events | Accueil et service en général | 120 |
| cabin-crew | Personnel navigant commercial (hôtesse, steward) | 260 |
| pilot | Pilote et équipage de conduite | 260 |
| event-hostess | Hôtesse et accueil événementiel | 180 |
| event-manager | Organisation d'événements | 180 |

Total : 1000. Ne reprends aucun `term_en` ni `id` existant (cherche avant : `content/import/*.txt`, surtout `58-events-sponsorship-influence.txt` pour l'événementiel déjà couvert côté marketing). Si un mot existe déjà, ajoute le rôle `air-events` sur la ligne existante n'est PAS demandé : choisis un autre mot.

## 3. Catégories à ajouter dans `content/categories.json`
Format identique aux existantes (`id`, `name_fr`, `name_en`, `icon` lucide, `course_fr` 2 phrases, `tip_fr` 1 phrase, tutoiement, sans tiret cadratin). Une catégorie = un **thème technique** (c'est ce que l'app présente) :

- `cabin-safety` Sécurité en cabine · `cabin-service` Service à bord · `passenger-care` Passagers et situations difficiles · `boarding-ground` Embarquement et escale
- `flight-basics` Bases du vol · `cockpit-procedures` Procédures et check-lists · `navigation` Navigation · `atc-phraseology` Radio et contrôle aérien · `weather-aviation` Météo aéronautique · `aircraft-systems` Systèmes de l'avion · `abnormal-emergency` Pannes et urgences
- `event-reception` Accueil et protocole · `event-logistics` Logistique et prestataires · `event-production` Technique et scénographie · `event-contracts` Devis, budget et contrats · `event-onsite` Jour J et gestion de crise

## 4. Répartition en lots (un fichier = un lot de 80 à 130 mots)
Numérotation `80` à `89` dans `content/import/`, en-tête de commentaire comme les autres lots, tout en `status: draft` (le script le met).

| Fichier | Rôle(s) | Catégories | Mots |
|---|---|---|---|
| 80-air-general-service.txt | general-air-events | passenger-care, cabin-service | 120 |
| 81-cabin-safety.txt | cabin-crew | cabin-safety | 130 |
| 82-cabin-service-passengers.txt | cabin-crew | cabin-service, passenger-care, boarding-ground | 130 |
| 83-pilot-basics-systems.txt | pilot | flight-basics, aircraft-systems | 130 |
| 84-pilot-procedures-nav.txt | pilot | cockpit-procedures, navigation, weather-aviation | 130 |
| 85-atc-emergency.txt | pilot (+ cabin-crew prio faible) | atc-phraseology, abnormal-emergency | 100 |
| 86-event-reception.txt | event-hostess | event-reception | 100 |
| 87-event-hostess-onsite.txt | event-hostess | event-onsite, event-reception | 80 |
| 88-event-logistics-production.txt | event-manager | event-logistics, event-production | 100 |
| 89-event-contracts-crisis.txt | event-manager | event-contracts, event-onsite | 80 |

Un mot a un rôle principal (priorité 60 à 90) et éventuellement `general-air-events:30` ou un second rôle (priorité 30 à 50).

## 5. Format d'une ligne (identique à `CLAUDE.md`)
`id | level | roles(role:prio,...) | categories | pos | term_en | translation_fr | definition_en | explanation_fr | why_it_matters_fr | ex1_en | ex1_fr | ex2_en | ex2_fr [| review_note]`
- `pos` : noun, verb, adjective, adverb, phrase, acronym.
- Mélange : ~60 % noms, 20 % verbes (`to brief the passengers`, `to cross-check`), 20 % expressions et phrases-types dites vraiment (`Cabin crew, doors to automatic and cross-check`, `Please remain seated`, `Welcome to the event, may I see your badge?`).
- Inclure par rôle : acronymes (`ETOPS`, `CRM`, `METAR`, `QR code` pour l'accueil…) avec `pos: acronym`, faux amis du métier (`cabin` ≠ cabine de plage, `crew` ≠ équipe au sens large, `to board`, `stand` côté salon, `delay` ≠ délai) et au moins 15 % de mots C1.
- Phraséologie radio : uniquement des formules standard réelles (OACI, « Mayday », « Pan-Pan », « Roger », « Wilco », « Say again »). **Au moindre doute, mets le doute dans `review_note`**, ne l'invente pas.
- Pas de chiffres, de réglementation ni de procédures de compagnie présentés comme des faits si tu n'es pas sûr : reste générique et signale en `review_note`.
- Français : tutoiement dans les explications, accents corrects, pas de tiret cadratin, pas d'emoji.

## 6. Parcours (après les mots, dans un second temps)
Pas maintenant : on ne rédige les parcours (`content/paths/roles/<role>.json`) qu'une fois les mots relus. Quand ce sera le moment, structure-les **par thème technique** (une unité = un thème : « Expliquer les consignes de sécurité », « Dialoguer avec la tour de contrôle »…) avec les mêmes règles que `content/paths/roles/README.md` et au moins 2 unités plus difficiles (B2/C1).

## 7. Vérifications avant de rendre la main
```
set -o pipefail
npm run content:import
npm run content:validate
```
Puis rends-moi la main : je lance validate, build, tests et je relis un échantillon (exactitude, doublons, fuites de réponse, répartition des niveaux).
