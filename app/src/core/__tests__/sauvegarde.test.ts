import { describe, expect, it } from 'vitest';
import { ajouterSauvegarde, lireSauvegarde } from '../sauvegarde';
import { difference } from '../sync';
import { DONNEES_VIDES, type Donnees } from '../types';

const p = (id: string, nom: string) => ({ id, nom, surfaceHa: 1, contour: [] });

describe('sauvegarde', () => {
  it('relit un export de l’app', () => {
    const d: Donnees = { ...DONNEES_VIDES, parcelles: [p('a', 'A')] };
    expect(lireSauvegarde('﻿' + JSON.stringify(d, null, 1)).parcelles).toHaveLength(1);
  });

  it('refuse un fichier qui n’est pas une sauvegarde', () => {
    expect(() => lireSauvegarde('pas du json')).toThrow(/illisible/);
    expect(() => lireSauvegarde('{"truc":1}')).toThrow(/pas une sauvegarde/);
  });

  it('ajoute sans doublon par identifiant', () => {
    const actuel: Donnees = { ...DONNEES_VIDES, parcelles: [p('a', 'A'), p('b', 'B')] };
    const r = ajouterSauvegarde(actuel, { ...DONNEES_VIDES, parcelles: [p('b', 'B2'), p('c', 'C')] });
    expect(r.parcelles.map((x) => x.nom)).toEqual(['A', 'B2', 'C']);
  });

  it('un remplacement part au NAS : fiches nouvelles envoyées, anciennes supprimées', () => {
    const actuel: Donnees = { ...DONNEES_VIDES, parcelles: [p('x', 'Android')] };
    const sauvegarde: Donnees = { ...DONNEES_VIDES, parcelles: [p('i', 'iPhone')] };
    const { changees } = difference(actuel, { ...actuel, ...sauvegarde }, 1);
    expect(changees.parcelles).toEqual([expect.objectContaining({ id: 'i', maj: 1 }), { id: 'x', maj: 1, supprime: true }]);
  });
});
