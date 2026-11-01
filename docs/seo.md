# Référencement (SEO)

Adresse utilisée partout : **https://techlingo.vercel.app**. Si un autre domaine est choisi, remplace-la dans `index.html`, `public/robots.txt`, `public/sitemap.xml`, `public/legal/*.html` et `public/decouvrir/index.html`.

## Ce qui est en place
- **`index.html` (l'app)** : titre et description en français avec les mots-clés (anglais professionnel, informatique, marketing digital), canonical, Open Graph et Twitter card avec `og-image.png`, JSON-LD `Organization` (contact services@codorah.com), `WebSite` et `WebApplication` (gratuite, en français, catégorie éducation). Le `<noscript>` renvoie vers /decouvrir/.
- **`public/og-image.png`** (1200x630, 22 Ko) : l'image affichée quand un lien est partagé. Pour la refaire, modifie `scripts/seo/og-image.html`, puis lance :
  `chrome --headless=new --hide-scrollbars --window-size=1200,630 --allow-file-access-from-files --screenshot=og.png scripts/seo/og-image.html` (Chrome ou Edge), et compresse le PNG.
- **`public/robots.txt`** : tout est autorisé, avec la ligne `Sitemap`. `/content/` n'est pas bloqué, car Google en a besoin pour afficher l'app. Il est exclu de l'index par l'en-tête `X-Robots-Tag: noindex` (`vercel.json`).
- **`public/sitemap.xml`** : /, /decouvrir/ et les deux pages légales. Mets à jour `lastmod` quand une page change vraiment.
- **Pages légales** : canonical et `robots index, follow`.
- **`vercel.json`** : robots.txt, sitemap.xml et og-image.png sont servis comme fichiers, jamais réécrits vers l'app.
- **Service worker** (`vite.config.ts`) : ces trois fichiers ne sont ni mis en cache hors ligne ni remplacés par l'app quand on les ouvre.

Limites connues :
- Google n'affiche une fiche enrichie d'application (étoiles, prix) que si la page a des notes ou des avis réels. On n'en invente pas. Le JSON-LD reste utile pour décrire l'app.
- Google n'affiche plus de résultats enrichis FAQ pour ce type de site. Une FAQ visible reste utile pour les requêtes longues, pour Bing et pour les moteurs IA.
- L'app (/) est une SPA : son texte est créé en JavaScript. C'est **/decouvrir/** qui doit porter les mots-clés.

## Déclarer le site
### Google Search Console
1. Va sur https://search.google.com/search-console, puis « Ajouter une propriété ».
2. Choisis **Préfixe d'URL** et saisis `https://techlingo.vercel.app/`. (Le type « Domaine » demande un domaine à toi, impossible avec un sous-domaine vercel.app.)
3. Validation : choisis « Balise HTML ». Copie la balise `<meta name="google-site-verification" ...>` dans le `<head>` de `index.html`, déploie, puis clique sur « Valider ». Autre option : un fichier `googleXXXX.html` dans `public/`, à ajouter aussi à la liste d'exclusion de la réécriture dans `vercel.json`.
4. Menu **Sitemaps** : saisis `sitemap.xml` et envoie.
5. **Inspection d'URL** : teste `/` et `/decouvrir/`, regarde la capture rendue, puis « Demander l'indexation ».
6. Suis **Signaux Web essentiels** (Core Web Vitals) et **Pages** (pages exclues) chaque mois.

### Bing Webmaster Tools (sert aussi DuckDuckGo, Ecosia, Qwant en partie et Copilot)
1. Va sur https://www.bing.com/webmasters et connecte-toi.
2. Le plus rapide : « Importer depuis Google Search Console ». Sinon, ajoute le site et valide avec la balise meta `msvalidate.01`.
3. Menu **Sitemaps** : envoie `https://techlingo.vercel.app/sitemap.xml`.
4. Option : active **IndexNow** pour signaler chaque mise à jour.

### Vérifier les partages
- LinkedIn : https://www.linkedin.com/post-inspector/
- Facebook et WhatsApp : https://developers.facebook.com/tools/debug/
- Données structurées : https://search.google.com/test/rich-results et https://validator.schema.org/

## Pages de contenu qui pourraient bien se positionner (non créées)
Les requêtes visées (« anglais pour développeur », « vocabulaire anglais informatique », « anglais marketing digital », « préparer un entretien en anglais ») sont tenues par des pages de listes de vocabulaire. TechLingo a mieux : des mots relus, expliqués en français, avec exemples. Idées, toutes générées au build depuis `content/` en HTML statique, avec un bouton « Apprendre ces mots dans l'app » :

1. **Une page par métier** : `/metiers/developpeur-web/`, `/metiers/cybersecurite/`, `/metiers/seo-sea/`… Titre du type « Anglais pour développeur web : les 50 mots à connaître ». Contenu : intro, mots clés avec traduction, explication et une phrase d'exemple, faux amis, questions d'entretien fréquentes. Chaque puce métier de /decouvrir/ pointe vers sa page.
2. **Une page par thème** (catégories avec `course_fr`) : « Vocabulaire anglais des API », « Anglais de Google Ads ».
3. **Faux amis par métier** : « library ≠ librairie », « eventually ≠ éventuellement ». Requêtes très cherchées, contenu déjà dans les explications.
4. **Préparer un entretien en anglais** dans la tech ou le marketing : questions, réponses modèles (depuis `career.json`).
5. **Phrases toutes faites** : « Comment dire en anglais en daily stand-up », « Écrire un message Slack en anglais au travail ».
6. **Glossaire** : une page par terme important (« Que veut dire rollback ? »), avec la définition en français. Seulement pour les mots validés.

Règles pour ces pages : seulement les mots `status: validated`, jamais les brouillons. Aujourd'hui, les 2096 mots sont encore `draft` : il faut d'abord relire au moins un métier avant de publier sa page. Ensuite, un titre et une description uniques, une canonical, une entrée dans `sitemap.xml` (à générer au build), des liens entre métiers proches, et une mise à jour de `lastmod` à chaque changement réel.
