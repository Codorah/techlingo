# Rappels quotidiens (Web Push) : mise en place

Les rappels arrivent à l’heure choisie même quand l’application est fermée. Sans compte : le serveur garde seulement l’abonnement push du navigateur, l’heure, le fuseau horaire et deux dates (voir `db/migrations/001_push.sql`). Tant que rien n’est configuré, l’application garde le rappel local (application ouverte en arrière-plan), sans message d’erreur.

## 1. Base Neon
1. Crée un projet sur https://neon.tech, région **AWS Europe (Frankfurt)** de préférence (RGPD).
2. Copie la chaîne de connexion (`postgresql://...?sslmode=require`).
3. La table est créée automatiquement au premier appel de l’API. Tu peux aussi exécuter `db/migrations/001_push.sql` dans l’éditeur SQL de Neon.

## 2. Clés VAPID
```
node scripts/push/generate-vapid.mjs
```
Garde la sortie hors du dépôt (ne la commite jamais).

## 3. Variables d’environnement Vercel (projet `techlingo`, Production)
| Variable | Valeur |
| --- | --- |
| `DATABASE_URL` | chaîne de connexion Neon |
| `VAPID_PUBLIC_KEY` | clé publique générée |
| `VAPID_PRIVATE_KEY` | clé privée générée (secrète) |
| `VAPID_SUBJECT` | `mailto:services@codorah.com` |
| `CRON_SECRET` | une longue valeur aléatoire, par exemple `openssl rand -hex 32` |
| `VITE_VAPID_PUBLIC_KEY` | la même valeur que `VAPID_PUBLIC_KEY` (lue au build par l’application) |

Puis redéploie (la clé `VITE_` est intégrée au moment du build).

## 4. Secrets GitHub (Settings, Secrets and variables, Actions)
- `CRON_SECRET` : la même valeur que sur Vercel.
- `APP_URL` : `https://techlinngo.vercel.app` (secret ou variable).

Le workflow `.github/workflows/reminders.yml` appelle `/api/push/send` toutes les 30 minutes. Sans ces secrets, il s’arrête proprement avec un message. GitHub peut retarder une exécution de quelques minutes, et désactive les workflows planifiés après 60 jours sans activité sur le dépôt : il suffit alors de le réactiver dans l’onglet Actions.

## 5. Tester
1. Sur Android (Chrome) ou sur ordinateur, ouvre l’application déployée, Paramètres, active le rappel et accepte les notifications. Sur iPhone : ajoute d’abord l’application à l’écran d’accueil (iOS 16.4 ou plus), puis ouvre-la depuis l’icône.
2. Dans Neon, vérifie qu’une ligne existe dans `push_subscriptions`.
3. Choisis une heure déjà passée de moins de 3 heures (par exemple via `UPDATE push_subscriptions SET reminder_time = '08:00'`), puis lance l’envoi à la main :
   ```
   curl -X POST -H "Authorization: Bearer $CRON_SECRET" https://techlinngo.vercel.app/api/push/send
   ```
   ou Actions, Rappels quotidiens, Run workflow. La réponse indique `due`, `sent`, `removed`, `failed`.
4. Un second appel le même jour n’envoie rien (`last_sent_day`). Termine une leçon : `last_active_day` passe au jour même et le rappel du jour est sauté.
5. Désactive le rappel dans Paramètres : la ligne disparaît.

## Règles d’envoi
- Envoi si l’heure locale (fuseau du navigateur) a dépassé l’heure choisie de 0 à 3 heures, si rien n’a été envoyé aujourd’hui et si l’apprenant n’a pas pratiqué aujourd’hui.
- Les abonnements que le service push déclare disparus (404 ou 410) sont supprimés.
- Le texte du rappel est dans `api/_lib/schedule.ts`.
