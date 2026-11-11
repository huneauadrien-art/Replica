import { categorieDe } from '../core/mois';
import type { Donnees, Groupe, Transaction } from '../core/types';

/** Titre, sous-titre et groupe affichés pour une ligne. */
export function libelleLigne(d: Donnees, t: Transaction): { titre: string; sous?: string; groupe?: Groupe } {
  if (t.type === 'depense') {
    const cat = categorieDe(d, t.categorieId);
    return { titre: t.note || cat.nom, sous: t.note ? cat.nom : undefined, groupe: cat.groupe };
  }
  if (t.type === 'revenu') return { titre: t.note || 'Revenu en plus', sous: 'Revenu' };
  const obj = d.objectifs.find((o) => o.id === t.objectifId);
  return { titre: t.note || (obj ? obj.nom : 'Épargne'), sous: obj ? `Épargne · ${obj.nom}` : 'Épargne' };
}
