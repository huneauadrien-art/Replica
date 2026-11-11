# Ce que réclament les utilisateurs : applis Kakeibo

Date : 2026-11-11

## Taille de l'échantillon : **0 avis vérifié**

Honnêtement : je n'ai pu copier **aucun avis mot pour mot**.
- Depuis cette session, les sources prévues sont refusées par le réseau :
  `apps.apple.com`, `itunes.apple.com` (flux RSS des avis), `hn.algolia.com`, `www.reddit.com`.
- Ces applis sont récentes et presque sans avis : « Kakeibo: Save First » et « Kakeibo App »
  affichent trop peu de notes pour un résumé, « Kakeibo - the bookkeeping app » a été retirée
  de Google Play le 16 octobre 2024 (selon AppBrain).

`replica/reviews-kakeibo.csv` est donc vide (seulement l'en-tête), et `reviews.py` n'a rien
à classer. Ce qui suit vient de **résumés de résultats de recherche** et d'**articles** :
ce sont des pistes, pas des tendances. Aucune citation ci-dessous n'est présentée comme un avis.

Pour aller plus loin : autoriser `itunes.apple.com` et `hn.algolia.com` dans les réglages
réseau de l'environnement (Accès réseau › Domaines autorisés), ou lire les avis à la main
sur le téléphone et les recopier dans le fichier CSV avec leur lien.

## 1. Ce qu'ils reprochent (pistes, non vérifiées)

| problème | d'où ça vient | poids |
| --- | --- | --- |
| La recherche dans les notes ne marche pas | résumé de recherche d'un avis Android, page exacte non identifiée ([Kakebo Budget Planner](https://play.google.com/store/apps/details?id=com.rellowteam.kakebo2&hl=en_IN) ou [Kakeibo - the bookkeeping app](https://www.appbrain.com/app/kakeibo-the-bookkeeping-app/com.kakeibo)) | mince (1) |
| Ajouter ses propres catégories est compliqué | même origine | mince (1) |
| Tout noter à la main prend du temps (15 à 20 min par semaine) | article critique, pas un avis : [cashbalancer.com](https://www.cashbalancer.com/blog/kakeibo-japanese-budgeting-method-2026) | mince (article) |
| Pertes de données à la synchro, catégories figées, pas d'export Excel | synthèse d'avis d'une **autre** appli de budget : [Kimola](https://kimola.com/reports/empower-your-strategy-with-wallet-app-insights-app-store-us-154577) | indirect |
| Export réservé à l'abonnement payant | fiche de [Kakeibo: Save First](https://apps.apple.com/app/id6760362042) (Pro) | fait, pas un avis |

## 2. Ce qui manque (pistes)

| demande | d'où ça vient | poids |
| --- | --- | --- |
| Un état des avoirs et des dettes | résumé de recherche d'un avis Android, page non identifiée | mince (1) |
| Gérer abonnements et prélèvements | même article critique | mince (article) |

## 3. Ce que personne ne fait

- **Partager un budget entre les téléphones du foyer sans cloud ni compte** : les applis
  trouvées sont soit sans synchro (« no cloud servers »), soit liées à un cloud.
  Le clone le fait avec le NAS de la maison.
- **Garder la réflexion de la méthode** (pensées notées avec les dépenses, bilan écrit) tout en
  allégeant la saisie : les articles opposent « carnet papier, réfléchi » et « appli, rapide ».

## Plan de corrections

| # | quoi | taille | où | état |
| --- | --- | --- | --- | --- |
| 1 | **Dépenses habituelles en un toucher** (même montant, catégorie et note vues 2 fois en 60 jours) : + puis 1 toucher | S | `mois.ts` `frequentes`, S04 | ✅ fait (test vitest + F02-E7) |
| 2 | Recherche dans les notes, sans accents ni majuscules | S | S06 | ✅ déjà fait (F08-E1) |
| 3 | Sous-catégories modifiables en 2 touches | S | S12 | ✅ déjà fait (F12-H1) |
| 4 | Export CSV gratuit, prêt pour Excel | S | S14 | ✅ déjà fait (F07-H1) |
| 5 | Charges fixes et abonnements repris chaque mois | S | S03 | ✅ déjà fait (F01-E2) |
| 6 | Synchro sans perte : rien ne part tant que le NAS n'a pas confirmé, la dernière modification gagne | M | `sync.ts` | ✅ déjà fait (tests synchro) |
| 7 | Point de la semaine (une phrase le dimanche) | S | S09 | à faire |
| 8 | Avoirs et dettes (épargne totale, crédits en cours) | M | nouvelle collection | à faire si utile au foyer (piste à 1 avis) |

Les lignes 1 et 6 sont ajoutées à `features-kakeibo.csv` avec `original = no`.

## L'angle

Usage personnel : il ne sert pas à vendre, mais à décider ce qui compte.

```
A. Pour un foyer qui veut tenir son budget à deux sans cloud ni abonnement,
   l'appli garde tout à la maison et le partage entre les téléphones par le NAS.
   Base : « ce que personne ne fait » (pas d'avis, constat sur les fiches des stores).

B. Pour qui trouve la méthode trop longue à tenir,
   les dépenses habituelles se notent en un toucher, le bilan en deux minutes.
   Base : article critique sur le temps de saisie (mince).

C. Pour qui veut la méthode d'origine,
   les 4 questions et le bilan écrit sont au centre, pas cachés dans un menu.
   Base : guides de la méthode (sources de la recon).
```

**Recommandé : A**, c'est ce qui distingue vraiment cette appli, et c'est la raison de
l'avoir faite pour vous plutôt que d'installer une appli existante.
