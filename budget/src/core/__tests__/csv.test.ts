import { describe, expect, it } from 'vitest';
import { exporterCsv } from '../csv';
import { ecrireSauvegarde, fusionner, lireSauvegarde } from '../sauvegarde';
import { DONNEES_VIDES, type Donnees } from '../types';

const d: Donnees = {
  ...DONNEES_VIDES,
  objectifs: [{ id: 'v', nom: 'Vacances', montantVise: 100000 }],
  transactions: [
    { id: '2', jour: '2026-11-10', montant: 2340, type: 'depense', categorieId: 'cat-courses', note: 'Marché; "bio"' },
    { id: '1', jour: '2026-11-01', montant: 5000, type: 'epargne', objectifId: 'v' },
    { id: '3', jour: '2026-12-01', montant: 1, type: 'depense', categorieId: 'cat-courses' },
  ],
};

describe('export CSV', () => {
  it('BOM, point-virgule, virgule décimale, guillemets, ordre chronologique, période', () => {
    const csv = exporterCsv(d, '2026-11-01', '2026-11-30');
    expect(csv.startsWith('﻿Date;Type;')).toBe(true);
    const lignes = csv.trim().split('\r\n');
    expect(lignes).toHaveLength(3);
    expect(lignes[1]).toBe('01/11/2026;Épargne;;;50,00;;Vacances');
    expect(lignes[2]).toBe('10/11/2026;Dépense;Survie;Courses;23,40;"Marché; ""bio""";');
  });
});

describe('sauvegarde', () => {
  it('aller-retour et refus des autres fichiers', () => {
    const relu = lireSauvegarde(ecrireSauvegarde(d));
    expect(relu.transactions).toHaveLength(3);
    expect(relu.mois).toEqual([]);
    expect(() => lireSauvegarde('{"parcelles":[]}')).toThrow(/pas une sauvegarde/);
    expect(() => lireSauvegarde('pas du json')).toThrow(/illisible/);
  });
  it('fusionne en remplaçant les fiches de même id', () => {
    const r = fusionner(d, { ...DONNEES_VIDES, transactions: [{ id: '1', jour: '2026-11-01', montant: 1, type: 'revenu' }] });
    expect(r.transactions).toHaveLength(3);
    expect(r.transactions.find((t) => t.id === '1')?.montant).toBe(1);
  });
});
