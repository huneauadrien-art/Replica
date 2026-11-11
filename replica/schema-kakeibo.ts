// Schéma des données du budget du foyer (clone Kakeibo).
// Pas de base SQL : comme Registre Vigne, chaque téléphone garde ses fiches
// (AsyncStorage / IndexedDB) et le NAS les synchronise (un fichier JSON).
// Ce fichier deviendra `budget/src/core/types.ts`.
//
// Règles communes à toutes les fiches :
//  - `id` : texte unique créé sur le téléphone (aléatoire), jamais réutilisé ;
//  - `maj` : heure de dernière modification (ms), posée par la synchronisation ;
//  - une suppression devient une pierre tombale { id, maj, supprime: true } ;
//  - l'argent en CENTIMES entiers (jamais de nombre à virgule) ;
//  - les dates en texte local du foyer : jour 'AAAA-MM-JJ', mois 'AAAA-MM'
//    (une dépense du 31 à 23 h reste dans son mois, pas de fuseau horaire).

export type Centimes = number;
/** 'AAAA-MM-JJ', heure locale du foyer. */
export type Jour = string;
/** 'AAAA-MM', mois de budget (voir `jourDebutMois` dans Reglages). */
export type CleMois = string;

/** Les 4 catégories de la méthode. Fixes : le reste de l'app compte dessus. */
export type Groupe = 'survie' | 'optionnel' | 'culture' | 'extra';
export const GROUPES: Groupe[] = ['survie', 'optionnel', 'culture', 'extra'];

type Base = { id: string; maj?: number };

/** Le budget d'un mois. id = la clé du mois ('2026-11') : un seul budget par mois. */
export type Mois = Base & {
  revenusPrevus: Centimes;
  chargesFixes: { libelle: string; montant: Centimes }[];
  epargneVisee: Centimes;
  /** Plafond par catégorie, facultatif. */
  budgets: Partial<Record<Groupe, Centimes>>;
  /** Mois clos après le bilan : on peut encore corriger, l'app le signale. */
  clos: boolean;
};

export type TypeTransaction = 'depense' | 'revenu' | 'epargne';

export type Transaction = Base & {
  jour: Jour;
  /** Toujours positif ; le sens vient du type. */
  montant: Centimes;
  type: TypeTransaction;
  /** Obligatoire pour une dépense : une sous-catégorie (Categorie.id). */
  categorieId?: string;
  /** Obligatoire pour un versement d'épargne vers un objectif précis. */
  objectifId?: string;
  note?: string;
  /** Créée par une ligne récurrente (pour ne pas la recréer deux fois). */
  recurrenteId?: string;
};

/** Sous-catégorie modifiable (« Courses », « Restaurant »…) rangée dans un des 4 groupes. */
export type Categorie = Base & {
  nom: string;
  groupe: Groupe;
  couleur?: string;
  ordre: number;
  archivee?: boolean;
};

export type ObjectifEpargne = Base & {
  nom: string;
  montantVise: Centimes;
  dateVisee?: Jour;
  atteint?: boolean;
  archive?: boolean;
};

/** Le bilan de fin de mois. id = la clé du mois. */
export type Bilan = Base & {
  ceQuiAMarche: string;
  tropDepense: string;
  aChanger: string;
};

/** Salaire, loyer, abonnements : recopiés dans chaque nouveau mois. */
export type LigneRecurrente = Base & {
  libelle: string;
  montant: Centimes;
  type: 'revenu' | 'chargeFixe';
  /** Jour du mois (1 à 28), facultatif. */
  jour?: number;
  active: boolean;
};

/** Réglages partagés par le foyer. Une seule fiche, id = 'foyer'. */
export type Reglages = Base & {
  devise: 'EUR';
  /** 1 par défaut ; 25 si le mois commence au salaire. */
  jourDebutMois: number;
};

// Réglages propres à chaque téléphone (rappels, verrou, adresse du NAS) :
// gardés en local, jamais synchronisés.

export type Donnees = {
  mois: Mois[];
  transactions: Transaction[];
  categories: Categorie[];
  objectifs: ObjectifEpargne[];
  bilans: Bilan[];
  recurrentes: LigneRecurrente[];
  reglages: Reglages[];
};

export const COLLECTIONS = ['mois', 'transactions', 'categories', 'objectifs', 'bilans', 'recurrentes', 'reglages'] as const;
