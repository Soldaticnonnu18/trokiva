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


## Vérification des déploiements — suite du 10 novembre 2026
- Dernier commit déployé pour PWA et API : `3716f1c6adf001211ceb48dc64d9c489447ae358`.
- API Render : déploiement `dep-dbpii5ff3r2c7388r600` confirmé `live`.
- PWA Render : déploiement `dep-dbpii9qjnfac739hpsu0` confirmé `live`.
- Journaux Render API : `postinstall` exécuté, vérification de syntaxe et deux tests hors base **PASS 2/2, FAIL 0**.
- Les tests ne couvrent pas encore une transaction réelle PostgreSQL, un parcours e-mail ni un test navigateur responsive complet.
- Ni `DATABASE_URL` ni le schéma PostgreSQL n'ont été activés/exécutés durant cette opération ; aucune publication d'annonce réelle confirmée.


## Correction logo mobile et cohérence graphique — 10/11/2026
- Source du symbole validé retrouvée dans les assets de la maquette : 285 × 228 px, au lieu de la miniature 64 × 51 px en ligne.
- Nouvelle ressource `assets/trokiva-symbol.svg` intégrant le symbole du fichier validé, sans changement volontaire du dessin ; export palette optimisé pour le web.
- `index.html` : en-tête remplacé par l'emblème source, favicon et icône Apple mis à jour.
- `icon.svg` : illustration PWA reconstruite autour du même symbole, avec source supérieure.
- `sw.js` : cache `trokiva-preview-v4` et ressource d'emblème ajoutée à la liste hors ligne.
- `compte.html` : le portail membre reprend désormais le véritable logo ; `api/server.js` expose la ressource de façon explicite.
- Test API du logo ajouté. Le rendu iPhone et l'icône d'installation restent à valider visuellement après redéploiement.
- La connexion DATABASE_URL, la migration PostgreSQL et les e-mails vérifiés ne sont toujours pas raccordés.


## Navigation mobile — retour et suivant (10 novembre 2026)
- Deux boutons visibles dans l'en-tête uniquement sur téléphone (`max-width:760px`) : Retour et Suivant, indépendants de la barre inférieure.
- Navigation des sections basée sur `history.pushState`, `history.back`, `history.forward` et `popstate`, avec compteur d'historique propre à la PWA.
- Les commandes sont désactivées lorsqu'aucune étape précédente/suivante interne n'est connue ; pas de redirection inventée ni de saut vers une page externe.
- Compatibilité du stockage de session en mode restrictif iOS : erreurs `sessionStorage` traitées.
- Le code de sauvegarde/export/import des brouillons locaux n'a pas été modifié par cette intervention.
- Test syntaxique du JavaScript PWA, présence des boutons accessibles, fonctions d'historique et gestion des brouillons ajoutés à `api/test/navigation.test.js`.
- Cache PWA incrémenté vers `trokiva-preview-v5`.
- **Finitions différées selon demande** : tailles des textes, espaces, hauteur/arrondi des sections, homogénéisation mobile/ordinateur. Valider d'abord le fonctionnement réel de la navigation.
- Les comptes, la connexion PostgreSQL, l'e-mail de vérification et les annonces publiques restent à valider séparément avant ouverture.


## Confirmation de déploiement — flèches mobiles
- PWA Render : `dep-dbpiqp3ncjis7391a1g0`, état `live`, commit `9393a416`.
- API Render : `dep-dbpiqprm8hqs73e1psig`, état `live`, même commit.
- Journaux Render : **5 tests réussis sur 5, 0 échec**, comprenant la syntaxe JavaScript PWA et la présence des fonctions de navigation.
- La validation tactile iPhone sur appareil réel reste à réaliser ; ne pas déclarer ce contrôle fait sans retour utilisateur.


## Sécurité et vraies propositions de troc — 10 novembre 2026
- Ajout SQL `exchange_offers` : sender, recipient, annonce, message et statut réel. Unicité des propositions en attente par annonce et expéditeur ; impossible d'envoyer à soi-même via contrainte SQL.
- Routes privées `GET/POST /api/my/offers` et `POST /api/my/offers/:id/accept|decline|cancel`. Authentification vérifiée, accès limité aux deux parties, refus de comptes désactivés.
- L'acceptation réserve l'annonce dans une transaction et refuse les propositions concurrentes ; ceci ne certifie pas un échange physique.
- Portail `compte.html` : liste réelle des annonces publiques, soumission d'offre et décisions accessibles selon le compte et le statut. Aucune annonce ou utilisateur fictif intégré.
- Nouveau drapeau de sécurité `ENABLE_EXCHANGES=true` requis pour activer les propositions ; **désactivé par défaut**, y compris une fois PostgreSQL raccordée. Les boutons d'offres restent inactifs tant que le serveur annonce `exchanges:disabled`.
- Migration et `/api/ready` mis à jour pour **six tables**, dont `exchange_offers`. Schéma non exécuté en production.
- Mutations API durcies : vérification same-origin HTTPS / CSRF et type MIME JSON requis.
- Tests ajoutés : routes d'offres bloquées sans base, contrôle CSRF et validation des annonces.
- À développer/tester avant ouverture : proposition/acceptation sur PostgreSQL réel, signalements et modération, messagerie privée, étapes et confirmation bilatérale d'échange, prévention des abus persistante, domaine de messagerie TROKIVA, sauvegardes et politique de confidentialité.
- Base Render gratuite `trokiva-db` expire le **10 décembre 2026** : éviter une ouverture pérenne sans plan de conservation.
- Les tests hors base ne valent pas recette de troc réel ; ne pas activer `ENABLE_EXCHANGES` avant les contrôles.


