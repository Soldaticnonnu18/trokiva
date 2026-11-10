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


## 10/11/2026 — Verrou global de disponibilité API et procédure Render
- L'ensemble des routes `/api/*` dépendant de PostgreSQL vérifie désormais la présence du schéma complet avant d'accéder aux données : comptes, annonces, signalements, modération, offres, messages et confirmations.
- `GET /api/listings` et `GET /api/me` disposent du même contrôle. Sans `DATABASE_URL`, le mode fermé reste inchangé ; le point `/api/me` répond toujours `user:null` hors base.
- `/api/health` et `/api/ready` restent accessibles pour diagnostiquer le raccordement.
- La procédure `docs/RENDER_DATABASE_SETUP.md` est alignée sur **neuf tables**, et rappelle de maintenir `ENABLE_REGISTRATION=false` et `ENABLE_EXCHANGES=false` jusqu'à la recette réelle.
- Aucun compte, message ou objet fictif n'a été créé ; la connexion privée PostgreSQL n'a pas été installée ni la migration appliquée.


## Vérification de production — verrou global du schéma
- API `dep-dbpjm19srm7s73av1qj0` confirmée `live` sur commit `5b70c030`.
- Journaux de construction Render : **17 tests réussis sur 17, 0 échec**.
- La réussite de ces tests ne prouve pas le raccordement PostgreSQL : `DATABASE_URL` reste à configurer, la migration à exécuter et les recettes de véritables échanges à effectuer.


## 10/11/2026 — Recette PostgreSQL isolée par GitHub Actions
- Nouveau workflow `.github/workflows/trokiva-postgres.yml` avec conteneur PostgreSQL 17 jetable sur GitHub Actions.
- Nouveau test `api/test/postgres.integration.test.js` : applique la migration neuf tables dans la base **locale de CI**, ouvre un serveur API sur port local, crée seulement des comptes/objets temporaires d'essai dans cette base isolée et contrôle l'annonce, l'offre, l'autorisation, les messages et les deux confirmations. Aucun jeu de données de test n'est injecté en production.
- L'exécution de ce test est verrouillée à `localhost` ou `127.0.0.1` avec nom de base strict `trokiva_test` ; pas d'URL distante possible.
- Correction de l'expression régulière CSRF pour les requêtes HTTP locales de test, sans ouvrir les requêtes HTTP sur les domaines réels. Tests unitaires ajoutés.
- **Résultat du workflow GitHub à confirmer** : le nombre de tests Render ne doit pas être présenté comme une preuve de transaction PostgreSQL tant que le job GitHub n'a pas réussi.
- Raccordement `DATABASE_URL` au PostgreSQL privé Render, migrations en production et validation avec véritables membres toujours non effectués.

## Validation du déploiement Render — banc PostgreSQL isolé
- Déploiement API `dep-dbpjq3ou01pc7390g780` confirmé `live` (commit `dafd7203`).
- Logs Render : 17 tests réussis, aucun échec ; le test PostgreSQL est `SKIP` dans Render par sécurité (base jetable réservée à GitHub Actions).
- Statut de l'exécution GitHub Actions PostgreSQL **non confirmé** à ce stade ; ne pas compter ce test comme validé sans rapport GitHub.
- La liaison privée `DATABASE_URL` et les migrations PostgreSQL de production demeurent non réalisées.


## 10 novembre 2026 — Renforcement recette d'intégration GitHub
- `api/test/postgres.integration.test.js` élargi : sur PostgreSQL 17 **jetable local**, le scénario couvre désormais également un signalement créé par un participant, le refus des doublons, l'accès à la file de modération, le refus d'un retrait par non-admin, le retrait effectif par admin, et l'impossibilité de restaurer l'annonce modérée.
- L'identité d'administration du test est uniquement l'UUID d'un compte temporaire dans la base jetable. Aucune modification des comptes et secrets de production.
- **État GitHub Actions non confirmé** : le connecteur GitHub n'expose pas ici les runs `push` du workflow et `get_commit_combined_status` renvoie une liste vide. Vérifier l'onglet Actions du dépôt et examiner le journal du job `postgres-integration` avant de déclarer ce test PASS.
- Les changements de ce passage portent sur le test d'intégration et la documentation : aucun déploiement Render nécessaire.


