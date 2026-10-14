// Transforme les entités d'un shapefile en parcelles proposées à l'import.
// Les noms de champs varient selon les exports (Telepac, SIG du domaine…),
// donc on les reconnaît par motif plutôt que par nom exact.

import { arrondiHa, surfaceHa } from './geo';
import type { Couche, Entite } from './shapefile';
import type { Parcelle } from './types';

export type ParcelleProposee = Omit<Parcelle, 'id'> & {
  estVigne: boolean;
  /** D'où vient la surface affichée. */
  origineSurface: 'fichier' | 'calculée';
};

type Attributs = Entite['attributs'];

const champ = (a: Attributs, motif: RegExp) => Object.keys(a).find((k) => motif.test(k));

export function proposerParcelles(couche: Couche): ParcelleProposee[] {
  const kCulture = champCulture(couche.entites.map((e) => e.attributs));
  const propositions = couche.entites.map((e, i) => {
    const a = e.attributs;
    const calculee = surfaceHa(e.contour);
    const { surface, origine } = surfaceDuFichier(a, calculee);
    const codeCulture = kCulture && a[kCulture] != null ? String(a[kCulture]) : undefined;
    return {
      nom: nomDepuis(a, i),
      surfaceHa: arrondiHa(surface),
      origineSurface: origine,
      codeCulture,
      estVigne: codeCulture ? /^(VR|VI|VIG)/i.test(codeCulture) : true,
      contour: e.contour,
      attributs: a,
    };
  });
  return nomsUniques(propositions);
}

/** Deux parcelles ne doivent jamais porter le même nom : sinon l'une écraserait l'autre à l'import. */
function nomsUniques<T extends { nom: string }>(liste: T[]): T[] {
  const total = new Map<string, number>();
  for (const p of liste) total.set(p.nom, (total.get(p.nom) ?? 0) + 1);
  const vus = new Map<string, number>();
  return liste.map((p) => {
    if ((total.get(p.nom) ?? 0) < 2) return p;
    const n = (vus.get(p.nom) ?? 0) + 1;
    vus.set(p.nom, n);
    return { ...p, nom: `${p.nom} (${n})` };
  });
}

/** Le champ du code culture : CODE_CULTU chez Telepac, sinon le champ « cult… » le plus rempli. */
function champCulture(lignes: Attributs[]): string | undefined {
  const cles = Object.keys(lignes[0] ?? {});
  const exact = cles.find((k) => /^code_?cult(u|ure)?$/i.test(k));
  if (exact) return exact;
  const candidats = cles.filter((k) => /cult/i.test(k));
  const rempli = (k: string) => lignes.filter((l) => l[k] != null && l[k] !== '').length;
  return candidats.sort((a, b) => rempli(b) - rempli(a))[0];
}

/**
 * Choisit la couche des parcelles quand le zip en contient plusieurs (îlots, parcelles,
 * surfaces non agricoles…) : celle qui a le plus de polygones, hors îlots.
 */
export function choisirCouche(couches: Couche[]): Couche {
  const pleines = couches.filter((c) => c.entites.length > 0);
  const horsIlots = pleines.filter((c) => !/ilot/i.test(c.nom));
  const candidates = horsIlots.length ? horsIlots : pleines;
  if (candidates.length === 0) return couches[0];
  return [...candidates].sort(
    (a, b) => b.entites.length - a.entites.length || Number(/parcel/i.test(b.nom)) - Number(/parcel/i.test(a.nom)),
  )[0];
}

function nomDepuis(a: Attributs, i: number): string {
  // Seulement un vrai nom de parcelle : pas la commune, l'exploitation ou le département.
  const kNom = champ(a, /^(nom|name|libelle|nom_?parc\w*|lieu_?dit)$/i);
  if (kNom && a[kNom]) return String(a[kNom]);
  const kIlot = champ(a, /^(num_?ilot|numero_?ilot|n_?ilot|ilot)$/i);
  const kParc = champ(a, /^(num_?parc\w*|num_?p|numero_?p\w*|n_?parc\w*|parcelle)$/i);
  const ilot = kIlot ? a[kIlot] : null;
  const parc = kParc ? a[kParc] : null;
  if (ilot != null && parc != null) return `Îlot ${ilot} – parcelle ${parc}`;
  if (parc != null) return `Parcelle ${parc}`;
  if (ilot != null) return `Îlot ${ilot}`;
  return `Parcelle ${i + 1}`;
}

/**
 * Garde la surface officielle du fichier quand elle est cohérente avec le contour
 * (à 20 % près). Le fichier peut être en hectares, en ares ou en m².
 */
function surfaceDuFichier(a: Attributs, calculee: number) {
  const k = champ(a, /surf/i);
  const brut = k ? a[k] : null;
  if (typeof brut === 'number' && brut > 0 && calculee > 0) {
    const candidats = [brut, brut / 100, brut / 10000];
    const meilleur = candidats.reduce((m, c) =>
      Math.abs(c - calculee) < Math.abs(m - calculee) ? c : m,
    );
    if (Math.abs(meilleur - calculee) / calculee < 0.2)
      return { surface: meilleur, origine: 'fichier' as const };
  }
  return { surface: calculee, origine: 'calculée' as const };
}

/**
 * Ajoute les parcelles importées. Une parcelle déjà enregistrée sous le même nom est
 * mise à jour (contour, surface, culture) sans toucher au cépage ni aux réglages,
 * et une seule fois : deux lignes du fichier ne peuvent jamais fusionner.
 */
export function fusionnerImport(
  existantes: Parcelle[],
  choisies: ParcelleProposee[],
  reglages: { ecartementM?: number; rangsParPassage?: number },
  nouvelId: () => string,
): Parcelle[] {
  const resultat = [...existantes];
  const dejaMisesAJour = new Set<number>();
  for (const { estVigne: _v, origineSurface: _o, ...p } of choisies) {
    const i = existantes.findIndex((x, k) => x.nom === p.nom && !dejaMisesAJour.has(k));
    if (i >= 0) {
      dejaMisesAJour.add(i);
      resultat[i] = { ...resultat[i], contour: p.contour, surfaceHa: p.surfaceHa, codeCulture: p.codeCulture, attributs: p.attributs };
    } else {
      resultat.push({ ...p, id: nouvelId(), ...reglages });
    }
  }
  return resultat;
}
