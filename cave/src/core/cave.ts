// Cave à vin personnelle : fenêtre de garde, état du jour, plan des casiers.
// Sans dépendance au téléphone : testé avec vitest (__tests__/cave.test.ts).

import type { Bouteille, CouleurVin, Donnees, FenetreGarde, Meuble, Vin } from './types';

export const COULEURS: { id: CouleurVin; nom: string }[] = [
  { id: 'rouge', nom: 'Rouge' },
  { id: 'blanc', nom: 'Blanc' },
  { id: 'rose', nom: 'Rosé' },
  { id: 'effervescent', nom: 'Effervescent' },
  { id: 'liquoreux', nom: 'Liquoreux' },
  { id: 'fortifie', nom: 'Muté / fortifié' },
];

export const nomCouleur = (c: CouleurVin) => COULEURS.find((x) => x.id === c)?.nom ?? c;

/** Années après le millésime : [prêt, début d'apogée, fin d'apogée, fin]. */
type Regle = [number, number, number, number];

const PAR_COULEUR: Record<CouleurVin, Regle> = {
  rouge: [3, 5, 10, 14],
  blanc: [1, 2, 5, 7],
  rose: [0, 0, 2, 3],
  effervescent: [1, 2, 6, 9],
  liquoreux: [5, 10, 25, 40],
  fortifie: [5, 10, 30, 50],
};

/** Ajustements par région (mot cherché dans la région ou l'appellation). */
const PAR_REGION: { mots: string[]; couleur: CouleurVin; regle: Regle }[] = [
  { mots: ['bordeaux', 'medoc', 'pauillac', 'margaux', 'saint-julien', 'saint-estephe', 'pessac', 'graves', 'saint-emilion', 'pomerol'], couleur: 'rouge', regle: [5, 8, 15, 22] },
  { mots: ['bourgogne', 'cote de nuits', 'cote de beaune', 'gevrey', 'nuits', 'pommard', 'volnay', 'vosne', 'chambolle'], couleur: 'rouge', regle: [4, 6, 12, 16] },
  { mots: ['rhone', 'chateauneuf', 'hermitage', 'cote-rotie', 'gigondas', 'cornas', 'vacqueyras'], couleur: 'rouge', regle: [3, 5, 12, 16] },
  { mots: ['loire', 'saumur', 'chinon', 'bourgueil', 'beaujolais', 'morgon', 'fleurie', 'brouilly'], couleur: 'rouge', regle: [1, 2, 5, 8] },
  { mots: ['bourgogne', 'chablis', 'meursault', 'puligny', 'chassagne', 'alsace'], couleur: 'blanc', regle: [2, 4, 8, 12] },
];

/** « Côte-Rôtie » → « cote-rotie » : comparaison sans accents ni majuscules. */
export const simplifier = (t: string) =>
  t
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

/** Fenêtre de garde du vin : celle saisie, sinon celle de la table. Sans millésime : rien. */
export function fenetreGarde(v: Vin): FenetreGarde | undefined {
  if (v.garde) return v.garde;
  if (!v.millesime) return undefined;
  const lieu = simplifier(`${v.region ?? ''} ${v.appellation ?? ''}`);
  const r = PAR_REGION.find((x) => x.couleur === v.couleur && x.mots.some((m) => lieu.includes(m)))?.regle ?? PAR_COULEUR[v.couleur];
  const m = v.millesime;
  return { pret: m + r[0], apogeeDebut: m + r[1], apogeeFin: m + r[2], fin: m + r[3] };
}

/** jeune : à garder ; pret : buvable ; apogee : au sommet ; vite : dernière année d'apogée et après ; passe : après la fin. */
export type EtatGarde = 'jeune' | 'pret' | 'apogee' | 'vite' | 'passe';

export function etatGarde(v: Vin, annee: number): EtatGarde {
  const f = fenetreGarde(v);
  if (!f) return 'pret';
  if (annee > f.fin) return 'passe';
  if (annee >= f.apogeeFin) return 'vite';
  if (annee >= f.apogeeDebut) return 'apogee';
  if (annee >= f.pret) return 'pret';
  return 'jeune';
}

export const LIBELLE_ETAT: Record<EtatGarde, string> = {
  jeune: 'À garder',
  pret: 'Prêt à boire',
  apogee: 'À son apogée',
  vite: 'À boire vite',
  passe: 'Passé, à boire sans tarder',
};

export const PHRASE_ETAT: Record<EtatGarde, string> = {
  jeune: 'Encore jeune, patience.',
  pret: 'Bon à boire, il peut encore gagner.',
  apogee: 'À son apogée, parfait maintenant.',
  vite: 'En fin d’apogée, à ouvrir bientôt.',
  passe: 'Au-delà de sa garde : ouvrez-le vite.',
};

export const enCave = (d: Donnees) => d.bouteilles.filter((b) => b.statut === 'cave');
export const bouteillesDuVin = (d: Donnees, vinId: string) => enCave(d).filter((b) => b.vinId === vinId);

