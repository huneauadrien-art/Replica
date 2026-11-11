# Backend : budget du foyer

Le « backend » est le petit serveur Node du NAS (`budget/serveur/index.ts`), sans
aucune dépendance npm à l'exécution. Il garde les fiches dans `budget.json`, en fait
une copie par jour (60 jours) et sert la version web.

## Ce que le skill prévoit, et ce qui s'applique ici

| sujet | ici |
| --- | --- |
| comptes, e-mail, mot de passe oublié, OAuth | **sans objet** : un NAS = un foyer, protégé par un code d'accès (variable `CODE` du docker-compose) |
| rôles | sans objet (tous les membres du foyer voient tout le budget) |
| suppression du compte | supprimer le projet Docker et son dossier `donnees` sur le NAS ; sur un téléphone, se déconnecter du NAS puis effacer les données de l'appli |
| base de données, migrations | fichier JSON ; les fiches n'ont pas de schéma figé côté serveur (le serveur ne lit que `id` et `maj`). Ajouter une collection : `COLLECTIONS` (`sync.ts`) + `Donnees` / `DONNEES_VIDES` (`types.ts`), puis mettre à jour le NAS |
| règles d'accès | une seule vérification, faite sur **toutes** les routes `/api/*` avant tout traitement |
| données de démonstration | les tests utilisent des montants fictifs ; aucune donnée réelle dans le dépôt (public) |
| sauvegardes | copie quotidienne sur le NAS (60 jours) + bouton « Enregistrer une sauvegarde » dans l'appli |
| paiements (Stripe) | sans objet : usage personnel |
| e-mails | sans objet ; les rappels seront des notifications locales du téléphone |
| tâches planifiées | synchro à l'ouverture, après chaque saisie, chaque minute ; sauvegarde quotidienne du NAS |
| intégrations tierces | aucune (pas de lien bancaire, voir la recon) |
| variables | `CODE` (obligatoire), `PORT`, `DONNEES`, `SITE`, `VERSION`, `TZ` : toutes dans `nas/budget/docker-compose.yml`, aucun secret dans le dépôt (le fichier contient « remplacez-par-votre-code ») |

## Liste de sécurité

- [x] secrets seulement dans les variables d'environnement du NAS ; `.env*.local` ignorés par git ; aucun secret dans l'appli
- [x] entrées contrôlées sur le serveur : corps JSON illisible → 400 ; `nettoyerChangements` ne garde que les collections connues, des objets avec un `id` texte ≤ 64 caractères et un `maj` numérique, 20 000 fiches au plus par envoi ; corps limité à 10 Mo (testé : `sync.test.ts`)
- [x] autorisation vérifiée sur chaque lecture et écriture (`/api/etat`, `/api/sync`), comparaison à temps constant
- [x] limitation : après 10 codes faux depuis une même adresse, réponse 429 pendant 10 minutes
- [x] webhooks : aucun
- [x] envois de fichiers : aucun (pas de pièces jointes dans le budget)
- [x] pas de données du foyer dans les adresses ni dans les journaux (les erreurs ne journalisent que la méthode, le chemin et le type d'erreur)
- [~] dépendances : le serveur n'en a aucune. `npm audit` signale des failles dans les **outils de construction** d'Expo (decode-uri-component, glob, minimatch, node-forge, deepmerge), les mêmes que pour Registre Vigne ; elles ne tournent ni sur le NAS ni dans le téléphone. Les corriger demande `--force`, qui casserait Expo : à revoir à la prochaine version d'Expo.
- [x] politique de confidentialité : aucun prestataire ; les données restent sur les téléphones et le NAS du foyer

## Limite connue

Le NAS parle en HTTP sur le réseau de la maison (comme le registre) : le code d'accès
passe en clair sur le Wi-Fi local. L'accès depuis l'extérieur (HTTPS ou VPN) est déjà
sur la liste « Reste à faire » du registre et protégera les deux.
