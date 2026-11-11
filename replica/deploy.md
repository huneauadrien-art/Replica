# Mise en service : Bas de laine

Usage personnel, sur le NAS de la maison. Pas de domaine, pas d'hébergeur, pas de
Stripe, pas d'e-mail, pas de store : les étapes du skill qui s'y rapportent sont sans objet.

## Contrôles avant mise en service (2026-11-11)

| contrôle | commande | résultat |
| --- | --- | --- |
| types | `cd budget && npx tsc --noEmit` | ✅ |
| calculs, export, synchro | `npm test` | ✅ 29/29 |
| bout en bout | `npm run e2e` | ✅ 24/24 (Pixel 7 simulé, axe sans erreur) |
| indispensables | `parity.py replica/features-kakeibo.csv` | ✅ 12/12, parité 89,3 |
| rien de l'original | `sweep.py . --config replica/brand.json` | ✅ Clean |
| version web | `npx expo export -p web` | ✅ |
| image Docker du NAS | GitHub Actions « Budget – serveur NAS » | ✅ (tsc + vitest + export web + serveur dans le build) |
| apk Android | GitHub Actions « Budget – Android » | voir plus bas |
| défauts ouverts S1/S2 | `bugs-kakeibo.md` | ✅ aucun |
| icône, favicon, nom | `budget/assets`, `app.json` | ✅ propres à l'appli |
| confidentialité | pas de prestataire, pas de cookies, données sur les téléphones et le NAS | ✅ (pas de page nécessaire pour un usage perso) |
| suppression des données | supprimer le projet Docker et son dossier ; sur le téléphone, effacer les données de l'appli | ✅ décrit |

## Ce que vous faites (je ne peux pas le faire à votre place)

Le guide pas à pas est dans [`nas/budget/README.md`](../nas/budget/README.md) :

1. Rendre l'image `budget-foyer` publique sur GitHub (une fois).
2. Créer le projet Docker `budget-foyer` dans UGOS avec `nas/budget/docker-compose.yml`
   et **votre** code d'accès.
3. Installer l'apk sur les téléphones Android (ou la version web sur iPhone).
4. Relier chaque téléphone au NAS (`http://<adresse-du-nas>:8081`).

## Adresse

- maison : `http://<adresse-du-nas>:8081`
- extérieur : pas encore (même chantier que le registre : HTTPS ou VPN). En attendant,
  l'appli marche hors ligne et envoie au retour sur le Wi-Fi.

## Surveillance (la première semaine)

- roue ⚙ › Serveur NAS : « Tout est envoyé » et la même version que le NAS ;
- UGOS › Docker › Conteneur `budget-foyer` : état « sain » (contrôle de santé chaque minute) ;
- le dossier `donnees/sauvegardes/` reçoit un fichier `budget-AAAA-MM-JJ.json` par jour ;
- noter quelques dépenses sur deux téléphones et vérifier qu'elles apparaissent sur l'autre ;
- tests à la main restants : `test-plan-kakeibo.md`, cas M1 à M6.

## Stores (App Store, Play Store)

Sans objet pour un usage personnel. Si un jour l'appli devait être publiée : comptes
développeur (Apple 99 $/an, Google 25 $ une fois), vérifications du nom (`brand.md`),
page de confidentialité, puis `/replica-launch`.
