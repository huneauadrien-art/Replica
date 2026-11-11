# Architecture : budget du foyer (clone Kakeibo)

D'après `recon-kakeibo.md` et `features-kakeibo.csv`. Nom de l'appli à choisir
(`/replica-brand`) ; en attendant : **Budget du foyer**, dossier `budget/`.

## Choix de fond

On reprend **la recette de Registre Vigne**, qui marche déjà chez vous : appli Expo
(Android, iPhone, web), données gardées sur chaque téléphone, synchronisation par
le NAS. Pas de Supabase, pas de Vercel, pas de compte en ligne : vos chiffres
restent chez vous, et rien de nouveau à apprendre.

| couche | choix | pourquoi |
| --- | --- | --- |
| appli | Expo SDK 57, Expo Router, TypeScript | même base que Registre Vigne, un seul code pour Android, iPhone et web |
| style | StyleSheet + jetons de `/replica-design` | comme Registre Vigne, pas de Tailwind à ajouter |
| données sur le téléphone | AsyncStorage (IndexedDB sur le web) | hors ligne d'abord, déjà utilisé |
| logique | `budget/src/core/` sans dépendance, testée avec vitest | calculs du mois et synchro testés sans téléphone |
| serveur | Node sans dépendance, `budget/serveur/index.ts` | copie allégée du serveur du registre (sans pièces jointes) |
| stockage serveur | un fichier JSON + une copie par jour (60 jours) | assez pour un foyer ; déjà éprouvé |
| hébergement | 2e conteneur Docker sur le NAS UGREEN, port **8081** | séparé du registre : autre code d'accès, autre dossier de données |
| image | `ghcr.io/huneauadrien-art/budget-foyer`, construite par GitHub Actions | même chemin que l'image du registre |
| apk Android | GitHub Actions, release `budget-android-latest` | même chemin que le registre |
| rappels | `expo-notifications`, notifications locales | rappel du soir, rappel du bilan, sans serveur |
| export | CSV généré sur le téléphone + `expo-sharing` | déjà utilisé dans le registre |
| paiements, e-mail, tâches serveur | aucun | usage perso : rien à vendre, rien à envoyer |

