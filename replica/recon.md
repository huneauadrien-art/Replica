# Carte de reconnaissance : Process2Wine, module Vignoble (web + iOS/Android)

Périmètre : gestion du vignoble uniquement (parcelles, carte, travaux, traitements,
main-d'œuvre, coûts, suivi de maturité). Le chai, la logistique et les
déclarations douanières sont hors périmètre.
Pour : un outil interne pour le domaine de l'utilisateur (pas un produit à vendre).
Date : 2026-10-14

> **Limite de cette reconnaissance.** Elle repose uniquement sur des sources
> publiques, et le réseau de cette session ne pouvait pas ouvrir les pages
> elles-mêmes. Seuls les extraits des résultats de recherche étaient lisibles.
> Il n'y a donc **aucune capture d'écran** dans `replica/screens/`, et les écrans
> ci-dessous sont **déduits** des fonctionnalités décrites, pas observés.
> L'aspect visuel et le nombre exact de clics restent à confirmer (voir « Prochaines
> sources » en bas).

## Sources

| # | source | URL | notes |
| --- | --- | --- | --- |
| 1 | page produit Vignoble (éditeur) | https://www.process2wine.com/en-us/vineyard-management/ | carte en temps réel, création de blocs, ordres de travail par tâche à plusieurs employés, historique des blocs ; module annoncé gratuit |
| 2 | article éditeur « advanced viticulture » (2024) | https://www.process2wine.com/en-us/2024/06/10/take-the-next-step-in-advanced-viticulture-with-process2wine-software-solutions/ | GPS dans les tracteurs, progression des opérateurs sur la carte, coûts par bloc |
| 3 | article éditeur « Web & Mobile Solutions for Vineyard Decisions » | https://www.process2wine.com/en/web-mobile-solutions-for-technology-driven-vineyard-decision | historique des blocs jusqu'à la vendange, analyses pré-vendange sur la carte, historique Brix/pH |
| 4 | page « Vineyard Management Company » | https://www.process2wine.com/en-us/the-other-process2wine-modules/vineyard-management-company/ | usage par les prestataires et leurs clients |
| 5 | article « 7 raisons d'automatiser » (2021) | https://www.process2wine.com/en-us/2021/06/18/7-bonnes-raisons-de-passer-a-un-logiciel-de-gestion-de-production-viti-vinicole/ | argumentaire éditeur |
| 6 | abonnements Advanced / Expert | https://www.process2wine.com/en-us/expert-subscription/ | paliers d'abonnement |
| 7 | Wine Industry Advisor (2018, contenu sponsorisé) | https://wineindustryadvisor.com/2018/08/03/innovative-web-and-mobile-software-exclusively-for-wine-producers/ | modules ; « 80 % de la saisie possible sur smartphone » ; Pesticide Use Report |
| 8 | Wine Industry Advisor (2019, sponsorisé) | https://wineindustryadvisor.com/2019/05/16/web-mobile-solutions-for-technology-driven-vineyard-decision-making/ | coûts et productivité par vignoble ou cépage |
| 9 | Wine Industry Advisor (2022, freemium) | https://wineindustryadvisor.com/2022/01/17/freemium-software-lets-you-test-drive-process2wines-intuitive-solution | offre freemium |
| 10 | Capterra (avis) | https://www.capterra.com/p/167549/Process2Wine/ | 4,4/5 sur 5 avis ; « tentaculaire », menus peu intuitifs, fonctions qui se chevauchent ; support réactif |
| 11 | Capterra Canada (avis FR) | https://fr.capterra.ca/reviews/167549/process2wine | deux vignobles gérés séparément ; interface mobile confortable ; questionnaire rempli sur place à la parcelle |
| 12 | SelectHub | https://www.selecthub.com/p/food-and-beverage-software/process2wine/ | fiabilité dépendante de la régularité de la saisie |
| 13 | GetApp | https://www.getapp.com/industries-software/a/process2wine/ | SaaS, prix public à partir de 100 $ par utilisateur et par mois |

Les sources 1 à 9 viennent de l'éditeur ou sont sponsorisées : elles disent ce
que le produit prétend faire. Les avis (10 à 13) ne portent que sur 5 personnes.

## Boucle principale

Planifier un travail sur une parcelle, l'envoyer à l'équipe sur mobile, le voir
réalisé sur la carte, et retrouver ensuite l'historique et le coût de chaque parcelle.

## Écrans (déduits, à confirmer)

