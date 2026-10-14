// Cultures des parcelles : la vigne, mais aussi les champs et les jachères importés de la PAC.

import type { Parcelle } from './types';

export const CULTURES = ['Vigne', 'Céréales', 'Oléagineux', 'Prairie', 'Jachère', 'Bois / haie'] as const;

/** Devine la culture à partir du code culture PAC (VRC, BTH, J6S, PTR…). */
export function cultureDepuisCode(code?: string): string | undefined {
  if (!code) return undefined;
  const c = code.trim().toUpperCase();
  if (/^V[RI]/.test(c)) return 'Vigne';
  if (/^J/.test(c)) return 'Jachère';
  if (/^(PT|PP|PR|PX|PH|SPH|SPL|LU|TR[EF])/.test(c)) return 'Prairie';
  if (/^(BT|BD|OR|AV|SG|SE|TC|TT|EP|MI|MC|RIZ)/.test(c)) return 'Céréales';
  if (/^(CZ|CO|TO|SOJ|LI|ML)/.test(c)) return 'Oléagineux';
  if (/^(BOR|BTA|HAI|BOS|TCR|PEP)/.test(c)) return 'Bois / haie';
  return 'Autre';
}

/** Culture affichée : celle choisie, sinon celle du code PAC, sinon vigne (parcelle créée à la main). */
export function cultureDe(p: Pick<Parcelle, 'culture' | 'codeCulture'>): string {
  return p.culture || cultureDepuisCode(p.codeCulture) || 'Vigne';
}

export const estVigne = (p: Pick<Parcelle, 'culture' | 'codeCulture'>) => cultureDe(p) === 'Vigne';

/** Largeur traitée à chaque passage, en mètres : rangs × écartement en vigne, largeur de rampe ailleurs. */
export function largeurTraitee(p: Parcelle): number | undefined {
  if (estVigne(p)) return p.ecartementM && p.rangsParPassage ? p.ecartementM * p.rangsParPassage : undefined;
  return p.largeurM || undefined;
}
