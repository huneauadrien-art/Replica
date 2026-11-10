# Carte de reconnaissance : Kolecto (web + mobile), partie factures d'achat

Périmètre choisi : relier les factures d'achat au registre (stock, coûts par parcelle),
et préparer un export pour l'expert-comptable. Pas de facturation de vente : la production
part en coopérative / négoce. Pas de tenue de comptabilité : c'est l'expert-comptable.
Pour : le domaine de l'utilisateur.
Date : 2026-11-10

> **Limite.** Sources publiques lues à travers des extraits de recherche, surtout des
> comparateurs et des pages du Crédit Agricole. Aucun écran observé.

## Sources

| # | source | URL | notes |
| --- | --- | --- | --- |
| 1 | site Kolecto | https://www.kolecto.fr/ | gestion TPE/PME : facturation, banque, pré-comptabilité |
| 2 | offre agriculteurs | https://www.kolecto.fr/agriculteurs | offre dédiée, gratuite à l'installation |
| 3 | gestion bancaire et précomptable | https://www.kolecto.fr/fonctionnalites/gestion-bancaire-et-precomptable | agrégation bancaire, suggestions de rapprochement, export, accès lecture seule du comptable |
| 4 | tarifs | https://www.kolecto.fr/tarifs | grille officielle |
| 5 | forfaits Crédit Agricole | https://support.kolecto.fr/fr/articles/406746-les-forfaits-kolecto-credit-agricole | forfaits « Agri » selon le nombre de salariés |
| 6 | Crédit Agricole agriculteur | https://www.credit-agricole.fr/agriculteur/compte/gerer-son-argent/kolecto.html | appli mobile qui scanne les factures |
| 7 | comparatif facture électronique | https://www.comparatif-facture-electronique.fr/kolecto-facturation-electronique-avis/ | plateforme agréée, réception Factur-X/UBL/CII, OCR, export FEC |
| 8 | comparateur e-facturation | https://comparateur-efacturation.fr/plateforme/kolecto | rapprochement factures / banque |
| 9 | guide agriculteurs (Pleinchamp) | https://www.pleinchamp.com/actualite/facturation-electronique-le-guide-pratique-pour-les-agriculteurs | réception obligatoire au 1er septembre 2026, émission en 2027 |
| 10 | ma-facture-electronique, agriculture | https://ma-facture-electronique.org/par-secteur/agriculture/ | formats Factur-X, UBL, CII ; passage par une plateforme agréée |

## Le point réglementaire qui change tout

Depuis le 1er septembre 2026, votre exploitation doit pouvoir **recevoir** les factures
électroniques par une **plateforme agréée** (Kolecto en est une). Une app maison ne peut pas
être plateforme agréée : c'est un agrément de l'administration fiscale.

Mais les factures reçues arrivent en **Factur-X** : un PDF lisible qui contient, caché à
l'intérieur, un fichier de données (fournisseur, numéro, date, lignes, quantités, prix, TVA).
Registre Vigne peut lire ce fichier : vous gardez votre plateforme agréée pour recevoir,
et l'app récupère les lignes d'achat sans rien retaper.

## Boucle principale

Une facture d'achat arrive → elle entre dans l'app (PDF Factur-X ou photo) → ses lignes
deviennent des entrées de stock avec leur prix → chaque traitement a un coût par parcelle →
en fin de période, l'export part chez l'expert-comptable.

## Écrans à ajouter (déduits)

| ID | écran | rôle | composants |
| --- | --- | --- | --- |
| S30 | Factures d'achat | liste par mois, fournisseur, montant, statut (à rapprocher, rangée) | liste, filtres, totaux |
| S31 | Ajouter une facture | choisir un PDF (Factur-X lu automatiquement) ou prendre une photo | sélecteur, appareil photo |
| S32 | Fiche facture | en-tête, lignes, lien de chaque ligne vers un produit du stock, pièce jointe | tableau de lignes, sélecteur de produit |
| S33 | Coûts | coût des traitements par parcelle, par culture, par campagne | tableaux |
| S34 | Export comptable | période → CSV des factures + PDF joints, pour l'expert-comptable | choix de période, partage |

## Parcours

```
F20 Faire entrer une facture de la coopérative
    S30 -> S31 (PDF Factur-X) -> S32 (lignes pré-remplies, produits reconnus) -> valider
    = le stock augmente, avec le prix unitaire
    edge : PDF sans données (photo ou vieux PDF) -> saisie des lignes à la main ;
           produit inconnu -> le créer depuis la ligne ; même facture importée deux fois

F21 Connaître le coût phyto d'une parcelle
    S33 -> parcelle -> traitements × prix moyen des achats

F22 Envoyer les pièces à l'expert-comptable
    S34 -> trimestre -> partage (e-mail, drive)
```

## Modèle de données à ajouter

```
FactureAchat  id, fournisseur, numero, date, totalHT, totalTVA, totalTTC,
              lignes[{ libelle, quantite, unite, prixUnitaireHT, tauxTVA, produitId? }],
              pieceJointe (PDF ou photo, stockée sur le NAS), source (facturx | photo | saisie)
              evidence : réception Factur-X/CII (7, 10) ; confidence : high
MouvementStock  + factureId, prixUnitaireHT      (l'achat vient de la ligne de facture)
Produit         + prix moyen pondéré, calculé depuis les achats
```

## Hors périmètre

- **Être plateforme agréée** (recevoir et transmettre les factures pour l'administration) :
  agrément fiscal. Gardez une plateforme agréée ; Kolecto en est une, avec une offre agricole.
- **L'agrégation bancaire** : réservée aux établissements agréés (DSP2). Un import de relevé
  CSV reste possible plus tard.
- **La tenue de la comptabilité et le FEC** : c'est le travail de votre expert-comptable.
- **La facturation de vente et les relances** : vous vendez en coopérative / négoce.
- **La lecture automatique (OCR) des photos de factures papier** : possible mais moins fiable ;
  pour une photo, saisie des lignes à la main au début.

## Taille

5 écrans, 3 parcours, 1 entité nouvelle. Parties difficiles : extraire le XML caché dans le
PDF Factur-X (pièce jointe PDF, parfois compressée), relier les libellés du fournisseur aux
produits du stock, stocker les pièces jointes sur le NAS. Taille : **S à M** (une à deux semaines).
