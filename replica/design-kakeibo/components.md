# Composants : budget du foyer

Jetons : `tokens.json` (couleurs par rôle, contrôle de contraste : 33 paires, 0 échec AA).
Code : `budget/src/ui/theme.ts` (les jetons) et `budget/src/ui/kit.tsx` (les composants).
Vitrine : route `/design` de l'appli (tous les composants, tous les états).
Pile React Native : pas de Tailwind ni de CSS ; les composants lisent `theme.ts`, jamais
de couleur écrite en dur dans un écran.

Icônes : aucune image reprise d'une autre appli. Pour l'instant des symboles texte
simples ; un jeu ouvert (Lucide, licence ISC) pourra les remplacer avec `/replica-brand`.
Tous les textes sont écrits pour cette appli.

Règles communes :
- cible tactile **48 px minimum** ; textes ≥ 14 px ; chiffres en `tabular-nums` ;
- montants toujours au format français : `1 234,50 €` (espace fine, virgule) ;
- chaque élément touchable a un `accessibilityRole` et une étiquette qui dit le montant
  et la catégorie (« Courses, 23,40 euros, survie ») ;
- les couleurs de catégorie ne sont jamais le seul indice : toujours le nom à côté.

```
Bouton
  variantes   principal, secondaire, discret, danger
  tailles     md 48px, lg 56px
  états       normal, appuyé (opacité .75), désactivé (.4), chargement (libellé gardé)
  jetons      fond accent, texte on-accent, rayon md, type base/700
  a11y        role button, état disabled annoncé
  écrans      S03, S04, S07, S08, S10, S13, S14

CarteChiffre (le grand chiffre « reste à dépenser »)
  variantes   principal (display 44), petit (xl 28)
  tons        normal (text), attention < 10 % du disponible (warning), dépassé < 0 (danger)
  contenu     libellé xs muted, montant, sous-ligne sm muted (« sur 1 850 € disponibles »)
  a11y        lu comme une phrase : « Reste à dépenser : 412 euros »
  écrans      S02, S09

JaugeCategorie
  variantes   4 groupes (couleur cat-*)
  états       sous budget, proche (≥ 90 %, texte warning), dépassé (barre danger + « dépassé de 12 € »)
              sans budget : seulement le total, pas de barre
  jetons      piste cat-*-soft, remplissage cat-*, hauteur 10, rayon pill
  a11y        role progressbar, valeur « 120 sur 200 euros »
  écrans      S02, S11

PastilleCategorie (sélecteur à la saisie)
  variantes   grande (S04 : 4 boutons 2×2, 72px de haut), petite (S06 : filtre, puce)
  états       choisie (fond cat-*, texte on-accent), non choisie (fond cat-*-soft, texte cat-*)
  a11y        role radio, groupe radiogroup « Catégorie »
  écrans      S04, S06, S12

PaveMontant
  contenu     affichage du montant en display, touches 0-9, virgule, effacer
  états       vide (« 0 € » muted), saisi, invalide (plus de 2 décimales refusées à la frappe)
  a11y        chaque touche étiquetée ; sur le web, le clavier physique marche aussi
  écrans      S03, S04, S05

BoutonAjouter (+ flottant)
  taille      64px, rond, fond accent, ombre pop
  position    en bas au centre, au-dessus de la barre d'onglets
  a11y        « Ajouter une dépense »
  écrans      S02, S06, S10

BasculeType
  segments    Dépense / Revenu / Épargne
  états       segment actif fond surface + texte accent, inactif texte muted
  a11y        role tab, sélectionné annoncé
  écrans      S04, S05

LigneTransaction
  contenu     pastille de couleur + catégorie, note (sm muted), montant à droite
              dépense « −23,40 € » text, revenu « +1 850 € » success, épargne « → 100 € » accent
  états       normal, appuyé ; suppression depuis S07 (pas de glisser caché)
  a11y        role button, étiquette complète
  écrans      S02, S06

EnTeteJour (liste groupée)
  contenu     « Mardi 10 novembre », total du jour à droite
  écrans      S06

BarreObjectif
  contenu     nom, « 340 € sur 1 200 € », barre, date visée
  états       en cours (accent), atteint (success + « Atteint »)
  écrans      S10

SelecteurMois
  contenu     ‹  Novembre 2026  ›
  états       mois courant, passé, clos (badge « Clos »), futur refusé
  a11y        boutons « Mois précédent », « Mois suivant »
  écrans      S02, S06, S11

ZoneReflexion
  contenu     question en lg, champ multiligne, aide sm muted
  états       vide, rempli
  écrans      S08, S09

Champ / ChampMontant
  états       normal (bord border-input), focus (bord accent 2px), erreur (bord danger + message), désactivé
  a11y        libellé lié, message d'erreur lu
  écrans      S03, S07, S10, S12, S13

Toast (« Dépense ajoutée · Annuler »)
  durée       5 s ; un seul à la fois ; bouton Annuler 48px
  a11y        annoncé (liveRegion polite)
  écrans      S04 (retour sur S02)

EtatVide
  contenu     phrase courte + bouton d'action
  exemples    S02 « Le mois n'est pas encore préparé. » [Préparer le mois]
              S06 « Aucune dépense ce mois-ci. »
              S10 « Pas encore d'objectif. Vacances, voiture, coussin de sécurité ? » [Créer un objectif]
              S11 « L'historique apparaît après votre premier mois complet. »

Badge
  tons        neutre, ok, attention, danger
  écrans      S02 (Clos), S10 (Atteint), S13 (NAS connecté)

Graphique barres mensuelles (S11)
  barres      épargné réel vs visé par mois ; react-native-svg (déjà utilisé par le registre)
  état        < 2 mois : EtatVide
```

## Mise en page

- largeur de contenu max **560 px**, centrée (tablette, web) ;
- marges 16 ; espace entre cartes 12 ; cartes : surface, rayon lg, ombre card ;
- onglets : **Mois**, **Dépenses**, **Épargne**, **Historique** ; réglages par la roue en haut à droite ;
- clair uniquement pour l'instant (comme le registre) ; le mode sombre viendra avec la marque.
