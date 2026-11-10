# TROKIVA — Suivi des maillons (10 novembre 2026)

## Vérifié / posé
- Identité TROKIVA et direction responsive communes à l'accueil téléphone et ordinateur.
- Dépôt GitHub indépendant et site Render statique de prévisualisation.
- Navigation vers Accueil, Explorer, Publier, Communautés, Messages et Profil.
- Brouillons **locaux** multiples : ajouter, modifier, supprimer, exporter et réimporter un fichier JSON.
- Migration du premier brouillon local V1 vers la liste V2 avec dédoublonnage.
- Les boutons de recherche sans catalogue réel ont été retirés ; pas de faux résultats.
- Aucun faux utilisateur, faux objet ni fausse conversation.
- Déploiements automatiques Render désactivés : publication contrôlée.

## Non terminés (ne pas présenter comme opérationnels)
- Comptes / vérification e-mail / sessions.
- Base PostgreSQL et API pour annonces, objets, images et échanges.
- Messagerie, communautés privées, modération et notifications.
- Recherche publique, filtres et géolocalisation approximative.
- Tests automatisés et recette navigateur complète (responsive/PWA).
- Visuels de produit réels ; illustration vélo de la maquette non encore intégrée.

## Points de vigilance
- Le site statique stocke les brouillons uniquement dans le navigateur ; exporter avant de changer de téléphone ou d'effacer les données.
- Le dépôt GitHub a été observé PUBLIC : vérifier le réglage de confidentialité. Aucune clé secrète n'est déposée dans le code public.
- Ne jamais utiliser le dépôt ni le service MINBA pour TROKIVA.
