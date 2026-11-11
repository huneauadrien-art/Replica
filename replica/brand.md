# Marque : Bas de laine

Appli de budget du foyer (méthode des 4 catégories), usage personnel.
Angle retenu (`fixes-kakeibo.md`) : **le budget du foyer partagé entre les téléphones par le
NAS de la maison, sans cloud ni abonnement.**

## Le nom

**Bas de laine** : l'argent mis de côté à la maison. Ça dit l'épargne d'abord (le cœur
de la méthode) et le « chez soi » (l'angle NAS). Français, court, compris tout de suite.

Les 20 pistes :

| style | noms |
| --- | --- |
| descriptif | Budget du foyer, Compte-maison, Carnet de dépenses, Fin de mois |
| composé | Bilan-maison, Épargne d'abord, Reste-à-vivre, Quatre-cases |
| image | **Bas de laine**, Grenier, Tirelire, Cassette, Panier, Boussole |
| inventé | Foyo, Mesura, Comptine |
| verbe | Mettre de côté, Compter, Ranger |

Écartés d'office : « Carnet du foyer » (traduction mot à mot de *kakeibo* : trop proche
des applis d'origine), « Pot commun » (nom d'un service de Lydia), « Pécule » (deux logiciels
de budget l'utilisent déjà, vu le 2026-11-11), « Tirelire » et « Cagnotte » (très utilisés).

Les 5 retenus et les vérifications :

| nom | recherche web « nom + appli budget » | stores (App Store, Play) | INPI / EUIPO (classes 9 et 42) | domaine |
| --- | --- | --- | --- | --- |
| **Bas de laine** | aucune appli de ce nom trouvée (2026-11-11) | à faire | à faire | à faire |
| Grenier | à faire | à faire | à faire | à faire |
| Compte-maison | à faire | à faire | à faire | à faire |
| Comptine | à faire | à faire | à faire | à faire |
| Budget du foyer | descriptif, peu protégeable | à faire | à faire | à faire |

Pour un usage personnel, ces vérifications ne sont pas nécessaires. Elles le deviennent
seulement si l'appli est un jour publiée ou vendue : il faudra alors un vrai examen par un
conseil en propriété industrielle.

Noms techniques inchangés (invisibles pour l'utilisateur) : dossier `budget/`, image
`budget-foyer`, paquet Android `fr.huneau.budgetfoyer`.

## Couleurs

Les jetons de `replica/design-bas-de-laine/tokens.json` restent tels quels : les couleurs
des applis d'origine n'ont pas pu être relevées (aucune capture, stores bloqués), et la
palette provisoire est déjà propre à l'appli et différente de Registre Vigne (prune).

| rôle | couleur | sens |
| --- | --- | --- |
| accent | `#1F5F5B` vert-de-gris | calme, « maison », pas le bleu des banques |
| fond | `#F6F4EF` crème | la laine |
| pièce (icône) | `#D6A840` ocre | l'épargne |
| catégories | bleu Survie, terre Optionnel, violet Culture, ocre Extra | toujours avec leur nom |

Contrôle : `python3 .claude/skills/replica-design/contrast.py replica/design-bas-de-laine/tokens.json`
→ 33 paires, **0 échec AA**.

## Icône

Faite pour l'appli (pas reprise) : une chaussette de laine crème, côtes vert foncé en haut,
une pièce ocre qui dépasse, sur fond vert-de-gris. Script : formes simples, lisible à 48 px.
Fichiers dans `budget/assets/` (icône 1024, favicon, icône adaptative Android avant-plan,
fond et monochrome). L'icône par défaut d'Expo est remplacée.

Brief pour une version dessinée plus tard :
- l'idée : « l'argent qu'on garde à la maison » ;
- symbole + nom ; doit marcher à 16 px et en 1024 px sans transparence (iOS) ;
- à fournir : SVG, icône 1024 × 1024, favicons, image 1200 × 630 ;
- pas de tirelire-cochon, pas de yen ni de motif japonais, rien qui rappelle une banque.

## Le ton

| mot | pas |
| --- | --- |
| simple | pas simpliste : les chiffres restent exacts |
| calme | pas mou : un dépassement est dit clairement, en rouge |
| concret | pas technique : « reste à dépenser », pas « solde disponible » |

| à faire | à éviter |
| --- | --- |
| « Le mois n’est pas encore préparé. » | « Aucune donnée budgétaire. » |
| « Soit 277 € par semaine jusqu’au 30. » | « Moyenne hebdomadaire projetée. » |
| « Il manque 40 € sur l’objectif. » | « Échec de l’objectif d’épargne ! » |
| « Deux minutes pour regarder le mois passé. » | « Complétez votre revue mensuelle. » |
| « Touchez la catégorie pour enregistrer. » | « Sélectionnez une catégorie puis validez. » |

Les textes les plus vus (accueil vide, reste à dépenser, saisie, bilan, objectifs,
erreurs de montant, NAS) suivent déjà ce ton ; tous ont été écrits pour cette appli.

## Contrôle « rien de l'original »

```bash
python3 .claude/skills/replica-brand/sweep.py . --config replica/brand.json
```

Résultat du 2026-11-11 : **Clean** (aucun « Kakeibo », « Kakebo », « Save First »,
« Halil », « Kakei » ni domaine d'origine dans le code). Les fichiers de `replica/`
(recherche) gardent le mot, c'est voulu.
