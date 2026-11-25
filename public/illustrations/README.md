# TechLingo — Catalogue des illustrations (`public/illustrations/`)

Index complet des **54 images** générées en PNG (`512×512` ou `1024×1024`).  
**Style actuel :** illustration vectorielle plate (SVG exporté en PNG via `sharp`), sans texte ni emoji, palette bleu ciel (`#65bdf5` / `#2b6cb0` / `#17324d`), corail marketing (`#c4513a`) et sarcelle aéronautique (`#0b7f7b`).  
> Note : ce lot ne contient **pas de photos réalistes** (le générateur d'images IA était en erreur 429/quota) ; les personnages (onboarding et avatars) sont en style vectoriel plat.

---

## 1. Onboarding (`1024×1024`, PNG RGBA transparent)

| Fichier | URL publique | Description | Écran / usage |
|---|---|---|---|
| `public/illustrations/onboarding/speak-english-at-work.png` | `/illustrations/onboarding/speak-english-at-work.png` | Deux collègues en réunion autour d'un laptop avec bulles de dialogue abstraites (personnages vectoriels plats) | Slide 1 — `IntroCarousel.tsx` |
| `public/illustrations/onboarding/situations-path.png` | `/illustrations/onboarding/situations-path.png` | Parcours sinueux ascendant avec jalons (laptop tech, mégaphone marketing, avion, drapeau d'arrivée) | Slide 2 — `IntroCarousel.tsx` |
| `public/illustrations/onboarding/spaced-repetition.png` | `/illustrations/onboarding/spaced-repetition.png` | Cartes mémoire en boucle circulaire avec ampoule | Slide 3 — `IntroCarousel.tsx` |
| `public/illustrations/onboarding/friendly-leagues.png` | `/illustrations/onboarding/friendly-leagues.png` | Petit podium avec 3 collègues et trophée discret | Slide 4 — `IntroCarousel.tsx`, `AccountScreen.tsx` |

---

## 2. Avatars (`512×512`, PNG fond uni par domaine)

Bustes neutres et variés (personnages vectoriels plats, pas de transparence, fond uni couvrant tout le carré).

### Tech — fond bleu ciel `#65bdf5`
| Fichier | URL publique | Description |
|---|---|---|
| `public/illustrations/avatars/avatar-tech-1.png` | `/illustrations/avatars/avatar-tech-1.png` | Cheveux courts foncés, lunettes, pull col rond |
| `public/illustrations/avatars/avatar-tech-2.png` | `/illustrations/avatars/avatar-tech-2.png` | Cheveux bouclés, peau foncée, chemise bleue |
| `public/illustrations/avatars/avatar-tech-3.png` | `/illustrations/avatars/avatar-tech-3.png` | Chignon, lunettes, pull foncé |
| `public/illustrations/avatars/avatar-tech-4.png` | `/illustrations/avatars/avatar-tech-4.png` | Crâne rasé, barbe grise, rides discrètes |
| `public/illustrations/avatars/avatar-tech-5.png` | `/illustrations/avatars/avatar-tech-5.png` | Hijab bleu océan, pull col rond |

### Marketing — fond corail `#c4513a`
| Fichier | URL publique | Description |
|---|---|---|
| `public/illustrations/avatars/avatar-marketing-1.png` | `/illustrations/avatars/avatar-marketing-1.png` | Carré châtain, chemise sombre |
| `public/illustrations/avatars/avatar-marketing-2.png` | `/illustrations/avatars/avatar-marketing-2.png` | Cheveux courts, barbe, chemise bleue |
| `public/illustrations/avatars/avatar-marketing-3.png` | `/illustrations/avatars/avatar-marketing-3.png` | Chignon roux/corail, lunettes |
| `public/illustrations/avatars/avatar-marketing-4.png` | `/illustrations/avatars/avatar-marketing-4.png` | Cheveux courts noirs, peau foncée, pull clair |
| `public/illustrations/avatars/avatar-marketing-5.png` | `/illustrations/avatars/avatar-marketing-5.png` | Cheveux bouclés, lunettes, chemise bleue |

### Aéronautique & événementiel — fond sarcelle `#0b7f7b`
| Fichier | URL publique | Description |
|---|---|---|
| `public/illustrations/avatars/avatar-air-events-1.png` | `/illustrations/avatars/avatar-air-events-1.png` | Chignon sombre, col uniforme avec cravate |
| `public/illustrations/avatars/avatar-air-events-2.png` | `/illustrations/avatars/avatar-air-events-2.png` | Cheveux courts, barbe, uniforme cravate |
| `public/illustrations/avatars/avatar-air-events-3.png` | `/illustrations/avatars/avatar-air-events-3.png` | Carré châtain, lunettes, uniforme bleu |
| `public/illustrations/avatars/avatar-air-events-4.png` | `/illustrations/avatars/avatar-air-events-4.png` | Hijab marine, peau foncée, tenue neutre |
| `public/illustrations/avatars/avatar-air-events-5.png` | `/illustrations/avatars/avatar-air-events-5.png` | Cheveux courts gris, uniforme cravate |

---

## 3. Fin de leçon et d'unité (`1024×1024`, PNG RGBA transparent)

| Fichier | URL publique | Description | Écran / usage |
|---|---|---|---|
| `public/illustrations/results/lesson-success.png` | `/illustrations/results/lesson-success.png` | Badge vert menthe avec coche blanche et éclats discrets | `SituationScreen.tsx`, `LessonScreen.tsx` (réussite simple) |
| `public/illustrations/results/lesson-perfect.png` | `/illustrations/results/lesson-perfect.png` | Médaille étoilée or avec rubans bleus | `SituationScreen.tsx`, `LessonScreen.tsx` (sans faute) |
| `public/illustrations/results/unit-complete.png` | `/illustrations/results/unit-complete.png` | Drapeau doré planté au sommet d'un parcours | Fin d'unité (`PathMap` / `CourseScreen`) |

---

## 4. États vides (`1024×1024`, PNG RGBA transparent)

| Fichier | URL publique | Description | Écran / usage |
|---|---|---|---|
| `public/illustrations/empty/no-streak.png` | `/illustrations/empty/no-streak.png` | Calendrier aux cases vides et flamme éteinte | Série à 0 (`HomeScreen`, `ProfileScreen`) |
| `public/illustrations/empty/no-league.png` | `/illustrations/empty/no-league.png` | Podium vide avec contour de trophée en pointillés | `LeagueScreen.tsx` |
| `public/illustrations/empty/offline.png` | `/illustrations/empty/offline.png` | Nuage avec signal barré en corail | `LeagueScreen.tsx` (erreur réseau / hors-ligne) |
| `public/illustrations/empty/no-words.png` | `/illustrations/empty/no-words.png` | Carnet ouvert vide avec petit crayon | `DictionaryScreen.tsx` (liste vide / favoris vides) |
| `public/illustrations/empty/reviews-done.png` | `/illustrations/empty/reviews-done.png` | Pile de cartes rangée avec coche verte sereine | `ReviewScreen.tsx` / `PracticeScreen.tsx` (tout révisé) |
| `public/illustrations/empty/spin-done.png` | `/illustrations/empty/spin-done.png` | Roue quotidienne au repos avec coche centrale | `SpinScreen.tsx` (déjà tirée / vide) |
| `public/illustrations/empty/not-found.png` | `/illustrations/empty/not-found.png` | Panneau directionnel avec petite boussole | `NotFound.tsx` (404) |

---

## 5. Badges (`512×512`, PNG RGBA transparent)

Médailles en trait monochrome `#17324d` (à teinter bronze / argent / or en CSS ou filtre), correspondant aux 16 identifiants de `src/learning/badges.ts` :

| ID badge (`badges.ts`) | Fichier | URL publique | Pictogramme |
|---|---|---|---|
| `first_steps` | `public/illustrations/badges/first-steps.png` | `/illustrations/badges/first-steps.png` | Boussole |
| `lexicon` | `public/illustrations/badges/lexicon.png` | `/illustrations/badges/lexicon.png` | Livre ouvert |
| `mastery` | `public/illustrations/badges/mastery.png` | `/illustrations/badges/mastery.png` | Trophée |
| `streak` | `public/illustrations/badges/streak.png` | `/illustrations/badges/streak.png` | Flamme |
| `weekly` | `public/illustrations/badges/weekly.png` | `/illustrations/badges/weekly.png` | Calendrier coché |
| `speaker` | `public/illustrations/badges/speaker.png` | `/illustrations/badges/speaker.png` | Microphone |
| `recall` | `public/illustrations/badges/recall.png` | `/illustrations/badges/recall.png` | Flèche circulaire |
| `interview` | `public/illustrations/badges/interview.png` | `/illustrations/badges/interview.png` | Mallette |
| `pitch` | `public/illustrations/badges/pitch.png` | `/illustrations/badges/pitch.png` | Tableau de présentation |
| `precision` | `public/illustrations/badges/precision.png` | `/illustrations/badges/precision.png` | Cible |
| `memory` | `public/illustrations/badges/memory.png` | `/illustrations/badges/memory.png` | Cerveau |
| `wheel` | `public/illustrations/badges/wheel.png` | `/illustrations/badges/wheel.png` | Roue |
| `collector` | `public/illustrations/badges/collector.png` | `/illustrations/badges/collector.png` | Étoile |
| `polyvalent` | `public/illustrations/badges/polyvalent.png` | `/illustrations/badges/polyvalent.png` | Globe |
| `xp` | `public/illustrations/badges/xp.png` | `/illustrations/badges/xp.png` | Éclair |
| `guardian` | `public/illustrations/badges/guardian.png` | `/illustrations/badges/guardian.png` | Bouclier coché |

---

## 6. Ligues (`512×512`, PNG RGBA transparent)

| Fichier | URL publique | Description | Écran / usage |
|---|---|---|---|
| `public/illustrations/leagues/league-1-bronze.png` | `/illustrations/leagues/league-1-bronze.png` | Écu bronze simple avec chevron | `LeagueScreen.tsx` (palier 1) |
| `public/illustrations/leagues/league-2-silver.png` | `/illustrations/leagues/league-2-silver.png` | Écu argent avec petites ailes et double chevron | `LeagueScreen.tsx` (palier 2) |
| `public/illustrations/leagues/league-3-gold.png` | `/illustrations/leagues/league-3-gold.png` | Écu or avec lauriers et étoile centrale | `LeagueScreen.tsx` (palier 3) |
| `public/illustrations/leagues/league-4-sapphire.png` | `/illustrations/leagues/league-4-sapphire.png` | Écu bleu saphir ailé avec étoile à 4 branches | `LeagueScreen.tsx` (palier 4) |
| `public/illustrations/leagues/league-5-diamond.png` | `/illustrations/leagues/league-5-diamond.png` | Blason diamant facetté avec couronne dorée | `LeagueScreen.tsx` (palier 5) |

---

## 7. Carrière & Domaines (`PNG RGBA transparent`)

| Fichier | URL publique | Taille | Description | Écran / usage |
|---|---|---|---|---|
| `public/illustrations/career/interview-prep.png` | `/illustrations/career/interview-prep.png` | `1024×1024` | Candidat face au bureau avec mallette et fiche structurée | `CareerScreen.tsx`, `PitchScreen.tsx`, `QuestionScreen.tsx` |
| `public/illustrations/domains/tech.png` | `/illustrations/domains/tech.png` | `512×512` | Vignette bleu ciel avec ordinateur et balise code | Domaine `tech` (`OnboardingScreen`, `RolesScreen`) |
| `public/illustrations/domains/marketing.png` | `/illustrations/domains/marketing.png` | `512×512` | Vignette corail avec mégaphone | Domaine `marketing` (`OnboardingScreen`, `RolesScreen`) |
| `public/illustrations/domains/air-events.png` | `/illustrations/domains/air-events.png` | `512×512` | Vignette sarcelle avec avion | Domaine `air-events` (`OnboardingScreen`, `RolesScreen`) |
