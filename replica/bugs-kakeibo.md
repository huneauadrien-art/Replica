# Défauts : budget du foyer

| ID | gravité | état |
| --- | --- | --- |
| B01 | S3 | corrigé |
| B02 | S4 | corrigé |
| B03 | S4 | corrigé |
| B04 | S3 | corrigé |

## B01 — Lecteur d'écran : état des choix et des jauges non annoncé (S3)

- **Étapes** : ouvrir Ajouter, ou l'écran Mois avec des plafonds par catégorie ; analyse axe.
- **Attendu** : les pastilles de catégorie disent si elles sont choisies ; les jauges disent leur valeur.
- **Obtenu** : `aria-required-attr` — `role=radio` sans `aria-checked`, `role=progressbar` sans valeur
  (la propriété `accessibilityState` n'est plus traduite sur le web).
- **Preuve** : F02-H1, F01-H1, F07-H1, F08-H1 en échec sur axe.
- **Correction** : `aria-checked`, `aria-selected`, `aria-disabled`, `aria-valuenow/min/max` dans `ui/kit.tsx`.

## B02 — Nom lu différent du texte affiché (S4)

- **Étapes** : Dépenses ou Historique ; analyse axe.
- **Attendu** : le nom lu par le lecteur d'écran commence par ce qui est écrit.
- **Obtenu** : `label-content-name-mismatch` (« Marché, −20 €, Courses » lu, « Marché / Courses / −20 € » affiché ;
  cartes de l'historique et du bilan oublié).
- **Correction** : nom des lignes dans l'ordre d'affichage ; pas d'étiquette forcée sur ces cartes.

## B03 — Apostrophe droite dans les messages de connexion (S4)

- **Obtenu** : « Code d'accès refusé » et « Vérifiez l'adresse » avec ' au lieu de ’ (le reste de l'appli utilise ’).
- **Correction** : `data/serveur.ts`.

## B04 — Historique : le mois en cours compté comme « épargné » (S3)

- **Étapes** : un mois en cours avec des revenus prévus, ouvrir Historique.
- **Attendu** : le mois en cours n'est pas encore une épargne.
- **Obtenu** : « épargné 1 132,20 € » pour le mois en cours (revenus − charges − dépenses déjà faites), plus grande barre du graphique.
  Les chiffres des axes du graphique s'affichaient aussi en police avec empattements.
- **Preuve** : `replica/clone-screens-kakeibo/S11-historique.png` avant correction.
- **Correction** : graphique et total sur les mois finis seulement ; le mois en cours affiche « dépensé pour l'instant ».

## À vérifier (pas reproduit)

- Sur Android, la fenêtre « Ajouter » s'ouvre en modale : vérifier que le bouton retour du téléphone la ferme (M1).
- Le message « annuler » (5 s) recouvre le bas de l'écran : vérifier qu'il ne gêne pas sur un petit téléphone.
