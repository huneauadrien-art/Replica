# Ma Cave

App mobile (Android, iPhone, web) pour gérer sa cave à vin personnelle : ajouter ses
bouteilles, les ranger dans ses casiers, savoir lesquelles ouvrir, noter ses dégustations.
Visuel sombre inspiré de Tire-Bouchon (voir `replica/recon-tire-bouchon.md`).
Indépendante de Registre Vigne : ses propres données, son propre service sur le NAS.

## Installer sur le NAS (UGREEN, UGOS Pro)

**Le plus simple : le dossier tout prêt.** `bash nas/fabriquer-dossier.sh` (dans `cave/`)
fabrique `build-nas/ma-cave.zip` : l'appli déjà construite + `docker-compose.yml` +
`LISEZMOI.txt`. On l'extrait, on met le code dans `docker-compose.yml`, on copie le dossier
sur le NAS et on crée le projet Docker dessus. Il utilise l'image officielle `node`, rien
à télécharger depuis GitHub. Mise à jour : remplacer le sous-dossier `app`.

**Autre possibilité : l'image GitHub** (après fusion sur la branche de travail) :


1. **Docker** › **Projet** › **Créer**. Nom : `ma-cave`. Emplacement : par exemple
   `docker/ma-cave`.
2. Collez le contenu de [`nas/docker-compose.yml`](nas/docker-compose.yml) et remplacez
   `remplacez-par-votre-code` par un code long (au moins 16 caractères).
3. Lancez le projet. Vérification : `http://<adresse-du-nas>:8083` affiche l'app.

Si le NAS répond « denied » en téléchargeant l'image : sur GitHub, **Packages** ›
`ma-cave` › **Package settings** › **Change visibility** › Public.

## Reconnaître les bouteilles

- **Photo de l'étiquette** : le NAS l'envoie à Claude Sonnet (Anthropic), qui renvoie la fiche
  (domaine, millésime, appellation, cépages, garde, accords…) ; on corrige puis on enregistre.
  Il faut une clé Anthropic (crédit prépayé sur platform.claude.com, environ 2 centimes la
  photo) dans `ANTHROPIC_API_KEY` du `docker-compose.yml` du NAS. Sans clé, tout le reste marche.
- **Code-barres** : cherché dans Open Food Facts (gratuit, souvent incomplet). Un vin déjà
  dans la cave est reconnu par son code-barres sans rien demander à Internet.

## Relier les téléphones

Dans l'app : bouton ⚙ (Réglages) › adresse `http://<adresse-du-nas>:8083` et le code ›
**Tester la connexion**. Le premier téléphone **envoie** sa cave, les autres la **prennent**.

## Mettre à jour

1. **Docker** › **Projet** › `ma-cave` : **Arrêter**.
2. **Docker** › **Image** : supprimer `ghcr.io/huneauadrien-art/ma-cave`.
3. **Projet** › `ma-cave` : **Démarrer**. La cave (dossier `donnees`) est conservée.

Android : la dernière version est dans la release GitHub **cave-android-latest**
(`ma-cave.apk`).

## Pour développer (dans `cave/`)

```bash
npm test                      # vitest
npx tsc --noEmit              # types
npx tsc -p serveur/tsconfig.json
EXPO_OFFLINE=1 CI=1 npx expo export -p web
```

Test de bout en bout : voir l'en-tête de `e2e/cave.e2e.mjs`.