export type Resume = {
  bouteilles: number;
  /** Bouteilles bonnes à boire (pret, apogée, vite, passé). */
  pretes: number;
  valeur: number;
  sansPrix: number;
  aRanger: number;
  parEtat: Record<EtatGarde, number>;
};

export function resumeCave(d: Donnees, annee: number): Resume {
  const vins = new Map(d.vins.map((v) => [v.id, v]));
  const parEtat: Record<EtatGarde, number> = { jeune: 0, pret: 0, apogee: 0, vite: 0, passe: 0 };
  let valeur = 0;
  let sansPrix = 0;
  let aRanger = 0;
  const bs = enCave(d).filter((b) => vins.has(b.vinId));
  for (const b of bs) {
    parEtat[etatGarde(vins.get(b.vinId)!, annee)] += 1;
    if (b.prix != null) valeur += b.prix;
    else sansPrix += 1;
    if (!b.meubleId) aRanger += 1;
  }
  return { bouteilles: bs.length, pretes: bs.length - parEtat.jeune, valeur, sansPrix, aRanger, parEtat };
}

/** Priorité d'ouverture : ce qui part en premier passe devant. */
const PRIORITE: Record<EtatGarde, number> = { passe: 0, vite: 1, apogee: 2, pret: 3, jeune: 4 };

/** Les vins en cave, triés : à boire d'abord, puis par fin de garde. */
export function vinsEnCave(d: Donnees, annee: number): { vin: Vin; nombre: number; etat: EtatGarde }[] {
  const compte = new Map<string, number>();
  for (const b of enCave(d)) compte.set(b.vinId, (compte.get(b.vinId) ?? 0) + 1);
  return d.vins
    .filter((v) => compte.has(v.id))
    .map((vin) => ({ vin, nombre: compte.get(vin.id)!, etat: etatGarde(vin, annee) }))
    .sort(
      (a, b) =>
        PRIORITE[a.etat] - PRIORITE[b.etat] ||
        (fenetreGarde(a.vin)?.apogeeFin ?? 9999) - (fenetreGarde(b.vin)?.apogeeFin ?? 9999) ||
        nomVin(a.vin).localeCompare(nomVin(b.vin), 'fr'),
    );
}

/** La bouteille à ouvrir ce soir : la plus pressée parmi celles à leur apogée ou après. */
export function vinDuSoir(d: Donnees, annee: number) {
  return vinsEnCave(d, annee).find((x) => x.etat !== 'jeune' && x.etat !== 'pret') ?? vinsEnCave(d, annee).find((x) => x.etat === 'pret');
}

/** Vins à boire avant la fin de l'année donnée (fin d'apogée atteinte d'ici là). */
export function aBoireAvant(d: Donnees, annee: number, horizon: number) {
  return vinsEnCave(d, annee).filter((x) => {
    const f = fenetreGarde(x.vin);
    return f != null && f.apogeeFin <= horizon;
  });
}

export const nomVin = (v: Vin) => [v.domaine, v.cuvee].filter(Boolean).join(' · ');
export const lieuVin = (v: Vin) => [v.appellation, v.region].filter(Boolean).join(' · ');

export type Filtre = 'tout' | 'pretes' | CouleurVin;

export function filtrer<T extends { vin: Vin; etat: EtatGarde }>(liste: T[], f: Filtre, recherche = ''): T[] {
  const q = simplifier(recherche.trim());
  return liste.filter(
    (x) =>
      (f === 'tout' || (f === 'pretes' ? x.etat !== 'jeune' : x.vin.couleur === f)) &&
      (!q || simplifier(`${nomVin(x.vin)} ${lieuVin(x.vin)} ${x.vin.millesime ?? ''}`).includes(q)),
  );
}

// --- plan des casiers -------------------------------------------------------

/** « R2 · C5 » */
export const nomCase = (rangee: number, colonne: number) => `R${rangee} · C${colonne}`;

export function emplacement(d: Donnees, b: Bouteille): string {
  if (!b.meubleId || !b.rangee || !b.colonne) return 'À ranger';
  const m = d.meubles.find((x) => x.id === b.meubleId);
  return m ? `${m.nom} · ${nomCase(b.rangee, b.colonne)}` : 'À ranger';
}

/** Grille[rangée-1][colonne-1] = bouteille en cave dans cette case, ou null. */
export function grilleMeuble(d: Donnees, m: Meuble): (Bouteille | null)[][] {
  const g: (Bouteille | null)[][] = Array.from({ length: m.rangees }, () => Array<Bouteille | null>(m.colonnes).fill(null));
  for (const b of enCave(d))
    if (b.meubleId === m.id && b.rangee && b.colonne && b.rangee <= m.rangees && b.colonne <= m.colonnes) g[b.rangee - 1][b.colonne - 1] ??= b;
  return g;
}

export function caseLibre(d: Donnees, meubleId: string, rangee: number, colonne: number): boolean {
  return !enCave(d).some((b) => b.meubleId === meubleId && b.rangee === rangee && b.colonne === colonne);
}

