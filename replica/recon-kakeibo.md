# Carte de reconnaissance : Kakeibo (méthode + applis mobiles)

Périmètre : la méthode japonaise Kakeibo telle que les applis la mettent en œuvre :
revenus du mois, épargne décidée d'abord, dépenses dans 4 catégories, bilan de fin de
mois avec les 4 questions. On garde les meilleures idées de plusieurs applis, pas une seule.
Pour : le **budget du foyer** de l'utilisateur, appli séparée de Registre Vigne
(aucune donnée du domaine dedans). Pas un produit à vendre.
Plateforme : iPhone, Android, web (comme Registre Vigne).
Date : 2026-11-10

> **Limite.** Sources publiques lues à travers des extraits de recherche : le réseau
> de cette session ne peut pas ouvrir les pages (apps.apple.com refusé). Aucun écran
> observé, aucune capture dans `replica/screens/`. Les écrans sont **déduits** des
> descriptions des stores et des guides. Peu d'avis publiés : ces applis sont récentes
> et ont peu de notes.

## Sources

| # | source | URL | notes |
| --- | --- | --- | --- |
| 1 | Wikipédia « Kakeibo » | https://en.wikipedia.org/wiki/Kakeibo | méthode créée en 1904 par Hani Motoko |
| 2 | Goodbudget, guide | https://goodbudget.com/how-to-budget-with-kakeibo/ | revenus − charges fixes = disponible ; épargne fixée avant de dépenser |
| 3 | PocketGuard, guide | https://pocketguard.com/blog/kakeibo-method/ | 4 catégories, 4 questions, bilan |
| 4 | Money Crashers, guide | https://www.moneycrashers.com/kakeibo-japanese-budgeting-method-save-money/ | catégories survie / optionnel / culture / extra |
| 5 | Shoeboxed, guide | https://shoeboxed.com/blog/kakeibo-japanese-budgeting-method | « culture » séparée ou non selon les livres |
| 6 | Kakeibo: Simple Budget Tracker / Save First (iOS) | https://apps.apple.com/us/app/id6760362042 | revenu du mois, puis objectif d'épargne d'abord ; hors ligne ; pas de lien bancaire ni de cloud ; widget ; Pro 2,99 $/mois (export illimité) |
| 7 | Kakeibo: Budget Planner, Halil Apps (Android) | https://www.similarweb.com/app/google/com.halil.kakeibo/ | même éditeur que (6), « Save first. Live on the rest. » ; abonnement |
| 8 | Kakeibo: Goal & Budget Planner (iOS) | https://apps.apple.com/au/app/kakeibo-goal-budget-planner/id6756763478 | objectifs ; « réflexions rapides » chaque semaine, gratuites |
| 9 | Kakebo: Budget + AI (iOS) | https://apps.apple.com/app/id6479921558 | budget hebdo et mensuel calculé à partir de l'objectif d'épargne |
| 10 | Guide de l'appli Kakebo (Medium, 2020) | https://medium.com/officialkakebo/how-to-effectively-use-the-kakebo-mobile-app-9cfc9e289e06 | accueil en cartes (revenu, objectif, budget) ; revenu récurrent ; bouton + central, bascule Dépense/Épargne |
| 11 | Kakeibo (iOS, id6762317611) | https://apps.apple.com/us/app/id6762317611 | export CSV par période (UTF-8 BOM pour Excel) ; widget « dépenses du jour » |
| 12 | Kakei: The Art of Budgeting (iOS) | https://apps.apple.com/ca/app/kakei/id6758553883 | sauvegarde Google Drive (corrigée), catégories par défaut traduites |
| 13 | Kakeibo! (iOS, ancienne) | https://apps.apple.com/us/app/kakeibo/id1397144593 | avis : export/import en achat unique apprécié |
| 14 | Étude de cas Raffi | https://raffi.is-a.dev/case-studies/kakeibo | Expo + Supabase ; comptes (espèces, banque, carte…) ; scan de tickets ; bilan en 2 minutes « ce qui a marché / trop dépensé / à changer » ; mode hors ligne |
| 15 | Product Hunt « My Kakeibo » | https://www.producthunt.com/products/my-kakeibo/reviews | peu d'avis |
| 16 | Synthèse d'avis Kimola (appli budget générale) | https://kimola.com/reports/empower-your-strategy-with-wallet-app-insights-app-store-us-154577 | plaintes : perte de données à la synchro, catégories non modifiables, pas d'export Excel/PDF |

## La méthode en 30 secondes

1. **Début du mois** : on note ses revenus, on retire les charges fixes (loyer, crédit,
   abonnements). On **décide l'épargne d'abord**. Le reste = ce qu'on peut dépenser.
