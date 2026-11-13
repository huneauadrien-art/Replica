# Carte de reconnaissance : Tire-Bouchon, cave à vin (iPhone, Android, web)

Périmètre choisi : la gestion de cave. Entrer une bouteille (photo de l'étiquette ou saisie),
la ranger dans son casier, savoir quand l'ouvrir, choisir le vin du soir, noter la dégustation.
**Visuel : à reprendre au plus près de l'original** (demande de l'utilisateur), voir la section
« Visuel » plus bas : couleurs, polices, composants.
Pour : le domaine de l'utilisateur (sa cave personnelle et, en option, les vins du domaine).
Date : 2026-11-13

> **Ce qui a été lu.** Le site public (page d'accueil, pages produit, deux articles du blog),
> la fiche App Store, la fiche French Tech. Les couleurs et polices viennent de la feuille de
> style publique du site (variables CSS). Les écrans viennent des 6 captures publiées sur la
> page d'accueil. Aucun compte utilisé, aucun code de l'app lu. Les captures sont gardées hors
> du dépôt (dépôt public) : leurs adresses sont dans le tableau des sources.

## Sources

| # | source | URL | notes |
| --- | --- | --- | --- |
| 1 | site officiel | https://tire-bouchon.app/ | pitch, 3 étapes, sommelier, apogée, tarifs, FAQ, 6 captures |
| 2 | logiciel de gestion de cave | https://tire-bouchon.app/logiciel-gestion-cave | stats par région/couleur/millésime, PWA hors ligne, partage en cours |
| 3 | foire aux vins | https://tire-bouchon.app/foire-aux-vins | scan en rafale, écran de confirmation, bac « à ranger » |
| 4 | import Excel (blog) | https://tire-bouchon.app/blog/cave/importer-cave-vin-excel | assistant d'import en 8 étapes, annulable 7 jours |
| 5 | apogée (blog) | https://tire-bouchon.app/blog/degustation/quand-ouvrir-son-vin | fenêtre de garde |
| 6 | fiche App Store | https://apps.apple.com/fr/app/id6795821948 | v1.0.9 (26 oct.), 4,6/5 (11 avis), Premium 4,99 €/mois ou 44,99 €/an |
| 7 | Google Play | https://play.google.com/store/apps/details?id=app.tirebouchon.mobile | appli Android |
| 8 | fiche French Tech | https://lespepitestech.com/startup-de-la-french-tech/tire-bouchon | éditeur ADVIJU Investissement, Bordeaux/Paris, 1 personne |
| 9 | manifeste de l'app web | https://tire-bouchon.app/manifest.json | fond `#1a1714`, barre `#3a1e25`, portrait |
| 10 | captures (référence seulement) | https://tire-bouchon.app/images/landing/phone-dashboard.png, phone-cave-hero.webp, plan-casier-hero.webp, phone-fiche-data.png, phone-sommelier.png, scan-bottle.png | ne jamais les mettre dans l'app |

## Boucle principale

Photographier l'étiquette → l'app reconnaît le vin et calcule sa fenêtre de garde → toucher la
case du casier où on la pose → le soir, l'app dit quelle bouteille ouvrir et dans quelle case
elle attend → après la dernière gorgée, une note de dégustation, la case se libère.

Ce que les gens paient (abonnement) : la fenêtre de garde de chaque bouteille, les alertes
d'apogée, le sommelier sans limite, plus de 30 vins.

## Écrans

Deux versions de l'app apparaissent dans les captures : l'ancienne barre du bas (Accueil, Cave,
appareil photo, Découvrir, Paramètres) et la nouvelle (Ma cave, Sommelier, scan, Social, Profil).
La carte suit la nouvelle.

| ID | écran | comment y aller | rôle | composants clés | états vus |
| --- | --- | --- | --- | --- | --- |
| S40 | Ma cave, vue Liste | onglet « Ma cave » | tout le stock, le vin du soir, la jauge de garde | salutation (« BONNE NUIT »), grand chiffre (29 bouteilles · 28 prêtes · ≈ 1 521 € · 13 sans prix), cloche, bouton « Mes meubles », bascule Liste / Plan, carte « À BOIRE CE SOIR », jauge Prêt / Apogée / À boire vite, puces de filtre (Tout, Prêtes à boire, Rouge, Blanc, Rosé…), lignes bouteille | rempli |
| S41 | Ma cave, ancien tableau de bord | ancienne version | résumé + urgences | « MA CAVE » 12 bouteilles · 629 €, bouton rond « + », jauge Apogée / À boire / De garde, « CE SOIR, OUVREZ » avec frise d'apogée, « BOIRE AVANT 2027 » (lignes à liseré rouge, « ≤ 2027 »), « MES BOUTEILLES » + « Voir tout » | rempli |
| S42 | Ma cave, vue Plan | bascule « Plan » | le casier en grille | colonnes C1…C8, rangées R1…R3 en police mono, case = nom court + millésime, fond de case = couleur du vin, case vide en pointillés | rempli, cases vides |
| S43 | Mes meubles | bouton « Mes meubles » | créer et nommer ses casiers (rangées × colonnes) | liste des meubles, formulaire | déduit |
| S44 | Scan | gros bouton rouge au centre de la barre | photographier une ou plusieurs étiquettes | caméra plein écran, cadre de visée, bandeau « N vins lus », import depuis la galerie | rafale (v1.0.9), hors ligne |
| S45 | Confirmation du scan | après la photo | vérifier ce qui a été lu | domaine, cuvée, appellation, région, millésime, couleur (demandée si absente), quantité, prix payé, temps de lecture (« 2,8 s ») | reconnu, inconnu (fiche créée depuis l'étiquette) |
| S46 | Ranger | après confirmation, ou depuis « à ranger » | toucher une case libre ; la bouteille suivante apparaît | grille du meuble, bac « À ranger » | maintenant / plus tard |
| S47 | Fiche vin | toucher une bouteille | tout sur ce vin | en-tête nom (serif) + millésime (mono), icônes stock et modifier, frise d'apogée (mise, apogée, fin d'apogée, déclin), emplacement « Ma cave à vin · R1 · C1 », profil gustatif (4 curseurs : Léger–Puissant, Souple–Tannique, Doux–Acide, Sec–Moelleux), arômes dominants (puces avec pastille de couleur), cépages (barres en %), Service (température, carafage, garde « → 2045 »), « À table », barre du bas « Actions » + « Déguster cette bouteille » | rempli |
| S48 | Déguster | « Déguster cette bouteille » | sortir la bouteille du stock et la noter | note, robe, arômes, avec qui, photos | déduit |
| S49 | Carnet de dégustation | Profil ou fiche vin | mes notes passées | liste par date | déduit |
| S50 | Le sommelier | onglet « Sommelier » | « Dites ce que vous mangez » → le vin de ma cave | champ du plat, carte « LE PLAT » (puces : Gras, Noisette), puces du vin (Acidité fraîche, Pomme), explication en italique serif, carte résultat avec score rond (« 75 »), « NOTRE CHOIX · TRÈS BON ACCORD », état « À son apogée », puce emplacement (pointillés si « À ranger »), bouton rouge « Voir cette bouteille », « Changer de plat » | résultat, rien ne va (« le vin qu'il vous faudrait ») |
| S51 | Notifications | cloche | alertes d'apogée | « Votre Clos des Ruelles 2016 entre dans sa fenêtre d'apogée », « 3 bouteilles arrivent à maturité ce mois-ci » | rempli |
| S52 | Social | onglet « Social » | voir la cave d'un ami, partager une dégustation | liste d'amis, invitations | déduit |
| S53 | Profil / Paramètres | onglet « Profil » | alertes (rythme, email), langue, abonnement, import, export, compte | listes de réglages | déduit |
| S54 | Importer une cave (web) | Cave › « ••• » › « Importer une cave » | Excel, CSV, export CellarTracker, photo ou PDF | assistant : colonnes reconnues, piles (Prêtes, À confirmer, Inconnus, À trancher, Écartées), « Ajouter la différence » / « Tout ajouter », « Ajouter N bouteilles », « Imports récents » + « Annuler » (7 jours) | sur ordinateur seulement |
| S55 | Découvrir / Guide des vins | ancien onglet, site | régions, cépages, appellations, producteurs | listes, fiches | — |
| S56 | Abonnement | au 31ᵉ vin, ou fonction réservée | essai 7 jours puis 4,99 €/mois ou 44,99 €/an | offre unique | — |
| S57 | Essayer sans compte | /essayer | une photo d'étiquette → ouvrir ou attendre | caméra, résultat | photo non gardée |

## Parcours

```
F40 Entrer une bouteille et la ranger
    S40 -> S44 (photo) -> S45 (vérifier, quantité, prix) -> S46 (toucher la case) -> S47
    clics : 4
    edge : vin inconnu (fiche créée depuis l'étiquette), couleur absente (l'app la demande),
           hors ligne (photo gardée, analyse au retour du réseau), case déjà prise, plus de place

F41 Ranger un carton (foire aux vins)
    S44 (rafale : photo, photo, photo…) -> bandeau « 6 vins lus » -> S45 par vin -> S46 bouteille après bouteille
    edge : quitter l'écran pendant l'analyse (les photos restent), ranger plus tard (bac « À ranger »)

F42 Retrouver une bouteille
    S40 -> ligne -> S47 -> puce « R2 · C5 » -> S42 (case mise en avant)
    clics : 3

F43 Ouvrir le vin du soir
    S40 carte « À BOIRE CE SOIR » -> « Voir la bouteille » -> S47 -> « Déguster cette bouteille » -> S48 note
    = stock -1, la case se libère
    clics : 4

F44 Accord mets-vins
    S50 « magret, sauce aux figues » -> carte résultat -> « Voir cette bouteille » -> S47
    edge : rien ne va dans ma cave, bouteille pas encore rangée, abonnement requis au-delà de N essais

F45 Alerte d'apogée
    notification -> S47
    réglage : rythme et email dans S53

F46 Dessiner ses casiers
    S40 « Mes meubles » -> S43 (nom, rangées, colonnes) -> S42

F47 Importer une cave depuis Excel (ordinateur)
    S53 -> S54 (fichier -> colonnes -> lignes incertaines -> emplacements -> « Ajouter N bouteilles »)
    edge : vin déjà en cave (ajouter la différence), annuler l'import sous 7 jours
```

Nombre à battre : **4 gestes** de la photo à la bouteille rangée.

## Visuel (à reprendre au plus près)

Une seule ambiance : **sombre**, couleur de cave et de lie de vin, texte crème, détails dorés,
action en rouge corail. Pas de thème clair.

### Couleurs (valeurs lues dans la feuille de style publique)

| rôle | valeur | usage |
| --- | --- | --- |
| fond | `#1e1518` | fond de tous les écrans |
| fond profond | `#1b1316` | barre du bas, zones creusées |
| carte | `#251b1e` | lignes bouteille, cartes |
| carte surélevée | `#2a1b1f` | carte « ce soir » |
| fond 2 / 3 | `#2c2023` / `#3d2e31` | puces, pistes des curseurs |
| survol | `#4e3b3f` | |
| bordure | `#3a2c2f` (fine) / `#4e3b3f` (marquée) | cartes 1 px |
| texte | `#f2e8dc` crème | titres, bouton secondaire plein |
| texte 2 | `#d4c4b4` | sous-titres |
| texte discret | `#a08e7e` | appellation · région |
| or (accent) | `#c4a882`, clair `#d4b896`, sombre `#a08968`, texte or `#e8d4b8` | intitulés en capitales, puce active, curseurs |
| action | `#e5484d`, survol `#f25f63`, appuyé `#c93b3f` | bouton photo, bouton principal, urgences |
| bordeaux | `#4a1c24`, profond `#2d1118`, barre du système `#3a1e25` | cases de vin rouge, entête |
| bois | `#3d2e24` | |
| succès / attention / erreur | `#22c55e` / `#f59e0b` / `#ef4444` | |
| état « Prêt » | `#e8d9b8` | jauge, pastille |
| état « Apogée » | `#e8b54a` | jauge, pastille |
| état « À boire vite » | `#e58747` | jauge, pastille |
| case vin blanc | ≈ `#857b6f`, effervescent ≈ `#807d5c` | plan |
| case liquoreux | ≈ `#806b3c` ; porto ≈ `#4e2919` | plan |
| barre de cépage | dégradé `#921519` → `#ba0715`, % en `#ff6568` | fiche vin |

### Polices (toutes libres, Google Fonts, licence OFL : réutilisables)

- **Spectral** (serif) : noms de vin dans les en-têtes et cartes vedettes, titre « Le sommelier »,
  explications en *italique*.
- **Hanken Grotesk** (sans) : tout le reste ; grand chiffre en gras ~48 px.
- **JetBrains Mono** : millésimes en en-tête, emplacements « R1 · C1 », bornes de frise,
  intitulés de colonnes C1…C8.
- Intitulés de section : petites capitales espacées (≈ 12 px, interlettrage 0,25 em), couleur or
  discret : « MA CAVE », « À BOIRE CE SOIR », « ARÔMES DOMINANTS », « SERVICE ».

### Formes et composants

- Rayons : cartes 16–24 px, boutons 16 px, puces en pilule, cases du plan 10 px.
- Cartes : fond `#251b1e`, bordure 1 px `#3a2c2f`, pas d'ombre (sauf bouton rouge, halo rouge).
- Barre du bas flottante : pilule sombre, 4 onglets à icône fine + libellé, **gros rond rouge
  au centre** (appareil photo / cadre de scan).
- Bouton principal rouge plein, texte blanc ; bouton secondaire crème plein, texte sombre ;
  bouton fantôme bordure fine.
- Bascule à deux segments (Liste / Plan) : segment actif crème plein.
- Puce de filtre : pilule bordure fine ; active = fond or `#c4a882`, texte sombre.
- Puce d'emplacement : pilule bordure or, police mono, cible à gauche, « › » à droite ;
  en pointillés quand la bouteille est « À ranger ».
- Jauge de garde : barre segmentée arrondie + légende à pastilles.
- Frise d'apogée : piste fine, segment or pour la fenêtre, trait rouge pour « aujourd'hui »,
  bornes en mono.
- Curseurs du profil gustatif : piste `#3d2e31`, pouce rond or, mot du côté atteint en gras crème.
- Score d'accord : cercle bordure or, chiffre au centre.
- Icônes : trait fin, style « outline » (Lucide, licence ISC, convient).
- Vignette bouteille : photo de l'étiquette détourée sur fond `#2c2023`, pastille d'état en haut à droite.

**À ne pas reprendre** : le nom « Tire-Bouchon », son logo et son icône, les photos de
bouteilles et illustrations, les textes du site. Les couleurs et la mise en page, oui.

## Composants (pour replica-design)

| composant | variantes | états | écrans |
| --- | --- | --- | --- |
| Bouton | rouge plein, crème plein, fantôme, lien « 18 autres › » | normal, appuyé, désactivé, chargement | tous |
| Barre du bas | 4 onglets + rond central | onglet actif (or), inactif | tous |
| Intitulé de section | simple, avec lien à droite (« Voir tout »), avec badge (« À L'APOGÉE ») | — | S40, S41, S47, S50 |
| Grand chiffre | avec ligne de stats | — | S40, S41 |
| Bascule | Liste / Plan | actif | S40, S42 |
| Carte « ce soir » | avec frise, avec emplacement | aucune bouteille prête | S40, S41 |
| Jauge de garde | 3 segments + légende | cave vide | S40, S41 |
| Puce | filtre, arôme (pastille), emplacement (mono), info | active, inactive, pointillés | S40, S47, S50 |
| Ligne bouteille | normale, urgente (liseré rouge + « ≤ 2027 »), quantité « ×2 » | — | S40, S41 |
| Case du plan | rouge, blanc, rosé, effervescent, liquoreux, vide | sélectionnée, mise en avant | S42, S46 |
| Frise d'apogée | courte (carte), longue (fiche) | avant, pendant, après | S41, S47 |
| Curseur de profil | 4 axes | lecture seule | S47 |
| Barre de cépage | % | — | S47 |
| Bloc Service | 3 colonnes | — | S47 |
| Score d'accord | cercle | — | S50 |
| Notification | apogée, mensuelle | — | S51 |

## Modèle de données déduit

```
Meuble      id, nom (« Ma cave à vin »), rangees, colonnes, ordre
            evidence : « Mes meubles », R1–R3 × C1–C8, « Ma cave à vin · R1 · C1 »   confiance : haute
Vin         id, domaine, cuvee, appellation, region, pays, couleur (rouge|blanc|rosé|effervescent|liquoreux|fortifié),
            millesime, cepages [{nom, pct}], profil {corps, tanins, acidite, sucre} (0–1), aromes [nom],
            service {temp_min, temp_max, carafage_h}, garde {debut, apogee_debut, apogee_fin, fin},
            accords [plat], source (catalogue | étiquette | saisie), photo_etiquette
            evidence : S45, S47, import (Domaine, Cuvée, Millésime, Appellation)   confiance : haute
Bouteille   id, vin_id, meuble_id?, rangee?, colonne? (vide = « À ranger »), prix_paye?, entree_le,
            sortie_le?, statut (en cave | bue | offerte), import_id?
            evidence : « ×2 », « 13 sans prix », « ≈ 1 521 € », bac « à ranger », import annulable   confiance : haute
Degustation id, vin_id, bouteille_id?, date, note, robe, aromes, commentaire, avec_qui, photos
            evidence : carnet de dégustation, App Store « qui a partagé la bouteille »   confiance : moyenne
EtatGarde   calculé, pas stocké : jeune / prêt / apogée / à boire vite / passé, selon garde et date du jour
            evidence : jauges S40/S41, « ≤ 2027 »   confiance : haute (règles exactes : devinées)
Alerte      rythme (immédiat | hebdo | mensuel), email (oui/non)          confiance : moyenne
Import      id, date, source, nb_bouteilles, annulable_jusqu_au           confiance : haute
Ami/Partage utilisateur, ami, droits (lecture | modification)              confiance : devinée
```

Relations : Meuble 1-n Bouteille, Vin 1-n Bouteille, Vin 1-n Degustation, Import 1-n Bouteille.
Une bouteille est « Prêt / Apogée / À boire vite » selon la fenêtre de garde de son vin.

## Tableau des fonctionnalités

Voir `features-tire-bouchon.csv`. Must : 14, should : 11, could : 8, skip : 5.

## Ce qui ne peut pas être repris

- **Le catalogue de 190 000 vins** (et 59 000 domaines) : c'est leur base, pas copiable. À la
  place : saisie, lecture de l'étiquette, et une table maison de garde par couleur et région.
- **Leur IA de reconnaissance** : on peut lire une étiquette avec un modèle d'IA de vision, mais
  il faut une clé API et Internet ; sans ça, saisie à la main (champs pré-remplis par recherche
  dans ses propres vins).
- **Le réseau d'amis** et ses utilisateurs.
- **Le guide des vins** (régions, cépages, appellations) : contenu rédigé par eux.
- **Le nom, le logo, les photos de bouteilles et les textes** : on garde les couleurs et la mise
  en page, avec un nom et une icône à vous.

## Taille

Écrans 18 (dont 11 utiles pour vous), parcours 8, entités 7.
Parties difficiles :
1. **La fenêtre de garde** sans leur base : il faut des règles fiables (couleur, région,
   appellation, millésime) que vous pourrez corriger bouteille par bouteille.
2. **La lecture d'étiquette** : appel à un modèle d'IA depuis le NAS, avec clé API ; prévoir le
   mode sans réseau.
3. **Le plan de cave tactile** : grille à cases, toucher pour ranger, mettre en avant une case.

Le reste existe déjà dans Registre Vigne : stockage local, synchronisation NAS (ajouter les
collections `meubles`, `vins`, `bouteilles`, `degustations`), pièces jointes (photos d'étiquette).
Taille : **M** (quelques semaines), comme un nouvel onglet « Cave » de l'app. Le thème sombre
façon Tire-Bouchon peut rester propre à cet onglet ou devenir le thème de toute l'app.
