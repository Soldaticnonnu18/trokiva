# TROKIVA — État vérifié du chantier

Date : 10 novembre 2026.

## Déployé
- PWA visuelle sur Render : https://trokiva-preview.onrender.com
- Service API indépendant : https://trokiva-api.onrender.com
- API déployée avec statut Render `live` (déploiement `dep-dbpf2iqjnfac7398mti0`).
- Dépôt GitHub indépendant `Soldaticnonnu18/trokiva` : code de l'interface et de l'API.
- Brouillons locaux multiples et import/export sur le navigateur ; ne pas confondre avec des annonces publiques.

## Base de données
- PostgreSQL Render indépendant créé : `trokiva-db` (`dpg-dbpf2crbc2fs73a17ogg-a`), région Francfort, formule gratuite.
- Expiration annoncée par Render : 10 décembre 2026.
- État constaté après création : `creating`; attendre le statut `available` avant mise en service.
- Schéma SQL préparé dans `api/schema.sql`, **non exécuté**.
- Le service API n'a **pas** de variable `DATABASE_URL` configurée : API non raccordée au stockage réel.

## Sécurité / fonctionnalité
- API HTTP : `api/server.js`; routage de santé et catalogue ; structures de sessions et brouillons privés préparées.
- Les inscriptions publiques sont volontairement **désactivées** : fournisseur de vérification e-mail et flux d'inscription non implémentés.
- Connexion membre non opérationnelle tant que la base et la création vérifiée des comptes ne sont pas raccordées.
- Aucune publication publique n'est activée. Aucun faux objet, faux membre ni faux échange.
- Protection CSRF, cookie HttpOnly/Secure, limitation de requêtes initiales : code posé, **audit et tests incomplets**.

## Prochains raccordements nécessaires
1. Vérifier `trokiva-db` disponible et exécuter `api/schema.sql` via un canal d'administration autorisé.
2. Ajouter le secret `DATABASE_URL` côté Render uniquement, sans le publier dans GitHub ou le chat.
3. Raccorder l'envoi et la validation d'e-mail, puis implémenter réellement l'inscription sécurisée.
4. Tester les scénarios d'inscription, connexion, réinitialisation, déconnexion et limitation des tentatives.
5. Raccorder l'interface PWA à l'API (même origine ou politique CORS/cookies explicitement sécurisée), puis les annonces.
6. Tests fonctionnels, de sécurité et responsive avant ouverture publique.

## Règles
- Aucun autre dépôt GitHub ni service MINBA ne doit être modifié.
- Ne pas considérer un service `live` comme un système de comptes fonctionnel.
- Dépôt GitHub observé en mode PUBLIC : demander une vérification de confidentialité dans les paramètres.
