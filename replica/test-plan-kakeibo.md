# Plan de tests : budget du foyer

Tests de bout en bout : `budget/e2e/` (Playwright, téléphone Pixel 7 simulé, français,
heure de Paris), contre la version web servie par le vrai serveur du NAS lancé en local
avec un dossier vide. Chaque test échoue sur une erreur de console ou une réponse 5xx,
et passe un contrôle d'accessibilité axe sur chaque écran visité.

```bash
cd budget
npm test          # 28 tests des calculs, de l'export et de la synchro (vitest)
npm run e2e       # construit la version web et le serveur, puis 23 tests Playwright
```

Dernier passage : **28/28 vitest, 23/23 Playwright** (2026-11-11).

| cas | ce qui est vérifié | auto |
| --- | --- | --- |
| F01-H1 | premier mois : revenus 2 000, loyer 700, épargne 200 → reste 1 100 ; charges retenues pour la suite | ✅ |
| F01-E1 | épargne plus grande que le disponible : avertissement | ✅ |
| F01-E2 | mois suivant repris du mois précédent | ✅ |
| F01-N1 | montant illisible (« deux mille ») : refusé, rien d'enregistré | ✅ |
| F02-H1 | dépense en 3 touches (+, 23,4, Courses) → reste 1 076,60, jauge Survie | ✅ |
| F02-E1 | « Annuler » dans le message retire la dépense | ✅ |
| F02-E2 | double touche sur la catégorie : une seule dépense | ✅ |
| F02-E3 | date d'hier, note avec accents, guillemets et emoji | ✅ |
| F02-E4 | sur ordinateur, le clavier tape le montant (et Retour arrière) | ✅ |
| F02-E5 | dépassement : reste négatif en rouge + alerte | ✅ |
| F02-E6 | revenu en plus : augmente le reste | ✅ |
| F02-N1 | sans montant : message, rien d'enregistré | ✅ |
| F03-H1 | objectif créé, épargne rangée, avancement affiché, reste inchangé | ✅ |
| F04-H1 | bilan oublié signalé, chiffres des 4 questions, clore → préparer le mois suivant | ✅ |
| F06-H1 | historique : graphique et « à changer » des bilans | ✅ |
| F06-E1 | historique vide | ✅ |
| F07-H1 | export CSV : BOM, point-virgule, virgule, guillemets, nom du fichier | ✅ |
| F07-N1 | export d'une période vide : message | ✅ |
| F08-H1 | corriger le montant, puis supprimer avec confirmation | ✅ |
| F08-E1 | recherche sans accents, filtre par catégorie, aucun résultat | ✅ |
| F09-H1 | deux téléphones : envoi au NAS, récupération, dépense qui passe de l'un à l'autre | ✅ |
| F09-N1 | mauvais code d'accès : refusé avec un message | ✅ |
| F12-H1 | renommer, ajouter, retirer une sous-catégorie ; visible à la saisie | ✅ |
| calculs | fin de mois au 25, février bissextile, passage d'année, arrondis, 10 %, catégorie supprimée, bilans oubliés (vitest) | ✅ |
| synchro | deux dépenses sur deux téléphones, même mois préparé deux fois, suppressions, modification locale pas envoyée, fiches invalides refusées (vitest) | ✅ |

## À vérifier à la main (pas automatisable ici)

| cas | comment |
| --- | --- |
| M1 | appli Android installée depuis l'apk : saisie, pavé, retour arrière du téléphone |
| M2 | iPhone par la version web du NAS (Safari, « Sur l'écran d'accueil ») |
| M3 | NAS éteint ou hors Wi-Fi : saisir 2 dépenses, rallumer, vérifier qu'elles arrivent |
| M4 | même ligne modifiée sur deux téléphones hors ligne : la dernière modification gagne |
| M5 | lecteur d'écran (TalkBack / VoiceOver) sur l'écran Mois et la saisie |
| M6 | sauvegarde enregistrée puis restaurée sur un autre téléphone |