## 10/11/2026 — sécurisation environnement Render avant raccordement PostgreSQL
- Base `trokiva-db` existante contrôlée via connecteur Render : PostgreSQL 17, Francfort, statut `available`, plan gratuit, expiration annoncée 10/12/2026. Aucune base supplémentaire créée.
- Service `trokiva-api` contrôlé, région Francfort, branche `main`, auto-déploiement désactivé.
- Variables du service modifiées **réellement sur Render** (fusion sans écraser les autres) : `ENABLE_REGISTRATION=false`, `ENABLE_EXCHANGES=false`, `RUN_MIGRATIONS_ON_BOOT=false`.
- Les secrets PostgreSQL ne sont pas exposés par le connecteur Render ; `DATABASE_URL` n'a pas été configurée. L'URL interne doit être saisie directement depuis le tableau de bord Render de la base dans l'environnement du service API, sans être transmise dans la conversation.
- Render a déclenché le déploiement `dep-dbpjv9k9v7es73c3pi80` sur le commit `a66e0877`. Logs de construction : 17 tests réussis, 1 test d'intégration PostgreSQL explicitement ignoré dans Render. Dernier état consulté au moment de cette note : `update_in_progress`.
- Étape suivante après saisie privée de l'URL : confirmer `databaseConfigured:true`, lancer migration contrôlée des neuf tables avec `RUN_MIGRATIONS_ON_BOOT=true`, vérifier `/api/ready`, puis remettre le drapeau à `false`. Ne pas activer les inscriptions ou les échanges avant vérification des e-mails et des transactions avec vrais comptes.


## 10 novembre 2026 — préparation stricte de la première migration
- Base Render existante `trokiva-db` confirmée `available` ; API dernière mise à jour 16:01 UTC. Aucun signe d'un nouveau déploiement lié à `DATABASE_URL` à l'heure du contrôle, et accès externe de diagnostic impossible depuis les outils. La présence réelle du secret doit être confirmée via `/api/health` par un accès interne au service.
- Nouvelle garde `RUN_MIGRATIONS_ON_BOOT=true` : l'API refuse de démarrer si `ENABLE_REGISTRATION=true` **ou** `ENABLE_EXCHANGES=true`, empêchant une migration accompagnée d'ouverture publique prématurée.
- Tests complémentaires ajoutés à `api/test/smoke.test.js` pour les deux combinaisons dangereuses.
- Aucun secret copié, aucune base recréée, migration de production non exécutée ; `DATABASE_URL` doit être saisie dans Render privé.


## 10/11/2026 — PostgreSQL Render réellement raccordée et migration initiale réussie
- L'utilisateur a renseigné lui-même `DATABASE_URL` sur le service privé Render, sans partager le secret.
- Première tentative de migration `dep-dbpk6ktbedkc738vrn40` : `build_failed`, car le serveur de smoke-test héritait de `RUN_MIGRATIONS_ON_BOOT=true`. Aucune migration de ce déploiement n'a été confirmée.
- Correction ciblée de `api/test/smoke.test.js` commit `4d981843` : le serveur d'essai impose `RUN_MIGRATIONS_ON_BOOT=false`, sans modifier les réglages du service de production.
- Seconde tentative `dep-dbpk6vm1egvs73cbdcng` : déploiement **live** avec journal serveur **`TROKIVA schema migration verified: 9 tables`**. La connexion privée PostgreSQL fonctionne donc au moins lors de cette migration.
- Après migration, variables Render remises explicitement à **`RUN_MIGRATIONS_ON_BOOT=false`**, `ENABLE_REGISTRATION=false`, `ENABLE_EXCHANGES=false`.
- Déploiement final `dep-dbpk7avf3r2c738co1b0` : **live** (commit `4d981843`), tests de build **17 pass, 0 fail, 1 skipped** (intégration PostgreSQL jetable réservée à GitHub Actions).
- Les endpoints publics `/api/health` et `/api/ready` n'ont pas pu être ouverts depuis le navigateur de contrôle : le `ready:true` en production reste à confirmer malgré le succès du journal de migration.
- **Ne pas activer les comptes ni les échanges** avant la validation e-mail TROKIVA, le statut `ready:true`, la recette entre membres, les protections contre abus et la politique de conservation des données. Base gratuite expire le 10/12/2026.


