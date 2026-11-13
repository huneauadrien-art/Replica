// Données de la cave. Tout est stocké sur le téléphone (voir src/data/store.tsx)
// et synchronisé avec le serveur du NAS quand il est configuré.

export type PieceJointe = { id: string; nom: string; type: string; taille: number };

export type CouleurVin = 'rouge' | 'blanc' | 'rose' | 'effervescent' | 'liquoreux' | 'fortifie';

/** Un casier, une étagère, une cave de service : une grille de rangées × colonnes. */
export type Meuble = {
  id: string;
  maj?: number;
  nom: string;
  rangees: number;
  colonnes: number;
  ordre?: number;
};

/** Années (pas des dates) qui bornent la vie du vin. */
export type FenetreGarde = { pret: number; apogeeDebut: number; apogeeFin: number; fin: number };

/** Un vin (domaine + cuvée + millésime). Ses bouteilles sont dans `bouteilles`. */
export type Vin = {
  id: string;
  maj?: number;
  domaine: string;
  cuvee?: string;
  appellation?: string;
  region?: string;
  couleur: CouleurVin;
  millesime?: number;
  cepages?: { nom: string; pct?: number }[];
  /** 0 (léger, souple, sec…) à 4 (puissant, tannique, moelleux…). */
  profil?: { corps?: number; tanins?: number; acidite?: number; sucre?: number };
  aromes?: string[];
  tempMin?: number;
  tempMax?: number;
  carafageH?: number;
  /** Saisie à la main ; sinon calculée d'après la couleur et la région. */
  garde?: FenetreGarde;
  accords?: string;
  notes?: string;
  photo?: PieceJointe;
  /** Code-barres (EAN-13, EAN-8 ou UPC-A), pour retrouver le vin au prochain scan. */
  ean?: string;
};

/** Une bouteille physique. Sans meuble : « à ranger ». */
export type Bouteille = {
  id: string;
  maj?: number;
  vinId: string;
  meubleId?: string;
  /** 1 = première rangée (R1). */
  rangee?: number;
  /** 1 = première colonne (C1). */
  colonne?: number;
  /** Prix payé, en euros TTC. */
  prix?: number;
  /** AAAA-MM-JJ */
  entree: string;
  sortie?: string;
  statut: 'cave' | 'bue' | 'offerte';
};

export type Degustation = {
  id: string;
  maj?: number;
  vinId: string;
  /** AAAA-MM-JJ */
  date: string;
  /** Sur 20. */
  note?: number;
  robe?: string;
  aromes?: string;
  commentaire?: string;
  avecQui?: string;
};

export type Donnees = {
  version: 1;
  meubles: Meuble[];
  vins: Vin[];
  bouteilles: Bouteille[];
  degustations: Degustation[];
};

export const DONNEES_VIDES: Donnees = {
  version: 1,
  meubles: [],
  vins: [],
  bouteilles: [],
  degustations: [],
};
