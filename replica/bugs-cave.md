# Bugs : cave à vin

## B1 · S1 · Un téléphone qui n'a que sa cave peut la perdre en se connectant au NAS — corrigé

- **Étapes** : sur un téléphone sans parcelle, produit ni traitement, ajouter des bouteilles ;
  Serveur NAS › tester la connexion à un NAS qui a déjà des données › « Connecter et récupérer
  les données du NAS ».
- **Attendu** : une confirmation avant de remplacer les données du téléphone.
- **Constaté** : le téléphone était jugé « vide » (seuls parcelles, produits, traitements et
  mouvements étaient comptés) : aucune confirmation, et la cave était remplacée par celle du
  NAS. Le même défaut existait déjà pour les factures.
- **Preuve** : `src/app/reglages.tsx`, ancien calcul de `localVide`.
- **Correction** : `estVide()` dans `src/core/sync.ts` compte toutes les collections ;
  test `sync.test.ts › téléphone vide` (échouait avant, passe après). L'écran affiche aussi le
  nombre de bouteilles du téléphone et du NAS.

## À vérifier

- Un NAS **pas mis à jour** ignore les collections de la cave : elle reste sur chaque téléphone
  sans se synchroniser (et sans erreur). Il faut mettre à jour l'image du NAS.
