# Installer Registre Vigne sur le NAS (UGREEN DXP2800)

Le serveur garde les données de tous vos téléphones, en fait une copie chaque jour
(60 jours conservés, dans `donnees/sauvegardes/`) et sert la version web de l'app.

## 1. Créer le projet Docker

(Les intitulés peuvent varier un peu selon la version d'UGOS.)

1. Dans UGOS Pro, ouvrez **Docker**, puis **Projet** › **Créer**.
2. Nom : `registre-vigne`. Emplacement : un dossier partagé, par exemple `docker/registre-vigne`.
3. Collez le contenu de [`docker-compose.yml`](docker-compose.yml).
4. Remplacez `remplacez-par-votre-code` par un code long (au moins 16 caractères).
   C'est lui qui protège vos données : ne le partagez qu'avec les personnes qui saisissent.
5. Lancez le projet. Au premier démarrage, le NAS télécharge l'image (environ 100 Mo).

Vérification : depuis un ordinateur à la maison, ouvrez `http://<adresse-du-nas>:8080`.
L'app doit s'afficher.

## 2. L'ouvrir depuis l'extérieur

Le serveur écoute en HTTP sur le port 8080. Pour la 4G, passez par ce que vous avez déjà :

- **Nom de domaine** : ajoutez un proxy inverse vers `http://localhost:8080` avec un
  certificat HTTPS (Let's Encrypt), par exemple `https://registre.mondomaine.fr`.
  Sur iPhone, le GPS de l'étape 2 exigera HTTPS.
- **VPN** (Tailscale, WireGuard…) : utilisez l'adresse du NAS dans le VPN,
  par exemple `http://100.x.y.z:8080`.

## 3. Relier les téléphones

Dans l'app : **Accueil** › **Serveur NAS**, saisissez l'adresse et le code, puis
**Tester la connexion**.

- Sur le téléphone qui a déjà toutes vos parcelles : **Connecter et envoyer les données
  de ce téléphone**.
- Sur les autres : **Prendre les données du NAS**.

Ensuite chaque saisie part au NAS dans les secondes qui suivent, ou au retour du réseau.

## Mettre à jour

Dans **Docker** › **Projet** › `registre-vigne` : **Arrêter**, puis **Démarrer**.
Grâce à `pull_policy: always`, le NAS télécharge la dernière version à chaque démarrage.
Si ce n'est pas le cas : projet arrêté, supprimez l'image `ghcr.io/huneauadrien-art/registre-vigne`
dans **Docker** › **Image**, puis redémarrez le projet. Les données du dossier `donnees`
sont conservées.

## Si le téléchargement de l'image est refusé

L'image est publiée sur GitHub (`ghcr.io`). Si le NAS répond « denied », rendez-la
publique : sur GitHub, **Packages** › `registre-vigne` › **Package settings** ›
**Change visibility** › Public.
