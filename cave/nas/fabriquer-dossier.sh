#!/usr/bin/env bash
# Fabrique le dossier « ma-cave » à copier tel quel sur le NAS, sans passer par une image GitHub :
# le conteneur Node officiel lance le serveur et la version web déjà construits, rangés dans app/.
#
#   cd cave && bash nas/fabriquer-dossier.sh [dossier-de-sortie]
#
# Résultat : <sortie>/ma-cave/ et <sortie>/ma-cave.zip
set -euo pipefail
cd "$(dirname "$0")/.."
SORTIE="${1:-$PWD/build-nas}"
VERSION="$(git rev-parse HEAD 2>/dev/null || echo dev)"
CIBLE="$SORTIE/ma-cave"

rm -rf "$CIBLE" "$SORTIE/ma-cave.zip" dist
mkdir -p "$CIBLE/app" "$CIBLE/donnees"

npx tsc --noEmit
npx vitest run
EXPO_OFFLINE=1 CI=1 EXPO_PUBLIC_VERSION="$VERSION" npx expo export --platform web --output-dir "$CIBLE/app/site"
npx tsc -p serveur/tsconfig.json --outDir "$CIBLE/app"

cat > "$CIBLE/docker-compose.yml" <<EOF
# Ma Cave sur le NAS (UGOS Pro). Projet séparé de Registre Vigne, port 8083.
# Ce dossier contient déjà l'appli (dossier app/) : rien à télécharger depuis GitHub.
services:
  ma-cave:
    image: node:22-bookworm-slim
    container_name: ma-cave
    restart: unless-stopped
    working_dir: /app
    command: ["node", "serveur/index.js"]
    ports:
      - "8083:8080"
    environment:
      # Le code que l'appli demandera. Choisissez-en un long, sans espace, entre les guillemets.
      CODE: "remplacez-par-votre-code"
      TZ: "Europe/Paris"
      PORT: "8080"
      DONNEES: "/donnees"
      SITE: "/app/site"
      VERSION: "$VERSION"
    volumes:
      # L'appli (lecture seule) et vos données (la cave, les photos, les sauvegardes du jour).
      - ./app:/app:ro
      - ./donnees:/donnees
EOF

cat > "$CIBLE/LISEZMOI.txt" <<'EOF'
MA CAVE SUR LE NAS
==================

1. Ouvrez docker-compose.yml avec un éditeur de texte et remplacez
   remplacez-par-votre-code par un code long, sans espace (gardez les guillemets).

2. Copiez tout ce dossier « ma-cave » sur le NAS, par exemple dans le dossier
   partagé docker : docker/ma-cave

3. Dans UGOS Pro : Docker › Projet › Créer.
   Nom : ma-cave. Emplacement : le dossier docker/ma-cave.
   UGOS reprend le fichier docker-compose.yml du dossier
   (sinon, collez son contenu). Lancez le projet.

4. Vérification : sur un ordinateur à la maison, ouvrez
   http://<adresse-du-nas>:8083   → l'appli Ma Cave s'affiche.

5. Dans l'appli, roue ⚙ : adresse http://<adresse-du-nas>:8083 et le code.

Vos données sont dans le sous-dossier « donnees » (une sauvegarde par jour dans
donnees/sauvegardes). Ne le supprimez pas.

METTRE À JOUR
Arrêtez le projet, remplacez seulement le sous-dossier « app » par celui de la
nouvelle version, puis redémarrez. Ne touchez pas à « donnees » ni au code.
EOF

(cd "$SORTIE" && rm -f ma-cave.zip && python3 -c "
import shutil; shutil.make_archive('ma-cave', 'zip', '.', 'ma-cave')")
echo "Prêt : $SORTIE/ma-cave.zip"
