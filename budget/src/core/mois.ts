// Calculs du budget : mois, montants, catégories. Fonctions pures, testées avec vitest.
//
// Règles de la méthode, telles que l'appli les compte :
//  - disponible     = revenus prévus + revenus en plus − charges fixes − épargne visée
//  - reste          = disponible − dépenses du mois
//  - épargné réel   = revenus − charges fixes − dépenses (ce qui reste à la fin du mois)
// Les versements vers un objectif (type « epargne ») ne baissent pas le reste : ils
// rangent l'épargne déjà prévue dans un objectif.

import { GROUPES, type Bilan, type Categorie, type Centimes, type CleMois, type Donnees, type Groupe, type Jour, type Mois, type Reglages, type Transaction } from './types';

// --- argent -----------------------------------------------------------------

/** « 12,5 » ou « 12.50 » ou « 1 234,56 » → centimes ; vide, négatif ou plus de 2 décimales → undefined. */
export function lireMontant(texte: string): Centimes | undefined {
  const t = texte.replace(/[\s  €]/g, '').replace(',', '.');
  if (!/^\d+(\.\d{0,2})?$/.test(t)) return undefined;
  const [ent, dec = ''] = t.split('.');
  return Number(ent) * 100 + Number((dec + '00').slice(0, 2));
}

/** 123456 → « 1 234,56 € » ; entier sans décimales : « 1 234 € ». */
export function euros(c: Centimes, options: { signe?: boolean; decimales?: boolean } = {}): string {
  const negatif = c < 0;
  const abs = Math.abs(Math.round(c));
  const ent = Math.floor(abs / 100)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  const cents = abs % 100;
  const avecDec = options.decimales ?? cents !== 0;
  const corps = avecDec ? `${ent},${String(cents).padStart(2, '0')}` : ent;
  const signe = negatif ? '−' : options.signe ? '+' : '';
  return `${signe}${corps} €`;
}

/** Centimes → texte modifiable dans un champ (« 12,50 »). */
export const versChamp = (c?: Centimes) => (c == null ? '' : c % 100 === 0 ? String(c / 100) : (c / 100).toFixed(2).replace('.', ','));

// --- jours et mois ----------------------------------------------------------

const p2 = (n: number) => String(n).padStart(2, '0');