## 10/11/2026 — PostgreSQL prêt confirmé par le démarrage de production
- API modifiée pour journaliser l'état vérifié du schéma PostgreSQL au lancement, sans afficher de chaînes de connexion ni de secrets. Commit source `42283efc` + test `89f52d01`.
- Déploiement Render `dep-dbpkar5g1s2s73doq7v0` confirmé **live** sur commit `89f52d01`.
- Journal de démarrage de production : **`TROKIVA database schema readiness: ready`**, `TROKIVA API listening on port 10000`. La base et les colonnes attendues répondent donc effectivement à l'API déployée.
- Construction Render : **18 tests réussis, 0 échec, 1 test PostgreSQL jetable ignoré volontairement** (19 tests au total).
- Resend : un seul domaine d'envoi vérifié, appartenant à un autre projet. Aucun domaine expéditeur TROKIVA validé ; **ne pas activer** `ENABLE_REGISTRATION` ni réutiliser cet autre domaine.
- `ENABLE_EXCHANGES=false`, `RUN_MIGRATIONS_ON_BOOT=false` : valeurs réappliquées lors de la phase de migration précédente ; pas d'ouverture publique.
- Les transactions PostgreSQL réelles entre comptes authentifiés restent à valider avec le workflow CI et des comptes de test contrôlés avant d'autoriser une mise en service.


## 10/11/2026 — Adresse de contact conservée et accès privé aux conversations
- Décision utilisateur : conserver l'adresse e-mail habituelle comme contact et adresse de gestion ; ne pas imposer une boîte par projet. Cela ne dispense pas de disposer d'un expéditeur techniquement autorisé/vérifié pour les e-mails automatiques. Aucun expéditeur d'un autre projet n'est réutilisé.
- Correctif `GET /api/my/offers/:id/messages` : une offre introuvable ou inaccessible retourne désormais 404, au lieu d'une réponse 200 avec liste vide. Les deux participants d'une offre acceptée obtiennent toujours 200 avec `items:[]` si aucun message n'a été échangé.
- Sélection SQL protégée par identifiants de participants et statut `accepted` ; nouveaux contrôles statiques et test d'intégration PostgreSQL isolé (refus tiers / conversation vide autorisée).
- Inscriptions et échanges publics maintenus fermés. Les tests d'intégration PostgreSQL isolés et la chaîne e-mail n'ont pas encore de validation de production.


## 10 novembre 2026 — Contact e-mail conservé et protection des conversations déployée
- Choix utilisateur : conserver l'adresse e-mail existante comme contact/gestion de TROKIVA, sans création d'une boîte distincte. La délivrabilité des e-mails automatiques dépend néanmoins d'un expéditeur autorisé par le fournisseur ; aucun domaine appartenant à un autre projet n'est automatiquement réutilisé.
- Correctif côté API de `GET /api/my/offers/:id/messages` : 404 quand l'offre acceptée n'est pas accessible au compte connecté, 200 et tableau vide pour une conversation autorisée sans messages. Test de non-régression statique et test d'intégration PostgreSQL isolé mis à jour.
- Déploiement Render `dep-dbpkct9srm7s73amrjo0` confirmé **live**, commit `66ce7e78`. Journaux : **19 tests réussis / 0 échec / 1 ignoré sur Render** ; `TROKIVA database schema readiness: ready`.
- Aucune création de compte ni envoi de confirmation e-mail réel n'a été effectué ; `ENABLE_REGISTRATION=false` et `ENABLE_EXCHANGES=false` restent en place.


## 10/11/2026 — Liens de validation des comptes renforcés
- Une demande de renvoi d'e-mail invalide désormais les précédents liens de vérification non utilisés du même compte, à l'intérieur d'une transaction verrouillée sur le compte.
- Une vérification réussie consomme le lien utilisé et révoque les autres liens de vérification du compte. Le verrouillage de compte empêche les validations concurrentes incohérentes entre renvoi et activation.
- Tests de contrôle statique et scénario d'intégration PostgreSQL isolé ajoutés pour vérifier usage unique et invalidation. **Ce scénario PostgreSQL reste à confirmer par GitHub Actions** ; il n'est pas exécuté par le service Render.
- Déploiement API `dep-dbpkengu01pc73dk4du0` confirmé **live** sur commit `5e4733c6`. Logs de build : **20 pass / 0 fail / 1 skipped** ; démarrage : `TROKIVA database schema readiness: ready`.
- Aucune activation des inscriptions ou des échanges, aucun envoi d'e-mail réel. L'adresse de contact habituelle demeure conservée.


