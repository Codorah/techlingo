-- handle_new_user() est un déclencheur : personne n'a à l'appeler via /rest/v1/rpc.
-- (Déjà appliquée au projet via le connecteur ; ce fichier garde l'historique.)
revoke execute on function public.handle_new_user() from public, anon, authenticated;