/** Jour local du téléphone, jamais en UTC. */
export const jourLocal = (d: Date = new Date()): Jour => `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;

const decouper = (j: string) => j.split('-').map(Number);
const joursDansMois = (an: number, mois: number) => new Date(an, mois, 0).getDate();

export function decalerMois(cle: CleMois, n: number): CleMois {
  const [an, m] = decouper(cle);
  const total = an * 12 + (m - 1) + n;
  return `${Math.floor(total / 12)}-${p2((total % 12) + 1)}`;
}

/**
 * Le mois de budget d'un jour. Avec un début au 25, le mois de novembre va du
 * 25 octobre au 24 novembre (le salaire du 25 sert au mois qui suit).
 */
export function moisDe(jour: Jour, jourDebut = 1): CleMois {
  const [an, m, j] = decouper(jour);
  const cle = `${an}-${p2(m)}`;
  return jourDebut > 1 && j >= jourDebut ? decalerMois(cle, 1) : cle;
}

/** Premier et dernier jour (inclus) d'un mois de budget. */
export function bornesMois(cle: CleMois, jourDebut = 1): { du: Jour; au: Jour } {
  const [an, m] = decouper(cle);
  if (jourDebut <= 1) return { du: `${cle}-01`, au: `${cle}-${p2(joursDansMois(an, m))}` };
  const [pa, pm] = decouper(decalerMois(cle, -1));
  return { du: `${pa}-${p2(pm)}-${p2(jourDebut)}`, au: `${cle}-${p2(jourDebut - 1)}` };
}

/** Nombre de jours entre deux jours (b − a). */
export function ecartJours(a: Jour, b: Jour): number {
  const [aa, am, aj] = decouper(a);
  const [ba, bm, bj] = decouper(b);
  return Math.round((Date.UTC(ba, bm - 1, bj) - Date.UTC(aa, am - 1, aj)) / 86_400_000);
}

const MOIS_FR = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const JOURS_FR = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];

export function libelleMois(cle: CleMois): string {
  const [an, m] = decouper(cle);
  const nom = MOIS_FR[m - 1];
  return `${nom[0].toUpperCase()}${nom.slice(1)} ${an}`;
}

export function libelleJour(jour: Jour): string {
  const [an, m, j] = decouper(jour);
  const sem = JOURS_FR[new Date(an, m - 1, j).getDay()];
  return `${sem[0].toUpperCase()}${sem.slice(1)} ${j} ${MOIS_FR[m - 1]}`;
}

// --- catégories -------------------------------------------------------------

export const NOMS_GROUPES: Record<Groupe, string> = {
  survie: 'Survie',
  optionnel: 'Optionnel',
  culture: 'Culture',
  extra: 'Extra',
};

export const AIDE_GROUPES: Record<Groupe, string> = {
  survie: 'Courses, logement, santé, transport',
  optionnel: 'Restaurant, achats plaisir',
  culture: 'Livres, sorties, abonnements',
  extra: 'Imprévus, cadeaux, réparations',
};

/** Identifiants fixes : deux téléphones qui créent les catégories par défaut créent les mêmes fiches. */
export const CATEGORIES_DEFAUT: Categorie[] = (
  [
    ['courses', 'Courses', 'survie'],
    ['logement', 'Logement', 'survie'],
    ['energie', 'Énergie', 'survie'],
    ['sante', 'Santé', 'survie'],
    ['transport', 'Transport', 'survie'],
    ['restaurant', 'Restaurant', 'optionnel'],
    ['achats', 'Achats plaisir', 'optionnel'],
    ['loisirs', 'Loisirs', 'optionnel'],
    ['livres', 'Livres', 'culture'],
    ['sorties', 'Sorties', 'culture'],
    ['abonnements', 'Abonnements', 'culture'],
    ['imprevus', 'Imprévus', 'extra'],
    ['cadeaux', 'Cadeaux', 'extra'],
    ['reparations', 'Réparations', 'extra'],
    ['autre', 'Autre', 'extra'],
  ] as const
).map(([id, nom, groupe], ordre) => ({ id: `cat-${id}`, nom, groupe, ordre }));

export const ID_AUTRE = 'cat-autre';

/** Les catégories du foyer ; les catégories par défaut tant qu'il n'en a aucune. */
export function categories(d: Donnees, avecArchivees = false): Categorie[] {
  const liste = d.categories.length ? d.categories : CATEGORIES_DEFAUT;
  return liste.filter((c) => avecArchivees || !c.archivee).sort((a, b) => GROUPES.indexOf(a.groupe) - GROUPES.indexOf(b.groupe) || a.ordre - b.ordre);
}

/** La catégorie d'une dépense ; inconnue (supprimée ailleurs) → « Extra › Autre ». */
export function categorieDe(d: Donnees, id?: string): Categorie {
  const toutes = categories(d, true);
  return toutes.find((c) => c.id === id) ?? toutes.find((c) => c.id === ID_AUTRE) ?? CATEGORIES_DEFAUT[CATEGORIES_DEFAUT.length - 1];
}

// --- réglages ---------------------------------------------------------------

export const REGLAGES_DEFAUT: Reglages = { id: 'foyer', devise: 'EUR', jourDebutMois: 1 };
export const reglages = (d: Donnees): Reglages => ({ ...REGLAGES_DEFAUT, ...d.reglages.find((r) => r.id === 'foyer') });

// --- le mois ----------------------------------------------------------------

export const somme = (l: { montant: Centimes }[]) => l.reduce((s, x) => s + x.montant, 0);

export function transactionsDuMois(d: Donnees, cle: CleMois): Transaction[] {
  const { du, au } = bornesMois(cle, reglages(d).jourDebutMois);
  return d.transactions.filter((t) => t.jour >= du && t.jour <= au).sort((a, b) => (a.jour === b.jour ? (b.maj ?? 0) - (a.maj ?? 0) : a.jour < b.jour ? 1 : -1));
}

export type Resume = {
  cle: CleMois;
  mois?: Mois;
  revenusPrevus: Centimes;
  revenusEnPlus: Centimes;
  chargesFixes: Centimes;
  epargneVisee: Centimes;
  /** Ce qu'on peut dépenser dans le mois. */
  disponible: Centimes;
  depense: Centimes;
  parGroupe: Record<Groupe, Centimes>;
  reste: Centimes;
  /** Versements rangés dans des objectifs ce mois-ci. */
  verse: Centimes;
  /** Ce qui reste vraiment : revenus − charges − dépenses. */
  epargneReelle: Centimes;
  ton: 'normal' | 'attention' | 'depasse';
};

export function resume(d: Donnees, cle: CleMois): Resume {
  const mois = d.mois.find((m) => m.id === cle);
  const tx = transactionsDuMois(d, cle);
  const depenses = tx.filter((t) => t.type === 'depense');
  const parGroupe = Object.fromEntries(GROUPES.map((g) => [g, 0])) as Record<Groupe, Centimes>;
  for (const t of depenses) parGroupe[categorieDe(d, t.categorieId).groupe] += t.montant;
  const revenusPrevus = mois?.revenusPrevus ?? 0;
  const revenusEnPlus = somme(tx.filter((t) => t.type === 'revenu'));
  const chargesFixes = somme(mois?.chargesFixes ?? []);
  const epargneVisee = mois?.epargneVisee ?? 0;
  const depense = somme(depenses);
  const disponible = revenusPrevus + revenusEnPlus - chargesFixes - epargneVisee;
  const reste = disponible - depense;
  return {
    cle,
    mois,
    revenusPrevus,
    revenusEnPlus,
    chargesFixes,
    epargneVisee,
    disponible,
    depense,
    parGroupe,
    reste,
    verse: somme(tx.filter((t) => t.type === 'epargne')),
    epargneReelle: revenusPrevus + revenusEnPlus - chargesFixes - depense,
    ton: reste < 0 ? 'depasse' : disponible > 0 && reste < disponible * 0.1 ? 'attention' : 'normal',
  };
}

/** Reste à dépenser par semaine, jusqu'à la fin du mois de budget (aujourd'hui compris). */
export function resteParSemaine(d: Donnees, cle: CleMois, aujourdhui: Jour): { semaines: number; parSemaine: Centimes } {
  const { du, au } = bornesMois(cle, reglages(d).jourDebutMois);
  const depart = aujourdhui < du ? du : aujourdhui;
  const jours = Math.max(1, ecartJours(depart, au) + 1);
  const semaines = Math.max(1, Math.ceil(jours / 7));
  return { semaines, parSemaine: Math.floor(Math.max(0, resume(d, cle).reste) / semaines) };
}

/**
 * Proposition pour un mois pas encore préparé : la reprise du mois précédent s'il existe,
 * sinon les lignes récurrentes actives. Ne crée rien : l'écran S03 la montre, puis l'enregistre.
 */
export function propositionMois(d: Donnees, cle: CleMois): Mois {
  const existant = d.mois.find((m) => m.id === cle);
  if (existant) return existant;
  const precedent = d.mois.find((m) => m.id === decalerMois(cle, -1));
  if (precedent)
    return { id: cle, revenusPrevus: precedent.revenusPrevus, chargesFixes: precedent.chargesFixes, epargneVisee: precedent.epargneVisee, budgets: precedent.budgets, clos: false };
  const actives = d.recurrentes.filter((r) => r.active);
  return {
    id: cle,
    revenusPrevus: somme(actives.filter((r) => r.type === 'revenu')),
    chargesFixes: actives.filter((r) => r.type === 'chargeFixe').map((r) => ({ libelle: r.libelle, montant: r.montant })),
    epargneVisee: 0,
    budgets: {},
    clos: false,
  };
}

// --- bilan ------------------------------------------------------------------

export type ChiffresBilan = {
  /** 1. Combien j'avais ? (revenus − charges fixes) */
  avais: Centimes;
  /** 2. Combien je voulais épargner ? */
  voulaisEpargner: Centimes;
  /** 3. Combien j'ai dépensé ? */
  depense: Centimes;
  parGroupe: Record<Groupe, Centimes>;
  /** Ce qui est réellement resté. */
  epargne: Centimes;
  objectifAtteint: boolean;
  /** Écart de dépense par groupe avec le mois précédent (positif = plus dépensé). */
  ecartMoisPrecedent?: Record<Groupe, Centimes>;
};

export function chiffresBilan(d: Donnees, cle: CleMois): ChiffresBilan {
  const r = resume(d, cle);
  const avant = d.mois.some((m) => m.id === decalerMois(cle, -1)) ? resume(d, decalerMois(cle, -1)) : undefined;
  return {
    avais: r.revenusPrevus + r.revenusEnPlus - r.chargesFixes,
    voulaisEpargner: r.epargneVisee,
    depense: r.depense,
    parGroupe: r.parGroupe,
    epargne: r.epargneReelle,
    objectifAtteint: r.epargneReelle >= r.epargneVisee,
    ecartMoisPrecedent: avant ? (Object.fromEntries(GROUPES.map((g) => [g, r.parGroupe[g] - avant.parGroupe[g]])) as Record<Groupe, Centimes>) : undefined,
  };
}

export const bilanDe = (d: Donnees, cle: CleMois): Bilan | undefined => d.bilans.find((b) => b.id === cle);

/** Mois passés non clos et préparés, pour proposer le bilan oublié. */
export function bilansEnRetard(d: Donnees, cleCourante: CleMois): CleMois[] {
  return d.mois.filter((m) => m.id < cleCourante && !m.clos).map((m) => m.id).sort();
}

// --- objectifs --------------------------------------------------------------

export function avancement(d: Donnees, objectifId: string): Centimes {
  return somme(d.transactions.filter((t) => t.type === 'epargne' && t.objectifId === objectifId));
}

// --- historique -------------------------------------------------------------

export type LigneHistorique = { cle: CleMois; epargneVisee: Centimes; epargne: Centimes; depense: Centimes; parGroupe: Record<Groupe, Centimes>; clos: boolean };

export function historique(d: Donnees): LigneHistorique[] {
  return [...d.mois]
    .sort((a, b) => (a.id < b.id ? 1 : -1))
    .map((m) => {
      const r = resume(d, m.id);
      return { cle: m.id, epargneVisee: r.epargneVisee, epargne: r.epargneReelle, depense: r.depense, parGroupe: r.parGroupe, clos: m.clos };
    });
}

// --- recherche --------------------------------------------------------------

const sansAccents = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export function filtrer(d: Donnees, liste: Transaction[], filtre: { groupe?: Groupe; texte?: string }): Transaction[] {
  const q = filtre.texte ? sansAccents(filtre.texte.trim()) : '';
  return liste.filter((t) => {
    const cat = t.type === 'depense' ? categorieDe(d, t.categorieId) : undefined;
    if (filtre.groupe && cat?.groupe !== filtre.groupe) return false;
    if (!q) return true;
    return sansAccents(`${t.note ?? ''} ${cat?.nom ?? ''} ${euros(t.montant)}`).includes(q);
  });
}