## 10/11/2026 — Sécurité réinitialisation du mot de passe
- Les demandes successives de réinitialisation invalident désormais les anciens jetons en transaction, avec verrou de la ligne utilisateur ; une validation verrouille le même compte avant de consommer le jeton pour réduire les courses entre demande et consommation.
- Les sessions du compte et les jetons restants sont révoqués après réinitialisation réussie (comportement déjà existant, maintenu et couvert par davantage de tests).
- Un test statique de non-régression et un scénario d'intégration PostgreSQL isolé vérifient liens périmés, mot de passe remplacé et session révoquée.
- **Aucun test PostgreSQL réel sur Render et aucune ouverture des inscriptions/échanges** ; résultat de GitHub Actions toujours à établir séparément. Ne pas annoncer zéro bug : les parcours humains et l'envoi e-mail exigent une recette.


## 10/11/2026 — Vérification production réinitialisation
- API déployée sur Render, déploiement `dep-dbpkgk5g1s2s73dpcu20`, commit `ef82520e`, statut final **live**.
- Construction : **21 tests réussis**, **0 échec**, **1 test PostgreSQL jetable ignoré** sur Render (22 au total).
- Journal de démarrage : `TROKIVA database schema readiness: ready` et `TROKIVA API listening on port 10000`.
- Les protections de rotation des jetons de réinitialisation sont intégrées ; test PostgreSQL de bout en bout et e-mails réels restent à confirmer avant ouverture.


## 10/11/2026 — Correction directe de l'icône iOS TROKIVA
- Signalement utilisateur : icône installée sur iPhone floue / illisible. Diagnostic : la balise `apple-touch-icon` incorporait un PNG rectangulaire 285×228 au lieu d'une icône carrée ; `icon.svg` utilise aussi ce PNG embarqué et ne constitue pas un logo vectoriel natif.
- Nouveau fichier binaire `apple-touch-icon.png` **180×180** commité dans le dépôt, dérivé du PNG original embarqué, mis à l'échelle bicubique et placé sur fond blanc carré, sans redessiner ni déformer le symbole.
- `index.html` : balise Apple désormais `/apple-touch-icon.png?v=2` ; `manifest.webmanifest` : référence PNG carrée supplémentaire, SVG d'origine préservé ; `sw.js` : cache v7 et préchargement de l'icône.
- API : serveur statique sait aussi servir la nouvelle image en `image/png`. Nouveau smoke-test sur signature PNG, dimensions 180×180 et référence Apple.
- **Render static `trokiva-preview`** : déploiement `dep-dbpkocifngtc73fnbokg` confirmé `live`.
- **Render API `trokiva-api`** : déploiement `dep-dbpkohhsrm7s73anv5kg` confirmé `live`, tests de construction 21 pass, 0 fail, 1 test PostgreSQL volontairement skipped, schéma PostgreSQL toujours `ready`.
- Limite : l'icône source 285×228 est matricielle. Une correction de taille, de fond et de référence peut améliorer le rendu iOS mais ne transforme pas cette source en vectoriel haute résolution ; rendu après suppression et réinstallation de l'icône iPhone à confirmer visuellement. Les deux applications Render sont déployées.


