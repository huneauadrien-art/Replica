# Parité : budget du foyer contre les applis Kakeibo

Date : 2026-11-11 · `python3 .claude/skills/replica-diff/parity.py replica/features-kakeibo.csv`

## Verdict : **utilisable (shippable)**

- fonctionnalités : **89,3 / 100** ; indispensables : **12 sur 12** ;
- défauts : aucun S1 ni S2 ouvert (4 défauts S3/S4 trouvés et corrigés, `bugs-kakeibo.md`) ;
- tests : 28 tests de calcul et 23 tests de bout en bout passent.

« Mieux que l'original » demande encore les améliorations tirées des avis
(`/replica-entrepreneur`), dont deux sont déjà là : annuler juste après un ajout,
et le partage entre les téléphones du foyer sans cloud.

## Par domaine, du plus faible au plus fort

| domaine | score | |
| --- | --- | --- |
| comptes | 0 | plusieurs comptes et multi-devises : « could », pas utiles à un foyer en euros |
| accueil | 50 | explication de la méthode dans l'écran vide, pas d'écrans d'accueil dédiés |
| réglages | 75 | euro seulement |
| technique | 80 | pas de verrou ni de widget |
| saisie | 94 | pas de scan de tickets |
| bilan | 96 | point de la semaine partiel |
| mois | 96 | budget hebdo : simple division, pas d'IA |
| épargne, historique | 100 | |

## Mise en page

**Pas de score** : aucune capture des applis d'origine (les stores sont bloqués depuis
cette session, voir la recon). Les captures du clone sont dans
`replica/clone-screens-kakeibo/` (390 × 844) et serviront de référence pour les
prochaines versions :

```bash
python3 .claude/skills/replica-diff/imgdiff.py ancienne.png nouvelle.png --mode pixel
```

Comparer à la structure décrite par les stores : accueil en cartes (chiffre clé,
catégories, dernières lignes), bouton + central, bascule Dépense / Revenu / Épargne —
le clone suit ce schéma.

## Différences de comportement

| parcours | les applis d'origine | le clone | décision |
| --- | --- | --- | --- |
| F02 noter une dépense | + → montant → catégorie → valider : 4 touches | + → montant → sous-catégorie : **3 touches** (enregistre directement) | garder |
| F02 erreur de saisie | supprimer la ligne | « Annuler » pendant 5 s | garder |
| F01 préparer le mois | ressaisir ou revenu récurrent | reprise du mois précédent, ou des lignes habituelles | garder |
| F04 bilan | réflexion libre | les 4 questions chiffrées + 3 réponses, relues au bilan suivant ; bilan oublié signalé | garder |
| partage | aucun, ou cloud de l'éditeur | NAS du foyer, sans compte en ligne | garder |
| rappels | widget, notifications | notifications locales (soir, fin de mois) ; pas sur le web | garder |
| export | CSV en payant (Save First Pro) | CSV gratuit, prêt pour Excel français | garder |
| hors ligne | oui | oui, synchro au retour du Wi-Fi | garder |

## Les cinq prochaines choses à construire

1. **Point de la semaine** (S09) : une phrase de réflexion le dimanche, à côté du reste par semaine.
2. **Verrou** par code ou empreinte (le budget est privé, le téléphone se prête).
3. **Écrans d'accueil** : 3 pages qui expliquent la méthode au premier lancement.
4. **Widget** « reste à dépenser » (Android d'abord ; demande du code natif).
5. **Devise** : seulement si le foyer en a besoin (sinon laisser « euro seulement »).

Mais avant d'en construire davantage : `/replica-entrepreneur` pour voir ce que les
utilisateurs de ces applis réclament vraiment.