export const sansCase = (b: Bouteille): Bouteille => {
  const { meubleId: _m, rangee: _r, colonne: _c, ...reste } = b;
  return reste;
};

/** Range une bouteille dans une case libre. Refuse une case prise. */
export function ranger(d: Donnees, bouteilleId: string, meubleId: string, rangee: number, colonne: number): Donnees {
  if (!caseLibre(d, meubleId, rangee, colonne)) throw new Error(`La case ${nomCase(rangee, colonne)} est déjà prise.`);
  return { ...d, bouteilles: d.bouteilles.map((b) => (b.id === bouteilleId ? { ...b, meubleId, rangee, colonne } : b)) };
}

/** Sort une bouteille de la cave (bue ou offerte) : sa case se libère. */
export function sortir(d: Donnees, bouteilleId: string, date: string, statut: 'bue' | 'offerte' = 'bue'): Donnees {
  return { ...d, bouteilles: d.bouteilles.map((b) => (b.id === bouteilleId ? { ...sansCase(b), statut, sortie: date } : b)) };
}

/** La bouteille d'un vin à sortir en premier : une rangée, sinon la première venue. */
export function bouteilleASortir(d: Donnees, vinId: string): Bouteille | undefined {
  const bs = bouteillesDuVin(d, vinId);
  return bs.find((b) => b.meubleId) ?? bs[0];
}

/** Supprime un meuble : ses bouteilles repassent « à ranger ». */
export function supprimerMeuble(d: Donnees, meubleId: string): Donnees {
  return {
    ...d,
    meubles: d.meubles.filter((m) => m.id !== meubleId),
    bouteilles: d.bouteilles.map((b) => (b.meubleId === meubleId ? sansCase(b) : b)),
  };
}

/** Change la taille d'un meuble : les bouteilles hors de la nouvelle grille repassent « à ranger ». */
export function redimensionnerMeuble(d: Donnees, m: Meuble): Donnees {
  return {
    ...d,
    meubles: d.meubles.some((x) => x.id === m.id) ? d.meubles.map((x) => (x.id === m.id ? m : x)) : [...d.meubles, m],
    bouteilles: d.bouteilles.map((b) =>
      b.meubleId === m.id && ((b.rangee ?? 0) > m.rangees || (b.colonne ?? 0) > m.colonnes) ? sansCase(b) : b,
    ),
  };
}

/**
 * Deux téléphones hors ligne ont pu ranger deux bouteilles dans la même case.
 * Garde la plus récente ; l'autre repasse « à ranger ». Renvoie `d` tel quel si rien à réparer.
 */
export function reparerCases(d: Donnees): Donnees {
  const vues = new Map<string, Bouteille>();
  const aDeplacer = new Set<string>();
  const meubles = new Set(d.meubles.map((m) => m.id));
  for (const b of enCave(d)) {
    if (!b.meubleId) continue;
    if (!meubles.has(b.meubleId)) {
      aDeplacer.add(b.id);
      continue;
    }
    const k = `${b.meubleId}/${b.rangee}/${b.colonne}`;
    const autre = vues.get(k);
    if (!autre) vues.set(k, b);
    else if ((b.maj ?? 0) > (autre.maj ?? 0)) {
      aDeplacer.add(autre.id);
      vues.set(k, b);
    } else aDeplacer.add(b.id);
  }
  if (aDeplacer.size === 0) return d;
  return { ...d, bouteilles: d.bouteilles.map((b) => (aDeplacer.has(b.id) ? sansCase(b) : b)) };
}

/** Supprime un vin, ses bouteilles et ses dégustations. */
export function supprimerVin(d: Donnees, vinId: string): Donnees {
  return {
    ...d,
    vins: d.vins.filter((v) => v.id !== vinId),
    bouteilles: d.bouteilles.filter((b) => b.vinId !== vinId),
    degustations: d.degustations.filter((x) => x.vinId !== vinId),
  };
}

/** Export CSV de la cave (une ligne par bouteille en cave), séparateur « ; » pour Excel. */
export function exporterCave(d: Donnees, annee: number): string {
  const vins = new Map(d.vins.map((v) => [v.id, v]));
  const champ = (x: unknown) => {
    const t = x == null ? '' : String(x);
    return /[;"\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
  };
  const lignes = [['Domaine', 'Cuvée', 'Millésime', 'Couleur', 'Appellation', 'Région', 'Emplacement', 'Prix payé', 'Entrée', 'État']];
  for (const b of enCave(d)) {
    const v = vins.get(b.vinId);
    if (!v) continue;
    lignes.push([
      v.domaine,
      v.cuvee ?? '',
      v.millesime ? String(v.millesime) : '',
      nomCouleur(v.couleur),
      v.appellation ?? '',
      v.region ?? '',
      emplacement(d, b),
      b.prix != null ? String(b.prix).replace('.', ',') : '',
      b.entree,
      LIBELLE_ETAT[etatGarde(v, annee)],
    ]);
  }
  return lignes.map((l) => l.map(champ).join(';')).join('\n');
}
