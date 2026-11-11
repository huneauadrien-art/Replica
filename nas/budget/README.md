# Installer Bas de laine (budget du foyer) sur le NAS (UGREEN DXP2800)

Un **deuxième projet Docker**, à côté de Registre Vigne, sans rien changer à celui-ci :
autre code d'accès, autre dossier de données, port **8081**.
Le serveur garde le budget de tous les téléphones du foyer, en fait une copie chaque jour
(60 jours conservés, dans `donnees/sauvegardes/`) et sert la version web de l'appli.

## 1. Rendre l'image téléchargeable (une seule fois)

L'image est publiée sur GitHub, mais une nouvelle image est privée au départ.

1. Sur GitHub, ouvrez votre profil › onglet **Packages** › `budget-foyer`.
2. **Package settings** (en bas à droite) › **Change visibility** › **Public** › confirmez
   en tapant `budget-foyer`.

(L'image ne contient que le programme, jamais vos chiffres : ceux-ci restent sur le NAS.)

## 2. Créer le projet Docker

1. Dans UGOS Pro, ouvrez **Docker**, puis **Projet** › **Créer**.
2. Nom : `budget-foyer`. Emplacement : un dossier partagé, par exemple `docker/budget-foyer`.
3. Collez le contenu de [`docker-compose.yml`](docker-compose.yml).
4. Remplacez `remplacez-par-votre-code` par un code long (au moins 16 caractères),
   **différent de celui du registre**. Ne le donnez qu'aux personnes du foyer.
5. Lancez le projet. Au premier démarrage, le NAS télécharge l'image (environ 100 Mo).

Vérification : depuis un ordinateur ou un téléphone à la maison, ouvrez
`http://<adresse-du-nas>:8081`. L'appli Bas de laine doit s'afficher.

## 3. Installer l'appli sur les téléphones

- **Android** : sur GitHub, **Releases** › « Bas de laine – Android » › téléchargez
  `budget-foyer.apk`, ouvrez-le et autorisez l'installation depuis le navigateur.
- **iPhone** : ouvrez `http://<adresse-du-nas>:8081` dans Safari, bouton Partager ›
  **Sur l'écran d'accueil**. (Pas de rappels sur iPhone dans ce mode.)

## 4. Relier les téléphones

Dans l'appli : roue ⚙ en haut à droite › **Relier au serveur NAS**. Adresse :
`http://<adresse-du-nas>:8081`, puis le code, puis **Tester la connexion**.

- Sur le premier téléphone (celui où vous avez commencé le budget) :
  **Connecter et envoyer le budget de ce téléphone**.
- Sur les autres : **Connecter et récupérer le budget du NAS**.

Ensuite chaque saisie part au NAS dans les secondes qui suivent, ou au retour du Wi-Fi.

## Mettre à jour

Comme pour le registre, « Arrêter » puis « Démarrer » ne suffit **pas** :

1. **Docker** › **Projet** › `budget-foyer` : **Arrêter**.
2. **Docker** › **Image** : supprimer `ghcr.io/huneauadrien-art/budget-foyer`
   (au besoin, supprimer d'abord le conteneur `budget-foyer` dans **Conteneur**).
3. **Projet** › `budget-foyer` : **Démarrer** : le NAS télécharge la dernière image.

Le dossier `donnees` est conservé. Vérification : roue ⚙ › Serveur NAS, la version du NAS
doit être celle de l'appli.

## Si quelque chose ne va pas

- « denied » au téléchargement : l'étape 1 n'est pas faite.
- « Code d'accès refusé » : vérifier le code ; après 10 essais faux, le NAS fait attendre 10 minutes.
- Hors de la maison, l'appli marche quand même : les dépenses partent au retour sur le Wi-Fi.
