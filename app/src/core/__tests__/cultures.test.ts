import { describe, expect, it } from 'vitest';
import { cultureDe, cultureDepuisCode, largeurTraitee } from '../cultures';
import { lignesRegistre } from '../registre';
import type { Donnees } from '../types';

describe('cultures', () => {
  it('reconnaît les codes PAC courants', () => {
    expect(cultureDepuisCode('VRC')).toBe('Vigne');
    expect(cultureDepuisCode('J6S')).toBe('Jachère');
    expect(cultureDepuisCode('PTR')).toBe('Prairie');
    expect(cultureDepuisCode('BTH')).toBe('Céréales');
    expect(cultureDepuisCode('CZH')).toBe('Oléagineux');
    expect(cultureDepuisCode('XYZ')).toBe('Autre');
    expect(cultureDepuisCode(undefined)).toBeUndefined();
  });

  it('garde le choix de l’utilisateur avant le code PAC', () => {
    expect(cultureDe({ codeCulture: 'J6S' })).toBe('Jachère');
    expect(cultureDe({ codeCulture: 'J6S', culture: 'Prairie' })).toBe('Prairie');
    expect(cultureDe({})).toBe('Vigne');
  });

  it('calcule la largeur traitée selon la culture', () => {
    const base = { id: 'p', nom: 'P', surfaceHa: 1, contour: [] };
    expect(largeurTraitee({ ...base, ecartementM: 2.2, rangsParPassage: 2 })).toBeCloseTo(4.4);
    expect(largeurTraitee({ ...base, codeCulture: 'BTH', largeurM: 24, ecartementM: 2, rangsParPassage: 2 })).toBe(24);
    expect(largeurTraitee({ ...base, codeCulture: 'BTH' })).toBeUndefined();
  });

  it('met la vraie culture dans le registre', () => {
    const d: Donnees = {
      version: 1,
      parcelles: [{ id: 'b', nom: 'Le Champ', surfaceHa: 3, codeCulture: 'BTH', contour: [] }],
      produits: [{ id: 'x', nom: 'Herbicide', unite: 'L' }],
      mouvements: [],
      traitements: [{ id: 't', date: '2026-04-01', parcelles: [{ parcelleId: 'b', surfaceHa: 3 }], produits: [{ produitId: 'x', doseHa: 1 }], operateur: 'A' }],
    };
    expect(lignesRegistre(d)[0].culture).toBe('Céréales');
  });
});
