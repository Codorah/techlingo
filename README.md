# TechLingo — Speak Tech. Think Global.

Application mobile pour apprendre l'**anglais technique** : expliquer ton code, DevOps, web, mobile, langages, réseaux, systèmes, et préparer tes **entretiens de développeur**.

- Application **Android et iOS** (Capacitor) + **PWA** installable depuis le navigateur
- Fonctionne **hors ligne**, **sans compte**, **sans publicité**, **sans collecte de données** : la progression reste sur l'appareil
- 30 mots, 8 questions d'entretien, 10 verbes d'action pour le CV

## Démarrer

```bash
npm install
npm run dev          # http://localhost:8080
```

## Structure

```
www/                    l'application web (HTML/CSS/JS, sans build)
  index.html            écran de chargement animé + coquille
  app.js                écrans, roue, quiz, révision espacée, onboarding, profil, sauvegarde
  data.js, data-extra.js  vocabulaire, questions d'entretien, verbes, FAQ
  style.css, fonts.css  design (clair/sombre), polices hébergées localement
  sw.js, manifest.webmanifest  PWA hors ligne
  privacy.html, terms.html     pages légales exigées par les stores
assets/                 logo (SVG/PNG) et sources des icônes/écrans de démarrage
store/                  visuels prêts pour Google Play et l'App Store
android/, ios/          projets natifs générés par Capacitor
capacitor.config.json   configuration de l'app (id : com.techlingo.app)
vercel.json             déploiement web sur Vercel (dossier www)
STORE.md                guide de publication Play Store / App Store
```

## Parcours dans l'app

Chargement animé → 4 écrans d'accueil animés → création du profil (avatar, prénom, objectif) → Accueil, Dictionnaire, Pratique, Carrière, Profil.

Sauvegarde sans serveur : *Profil → Paramètres → Sauvegarde* génère un code à copier pour retrouver sa progression sur un autre téléphone.

## Commandes utiles

| Commande | Rôle |
|---|---|
| `npm run dev` | Serveur local de la version web |
| `npm run sync` | Copie `www/` dans les projets Android et iOS |
| `npm run android` | Ouvre le projet dans Android Studio |
| `npm run ios` | Ouvre le projet dans Xcode (Mac uniquement) |
| `npm run assets` | Régénère icônes et écrans de démarrage depuis `assets/` |

## Déploiement web (Vercel)

Importe ce dépôt dans Vercel : `vercel.json` indique déjà le dossier `www` et aucune commande de build. Aucun réglage supplémentaire.

## Publier sur les stores

Voir [STORE.md](STORE.md) : comptes, signature, fiche du store, réponses « sécurité des données », captures à prendre. Avant publication, remplace l'email de contact dans `www/privacy.html` et `www/terms.html`.

## Limites actuelles

- Pas de compte ni de synchronisation automatique entre appareils (sauvegarde par code).
- L'entraînement oral avec reconnaissance vocale fonctionne dans Chrome/Edge ; dans l'app native, il est masqué tant qu'un plugin de reconnaissance vocale n'est pas ajouté.
- Pas de notifications de rappel (il faudrait un serveur).
- La compilation iOS demande un Mac.
