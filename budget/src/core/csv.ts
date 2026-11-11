// Export CSV pour Excel (version française : point-virgule, virgule décimale, UTF-8 avec BOM).

import { categorieDe, NOMS_GROUPES } from './mois';
import type { Donnees, Jour } from './types';

const TYPES = { depense: 'Dépense', revenu: 'Revenu', epargne: 'Épargne' } as const;

function cellule(v: string): string {
  return /[;"\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

const montant = (c: number) => (c / 100).toFixed(2).replace('.', ',');
const dateFr = (j: Jour) => j.split('-').reverse().join('/');

/** Toutes les lignes entre deux jours inclus, de la plus ancienne à la plus récente. */
export function exporterCsv(d: Donnees, du: Jour, au: Jour): string {
  const lignes = [['Date', 'Type', 'Groupe', 'Catégorie', 'Montant', 'Note', 'Objectif']];
  const tx = d.transactions.filter((t) => t.jour >= du && t.jour <= au).sort((a, b) => (a.jour < b.jour ? -1 : a.jour > b.jour ? 1 : 0));
  for (const t of tx) {
    const cat = t.type === 'depense' ? categorieDe(d, t.categorieId) : undefined;
    const objectif = t.objectifId ? d.objectifs.find((o) => o.id === t.objectifId)?.nom ?? '' : '';
    lignes.push([dateFr(t.jour), TYPES[t.type], cat ? NOMS_GROUPES[cat.groupe] : '', cat?.nom ?? '', montant(t.montant), t.note ?? '', objectif]);
  }
  return '﻿' + lignes.map((l) => l.map(cellule).join(';')).join('\r\n') + '\r\n';
}