## Modération et signalements réels — 10/11/2026
- `listing_reports` : 7e table SQL préparée, reliée à une annonce et à un membre réel, motif de signalement limité à une liste fermée, anti-doublon par membre et annonce.
- `POST /api/reports` exige un compte vérifié, une annonce publiée appartenant à un autre membre, une justification valide et limite les demandes.
- `GET /api/admin/reports`, `POST /api/admin/reports/:id/hide|dismiss` sont réservés au membre connecté ayant l'e-mail vérifié défini dans `TROKIVA_ADMIN_EMAIL` (secret Render, aucun identifiant par défaut).
- Un modérateur autorisé peut classer un signalement ou masquer une annonce ; les signalements ouverts de cette annonce sont alors clôturés.
- `compte.html` comporte un bouton de signalement et une file de modération, invisible aux autres comptes.
- Le catalogue public exclut les annonces de comptes non vérifiés ou désactivés.
- Tests enrichis : syntaxe du portail, présence du parcours de signalement, contraintes SQL, refus des actions sans base.
- La migration doit maintenant vérifier **sept tables** et n'a toujours pas été exécutée en production. `DATABASE_URL` absent des variables accessibles via connecteur ; aucune fausse annonce ni modération simulée.
- Avant ouverture, vérifier manuellement un incident complet (signalement → examen → décision → retrait du catalogue), avec comptes consentants et base réelle ; renforcer les limites anti-abus distribuées et prévoir recours/audit détaillé.


## 10 novembre 2026 — faille corrigée : contournement de modération
- Nouvelle colonne SQL idempotente `listings.moderation_hidden_at` pour distinguer un retrait administrateur d'un masquage volontaire.
- L'action admin `hide` rend ce verrou persistant ; un propriétaire ne peut ni restaurer ni republier un objet retiré par modération, même via l'API.
- Les modifications de brouillons respectent également le verrou.
- Test de non-régression ajouté dans `api/test/security.test.js`.
- **Migration de cette colonne non exécutée** tant que la base Render n'est pas connectée ; la fonctionnalité ne doit pas être annoncée comme validée avec PostgreSQL réel.

