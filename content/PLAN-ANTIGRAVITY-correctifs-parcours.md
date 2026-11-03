# Plan Antigravity n°3 : correctifs avant mise en ligne des parcours

Les parcours livrés (5 nouveaux rôles + réécriture des 19 existants) sont structurellement valides (validate, build, tests OK, niveaux bien étagés, mots existants), mais **ne sont pas encore commités** car ils ont trois défauts. Corrige-les dans les fichiers déjà présents dans `content/paths/roles/` et `content/career/`, sans rien créer d'autre.

## 1. La bonne réponse est presque toujours la plus longue (défaut principal)
Mesure : part des questions où le choix correct est le plus long (hasard = 33 %). Avant ta réécriture, les parcours existants étaient entre 39 % et 73 %. Après : cabin-crew 92 %, cybersecurity 84 %, event-hostess 78 %, qa-testing 77 %, event-manager 75 %, data-engineer 74 %, marketing-data 72 %, pilot 71 %. **Objectif : moins de 45 % pour chaque rôle.**
- Les 3 choix ont une longueur et une forme proches (écart de moins de 25 %).
- Les mauvais choix sont aussi détaillés et précis que le bon : ajoute le complément technique plausible, ne raccourcis pas le bon.
- Les mauvaises réponses doivent être tentantes pour un francophone du métier (calque, faux ami, mauvaise préposition, mauvais registre, demi-vérité).

## 2. Distracteurs absurdes (interdits par la règle « jamais Duolingo-easy »)
Exemples à supprimer : « pour que le personnel puisse passer l'aspirateur », « cacher le nouvel équipement sous une bâche noire », « le nombre de verres vendus au bar », « les passagers doivent applaudir », « le refus par la compagnie d'accorder des congés ». Chaque faux choix doit être une confusion réaliste que ferait un vrai professionnel ou un apprenant sérieux. Relis tous les rôles, en priorité cabin-crew, event-manager, event-hostess, pilot.

## 3. Exactitude (aéronautique)
Dans `pilot`, la question sur V1 affirme qu'après V1 le décollage « ne doit jamais être interrompu » et que l'arrêt est « physiquement impossible ». C'est trop absolu (la décision après V1 dépend de la situation) et peut induire en erreur sur un sujet de sécurité. Reformule de façon prudente (par exemple : V1 est la vitesse de décision, au-delà de laquelle on poursuit le décollage sauf cas exceptionnel) et relis toutes les questions de sécurité de pilot et cabin-crew avec la même prudence. Au doute, simplifie.

## 4. Ids (progression des utilisateurs)
Ids conservés par rapport à la version en ligne : community-manager 0/28, marketing-data 0/30, cybersecurity 1/30, brand-communication 5/29, data-engineer 6/30 : toute la progression de ces parcours serait perdue. Quand une unité ou une leçon garde le **même thème**, **reprends son id d'origine** (voir `git show HEAD:content/paths/roles/<role>.json`). N'invente un nouvel id que pour un vrai nouveau thème.

## 5. Rendre la main
```
set -o pipefail
npm run content:validate
```
Puis je relance la mesure du point 1 (objectif < 45 %), les ids, le build et les tests, et je commite.
