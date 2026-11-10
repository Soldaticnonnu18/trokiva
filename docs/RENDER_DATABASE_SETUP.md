# TROKIVA — Raccordement PostgreSQL / Render

État : service API disponible, base PostgreSQL Render disponible, **aucune inscription activée**.

## Précondition importante

La base `trokiva-db` est en plan gratuit et annonce l'expiration du **10 décembre 2026**. Les données importantes ne doivent pas être confiées à cette instance sans stratégie de conservation ou migration.

## 1. Connexion privée (Render → Render)

- Ouvrir [la base TROKIVA](https://dashboard.render.com/d/dpg-dbpf2crbc2fs73a17ogg-a) dans Render.
- Dans les informations de connexion, utiliser **Internal Database URL**. Elle n'a pas à être transmise à ChatGPT, placée dans une capture d'écran ou enregistrée dans GitHub.
- Ouvrir [le service TROKIVA API](https://dashboard.render.com/web/srv-dbpf2iajnfac7398mrvg).
- Environment → ajouter **DATABASE_URL** = URL interne copiée depuis `trokiva-db`.
- Conserver **ENABLE_REGISTRATION=false**.
- Aucun assouplissement de l'IP allowlist externe n'est nécessaire : les deux services sont hébergés à Francfort.

## 2. Initialiser le schéma avec un redémarrage contrôlé

Après avoir ajouté la bonne `DATABASE_URL` interne, configurer temporairement dans le service API :
- `RUN_MIGRATIONS_ON_BOOT=true`
- `ENABLE_REGISTRATION=false`

Déployer le service `trokiva-api` sur Render. Au démarrage, la migration `api/schema.sql` s'exécute **uniquement si le drapeau est égal à `true`** ; elle crée si nécessaire les cinq tables, sous verrou consultatif PostgreSQL. En cas d'erreur, le nouveau serveur ne démarre pas et le déploiement doit être considéré comme non validé.

Contrôler `/api/ready` et les journaux Render. Dès que `ready:true` est confirmé, remettre `RUN_MIGRATIONS_ON_BOOT=false` afin d'éviter de répéter les migrations lors de chaque démarrage.

La commande `cd api && npm run migrate` reste disponible pour une opération manuelle depuis un environnement sécurisé où la variable `DATABASE_URL` existe. Aucune clé ne doit être publiée dans GitHub, dans le navigateur ou dans cette conversation.

## 3. Vérifications

- `https://trokiva-api.onrender.com/api/health` répond si le processus Node est en ligne ; `databaseConfigured` confirme seulement la présence de la variable de connexion.
- `https://trokiva-api.onrender.com/api/ready` doit répondre 200 et `ready:true` uniquement après connexion PostgreSQL et présence des cinq tables. Tant qu'il retourne 503, l'API n'est pas prête pour les utilisateurs.

## 4. E-mails (avant toute ouverture)

Configurer le domaine expéditeur, la clé serveur Resend et l'URL du serveur dans Render : `RESEND_API_KEY`, `RESEND_FROM_EMAIL` et `PUBLIC_API_BASE_URL`. L'inscription ne doit être activée par `ENABLE_REGISTRATION=true` qu'après validation de toute la chaîne : envoi, réception, consommation unique du lien, connexion et déconnexion, réinitialisation du mot de passe, protection contre abus, et sécurisation même origine entre PWA et API.

**Ne pas activer les inscriptions maintenant.** La PWA et l'API sont sur des sous-domaines différents ; le cookie de session n'est pas prêt pour ce parcours. Le test GitHub Actions doit aussi être exécuté et validé.