| ID | écran | accès | rôle | composants clés | états à prévoir |
| --- | --- | --- | --- | --- | --- |
| S01 | Connexion | `/login` | entrer dans l'app | formulaire | erreur, mot de passe oublié |
| S02 | Tableau de bord | accueil | travaux du jour, alertes, avancement | cartes, liste de tâches | vide (premier lancement), rempli |
| S03 | Carte du vignoble | menu « Carte » | voir toutes les parcelles, leur état et les tracteurs | carte SIG, polygones, légende, filtres, panneau latéral | aucune parcelle, chargement, hors ligne (mobile) |
| S04 | Dessiner / modifier une parcelle | S03 → « Nouvelle parcelle » | tracer le polygone et saisir les infos | outil de dessin, formulaire | polygone invalide, chevauchement |
| S05 | Liste des parcelles | menu « Parcelles » | tableau filtrable de toutes les parcelles | tableau, filtres (vignoble, cépage), export | vide, rempli |
| S06 | Fiche parcelle | S03 ou S05 → clic | identité, historique, maturité, coûts d'une parcelle | onglets : Infos / Historique / Maturité / Coûts | sans historique |
| S07 | Planning des travaux | menu « Travaux » | calendrier ou liste des ordres de travail | calendrier, filtres par équipe et parcelle | vide, en retard |
| S08 | Créer un ordre de travail | S07 ou S06 → « Nouveau travail » | tâche, parcelles, employés, matériel, dates | sélecteurs multiples, sélecteur de date | champs manquants |
| S09 | Ordre de travail (mobile, terrain) | notification ou liste « Mes travaux » | démarrer, saisir l'avancement, terminer, remplir le questionnaire | gros boutons, chronomètre, questionnaire | hors ligne, en cours, terminé |
| S10 | Enregistrer un traitement | S07 → type « Traitement » | produit, dose, surface, matériel, opérateur, météo | formulaire, sélecteur de produits | dose hors limites, produit inconnu |
| S11 | Registre des traitements | menu « Traitements » | historique de tous les traitements, export | tableau, filtres, export PDF/CSV | vide, rempli |
| S12 | Suivi de maturité | S06 → onglet Maturité, ou menu | saisir des prélèvements (Brix, pH, AT…) et voir les courbes | formulaire, graphique, comparaison de parcelles | aucun prélèvement |
| S13 | Équipe et heures | menu « Personnel » | employés, heures par tâche et par parcelle | tableau, feuille de temps | vide |
| S14 | Matériel / tracteurs | menu « Matériel » | parc de tracteurs et outils, boîtier GPS associé | liste, fiche | sans GPS |
| S15 | Intrants / produits | menu « Stock » ou paramètres | catalogue des produits phyto et engrais, prix | tableau, formulaire | vide |
| S16 | Rapports et coûts | menu « Rapports » | coûts par parcelle, cépage ou vignoble ; productivité | tableaux croisés, graphiques, export | période sans données |
| S17 | Paramètres | menu | domaine, vignobles, cépages, types de tâches, utilisateurs et rôles | formulaires, listes | — |

17 écrans, tous déduits.

## Parcours

```
F01 Mettre en place le domaine (première fois)
    S01 -> S17 (vignobles, cépages, tâches) -> S03 -> S04 (pour chaque parcelle) -> S05
    edge : import d'un parcellaire existant (fichier, cadastre), parcelle à cheval sur deux vignobles

F02 Planifier un travail et l'envoyer à l'équipe
    S07 -> S08 -> notification -> S09
    happy path : environ 5 clics (non mesuré)
    edge : employé absent, plusieurs parcelles d'un coup, travail reporté

F03 Réaliser un travail sur le terrain (mobile)
    S09 : démarrer -> questionnaire sur place -> terminer
    edge : pas de réseau dans la vigne (saisie hors ligne), arrêt en cours de journée

F04 Enregistrer un traitement phytosanitaire
    S07/S08 (type Traitement) -> S10 -> S11
    edge : dose au-dessus de la limite autorisée, vent trop fort, délai avant récolte non respecté

F05 Suivre la maturité et décider de la date de vendange
    S12 (prélèvement) -> S03 (analyses pré-vendange sur la carte) -> S06
    edge : prélèvements irréguliers, plusieurs prélèvements le même jour

F06 Voir où en sont les tracteurs
    S03 (couche GPS) -> S14
    edge : boîtier hors ligne, tracteur hors parcelle

F07 Connaître le coût d'une parcelle
    S16 (filtre parcelle, période) -> S06 onglet Coûts
    edge : heures non saisies, produit sans prix
```

## Composants

| composant | variantes | états | utilisé sur |
| --- | --- | --- | --- |
| Carte SIG | parcelles, tracteurs, analyses | chargement, hors ligne, sélection | S03, S04, S06 |
| Outil de dessin de polygone | création, édition | invalide, chevauchement | S04 |
| Tableau de données | simple, croisé, avec export | vide, chargement, filtré | S05, S11, S13, S15, S16 |
| Formulaire d'ordre de travail | complet (bureau), compact (mobile) | erreurs de validation | S08, S09, S10 |
| Sélecteur multiple | parcelles, employés, matériel | vide, plein | S08, S10 |
| Calendrier | semaine, mois, liste | en retard, terminé | S07 |
| Graphique | courbe de maturité, barres de coûts | aucune donnée | S12, S16 |
| Questionnaire terrain | questions selon le type de tâche | obligatoire, optionnel | S09 |
| Onglets | — | — | S06 |
| Bandeau hors ligne | — | synchro en attente, synchronisé | toutes les vues mobiles |
| Bouton | principal, secondaire, danger | désactivé, chargement | toutes |

## Modèle de données déduit