2. **Pendant le mois** : chaque dépense est notée, à la main, dans une des 4 catégories :
   - **Survie** : courses, logement, santé, transport ;
   - **Optionnel** : restaurant, achats plaisir ;
   - **Culture** : livres, sorties, abonnements vidéo (certains livres la fusionnent avec Optionnel) ;
   - **Extra** : imprévus, réparations, cadeaux.
3. **Fin du mois** : on répond aux 4 questions : combien j'avais ? combien je voulais
   épargner ? combien j'ai dépensé ? comment faire mieux ? Le bilan sert au mois suivant.

La saisie **manuelle** est voulue : elle fait prendre conscience de chaque dépense. Les
applis Kakeibo refusent souvent le lien bancaire (source 6).

## Boucle principale

Ouvrir le mois → revenu et épargne visés → « reste à dépenser » affiché → noter une dépense
en 3 touches (montant, catégorie, valider) → le reste baisse → bilan de fin de mois → mois suivant.

C'est le « + » rapide qui fait ou défait l'appli : si noter une dépense prend plus de
10 secondes, on arrête au bout d'une semaine (source 14 : « ouvrir vite, ajouter vite »).

## Écrans (déduits)

| ID | écran | accès | rôle | composants | états |
| --- | --- | --- | --- | --- | --- |
| S01 | Bienvenue / premier mois | premier lancement | expliquer la méthode en 3 écrans, choisir la devise | pages qui défilent, bouton suivant | première ouverture |
| S02 | Accueil du mois | onglet Mois | reste à dépenser, épargne visée, barres des 4 catégories, dernières dépenses | grande carte chiffre, 4 jauges, liste | vide (mois non préparé), en cours, dépassé (rouge), mois clos |
| S03 | Préparer le mois | S02 « Préparer » ou 1er du mois | revenus, charges fixes, objectif d'épargne, budget par catégorie | champs montant, liste de lignes récurrentes, interrupteur « reprendre le mois dernier » | premier mois, reprise du mois précédent |
| S04 | Ajouter une dépense | bouton + central (partout) | montant, catégorie, note, date | pavé numérique, 4 grosses pastilles catégorie, date (aujourd'hui par défaut) | vide, montant invalide |
| S05 | Ajouter un revenu / un versement épargne | S04, bascule en haut | même saisie, type différent | bascule Dépense / Revenu / Épargne | — |
| S06 | Liste des dépenses | onglet Dépenses | toutes les lignes du mois, filtre par catégorie, recherche | liste groupée par jour, filtres, total | vide, filtré sans résultat |
| S07 | Détail / modifier une ligne | S06 toucher une ligne | corriger, supprimer | formulaire S04, bouton supprimer | confirmation de suppression |
| S08 | Bilan du mois | S02 en fin de mois, ou notification | les 4 questions avec les chiffres, 3 champs « ce qui a marché / trop dépensé / à changer » | chiffres résumés, comparaison avec le mois d'avant, zones de texte | à faire, rempli |
| S09 | Point de la semaine | S02, chaque dimanche (option) | reste par semaine, une phrase de réflexion | carte, champ texte | — |
| S10 | Objectifs d'épargne | onglet Épargne | objectifs (vacances, voiture…), montant visé, date, avancement | liste de barres, + objectif | aucun objectif, atteint |
| S11 | Historique | onglet Historique | les mois passés : épargné vs visé, dépenses par catégorie | graphique en barres par mois, liste des bilans | moins de 2 mois |
| S12 | Catégories | Réglages | renommer, ajouter des sous-catégories (ex. Survie › Courses), couleurs | liste, éditeur | — |
| S13 | Réglages | onglet / roue | devise, jour de début du mois, rappels, sauvegarde, export, code de verrouillage | liste de réglages | — |
| S14 | Export / sauvegarde | S13 | export CSV par période (Excel), sauvegarde et restauration | sélecteur de période, partage | rien à exporter |
| S15 | Widget écran d'accueil | téléphone | reste à dépenser / dépensé aujourd'hui | widget | — |

## Parcours

```
F01 Préparer le mois                        (le parcours qui fixe la règle)
    S02 (vide) -> S03 revenus, charges fixes, épargne -> S02 « reste à dépenser »
    edge : mois précédent repris tel quel (1 touche) ; revenus variables (saisis au fil du mois) ;
           épargne > disponible -> avertir

F02 Noter une dépense                       (le parcours de tous les jours, à battre : 3 touches)
    n'importe où : + -> S04 montant -> catégorie -> valider -> S02 mis à jour
    edge : dépense d'hier (date) ; dépense qui fait passer en négatif -> rouge, pas de blocage ;
           saisie hors réseau ; même dépense notée deux fois sur deux téléphones

F03 Mettre de côté pour un objectif
    + -> S05 bascule Épargne -> choisir l'objectif -> montant -> S10 avance

F04 Faire le bilan du mois
    notification fin de mois -> S08 chiffres + 3 réponses -> clore le mois -> S03 du mois suivant pré-rempli
    edge : bilan oublié (le proposer à la prochaine ouverture) ; mois clos puis dépense oubliée

F05 Point de la semaine (option)            S09
F06 Revoir l'année                          S11 -> un mois -> S08 (lecture)
F07 Exporter pour Excel                     S13 -> S14 -> période -> partager le CSV
F08 Corriger une erreur                     S06 -> S07 -> modifier ou supprimer
```

Clics du parcours F02 (les applis observées) : bouton +, montant, catégorie, valider = **4 touches**.
Objectif du clone : **3** (catégorie qui valide directement si le montant est saisi).

## Composants

| composant | variantes | états | écrans |
| --- | --- | --- | --- |
| Carte chiffre clé | reste à dépenser, épargné, dépensé | normal, attention (< 10 %), dépassé | S02, S09, S15 |
| Jauge de catégorie | 4 catégories, couleur propre | sous budget, proche, dépassé | S02, S11 |
| Pastille de catégorie (sélecteur) | grande (saisie), petite (liste) | choisie, non choisie | S04, S06, S12 |
| Pavé numérique montant | — | vide, saisi, invalide | S04, S05, S03 |
| Bouton + flottant | — | — | partout |
| Bascule de type | Dépense / Revenu / Épargne | — | S04, S05 |
| Ligne de transaction | dépense, revenu, épargne | normal, glisser pour supprimer | S02, S06 |
| Barre d'avancement objectif | — | en cours, atteint | S10 |
| Graphique barres mensuelles | — | peu de données | S11 |
| Zone de réflexion (texte) | 3 questions | vide, remplie | S08, S09 |
| Sélecteur de mois | ← mois → | mois courant, passé, clos | S02, S06, S11 |
| Toast « dépense ajoutée / annuler » | — | — | S04 |

## Modèle de données (déduit)

```
Mois          id (AAAA-MM), revenusPrevus, chargesFixes[{libelle, montant}],
              epargneVisee, budgets{survie, optionnel, culture, extra}, clos (bool)
              evidence : 2, 3, 6, 10 ; confidence : high

Transaction   id, date, montant (centimes), type (depense | revenu | epargne),
              categorie (survie | optionnel | culture | extra) si dépense,
              sousCategorie?, note?, objectifId? si épargne, creeLe, modifieLe
              evidence : 6, 10, 11 ; confidence : high

Categorie     id, nom, groupe (une des 4), couleur, ordre
              evidence : 5, 12, 16 (catégories modifiables demandées) ; confidence : medium

ObjectifEpargne  id, nom, montantVise, dateVisee?, (avancement = somme des transactions épargne)
              evidence : 8, 9, 10 ; confidence : high

Bilan         moisId, ceQuiAMarche, tropDepense, aChanger, creeLe
              evidence : 3, 14 ; confidence : high

LigneRecurrente  libelle, montant, type (revenu | charge fixe), jour?
              evidence : 10 (revenu récurrent) ; confidence : medium (devinette pour les charges)

Reglages      devise, jourDebutMois, rappelSoir (heure), rappelBilan, verrou
              evidence : 6, 14 ; confidence : medium
```

Supposition : un seul foyer, une seule devise. Le multi-devises et les comptes séparés
(espèces, banque, carte) de la source 14 sont en « could ».

## Ce qui ne se clone pas

- **Le lien bancaire automatique** : réservé aux établissements agréés (DSP2) et contraire à
  l'esprit Kakeibo. Un import de relevé CSV de la banque reste possible plus tard.
- **Les noms et contenus des applis** (« Kakeibo: Save First », leurs textes, icônes,
  illustrations) : on refait tout. Le mot « kakeibo » désigne une méthode publique, mais
  plusieurs applis l'utilisent comme nom : en choisir un autre (`/replica-brand`).
- **Les textes des livres Kakeibo** (questions, exercices des carnets publiés) : on reformule.
- **L'abonnement Pro** : pour un usage perso, rien à vendre, tout est inclus.

## Taille

15 écrans (dont un widget), 8 parcours, 7 entités. Parties difficiles :
1. **La saisie en 3 touches** qui reste agréable tous les jours (pavé, catégories, annuler).
2. **La synchronisation entre deux téléphones du foyer** sans perte ni doublon, hors ligne
   d'abord. Registre Vigne sait déjà le faire avec le NAS (`sync.ts`) : à réutiliser.
3. **Le widget d'écran d'accueil** (code natif à part sur iOS et Android avec Expo).

Le calcul lui-même est simple (additions par mois et par catégorie).
Taille : **S à M**, un week-end pour la saisie + le mois + le bilan, deux à trois semaines
avec objectifs, historique, synchro NAS et widget.
