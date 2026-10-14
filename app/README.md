# Registre Vigne

App mobile (Android, iPhone, web) pour tenir le registre phytosanitaire d'un domaine
viticole, avec le suivi du stock de produits.

## Ce qu'elle fait (étape 1)

- **Parcelles** : import direct du `.zip` de l'export parcellaire Telepac (shapefile),
  sans le dézipper. Les vignes (codes VR…) sont cochées d'office. Surface PAC reprise
  quand elle est cohérente avec le contour, sinon calculée. Écartement et rangs par
  passage par parcelle (pour le GPS de l'étape 2).
- **Stock** : fiche produit (AMM, dose maximale, DAR, DRE, ZNT, seuil d'alerte),
  achats, inventaires. Chaque traitement sort automatiquement dose × surface du stock.
- **Traitements** : parcelles, produits et doses, opérateur, cible, stade BBCH, météo.
  Alertes : dose au-dessus de l'homologation, stock insuffisant, vent > 19 km/h,
  AMM manquant. Calcul de la date de récolte possible (DAR) et de la rentrée (DRE).
- **Registre** : une ligne par parcelle et par produit, par campagne, en PDF ou en CSV
  (Excel). Sauvegarde complète en JSON.

Les données restent sur le téléphone, et se synchronisent avec le serveur du NAS
quand il est configuré (voir [`nas/README.md`](../nas/README.md)) : chaque appareil
travaille hors ligne et envoie ses modifications au retour du réseau ; en cas de
modification d'une même fiche sur deux appareils, la plus récente l'emporte.

## Installer

- **Android** : télécharger `registre-vigne.apk` dans la release
  [android-latest](../../releases/tag/android-latest), construite par GitHub à chaque
  modification (workflow `App Android`).
- **iPhone ou ordinateur** : la version web, publiée sur GitHub Pages par le workflow
  `App web`. Sur iPhone, « Partager › Sur l'écran d'accueil » pour l'avoir comme une app.

## Développer

```bash
npm install
npm test            # cœur du registre : import PAC, stock, contrôles, export
npm run typecheck
npx expo start      # puis Expo Go ou un build de développement
```

Le code métier, sans dépendance au téléphone, est dans `src/core/` (dont `sync.ts`,
partagé avec le serveur). Le serveur du NAS est dans `serveur/` (Node, sans dépendance) :

```bash
npx tsc -p serveur/tsconfig.json
CODE=essai DONNEES=./donnees SITE=./dist node build-serveur/serveur/index.js
```

Les écrans (Expo Router) sont dans `src/app/`.
