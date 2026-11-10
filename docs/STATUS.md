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


## Chantier suivant — inscription vérifiée (10/11/2026)
- Code d'inscription avec hachage scrypt + sel, vérification du format e-mail et limitation des demandes ajouté à `api/server.js`.
- Lien de vérification à usage unique, empreinte SHA-256 stockée en base et expiration de 24 heures ; page `verify.html`.
- Envoi prévu via Resend, avec secrets `RESEND_API_KEY` et `RESEND_FROM_EMAIL` configurables uniquement dans Render.
- Le serveur ne permet l'inscription que si `ENABLE_REGISTRATION=true`, `DATABASE_URL`, l'envoi Resend et `PUBLIC_API_BASE_URL` sont tous configurés.
- Commande `npm run migrate` préparée : nécessite `DATABASE_URL`. Migration SQL **non exécutée** : connecteur Render PostgreSQL en lecture seule et IP autorisées absentes.
- Le déploiement API `dep-dbpf57s9v7es73bntm40` a été confirmé `live`, mais cela ne valide pas un parcours d'inscription réel.
- Smoke test serveur ajouté au dépôt ; son exécution réussie n'est pas encore attestée.
- L'API et la PWA étant sur deux sous-domaines distincts de Render, prévoir un point d'entrée same-origin pour les cookies HttpOnly avant d'activer les comptes.
- Aucun compte utilisateur ni mail de vérification envoyé pendant ce chantier.


## Reprise du 10/11/2026 — 14 h 52 (Europe/Paris)
- Dépôt toujours `public` : ne jamais déposer de secret.
- PostgreSQL TROKIVA vérifiée `available`, expire le 10 décembre 2026.
- API Render `trokiva-api` déployée `live` avec le commit `391308d5` et journaux confirmant `node api/server.js` sur le port 10000.
- `GET /api/health` : distinction claire du serveur en fonctionnement et de la simple configuration de DATABASE_URL.
- `GET /api/ready` : vérifie la présence des quatre tables PostgreSQL, répond 503 si la connexion ou le schéma n'est pas prêt.
- Test smoke mis à jour et CI GitHub Actions ajoutée ; **résultat d'exécution CI non vérifié**.
- `docs/RENDER_DATABASE_SETUP.md` décrit la connexion interne sans divulguer les secrets.
- L'API **n'est toujours pas raccordée** à `trokiva-db`, schéma non appliqué, inscriptions toujours fermées.
- Aucun changement MINBA ou autres projets.


## Poursuite du 10 novembre — fiabilisation de la validation e-mail
- Correction du flux d'inscription : l'e-mail est désormais envoyé après validation de la transaction PostgreSQL, plutôt que pendant une transaction ouverte.
- Endpoint de renvoi limité `POST /api/auth/resend-verification` ajouté pour les comptes en attente de validation.
- Tests de non-ouverture sans base ajoutés pour le renvoi, la session et les annonces privées.
- Déploiement API demandé pour le commit `509a5702` ; consulter le statut Render avant toute déclaration de succès.
- Les inscriptions restent fermées ; aucun compte ou envoi de validation réel n'a été testé.
- `DATABASE_URL` et migration restent à configurer/exécuter via l'environnement privé Render.


## 10 novembre 2026 — suite : récupération sécurisée du compte
- Nouvelle table SQL `password_resets` ajoutée au schéma, avec hachage du jeton et expiration.
- `POST /api/auth/request-password-reset` et `POST /api/auth/reset-password` implémentés côté API.
- Nouvelle page `reset-password.html`, avec lien de réinitialisation transmis dans le fragment `#token=` et effacé de l'URL à l'ouverture.
- Nouveau mot de passe haché par scrypt avec sel distinct ; jeton utilisable une seule fois ; révocation des sessions existantes après modification.
- `api/migrate.js` et `/api/ready` contrôlent maintenant cinq tables.
- Tests de sécurité hors base complétés pour la réinitialisation désactivée et la page HTML.
- Cette fonctionnalité **n'est pas encore opérationnelle avec de véritables utilisateurs** : base non raccordée et domaine e-mail non configuré.
- Le dépôt reste public, aucun secret n'y est enregistré.


## Poursuite — migration contrôlée au démarrage
- `api/migrate.js` exporte une fonction idempotente, exécutable manuellement, qui applique le schéma SQL des cinq tables et vérifie leur présence.
- `api/server.js` déclenche cette fonction **uniquement** si `RUN_MIGRATIONS_ON_BOOT=true` et `DATABASE_URL` est configurée.
- Sans configuration, aucune migration n'est déclenchée au démarrage. Si la migration est demandée et échoue, le serveur refuse de démarrer.
- Test ajouté pour vérifier l'interdiction d'une migration sans URL PostgreSQL.
- Procédure de configuration documentée dans `docs/RENDER_DATABASE_SETUP.md`.
- **Limite non levée :** le connecteur actuel ne fournit pas l'URL interne de la base Render. L'initialisation effective des tables reste non exécutée ; aucune inscription publique n'est autorisée.


## Poursuite — vérification de l'expéditeur et durcissement auth
- Vérification directe dans Resend : seul le domaine `rendezelle.fr` est vérifié. Ce domaine appartient à un autre projet et ne doit pas servir aux e-mails TROKIVA.
- Correction API : le renouvellement de mot de passe refuse désormais un utilisateur désactivé ou dont l'e-mail n'est pas vérifié, au lieu de renvoyer un faux succès.
- Validation initiale de l'adresse e-mail resserrée.
- Liste des conditions de lancement créée dans `docs/AUTH_RELEASE_CHECKLIST.md`.
- Déploiement Render API `dep-dbpifh49v7es73c0d1c0` confirmé `live` sur le commit `3052415`.
- Toujours bloqué : `DATABASE_URL` non configurée, migration non exécutée, domaine e-mail TROKIVA non vérifié. Aucune ouverture utilisateur.


## Nouveau chantier — annonces et espace membre sur même origine (10/11/2026)
- Portail `/compte.html` ajouté à `trokiva-api` : connexion, inscription contrôlée, réinitialisation, renvoi de vérification, déconnexion, gestion des annonces personnelles. Le portail vérifie `/api/ready` avant de présenter les formulaires.
- Parcours des annonces préparé : création et édition privées, publication avec description (au moins 20 caractères) et ville, masquage et retour en brouillon. Vérification du propriétaire via session côté API. Aucune annonce n'est inventée.
- Accès explicite depuis le profil de la PWA de prévisualisation ; les brouillons locaux ne sont pas confondus avec les annonces serveur.
- `api/package.json` bloque désormais les builds Render si `node --check` ou les tests locaux échouent (`postinstall`).
- L'authentification reste indisponible en production tant que `DATABASE_URL`, les cinq tables et l'expéditeur TROKIVA ne sont pas validés ; le statut Render `live` ne doit pas être confondu avec une plateforme prête à vendre/échanger.
- Les deux sous-domaines sont distincts : l'authentification est prévue sur le domaine `trokiva-api.onrender.com`, sous **même origine** que ses routes API. Une intégration définitive sous le domaine principal reste à programmer.
- Les images, la modération, les signalements et les propositions de troc sont encore des chantiers nécessaires avant ouverture publique.
