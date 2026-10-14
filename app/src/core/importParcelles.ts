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
  return couche.entites.map((e, i) => {
    const a = e.attributs;
    const calculee = surfaceHa(e.contour);
    const { surface, origine } = surfaceDuFichier(a, calculee);
    const kCulture = champ(a, /^(code_?cult|cult|code_?cultu|culture)/i);
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
}

/** Choisit la couche des parcelles plutôt que celle des îlots quand le zip contient les deux. */
export function choisirCouche(couches: Couche[]): Couche {
  return (
    couches.find((c) => /parcel/i.test(c.nom) && c.entites.length > 0) ??
    couches.find((c) => c.entites.length > 0) ??
    couches[0]
  );
}

function nomDepuis(a: Attributs, i: number): string {
  const kNom = champ(a, /^(nom|name|libel|lieu)/i);
  if (kNom && a[kNom]) return String(a[kNom]);
  const kIlot = champ(a, /ilot/i);
  const kParc = champ(a, /^(num_?parc|num_?p$|numero_?p|parcel)/i);
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