## Vérification effective du correctif de modération
- Une première compilation Render `dep-dbpj3ko8v5cc73edhad0` a été rejetée par le test de non-régression (mauvais ordre dans une expression d'assertion), empêchant le code de passer sans contrôle.
- L'assertion a été alignée sur la requête SQL réellement utilisée, sans modifier la logique de retrait.
- Nouvelle compilation et déploiement `dep-dbpj42brjlhs7382jgp0` : **live** sur le commit `5be83143`.
- Journaux de tests Render : **10 tests PASS sur 10, aucun échec**.
- Validation SQL en base réelle toujours en attente du raccordement PostgreSQL ; ne pas annoncer cette protection comme éprouvée de bout en bout.


## Protection avant ouverture — cohérence de schéma et accès admin
- `GET /api/ready` contrôle désormais **sept tables** et les colonnes indispensables, notamment `listings.moderation_hidden_at`. La présence des tables seules ne suffit plus.
- `POST /api/auth/register` et les routes de propositions de troc exigent un schéma conforme avant d'autoriser une écriture, même si un drapeau d'environnement était activé par erreur.
- Accès privé modération via `TROKIVA_ADMIN_USER_ID` : l'UUID exact du compte vérifié est requis ; l'ancien contrôle par simple e-mail a été supprimé. Aucun identifiant administrateur par défaut n'est fourni.
- Tests statiques de ces garanties ajoutés. La recette PostgreSQL complète reste impossible sans `DATABASE_URL` raccordée.
- La documentation Render indique désormais sept tables et l'enregistrement privé de l'UUID admin après création du compte.


## Contrôle Render de la garde de lancement
- Déploiement `dep-dbpj90lg1s2s738ja3q0` confirmé `live` pour le commit `42af8310`.
- Journaux de construction : **12 tests PASS, 0 échec**, incluant contrôle du schéma complet et restriction d'identité admin.
- Les tests restent hors PostgreSQL réel ; absence de `DATABASE_URL` et de domaine e-mail TROKIVA validé.


## 10/11/2026 — Intégrité des échanges et de la modération
- Contrôle direct PostgreSQL via le connecteur Render impossible : la base `trokiva-db` n'autorise aucune IP externe, et le connecteur n'est pas sur le réseau privé Render. Ne pas ouvrir l'allowlist juste pour contourner ce blocage.
- Nouvelle offre : `INSERT INTO exchange_offers ... SELECT ... FOR UPDATE OF l` sérialise la création par rapport aux réservations/acceptations concurrentes d'une annonce.
- Modération : une action `hide` ne clôture plus les signalements si l'annonce n'a pas réellement été mise à l'état caché ; conflit HTTP 409 avec annulation de la transaction.
- Tests de non-régression ajoutés aux contrôles automatiques.
- Les chemins d'activation restent verrouillés : pas de comptes fictifs ni d'offres réelles avant connexion privée PostgreSQL, migration, vérification e-mail et recettes d'intégration.


## 10/11/2026 — Messagerie privée liée aux échanges
- Nouvelle huitième table `exchange_messages` avec `offer_id`, `sender_id`, `content` et horodatage, indexes de consultation. Le schéma est toujours idempotent, mais **non migré sur la base réelle** tant que `DATABASE_URL` reste manquante.
- `GET/POST /api/my/offers/:id/messages` : accessible uniquement aux deux comptes vérifiés d'une proposition **acceptée**. Envoi seulement pour annonce toujours réservée et non retirée par modération ; limite de longueur et limite de débit côté API.
- L'interface `compte.html` permet de consulter, actualiser et envoyer des messages entre les deux personnes concernées. Les messages sont retirés du DOM à la déconnexion.
- Pas de comptes fictifs ni de conversation simulée ; le chat réel reste désactivé tant que `ENABLE_EXCHANGES` et le schéma ne sont pas validés.
- Tests ajoutés pour contrôle des autorisations, schéma et fermeture fail-closed sans base. **Aucun test PostgreSQL end-to-end ni test humain encore réalisé.**
- Pour un lancement sécurisé : prévoir gestion des signalements des messages, conservation/suppression et moyens de contact protégés.


## Vérification du déploiement de la messagerie
- API Render `dep-dbpjehtbedkc738u0p7g` confirmée `live` sur commit `31e32d01`.
- Journaux Render : **15/15 tests réussis, 0 échec** dont le verrouillage d'accès aux messages.
- Les tests sont hors base réelle ; **aucune conversation réelle validée** tant que la migration de huit tables et les comptes n'ont pas été contrôlés.


## 10/11/2026 — Confirmation bilatérale de remise
- Ajout de `exchange_confirmations` : neuvième table idempotente, une confirmation unique par participant et par proposition.
- `POST /api/my/offers/:id/confirm` accepte uniquement un des deux participants actifs et vérifiés d'une proposition acceptée, dont l'annonce est réservée et n'a pas été retirée par modération.
- Les décisions sont sérialisées sous verrou PostgreSQL. La première confirmation reste en attente ; **seule la deuxième confirmation distincte** peut faire passer l'annonce de `reserved` à `exchanged`.
- `GET /api/my/offers` affiche le nombre de confirmations et l'état du membre connecté. Le portail membre propose une confirmation explicite avec avertissement ; aucun faux échange n'est ajouté.
- La messagerie reste accessible à la lecture après clôture ; les messages ne sont envoyables que pendant la réservation active.
- Tests ajoutés pour contraintes de confirmation et refus sans base.
- À valider avant ouverture : transactions PostgreSQL avec deux comptes réels, litiges/recours en cas de non-remise, procédures de modération des échanges et préservation des données.
- **Aucune remise physique réelle testée** ; le bouton ne démontre pas à lui seul qu'un objet a changé de mains.


## Confirmation du déploiement de la remise bilatérale
- Première tentative `dep-dbpjio0m7kps73b4e7q0` bloquée à la construction : une assertion exigeait encore que `exchange_messages` soit la dernière table déclarée dans le schéma.
- Test de schéma corrigé sans desserrer le contrôle ; second déploiement `dep-dbpjj63rjlhs7383occ0`, commit `464f21fe`, confirmé **live**.
- Journaux de construction Render : **16 tests réussis sur 16, 0 échec**.
- Neuf tables désormais prévues ; **aucune migration effectuée** sur PostgreSQL tant que `DATABASE_URL` privée n'est pas renseignée. Aucun échange réel effectué ni certifié par les tests.