## 10/11/2026 — Icône iOS PWA TROKIVA corrigée
- Le raccourci iPhone montrait une icône floue ; diagnostic du dépôt : balise `apple-touch-icon` contenant le PNG original rectangulaire **285 × 228**, et `icon.svg` affichant ce même PNG intégré dans une toile carrée. Le logo source n'a pas été redessiné.
- Nouvelle icône `apple-touch-icon.png` **carrée 180 × 180**, encodée en PNG RGBA à partir du fichier original référencé dans `assets/trokiva-symbol.svg`. Ajustement proportionnel sans déformation, fond blanc ; fichier original inchangé.
- `index.html` utilise désormais `/apple-touch-icon.png?v=2` et non plus un PNG rectangulaire intégré ; `manifest.webmanifest` référence l'icône PNG carrée tout en conservant `/icon.svg` ; cache PWA `sw.js` passé à v7 ; l'API sert aussi `apple-touch-icon.png`.
- Test smoke ajouté : contrôles HTTP 200, type `image/png`, signature PNG et dimensions exactes 180 × 180, et référence HTML.
- Commit GitHub du lot : `ac0522c6`. Render statique : `dep-dbpkonon74is738olpt0` **live**. API : `dep-dbpkooh5efls73dghlvg` déclenché (état à suivre). La vérification d'affichage effective sur l'écran d'accueil iPhone nécessite de rafraîchir le raccourci (iOS peut garder l'ancienne icône en cache).
- Ne pas confondre une icône PWA 180 × 180 plus adaptée avec un fichier vectoriel original : le logo source de 285 × 228 pixels limite intrinsèquement la résolution maximum.


## 10/11/2026 — Refonte de cadrage mobile et desktop de TROKIVA
- Demande : interface jugée trop « site vitrine » ; sections et fenêtres mal cadrées, présentation de la PWA insuffisamment applicative.
- `index.html` : nouvelle couche finale `trokiva-app-shell-v1` harmonisant largeur des écrans, cadres et grilles de cartes, rayons de coins, hauteur des boutons, typographie plus compacte, marges régulières, panneau de brouillons, écrans Explorer/Publier/Messages/Profil et navigation inférieure flottante en zone sûre iOS. Le logo original et toutes les fonctions des brouillons locaux sont préservés.
- `compte.html` : `trokiva-member-app-shell-v1` pour les formulaires, onglets, listes d'annonces, messagerie et modération, avec grilles adaptatives et actions reflow sans débordements attendus. Fonctionnalités et requêtes API inchangées.
- Service Worker `sw.js` : cache mis à jour de `v7` à `v8`. Tests smoke renforcés pour la présence des couches UI et les contraintes mobiles.
- Aucune annonce ou conversation fictive injectée, aucune modification du schéma PostgreSQL ou des réglages de sécurité.
- Vérifier le rendu sur véritable iPhone, petits écrans Android et bureau après déploiement ; les tests statiques ne démontrent pas à eux seuls l'absence de tous problèmes visuels.


## Contrôle déploiement refonte interface — 10/11/2026
- PWA statique Render `dep-dbpks81srm7s73aoajm0` confirmée **live**.
- API et portail membre Render `dep-dbpks8sipgvc738140sg` confirmés **live** ; logs de build **21 tests réussis / 0 échec / 1 test PostgreSQL isolé ignoré**. Journal `TROKIVA database schema readiness: ready`.
- Commit déployé `afc4cc8b`. Vérification visuelle manuelle sur iPhone/desktop **non effectuée** à ce stade ; ne pas garantir absence de débordements sans cette recette.


## 10/11/2026 — Corrections ciblées des captures iPhone (Explorer et Publier)
- L'utilisateur a fourni des captures montrant une hauteur excessive de page, la barre mobile flottante laissant apparaître le footer et de trop grands blocs de formulaire.
- `index.html`: styles `trokiva-mobile-corrections-v2` (CSS uniquement) : header abaissé à 52px, flèches à 32px, sections sans hauteur minimale forcée, deux actions Explorer sur une même ligne, carte d'absence d'annonce compacte, champs Publier à 40px et description à 78px, espacement resserré.
- Barre mobile ancrée au bas de l'écran avec safe-area iOS, fond opaque et rayon supérieur uniquement ; footer masqué dans la PWA mobile pour éviter sa bande derrière le dock ; contenu conservé en bureau.
- `sw.js` : cache `trokiva-preview-v9`. Test smoke : vérification des règles critiques et des balises `style` équilibrées.
- Ni les fonctions de navigation, ni les brouillons locaux, ni les données PostgreSQL, ni le logo n'ont été modifiés. Contrôle visuel sur iPhone réel encore nécessaire après déploiement.
