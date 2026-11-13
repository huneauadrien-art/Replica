# Composants de la cave

Jetons : `replica/design/tokens-cave.json` (contrastes AA vérifiés : 22 paires, 0 échec).
Code : `cave/src/ui/cave/theme.ts`, `kit.tsx`, `Grille.tsx`, `FormVin.tsx`.

Écart volontaire avec l'original : le texte blanc des **boutons** rouges est posé sur
`#d13b41` (au lieu de `#e5484d`) pour être lisible (4,8:1). Le rond « + » garde `#e5484d`.
Les cases de vin blanc, rosé, effervescent et liquoreux sont un peu plus sombres que
l'original pour que leur texte soit lisible (≥ 4,9:1).

```
BoutonCave
  variantes  rouge (action principale), creme (secondaire plein), fantome (bordure), lien
  taille     52 px de haut, rayon 16, Hanken Grotesk 600 17 px
  états      normal, appuyé (opacité .8), désactivé (.4)
  a11y       role button, état disabled annoncé
  écrans     S40, S45, S46, S47, S48, S43

BoutonRond
  rond rouge 64 px, « + », halo rouge ; en bas à droite de Ma cave
  a11y       label « Ajouter une bouteille »

Bascule (Liste / Plan)
  fond profond, bordure fine, segment actif crème plein, texte sombre 600
  a11y       tablist / tab, sélection annoncée
  écrans     S40, S42

Surtitre
  capitales, interlettrage 3, or, 12 px 600 ; variante mono (« À BOIRE CE SOIR ») ; élément à droite
  a11y       header

GrandChiffre    52 px 700 + ligne de détails en texte discret

PuceCave
  filtre (active : fond or, texte sombre), arôme (pastille de couleur), info (sans action)
  40 px de haut, pilule

PuceEmplacement
  « ◎ Cave du bas · R1 · C3 › » en mono, bordure or ; pointillés et texte discret si « À ranger »
  a11y       label « Emplacement : … »

Jauge           barre segmentée 9 px + légende à pastilles (Prêt, Apogée, À boire vite, À garder)

Vignette        silhouette de bouteille à la couleur du vin, ou photo de l'étiquette ;
                point d'état en haut à droite

LigneVin
  normale ; urgente = liseré rouge à gauche + « ≤ 2027 » en mono rouge ; quantité « ×3 » en mono
  a11y       label complet (nom, lieu, nombre)

Grille (plan)
  repères C1… / R1… en mono, case carrée rayon 10, fond = couleur du vin, nom 10 px + millésime mono,
  case vide en pointillés, case mise en avant bordure or 2 px ; défile de côté au-delà de 6 colonnes
  a11y       chaque case : « R2 C5 : Domaine… 2019 » ou « case libre »

Frise           piste 4 px, fenêtre d'apogée or, trait rouge « aujourd'hui », bornes en mono
Curseur         profil gustatif en lecture seule (4 axes), mot du côté atteint en gras
Crans           le même en saisie : 5 crans à toucher
BarreCepage     nom, barre rouge, % en mono rouge
Service         3 colonnes : température, carafage, garde
CarteCave       fond carte, bordure fine, rayon 20 ; variante haute (carte « ce soir »)
ChampCave       libellé en capitales or, champ sombre bordure #8a767a (4,2:1), 50 px
BarreBas        barre fixe en bas (Actions / Déguster)
```
