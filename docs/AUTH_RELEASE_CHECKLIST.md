# TROKIVA — Conditions de mise en service des comptes

Date de référence : 10 novembre 2026.

## État actuellement constaté
- Base indépendante `trokiva-db` : disponible sur Render, expiration annoncée **10 décembre 2026**.
- Service `trokiva-api` : déployé. Le connecteur ne renvoie pas la chaîne interne `DATABASE_URL`.
- Domaine Resend : seul `rendezelle.fr` est vérifié. **Ne pas l'utiliser pour TROKIVA.**
- Aucun compte réel ni vérification e-mail de bout en bout confirmés.
- Le dépôt GitHub `Soldaticnonnu18/trokiva` est **public**.

## Porte 1 — Base privée et schéma
1. Copier `Internal Database URL` depuis le dashboard de `trokiva-db` vers le secret `DATABASE_URL` de `trokiva-api`. Ne jamais envoyer ce secret en chat, dans GitHub ou sur une capture.
2. Maintenir `ENABLE_REGISTRATION=false`.
3. Configurer temporairement `RUN_MIGRATIONS_ON_BOOT=true` puis déployer l'API pour exécuter `api/schema.sql`.
4. Vérifier `GET /api/ready` = 200 avec `ready:true` et contrôler les journaux.
5. Remettre `RUN_MIGRATIONS_ON_BOOT=false`.

## Porte 2 — Expéditeur e-mail indépendant
1. Disposer d'un domaine ou sous-domaine que TROKIVA est autorisé à utiliser et le faire vérifier auprès du prestataire d'e-mail.
2. Configurer `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `PUBLIC_API_BASE_URL` dans les secrets Render uniquement.
3. Tester un e-mail de vérification réel, réception, expiration, tentative de réutilisation, renvoi, et flux de récupération du mot de passe.

## Porte 3 — Sessions et même origine
1. Servir la PWA et les endpoints `/api/*` sous **la même origine HTTPS** avant de brancher l'interface aux cookies de session.
2. Vérifier `SameSite`, `Secure`, `HttpOnly`, CSRF, limitation des tentatives de connexion, et l'invalidation de sessions.
3. Vérifier les opérations propriétaires sur les brouillons d'annonces, leur visibilité publique, et le refus d'accès aux annonces d'autrui.
4. Automatiser les tests de non-régression, y compris la base et les e-mails, sans données personnelles en dur.

## Porte 4 — Activation publique
- Lorsque les trois portes précédentes sont validées, activer `ENABLE_REGISTRATION=true`.
- Prévoir une formule durable pour PostgreSQL avant l'expiration du plan gratuit.
- Prévoir une procédure de sauvegarde/restauration des données.
- Ne pas annoncer le service public comme prêt avant une recette réelle de bout en bout.

**État final actuel :** compte et annonces publiques volontairement inactifs. Aucun autre projet ne doit être modifié.
