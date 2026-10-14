// Données du registre. Tout est stocké sur le téléphone (voir src/data/store.tsx).

/** Un anneau de polygone : liste de [longitude, latitude] en WGS84. */
export type Anneau = [number, number][];

export type Parcelle = {
  id: string;
  nom: string;
  /** Surface en hectares (surface PAC si elle existe, sinon calculée). */
  surfaceHa: number;
  cepage?: string;
  /** Distance entre deux rangs, en mètres. */
  ecartementM?: number;
  /** Nombre de rangs traités à chaque passage du pulvérisateur. */
  rangsParPassage?: number;
  /** Code culture PAC (VRC, VRT…). */
  codeCulture?: string;
  /** Anneaux du contour (extérieurs et trous), vide si la parcelle est saisie à la main. */
  contour: Anneau[];
  /** Attributs bruts du fichier importé, gardés pour référence. */
  attributs?: Record<string, string | number | null>;
  archivee?: boolean;
};

export type Unite = 'L' | 'kg';

export type Produit = {
  id: string;
  nom: string;
  /** Numéro d'autorisation de mise sur le marché. */
  amm?: string;
  unite: Unite;
  /** Dose maximale homologuée sur vigne, par hectare (dans l'unité du produit). */
  doseMaxHa?: number;
  /** Délai avant récolte, en jours. */
  darJours?: number;
  /** Zone non traitée, en mètres. */
  zntM?: number;
  /** Délai de rentrée dans la parcelle, en heures. */
  dreHeures?: number;
  /** En dessous de cette quantité en stock, l'app affiche une alerte. */
  seuilAlerte?: number;
  archive?: boolean;
};

/** Entrée ou correction de stock. Les sorties dues aux traitements sont calculées. */
export type MouvementStock = {
  id: string;
  produitId: string;
  /** AAAA-MM-JJ */
  date: string;
  type: 'achat' | 'ajustement';
  /** Positive pour une entrée, négative pour une sortie (ajustement). */
  quantite: number;
  fournisseur?: string;
  lot?: string;
  note?: string;
};

export type TraitementParcelle = { parcelleId: string; surfaceHa: number };
export type TraitementProduit = { produitId: string; doseHa: number };

export type Traitement = {
  id: string;
  /** AAAA-MM-JJ */
  date: string;
  /** HH:MM */
  heureDebut?: string;
  heureFin?: string;
  parcelles: TraitementParcelle[];
  produits: TraitementProduit[];
  operateur: string;
  materiel?: string;
  /** Cible visée (mildiou, oïdium…). */
  cible?: string;
  /** Stade phénologique BBCH. */
  stadeBBCH?: string;
  volumeBouillieHa?: number;
  ventKmh?: number;
  temperatureC?: number;
  notes?: string;
};

export type Donnees = {
  version: 1;
  parcelles: Parcelle[];
  produits: Produit[];
  mouvements: MouvementStock[];
  traitements: Traitement[];
};

export const DONNEES_VIDES: Donnees = {
  version: 1,
  parcelles: [],
  produits: [],
  mouvements: [],
  traitements: [],
};