```
Domaine       id, nom, adresse
              evidence : produit multi-vignobles (avis 11) ; confidence : high

Vignoble      id, domaine_id, nom
              evidence : « gérer mes deux vignobles séparément » (avis 11) ; confidence : high

Parcelle      id, vignoble_id, nom, geometrie (polygone), surface_ha, cepage_id,
              porte_greffe, annee_plantation, densite, ecartement
              evidence : création de blocs sur la carte (source 1) ; confidence : high
              (champs agronomiques : guess)

Cepage        id, nom, couleur
              evidence : coûts par cépage (source 8) ; confidence : high

TypeTache     id, nom, categorie (taille, travail du sol, traitement, vendange…),
              questionnaire (json)
              evidence : « assign work orders by task » (1), questionnaire (avis 11) ; confidence : medium

OrdreTravail  id, type_tache_id, statut (planifié | en cours | terminé | annulé),
              date_prevue, date_debut, date_fin, notes
              evidence : sources 1 et 2 ; confidence : high

OrdreTravail_Parcelle   ordre_id, parcelle_id, surface_realisee
OrdreTravail_Employe    ordre_id, employe_id, heures
OrdreTravail_Materiel   ordre_id, materiel_id
              evidence : « to multiple employees » (1), heures par employé (2) ; confidence : medium

ReponseQuestionnaire    ordre_id, parcelle_id, reponses (json), saisi_le
              evidence : avis 11 ; confidence : medium

Traitement    id, ordre_id, produit_id, dose, unite, surface_traitee, volume_bouillie,
              cible, meteo (vent, température), operateur_id, materiel_id
              evidence : gestion des pulvérisations, Pesticide Use Report (7) ; confidence : medium

Produit       id, nom, type (phyto | engrais | autre), numero_amm, matiere_active,
              dose_max, dar_jours, znt_m, prix_unitaire
              evidence : coût des intrants par bloc (2) ; confidence : guess
              (les champs réglementaires sont une hypothèse pour la France)

Employe       id, nom, role, cout_horaire
              evidence : heures et productivité par employé (2) ; confidence : high

Materiel      id, nom, type, cout_horaire, gps_device_id
              evidence : boîtiers GPS dans les tracteurs (2) ; confidence : high

PositionGPS   materiel_id, horodatage, lat, lon
              evidence : progression en temps réel sur la carte (2) ; confidence : high

Prelevement   id, parcelle_id, date, brix, ph, acidite_totale, poids_baies, notes
              evidence : historique Brix et pH (3) ; confidence : high (Brix, pH), guess (le reste)

Utilisateur   id, email, role (admin | chef de culture | ouvrier), employe_id
              evidence : déduit ; confidence : guess
```

Relations : Domaine 1-n Vignoble, Vignoble 1-n Parcelle, Parcelle n-1 Cépage,
OrdreTravail n-n Parcelle / Employé / Matériel, OrdreTravail 1-n Traitement,
Traitement n-1 Produit, Parcelle 1-n Prélèvement, Matériel 1-n PositionGPS.

## Tableau des fonctionnalités

Voir `features.csv`. Must : 12, should : 9, could : 5, skip : 3. Il contient en
plus 4 ajouts pour la réglementation française, marqués `original = no`. Ils ne
comptent pas dans le score de ressemblance.

## Hors périmètre

- **Le chai, la logistique et les déclarations douanières** : exclus par votre choix de périmètre.
- **Les boîtiers GPS Process2Wine** : c'est du matériel vendu par l'éditeur. Le clone
  peut afficher la position d'un tracteur à partir du GPS d'un téléphone ou d'un
  boîtier du commerce, mais pas reproduire leur boîtier.
- **Le Pesticide Use Report et le TTB 5120.17** : ce sont des formulaires américains
  qui ne servent pas à un domaine français. L'équivalent français (registre
  phytosanitaire, calcul de l'IFT) est proposé en ajout.
- **Le portail pour les clients des prestataires viticoles** : sans objet pour un
  domaine qui travaille en interne.

## Taille

17 écrans, 7 parcours, 15 entités.

Les parties difficiles :
1. **La carte SIG** avec tracé des parcelles, couches et affichage sur mobile.
2. **Le mode hors ligne** sur mobile, avec la synchronisation et les conflits
   (pas de réseau dans les vignes).
3. **Le suivi GPS en temps réel** des tracteurs.
4. Les règles des traitements : doses, délai avant récolte (DAR), zones non
   traitées (ZNT), délai de rentrée.

Taille : **L** (un trimestre) pour tout, natif iOS et Android compris. Si l'on
commence par une app web mobile, sans GPS en temps réel, la base (carte,
parcelles, travaux, traitements) tient en **M** (quelques semaines).

## Prochaines sources, pour affiner

- Les vidéos de démonstration publiques de Process2Wine, pour voir les vrais
  écrans et compter les clics.
- Les pages éditeur ci-dessus, lues en entier. Le réseau de cette session ne
  pouvait pas les ouvrir.
- Des captures de l'App Store ou de Google Play, si une app mobile publique existe
  (aucune trouvée pour l'instant).
