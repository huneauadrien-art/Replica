# Registre Vigne — notes pour Claude

Appli pour un domaine viticole (vigne + champs + jachères) : registre phytosanitaire,
stock de produits, factures d'achat, synchronisation entre téléphones via un NAS.
L'utilisateur est viticulteur, francophone, non développeur : répondre en français
simple, guider pas à pas dans les interfaces (UGOS, GitHub), ne jamais supposer qu'il
sait lancer des commandes.

## Organisation

- `app/` : app Expo (SDK 57, Expo Router, TypeScript) pour Android, iOS et web.
  - `src/core/` : logique sans dépendance au téléphone, testée avec vitest
    (`registre.ts`, `factures.ts`, `facturx.ts` Factur-X/CII, `facturePdf.ts` +
    `pdfTexte.ts` + `pdfFlux.ts` lecture des PDF classiques, `sync.ts`,
    `shapefile.ts` + `importParcelles.ts` import PAC Telepac, `cultures.ts`, `cave.ts` cave à vin
    perso : fenêtre de garde, plan des casiers).
  - `src/data/` : stockage local (AsyncStorage, pièces jointes fichiers/IndexedDB),
    synchronisation avec le NAS (`store.tsx`), appels serveur, fichiers.
  - `src/app/` : écrans (onglets Accueil, Parcelles, Traitements, Stock, Registre, Cave ;
    `cave/` écrans de la cave, thème sombre façon Tire-Bouchon dans `src/ui/cave/` ;
    `factures/`, `reglages.tsx` = écran Serveur NAS).
  - `serveur/index.ts` : serveur du NAS (Node sans dépendance) : `/api/etat`,
    `/api/sync`, `/api/pieces/:id`, sert aussi la version web.
- `Dockerfile` + `nas/` : image et docker-compose pour le NAS UGREEN DXP2800 (UGOS).
- `.github/workflows/` : apk Android (release `android-latest`), web (GitHub Pages),
  image `ghcr.io/huneauadrien-art/registre-vigne` (publique).
- `replica/` : cartes de reconnaissance (Process2Wine, Smag Farmer, Kolecto, Tire-Bouchon),
  tableaux de fonctionnalités, architecture, jetons de design, plans de test.
- `app/e2e/cave.e2e.mjs` : test de bout en bout de la cave (voir l'en-tête pour le lancer).

## Commandes (dans `app/`)

```bash
npm test                      # vitest
npx tsc --noEmit              # types de l'app
npx tsc -p serveur/tsconfig.json
EXPO_OFFLINE=1 CI=1 npx expo export -p web   # le réseau du conteneur bloque api.expo.dev
```

Le conteneur n'a pas Docker ni accès aux sites web (sauf npm/PyPI) : les builds réels se
font sur GitHub Actions (vérifier les runs avec les outils GitHub). Tests de bout en bout :
Playwright (`/opt/pw-browsers`) contre `dist/` servi par le serveur lancé en local.

## Points à savoir

- Mise à jour du NAS : Arrêter le projet, **supprimer l'image** dans Docker › Image,
  puis Démarrer (Arrêter/Démarrer seul ne télécharge pas la nouvelle image). L'écran
  Serveur NAS affiche la version de l'app et celle du NAS.
- Ajouter une collection de données : l'ajouter à `COLLECTIONS` (`sync.ts`), à
  `Donnees`/`DONNEES_VIDES` (`types.ts`) ; le NAS doit être mis à jour.
- Ne jamais committer de vraies factures, codes d'accès ou données personnelles : le
  dépôt est public. Les tests utilisent des factures fictives (`__tests__/fixtures`).
- Branche de travail : `claude/replica-skill-install-u8a3g6` (pas de PR sans demande).

## Reste à faire (au choix de l'utilisateur)

- Cave à vin : lecture d'étiquette par IA, scan en rafale, alertes d'apogée, sommelier,
  import Excel (voir `replica/features-tire-bouchon.csv`).

- GPS du pulvérisateur : tracer la bande traitée sur la parcelle et compter les ha
  (marque/modèle du boîtier de commande encore inconnus ; prévoir un bouton
  Pulvé ON/OFF d'abord, puis capteur Bluetooth). Largeur = rangs × écartement
  (vigne) ou largeur de rampe (`largeurTraitee` dans `cultures.ts`).
- Toutes les interventions (semis, fertilisation, travail du sol, taille, vendange).
- Calcul de l'IFT ; coûts par culture.
- Accès au NAS depuis l'extérieur (HTTPS ou VPN), nécessaire au GPS sur iPhone.
- Autres formats de factures fournisseurs (le lecteur PDF est réglé sur le modèle
  Groupe Nau : n° AMM et lot sous la ligne, redevance pollution).
