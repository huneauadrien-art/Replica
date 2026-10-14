# Carte de reconnaissance : Smag Farmer (web + iOS/Android)

Périmètre : ce que Smag Farmer fait de plus que Registre Vigne, pour le compléter.
Pour : le domaine de l'utilisateur (vigne + champs + jachères), pas un produit à vendre.
Date : 2026-10-14

> **Limite.** Sources publiques uniquement, lues à travers des extraits de recherche :
> le réseau de cette session ne peut pas ouvrir les pages. Aucun écran observé.
> Les sources sont surtout commerciales (Smag, coopératives). Smag Farmer vise d'abord
> les **grandes cultures** ; Smag a un autre produit pour la vigne (Agreo Vigne).

## Sources

| # | source | URL | notes |
| --- | --- | --- | --- |
| 1 | page produit Smag | https://smag.tech/nos-logiciels/logiciel-de-gestion-de-parcelles/ | « plus de 40 points de contrôle » phyto, export XML PAC, score de diversité, IFT |
| 2 | application mobile | https://smag.tech/application-mobile-smag-farmer/ | iOS/Android, avec ou sans réseau, saisie des interventions, observations partagées avec le conseiller |
| 3 | Cerfrance Val de Loire | https://val-de-loire.cerfrance.fr/pages/smag-farmer-la-solution-performance | alertes d'anomalie, SPE et ZNT aquatiques automatiques, plan de fumure, coûts, marges, IFT |
| 4 | Cavac Services | https://www.cavacservices.fr/info/smag-farmer/ | registre phyto, cahier d'épandage, stocks, matériel, personnel |
| 5 | blog pilotage économique | https://smag.tech/blog/smag-farmer-pilotage-economique/ | marge brute par culture, marge semi-nette (matériel, tiers, main-d'œuvre) |
| 6 | blog PAC | https://smag.tech/blog/comment-smag-farmer-vous-simplifie-et-securise-votre-declaration-pac-en-5-etapes/ | préparation de la télédéclaration, contrôles |
| 7 | blog Stat'Phyto26 | https://smag.tech/blog/statphyto26-comment-transmettre-ses-donnees-phytosanitaires-depuis-smag-farmer/ | transmission des données phyto pour l'enquête 2026 |
| 8 | agriculture de précision | https://smag.tech/nos-logiciels/protection-des-culture-prevision-des-rendements/agriculture-de-precision/ | indices de végétation, cartes de modulation (partenaires) |
| 9 | FAQ prix | https://en.smag.tech/helpie_faq/quel-est-le-prix-de-smag-farmer/ | environ 399 € HT/an, selon le distributeur |
| 10 | Smag Farmer Premium | https://smag.tech/nos-logiciels/logiciel-de-gestion-de-parcelles/smag-farmer-premium/ | module PPF (Fertiweb) en option, exploitation supplémentaire (page ancienne) |
| 11 | App Store | https://apps.apple.com/fr/app/smag-farmer/id1460245241 | avis : saisie rapide appréciée ; parcellaire viticole absent (2020) ; bugs d'affichage iPhone (2024) |
| 12 | Agreo Vigne (2019) | https://smag.tech/app/uploads/2019/11/Agreo_Vigne.pdf | produit vigne de Smag : itinéraires, suivi vignoble, vendanges, chai |
| 13 | plaquette Smag végétal | https://smag.tech/app/uploads/2020/03/Plaquette_SMAG_VEGETAL-1.pdf | saisie groupée, registres, stocks web et mobile, observations |

## Boucle principale

Saisir chaque intervention (pas seulement les traitements) sur le mobile, même sans réseau,
contrôlée automatiquement contre la réglementation, pour en tirer registres, IFT et coûts.

## Ce que Registre Vigne a déjà

Import PAC, cultures par parcelle, registre phyto PDF/CSV, stock automatique, contrôles
(dose, vent, AMM, DAR, DRE), synchronisation entre téléphones via le NAS, sauvegardes.

## Écrans à ajouter (déduits)

| ID | écran | rôle | composants |
| --- | --- | --- | --- |
| S20 | Nouvelle intervention (tous types) | semis, travail du sol, fertilisation, taille, vendange, récolte, en plus du traitement | choix du type, parcelles, intrants, matériel, personnes, heures |
| S21 | Carte du parcellaire | voir les parcelles sur fond satellite, colorées par culture ou par dernier traitement | carte, légende, filtres |
| S22 | Observations | noter maladies, ravageurs, stades, avec photo et position | formulaire, photo, liste |
| S23 | Fertilisation / cahier d'épandage | apports d'azote par parcelle, cumul par campagne | tableau, totaux |
| S24 | Matériel | tracteurs, pulvérisateur, outils, coût horaire | liste, fiche |
| S25 | Personnel | personnes, coût horaire, heures saisies | liste, fiche |
| S26 | Indicateurs | IFT par parcelle et par culture, coûts et marges | tableaux, graphiques |
| S27 | Catalogue E-Phy | rechercher un produit officiel et pré-remplir AMM, doses, DAR, ZNT | recherche, fiche |

## Parcours

```
F10 Saisir une intervention en groupe sur le terrain (hors ligne)
    S20 : type -> parcelles -> intrants -> valider -> synchronisé au retour du réseau
    edge : pas de réseau, plusieurs personnes et matériels

F11 Être alerté avant un traitement non conforme
    S20 -> contrôles (dose, mélange, ZNT, DAR, nombre max d'applications, délai entre deux applications)

F12 Connaître l'IFT et le coût d'une parcelle à la fin de la campagne
    S26 -> filtre culture / parcelle -> export
```

## Modèle de données à ajouter

```
Intervention  remplace Traitement : type (traitement | fertilisation | semis | travail du sol |
              taille | récolte | autre), mêmes parcelles/intrants, + materiel[], personnes[], heures
              evidence : saisie de toutes les interventions (2, 13) ; confidence : high
Materiel      nom, type, coutHoraire               evidence : 4, 5 ; confidence : high
Personne      nom, coutHoraire                     evidence : 4, 5 ; confidence : high
Observation   date, parcelle, type, note, photo, position   evidence : 2, 13 ; confidence : medium
Produit       + doseRefIFT, nbMaxApplications, delaiEntreApplications, type (phyto | engrais | semence…),
              teneurs N-P-K (engrais), prixUnitaire     evidence : 1, 3, 5 ; confidence : medium
```

## Tableau des fonctionnalités

Voir `features-smag-farmer.csv`. La colonne `clone` indique ce que Registre Vigne fait déjà
(`yes`), en partie (`partial`) ou pas encore (`no`).

## Hors périmètre

- **La certification ministérielle du calcul de l'IFT** : l'app peut calculer l'IFT avec la
  méthode publique, pas obtenir la certification de Smag.
- **Les indices satellite et cartes de modulation** : données de partenaires payants.
- **La base réglementaire propre à Smag** : remplacée par les données publiques E-Phy de l'Anses.
- **La distribution par coopératives et le partage avec un conseiller de coopérative**.
- **La préparation de la télédéclaration PAC** : Telepac reste l'outil officiel.

## Taille

8 écrans, 3 parcours, 4 entités nouvelles. Les parties difficiles : la carte avec fond
satellite, les contrôles réglementaires complets (mélanges, ZNT par cours d'eau),
l'import des données E-Phy. Taille : **M** (quelques semaines) pour l'essentiel.
