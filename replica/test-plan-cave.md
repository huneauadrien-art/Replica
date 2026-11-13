# Plan de test : cave à vin

Automatique : `cave/e2e/cave.e2e.mjs` (Playwright, version web servie par le serveur du NAS
en local) et `cave/src/core/__tests__/cave.test.ts` (vitest, 13 cas de logique).
Chaque passage échoue sur une erreur de la console ou une réponse 5xx.
Dernier passage : 2026-11-13, app séparée Ma Cave : **17/17 de bout en bout, 29/29 en vitest**.

| cas | parcours | ce qu'on vérifie | auto | résultat |
| --- | --- | --- | --- | --- |
| F40-E0 | cave vide | message d'accueil, bouton « Dessiner mon premier casier » | e2e | ok |
| F46-H1 | créer un meuble | 2 × 3, « 6 cases, de R1 · C1 à R2 · C3 » | e2e | ok |
| F40-N1 | domaine vide | refus avec message | e2e | ok |
| F40-H1 | ajouter 2 bouteilles et les ranger | accents + emoji, prix « 20,5 », garde estimée, rangement case après case | e2e | ok |
| F40-E1 | case déjà prise | refus « Case prise » | e2e | ok |
| F40-E2 | même vin ajouté une 2ᵉ fois (casse, accents différents) | regroupé (×3), pas de doublon | e2e | ok |
| F42-H1 | retrouver une bouteille | liste → fiche → puce emplacement → plan | e2e | ok |
| F43-H1 | déguster | note 16/20, sortie de cave, case libérée, carnet | e2e | ok |
| F43-E1 | rechargement de la page | données gardées | e2e | ok |
| F46-E1 | meuble rétréci | confirmation, la bouteille hors grille repasse « à ranger » | e2e | ok |
| F42-E1 | filtres | Blanc vide, Rouge rempli | e2e | ok |
| F47-H1 | supprimer un vin | bouteilles et notes supprimées | e2e | ok |
| N-1 | relier au NAS (Réglages) | test de connexion, envoi de la cave, le NAS compte 1 vin et 3 bouteilles | e2e | ok |
| R-1 | photo de l'étiquette | fiche remplie (domaine, millésime, cépages, garde), photo réduite à 1568 px avant envoi | e2e (faux Anthropic) | ok |
| R-2 | code-barres tapé | trouvé dans Open Food Facts, puis reconnu dans la cave sans appel (×2) | e2e (faux OFF) | ok |
| R-N1 | code-barres faux / inconnu | refusé (clé de contrôle) / « inconnu d'Open Food Facts » | e2e | ok |
| R-N2 | pas de clé sur le NAS | 503 « reconnaissance pas activée », Réglages l'indique | à la main (curl) | ok |
| S-1 | synchro NAS | vins et bouteilles reçus, gardés après redémarrage du serveur | à la main (curl) | ok |
| S-2 | deux téléphones rangent dans la même case hors ligne | la plus récente reste, l'autre repasse à ranger | vitest | ok |
| S-3 | garde | jeune → prêt → apogée → vite → passé ; fenêtre saisie prioritaire ; sans millésime | vitest | ok |
| S-4 | export CSV | « ; », guillemets, une ligne par bouteille | vitest | ok |

## À faire à la main sur le téléphone (pas automatisable ici)

- [ ] Photo de l'étiquette avec l'appareil photo (Android et iPhone), puis la voir sur l'autre téléphone après synchro.
- [ ] Polices : Spectral, Hanken Grotesk et JetBrains Mono s'affichent bien sur le téléphone.
- [ ] Barre d'état en texte clair sur les écrans de la cave, foncé ailleurs.
- [ ] Export CSV ouvert dans Excel : accents corrects.
- [ ] Plan d'un grand casier (10 colonnes) : défile de côté.

Non fait : le contrôle d'accessibilité automatique (axe) ; les libellés d'accessibilité des
cases, boutons et champs sont posés à la main et servent de sélecteurs aux tests.
