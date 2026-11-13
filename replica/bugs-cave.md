# Bugs : cave à vin (Ma Cave) et Registre Vigne

## B1 · S1 · Registre Vigne : un téléphone qui n'a que des factures peut les perdre en se connectant au NAS — corrigé

- **Étapes** : sur un téléphone sans parcelle, produit ni traitement, ajouter des factures ;
  Serveur NAS › tester la connexion à un NAS qui a déjà des données › « Connecter et récupérer
  les données du NAS ».
- **Attendu** : une confirmation avant de remplacer les données du téléphone.
- **Constaté** : le téléphone était jugé « vide » (seuls parcelles, produits, traitements et
  mouvements étaient comptés) : aucune confirmation, et ses factures étaient remplacées par celles du
  NAS. Trouvé en ajoutant la cave ; corrigé dans Registre Vigne et dans Ma Cave.
- **Preuve** : `src/app/reglages.tsx`, ancien calcul de `localVide`.
- **Correction** : `estVide()` dans `src/core/sync.ts` (des deux apps) compte toutes les
  collections ; test `sync.test.ts › téléphone vide` (échouait avant, passe après).

## B2 · S2 · Ma Cave : la photo d'étiquette refusée par le NAS — corrigé avant mise en service

- **Constaté** (à la lecture du serveur) : le NAS n'accepte que des pièces jointes dont
  l'identifiant finit par une extension (`.jpg`…). Les photos avaient un identifiant sans
  extension : elles seraient restées sur le téléphone, en échec à chaque synchronisation.
- **Correction** : identifiant `xxxx.jpg` (`cave/src/ui/cave/FormVin.tsx`).

## B3 · S2 · Ma Cave : risque d'envoyer la cave au serveur de Registre Vigne — évité

- Les deux serveurs répondent de la même façon. Le serveur Ma Cave dit maintenant qui il est
  (`app: 'ma-cave'` dans `/api/etat`) et l'écran Réglages refuse une autre adresse, avec un
  message qui rappelle le port 8081.
