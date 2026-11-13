# Architecture : Ma Cave, cave à vin (inspirée de Tire-Bouchon)

Source : `replica/recon-tire-bouchon.md`, `replica/features-tire-bouchon.csv`.
Pour : la cave **personnelle** de l'utilisateur (pas le stock du domaine).

> **Mise à jour du 2026-11-13** : à la demande de l'utilisateur, la cave est une **app
> séparée** (`cave/`, « Ma Cave »), sans lien avec Registre Vigne. Elle reprend la même pile
> (copie, pas de code partagé) : son propre stockage, son propre service sur le NAS (port
> 8081, image `ma-cave`), son propre apk. Les chemins `src/…` ci-dessous sont dans `cave/`.
Date : 2026-11-13

## Pile technique

La même pile que Registre Vigne, recopiée dans `cave/`.

| couche | choix | pourquoi |
| --- | --- | --- |
| app | Expo SDK 57 + Expo Router + TypeScript (Android, iOS, web) | déjà en place, un seul code pour les trois |
| style | `StyleSheet` + jetons `src/ui/cave/theme.ts` | thème sombre propre à la cave, le reste de l'app ne bouge pas |
| polices | Spectral, Hanken Grotesk, JetBrains Mono (`@expo-google-fonts/*`, OFL) | celles de l'original, libres, chargées avec `expo-font` |
| données | AsyncStorage sur le téléphone (`src/data/store.tsx`) | déjà en place, marche sans réseau |
| synchro | serveur du NAS (`serveur/index.ts`), « le plus récent gagne » | 4 nouvelles collections, rien d'autre à écrire |
| photos d'étiquette | pièces jointes existantes (`ajouterPiece` / `lirePiece`) | même chemin que les PDF de factures |
| logique | `src/core/cave.ts`, testée avec vitest | sans dépendance au téléphone |
| hébergement | NAS (image Docker) + GitHub Pages pour le web | déjà en place |

Pas de base Postgres, pas de compte, pas de paiement : une seule personne, ses téléphones, son NAS.

## Le « schéma » (types TypeScript, `src/core/types.ts`)

Chaque fiche a `id` (texte) et `maj` (heure de modification, pour la synchro). Les dates
sont en `AAAA-MM-JJ`, les années en nombre, l'argent en euros TTC (nombre à 2 décimales,
comme le reste de l'app).

```ts
Meuble      { id, maj, nom, rangees, colonnes, ordre }
Vin         { id, maj, domaine, cuvee?, appellation?, region?, couleur, millesime?,
              cepages?: { nom, pct? }[], profil?: { corps, tanins, acidite, sucre } (0–4),
              aromes?: string[], tempMin?, tempMax?, carafageH?,
              garde?: { pret, apogeeDebut, apogeeFin, fin } (années, saisies à la main ; sinon calculées),
              accords?: string, notes?, photo?: PieceJointe }
Bouteille   { id, maj, vinId, meubleId?, rangee?, colonne?, prix?, entree, sortie?,
              statut: 'cave' | 'bue' | 'offerte' }
Degustation { id, maj, vinId, date, note? (0–20), robe?, aromes?, commentaire?, avecQui? }
```

Règles :
- **Une bouteille par objet physique.** « ×3 » = 3 fiches `Bouteille` du même vin. C'est ce qui
  permet de les ranger dans 3 cases différentes.
