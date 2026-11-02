# TechLingo

Apprendre l'**anglais du travail** : expliquer un bug, relire une pull request, présenter une campagne, répondre en entretien. Pour les francophones qui lisent déjà un peu d'anglais mais ne savent pas encore le **parler** dans leur métier.

- Application web installable (**PWA**), sans app store : https://techlinngo.vercel.app
- Fonctionne **hors ligne** après le premier chargement, **sans compte**, **sans publicité** : la progression reste sur l'appareil (IndexedDB), avec export et import de sauvegarde
- 2 domaines, 21 métiers : Informatique (web, mobile, data, IA, cloud/DevOps, cybersécurité, réseaux, QA, produit/design, gestion de projet) et Marketing (community management, SEO/SEA, contenu, growth, e-commerce, etc.)
- 2 096 mots, tous encore en **brouillon** (`status: draft`) en attente de relecture par des professionnels

Détails produit (public, ton, principes de design) : [PRODUCT.md](PRODUCT.md). Façon de travailler dans le dépôt : [CLAUDE.md](CLAUDE.md).

## Démarrer

```bash
npm install
npm run dev          # http://localhost:8080 (génère le contenu puis lance Vite)
```

## Pile technique

React 19, Vite, TypeScript, Tailwind v4, wouter, Dexie, Zod (schéma du contenu, à la compilation), i18next (`src/i18n/fr.json`), ts-fsrs (répétition espacée), MiniSearch, vite-plugin-pwa.

## Structure

```
src/                 l'application (écrans, composants, parcours, base locale, i18n)
content/             le contenu source : domaines, métiers, thèmes, parcours, carrière
  import/NN-*.txt    les mots, une ligne par mot (format dans CLAUDE.md)
public/              contenu généré, page de présentation (decouvrir/), pages légales, SEO
scripts/content/     import, validation et compilation du contenu
scripts/push/        rappels push (génération des clés VAPID, envoi planifié)
api/                 petite API Vercel pour les rappels
tests/, src/**/*.test.ts   tests vitest
docs/                push-setup.md (rappels), seo.md (référencement)
video/               projet Remotion de la vidéo de présentation (en pause)
www/                 ancienne application : non déployée, ne pas modifier
```

## Commandes

| Commande | Rôle |
|---|---|
| `npm run dev` | Application en local sur le port 8080 |
| `npm run app:build:drafts` | Build de production (ce que lance Vercel) |
| `npm run app:preview` | Prévisualise le build |
| `npm test` | Tests vitest |
| `npm run typecheck` | Vérification TypeScript |
| `npm run content:import` | Écrit `content/roles/<métier>.json` depuis `content/import/` |
| `npm run content:validate` | Valide tout le contenu |
| `npm run content:build -- --drafts` | Génère `public/content/` (manifeste, packs par métier, recherche) |
| `npm run legacy` | Sert l'ancienne app sur le port 8081 |

## Déploiement

Vercel, projet `techlingo`, déploiement automatique à chaque push sur `main`. Commande de build : `npm run app:build:drafts`.

## Rappels push

Optionnels. Sans configuration, les rappels fonctionnent seulement app ouverte. Pour les recevoir app fermée : base Neon, variables Vercel, secrets GitHub, clés VAPID. Procédure complète dans [docs/push-setup.md](docs/push-setup.md).

## Référencement

Balises, sitemap et Search Console : [docs/seo.md](docs/seo.md).

## Contact

services@codorah.com

## Limites actuelles

- Contenu en brouillon : les mots n'ont pas encore été relus par des professionnels.
- Pas de compte ni de synchronisation automatique entre appareils (sauvegarde par fichier).
- La reconnaissance vocale dépend du navigateur (Chrome et Edge la gèrent, d'autres non).
- Rappels app fermée : jamais testés avec de vraies clés.
- Pas d'APK : l'application se distribue uniquement en PWA.