Pourquoi une appli séparée et pas un onglet du registre : le budget du foyer ne doit
pas se mélanger aux données du domaine (ni dans la synchro, ni dans les exports pour
l'expert-comptable), et un autre membre du foyer peut l'utiliser sans voir le registre.

Pourquoi recopier la synchro au lieu de la partager : deux applis Expo dans le même
dépôt qui importent le même fichier compliquent la construction. `sync.ts` fait 130
lignes ; on le recopie en lisant la liste des collections en paramètre. Si un bug y
est corrigé, on le corrige dans les deux.

## Organisation du dépôt

```
budget/                     nouvelle appli (à côté de app/)
  src/core/                 types.ts (= replica/schema-kakeibo.ts), mois.ts, sync.ts, csv.ts, __tests__/
  src/data/                 store.tsx (stockage + synchro), serveur.ts
  src/app/                  écrans (onglets Mois, Dépenses, Épargne, Historique ; reglages.tsx)
  serveur/index.ts
Dockerfile.budget
nas/budget/docker-compose.yml
.github/workflows/budget-*.yml
```

## Schéma

Pas de SQL : les fiches sont des objets JSON (voir **`replica/schema-kakeibo.ts`**).
Les règles du skill appliquées à ce choix :

| règle | ici |
| --- | --- |
| identifiant unique | `id` texte aléatoire créé sur le téléphone ; **id fixe** quand l'objet est unique par nature : `Mois.id = '2026-11'`, `Bilan.id = '2026-11'`, `Reglages.id = 'foyer'` |
| dates de modification | `maj` (ms), posé par la synchro, sert à départager deux téléphones |
| propriétaire | un NAS = un foyer ; le code d'accès protège tout. Pas de multi-utilisateur |
| suppression | pierre tombale `{ id, maj, supprime: true }` ; une sous-catégorie utilisée est **archivée**, pas supprimée, pour garder l'historique ; supprimer un objectif détache ses versements (`objectifId` vidé) |
| statuts | types fermés : `Groupe`, `TypeTransaction` |
| dates | texte local `AAAA-MM-JJ`, pas d'horodatage : une dépense de 23 h le 31 ne glisse pas au mois suivant |
| argent | centimes entiers, devise unique EUR (dans `Reglages`) |
| accès | le serveur vérifie le code d'accès à chaque appel `/api/*` (comme le registre) |

Ce que la base garantirait ailleurs, garanti ici par le code (et testé) :

- **un seul budget par mois** : id = clé du mois, deux téléphones écrivent la même fiche ;
- **pas de récurrente créée deux fois** : la transaction reçoit l'id `rec-<recurrenteId>-<mois>`,
  le même sur chaque téléphone ; la créer deux fois réécrit la même fiche ;
- **pas de dépense sans catégorie** : la saisie refuse ; à la lecture, une catégorie
  inconnue tombe dans « Extra › Autre » ;
- catégories par défaut créées avec des **id fixes** (`cat-courses`…) pour la même raison.

Calculs (fonctions pures dans `mois.ts`, jamais stockés) :

```
moisDe(jour, jourDebutMois)        -> CleMois
disponible(mois)                   = revenusPrevus − Σ chargesFixes − epargneVisee
depense(mois, groupe?)             = Σ transactions type depense du mois (par groupe)
resteADepenser(mois)               = disponible + revenus imprévus du mois − depense
resteParSemaine(mois, aujourdhui)  = resteADepenser / semaines restantes
avancement(objectif)               = Σ transactions type epargne de cet objectif
bilanChiffres(mois)                = les 4 questions : avais, voulais épargner, dépensé, épargné réel
```

## API

Le serveur ne fait que garder et redistribuer les fiches : tout le reste se passe
sur le téléphone.

| méthode chemin | rôle | qui | entrée | sortie | parcours |
| --- | --- | --- | --- | --- | --- |
| GET `/api/etat` | tester la connexion, version, nombre de fiches | code d'accès | — | `{ ok, version, rev, fiches }` | réglages |
| POST `/api/sync` | envoyer les fiches modifiées, recevoir celles des autres | code d'accès | `{ depuis, changements }` | `{ rev, recues }` | tous (F01 à F08) |
| GET `/*` | version web de l'appli | tous | — | fichiers du site | — |

Actions dans l'appli (pas de route serveur), par parcours :

| parcours | action | écrans |
| --- | --- | --- |
| F01 préparer le mois | `preparerMois(cle)` : copie le mois précédent ou les récurrentes, crée les transactions récurrentes à id fixe | S02, S03 |
| F02 noter une dépense | `ajouterTransaction` + annuler pendant 5 s | S04, S02 |
| F03 épargner | `ajouterTransaction(type epargne, objectifId)` | S05, S10 |
| F04 bilan | `enregistrerBilan(cle)` puis `clore(cle)` puis `preparerMois(suivant)` | S08, S03 |
| F05 point semaine | lecture de `resteParSemaine` + note | S09 |
| F06 historique | lecture | S11, S08 |
| F07 export | `exporterCsv(du, au)` → partage | S14 |
| F08 corriger | `modifierTransaction`, `supprimerTransaction` | S06, S07 |

Tâches planifiées :

| quoi | où | quand |
| --- | --- | --- |
| synchro | téléphone | à l'ouverture, après chaque saisie (regroupée 2 s), toutes les 5 min appli ouverte |
| rappel « notez vos dépenses » | notification locale | chaque soir à l'heure choisie (21 h par défaut), si rien saisi ce jour |
| rappel bilan | notification locale | dernier jour du mois de budget, 20 h |
| sauvegarde | NAS | une copie par jour, 60 jours |

## Ce qui peut mordre

- **Fin de mois** : avec `jourDebutMois = 25`, le « mois de novembre » va du 25 octobre au
  24 novembre. Une seule fonction `moisDe` partout, testée aux bords (24, 25, 31, février).
- **Fuseau horaire** : dates en texte local, jamais `new Date('2026-11-30')` (qui lit en UTC).
- **Deux téléphones en même temps** : la plus récente gagne fiche par fiche. Deux dépenses
  différentes ne se gênent pas ; deux modifications du même budget de mois : la dernière gagne.
  Acceptable pour un foyer, à signaler dans l'écran de réglages.
- **Doublons** : id fixes pour mois, bilans, récurrentes et catégories par défaut (voir plus haut).
- **Hors ligne** : tout marche sans NAS ; les fiches attendent et partent au retour du réseau.
- **Hors de la maison** : comme le registre, le NAS n'est joignable que sur le Wi-Fi de la
  maison. Les dépenses notées dehors partent au retour. L'accès extérieur (HTTPS ou VPN)
  est déjà sur la liste du registre ; il servira aux deux.
- **Confidentialité** : le dépôt est public. Aucune donnée réelle dans le code ni dans les
  tests (montants fictifs). Le code d'accès reste dans le docker-compose du NAS, jamais sur GitHub.
- **Arrondis** : centimes entiers ; la saisie « 12,5 » donne 1250. Virgule et point acceptés.
- **Export CSV** : UTF-8 avec BOM et point-virgule, pour qu'Excel français l'ouvre bien.
- **Widget** (plus tard) : code natif à part, demande un module Expo dédié ; en dernier.
- Recherche, temps réel, e-mails, limites d'API, RGPD multi-clients : sans objet ici.

## Ordre de construction

**Étape 1 — tranche verticale (un week-end).** Préparer le mois, noter une dépense,
voir le reste baisser, sur un téléphone, sans NAS, sans style.
Écrans S02, S03, S04. Fiches `mois`, `transactions`, `categories`, `reglages`.
Code `mois.ts` + tests. Fonctionnalités : saisir une dépense, 4 catégories, bouton +,
préparer le mois, reste à dépenser, saisir un revenu, hors ligne.

**Étape 2 — les « must ».** S06 liste et recherche, S07 modifier/supprimer, S08 bilan
avec les 4 questions et les 3 réponses (fiche `bilans`), sauvegarde : synchro NAS
(`sync.ts`, `serveur/index.ts`, `Dockerfile.budget`, `nas/budget/`, workflows image et apk).
À la fin de cette étape, l'appli s'utilise vraiment.

**Étape 3 — les « should ».** Jauges par catégorie, reprise du mois précédent, lignes
récurrentes (`recurrentes`), comparaison avec le mois d'avant, rappels du soir et du bilan,
objectifs d'épargne S10 (`objectifs`), historique S11, sous-catégories modifiables S12,
export CSV S14, annuler après ajout.

**Étape 4 — les « could ».** Jour de début de mois, point de la semaine S09, graphiques,
écrans d'explication S01, verrou par code, widget S15, comptes et multi-devises,
scan des tickets.

**Étape 5 — les corrections** que trouvera `/replica-entrepreneur` dans les avis.