- **Une case ne porte qu'une bouteille en cave.** Vérifié par `caseLibre()` avant chaque
  rangement (deux téléphones peuvent ranger dans la même case hors ligne : à la synchro, la
  plus récente gagne et l'autre bouteille repasse « à ranger », voir `reparerCases()`).
- **Supprimer un meuble** remet ses bouteilles « à ranger » (jamais de bouteille perdue).
- **Supprimer un vin** supprime ses bouteilles et ses dégustations (confirmé à l'écran).
- **Boire une bouteille** ne la supprime pas : `statut = 'bue'`, `sortie = date`, la case se libère.
- Couleurs : `rouge | blanc | rose | effervescent | liquoreux | fortifie`.

Synchro : ajouter `meubles`, `vins`, `bouteilles`, `degustations` à `COLLECTIONS`, `Donnees`,
`DONNEES_VIDES`, `etatServeurVide`. Le serveur fusionne déjà les collections inconnues de
l'ancien fichier (`serveur/index.ts`, ligne 41). **Le NAS doit être mis à jour** pour garder la
cave (sinon il refuse les nouvelles collections sans erreur et la cave reste sur chaque téléphone).

## La fenêtre de garde (le point difficile n° 1)

Sans catalogue, une table maison : années après le millésime, par couleur, ajustée par région.

| cas | prête dès | apogée | fin |
| --- | --- | --- | --- |
| rouge (par défaut) | +3 | +5 à +10 | +14 |
| rouge Bordeaux | +5 | +8 à +15 | +22 |
| rouge Bourgogne | +4 | +6 à +12 | +16 |
| rouge Rhône | +3 | +5 à +12 | +16 |
| rouge Loire / Beaujolais | +1 | +2 à +5 | +8 |
| blanc sec | +1 | +2 à +5 | +7 |
| blanc Bourgogne / Alsace | +2 | +4 à +8 | +12 |
| rosé | 0 | 0 à +2 | +3 |
| effervescent | +1 | +2 à +6 | +9 |
| liquoreux | +5 | +10 à +25 | +40 |
| fortifié | +5 | +10 à +30 | +50 |

Sans millésime : « prête » tout de suite (vin sans année). La fenêtre saisie sur la fiche
remplace toujours la table. État du jour (année en cours) :
`garde` (avant « prête ») → `pret` → `apogee` → `vite` (dernière année de l'apogée et au-delà
jusqu'à la fin) → `passe` (après la fin). La jauge affiche Prêt / Apogée / À boire vite comme
l'original ; « passé » compte dans « À boire vite » avec un liseré rouge.

## « Routes » (écrans Expo Router) par parcours

Pas d'API à écrire : tout passe par `modifier()` du store et `/api/sync` existant.

| écran | fichier | parcours |
| --- | --- | --- |
| S40/S42 Ma cave, Liste / Plan | `src/app/(onglets)/cave.tsx` | F42, F43 |
| S45 Nouvelle bouteille (saisie, photo) | `src/app/cave/nouveau.tsx` | F40 |
| S46 Ranger | `src/app/cave/ranger.tsx?bouteilles=…` | F40, F46 |
| S47 Fiche vin (+ modifier) | `src/app/cave/vin/[id].tsx` | F42, F43 |
| S48 Déguster | `src/app/cave/deguster/[id].tsx` | F43 |
| S43 Mes meubles | `src/app/cave/meubles.tsx` | F46 |
| S49 Carnet | `src/app/cave/carnet.tsx` | — |

Fonctions de `src/core/cave.ts` : `fenetreGarde`, `etatGarde`, `resumeCave`, `vinDuSoir`,
`aBoireAvant`, `grilleMeuble`, `caseLibre`, `ranger`, `deguster`, `supprimerMeuble`,
`reparerCases`, `filtrerVins`.

## Ce qui mord

- **Hors ligne** : déjà géré (stockage local, envoi en attente).
- **Deux téléphones, même case** : `reparerCases()` à l'affichage du plan, voir plus haut.
- **Photos lourdes** : l'étiquette est réduite à l'envoi (`quality: 0.5`, 1200 px) avant de
  devenir une pièce jointe.
- **Années** : l'état de garde dépend de l'année en cours, calculé à l'affichage, jamais stocké.
- **Polices** : sur le web l'app attend leur chargement ; si elles échouent, polices du système.
- **Thème sombre dans une app claire** : l'onglet Cave et ses écrans ont leurs propres en-têtes
  sombres ; la barre d'onglets reste celle de l'app.

## Ordre de construction

1. **Tranche verticale** : types + synchro, `cave.ts` + tests, saisie d'une bouteille,
   liste de la cave, fiche vin. (S40, S45, S47)
2. **Les « must »** : meubles, plan, ranger, bac « à ranger », vin du soir, jauge, urgences,
   déguster. (S42, S43, S46, S48)
3. **Les « should »** : filtres, valeur, carnet, photo d'étiquette, profil et arômes, export CSV.
   (S49)
4. **Plus tard** : lecture d'étiquette par IA (clé API sur le NAS), alertes d'apogée
   (notifications), sommelier, import Excel, scan en rafale.
