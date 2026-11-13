/// <reference types="node" />
import { describe, expect, it } from 'vitest';
import { ajouterSauvegarde, lireSauvegarde } from '../sauvegarde';
import { difference } from '../sync';
import { DONNEES_VIDES, type Donnees } from '../types';

const p = (id: string, domaine: string) => ({ id, domaine, couleur: 'rouge' as const });

describe('sauvegarde', () => {
  it('relit un export de l’app', () => {
    const d: Donnees = { ...DONNEES_VIDES, vins: [p('a', 'A')] };
    expect(lireSauvegarde('﻿' + JSON.stringify(d, null, 1)).vins).toHaveLength(1);
  });

  it('refuse un fichier qui n’est pas une sauvegarde', () => {
    expect(() => lireSauvegarde('pas du json')).toThrow(/illisible/);
    expect(() => lireSauvegarde('{"truc":1}')).toThrow(/pas une sauvegarde/);
  });

  it('ajoute sans doublon par identifiant', () => {
    const actuel: Donnees = { ...DONNEES_VIDES, vins: [p('a', 'A'), p('b', 'B')] };
    const r = ajouterSauvegarde(actuel, { ...DONNEES_VIDES, vins: [p('b', 'B2'), p('c', 'C')] });
    expect(r.vins.map((x) => x.domaine)).toEqual(['A', 'B2', 'C']);
  });

  it('un remplacement part au NAS : fiches nouvelles envoyées, anciennes supprimées', () => {
    const actuel: Donnees = { ...DONNEES_VIDES, vins: [p('x', 'Android')] };
    const sauvegarde: Donnees = { ...DONNEES_VIDES, vins: [p('i', 'iPhone')] };
    const { changees } = difference(actuel, { ...actuel, ...sauvegarde }, 1);
    expect(changees.vins).toEqual([expect.objectContaining({ id: 'i', maj: 1 }), { id: 'x', maj: 1, supprime: true }]);
  });
});

import { depuisBase64, versBase64 } from '../base64';

describe('base64 des pièces jointes', () => {
  it('fait l’aller-retour sur des octets quelconques, comme Node', () => {
    for (const n of [0, 1, 2, 3, 4, 1000, 70001]) {
      const o = new Uint8Array(n).map((_, i) => (i * 37 + 11) & 255);
      const b = versBase64(o);
      expect(b).toBe(Buffer.from(o).toString('base64'));
      expect([...depuisBase64(b)]).toEqual([...o]);
    }
  });
});
