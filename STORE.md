# Publier TechLingo sur Google Play et l'App Store

Ce guide liste ce que **toi seul peux faire** (comptes, signature, captures) et prépare les textes demandés par les stores.

## 0. Avant tout : à remplir

- [x] **Email de contact** : services@codorah.com (page de confidentialité `public/legal/confidentialite.html`).
- [ ] **Nom du développeur** exact, tel qu'il apparaîtra sur les stores.
- [ ] **Identifiant de l'app** : `com.techlingo.app` (dans `capacitor.config.json`). Il est **définitif** une fois publié. Change-le avant si tu veux utiliser ton propre domaine (ex. `com.tonnom.techlingo`), puis relance `npx cap sync`.
- [ ] Déploie le site sur Vercel : l'URL de `privacy.html` sert de **lien de politique de confidentialité** exigé par les deux stores (ex. `https://ton-site.vercel.app/privacy.html`).

## 1. Android — Google Play

**Compte** : Google Play Console, 25 $ une seule fois. Pour un compte personnel créé récemment, Google impose un **test fermé de 12 testeurs pendant 14 jours** avant la production.

**Générer le fichier à envoyer (AAB)**

1. Crée ta clé de signature (une seule fois, **ne la perds jamais**, ne la mets pas sur GitHub) :
   ```
   keytool -genkeypair -v -keystore techlingo-release.keystore -alias techlingo -keyalg RSA -keysize 2048 -validity 10000
   ```
2. Ouvre le projet : `npm run android` (Android Studio).
3. Menu **Build → Generate Signed App Bundle / APK → Android App Bundle**, choisis ta clé, mode **release**.
4. Envoie le fichier `app-release.aab` dans la Play Console (Production ou Test fermé).
5. À chaque nouvelle version : augmente `versionCode` (+1) et `versionName` dans `android/app/build.gradle`.

**Fiche du store** (fichiers prêts dans `store/`)

| Élément | Fichier / valeur |
|---|---|
| Icône 512×512 | `store/play-icon-512.png` |
| Image de présentation 1024×500 | `store/play-feature-graphic-1024x500.png` |
| Captures d'écran téléphone | 2 minimum, à prendre toi-même (voir §3) |
| Catégorie | Éducation |
| Public cible | 13 ans et plus (pas conçu pour les enfants) |
| Annonces | Non, l'app ne contient pas de publicité |

**Section « Sécurité des données »** (Data safety) — réponses conformes à l'app actuelle :

- Collecte-t-elle des données utilisateur ? **Non**
- Partage-t-elle des données avec des tiers ? **Non**
- Les données sont-elles chiffrées en transit ? Sans objet (aucune donnée transmise)
- Les utilisateurs peuvent-ils demander la suppression ? **Oui** : dans l'app (Paramètres → Supprimer toutes mes données) ; aucune donnée côté serveur
- URL de la politique de confidentialité : celle de ton site Vercel

> Si tu ajoutes plus tard des comptes en ligne, publicités ou analytics, **mets à jour ces réponses** et la politique de confidentialité, sinon l'app peut être retirée.

**Questionnaire de classification (IARC)** : application éducative, sans violence, sans contenu sexuel, sans jeux d'argent, sans achats, sans contenu généré par les utilisateurs. Résultat attendu : tous publics / PEGI 3.

## 2. iOS — App Store

**Obligatoire** : un **Mac avec Xcode** et un compte **Apple Developer (99 $/an)**. La compilation iOS n'est pas possible depuis Windows ; deux solutions : un Mac (même emprunté), ou un service de build cloud (Codemagic, Ionic Appflow, GitHub Actions sur runner macOS).

1. Sur le Mac : `npm install`, `npx cap sync ios`, puis `npm run ios` (Xcode).
2. Xcode → cible **App** → *Signing & Capabilities* : choisis ton équipe (Team), garde le Bundle Identifier `com.techlingo.app` (ou le tien).
3. **Product → Archive → Distribute App → App Store Connect**.
4. Dans App Store Connect : crée la fiche, ajoute l'icône (`store/appstore-icon-1024.png` ; sans transparence, déjà conforme), les captures d'écran (iPhone 6,9″ et 6,5″ requis), l'URL de confidentialité.

**Section « Confidentialité de l'app »** : choisis **« Aucune donnée collectée »**.

**Points de vigilance Apple**

- *Guideline 4.2 (fonctionnalité minimale)* : une app web emballée peut être refusée si elle semble n'être qu'un site. TechLingo fonctionne hors ligne, a un retour haptique, un stockage local et des écrans propres à l'app, ce qui aide. Dans la note de relecture, explique qu'elle propose des leçons, des jeux de révision et des entraînements d'entretien hors ligne.
- *Guideline 5.1.1* : pas de compte ni de collecte, donc pas de suppression de compte à fournir. Le bouton « Supprimer toutes mes données » existe déjà.
- Âge : classification **4+**.

## 3. Captures d'écran à prendre

Lance l'app sur ton téléphone ou un émulateur, avec le profil rempli et quelques mots appris, puis capture :

1. Accueil · 2. La roue · 3. Une fiche de mot · 4. Quiz · 5. Question d'entretien · 6. Statistiques ou badges

## 4. Texte de la fiche

**Titre** (30 car. max) : `TechLingo : anglais tech`

**Description courte** (80 car. max) : `Apprends l'anglais technique et prépare tes entretiens de développeur.`

**Description longue**

> TechLingo t'aide à parler tech en anglais : expliquer ton code, le DevOps, le web, le mobile, les réseaux et les systèmes, et réussir tes entretiens.
>
> • Un mot tech chaque jour avec la roue
> • Définitions en anglais et en français, prononciation, exemples issus de vraies équipes
> • Révision espacée pour retenir pour de bon
> • Quiz rapide, vrai ou faux et association de paires
> • 8 questions d'entretien avec réponse modèle, expressions clés et entraînement à l'oral
> • 10 verbes d'action pour ton CV
> • Badges, streak et statistiques de progression
> • Fonctionne hors ligne, sans compte, sans publicité
>
> Tes données restent sur ton téléphone.

**Mots-clés (iOS, 100 car.)** : `anglais,technique,développeur,entretien,vocabulaire,DevOps,programmation,informatique,IT`

## 5. Mise à jour du contenu

`npm run sync` copie `www/` dans les projets Android et iOS. Pour que les appareils déjà installés (version web/PWA) se mettent à jour, change le nom du cache dans `www/sw.js` (`techlingo-v3`, etc.).
