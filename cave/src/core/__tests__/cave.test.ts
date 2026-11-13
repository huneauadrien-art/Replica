import { describe, expect, it } from 'vitest';
import {
  aBoireAvant,
  caseLibre,
  emplacement,
  etatGarde,
  exporterCave,
  fenetreGarde,
  filtrer,
  grilleMeuble,
  ranger,
  redimensionnerMeuble,
  reparerCases,
  resumeCave,
  sortir,
  supprimerMeuble,
  supprimerVin,
  vinDuSoir,
  vinsEnCave,
} from '../cave';
import { DONNEES_VIDES, type Bouteille, type Donnees, type Vin } from '../types';

const vin = (id: string, x: Partial<Vin> = {}): Vin => ({ id, domaine: `Domaine ${id}`, couleur: 'rouge', millesime: 2018, ...x });
const bt = (id: string, vinId: string, x: Partial<Bouteille> = {}): Bouteille => ({ id, vinId, entree: '2026-01-01', statut: 'cave', ...x });

const cave = (): Donnees => ({
  ...DONNEES_VIDES,
  meubles: [{ id: 'm', nom: 'Cave du bas', rangees: 3, colonnes: 4 }],
  vins: [
    vin('bx', { region: 'Bordeaux', millesime: 2016 }),
    vin('rose', { couleur: 'rose', millesime: 2025 }),
    vin('jeune', { region: 'Bordeaux', millesime: 2024 }),
    vin('vieux', { couleur: 'blanc', millesime: 2015 }),
  ],
  bouteilles: [
    bt('1', 'bx', { meubleId: 'm', rangee: 1, colonne: 1, prix: 30 }),
    bt('2', 'bx', { prix: 30 }),
    bt('3', 'rose', { meubleId: 'm', rangee: 2, colonne: 3 }),
    bt('4', 'jeune', { prix: 15.5 }),
    bt('5', 'vieux', { meubleId: 'm', rangee: 3, colonne: 4 }),
    bt('6', 'bx', { statut: 'bue', sortie: '2026-03-01' }),
  ],
});

describe('fenêtre de garde', () => {
  it('ajuste la table par région, sans tenir compte des accents', () => {
    expect(fenetreGarde(vin('a', { region: 'Bordeaux', millesime: 2016 }))).toEqual({ pret: 2021, apogeeDebut: 2024, apogeeFin: 2031, fin: 2038 });
    expect(fenetreGarde(vin('b', { appellation: 'Côte-Rôtie', millesime: 2016 }))?.apogeeFin).toBe(2028);
    expect(fenetreGarde(vin('c', { millesime: 2016 }))?.apogeeFin).toBe(2026);
  });

  it('préfère la fenêtre saisie, et ne calcule rien sans millésime', () => {
    const garde = { pret: 2020, apogeeDebut: 2021, apogeeFin: 2022, fin: 2023 };
    expect(fenetreGarde(vin('a', { garde }))).toBe(garde);
    expect(fenetreGarde(vin('a', { millesime: undefined }))).toBeUndefined();
    expect(etatGarde(vin('a', { millesime: undefined }), 2026)).toBe('pret');
  });

  it('suit le vin de sa jeunesse à son déclin', () => {
    const v = vin('a', { millesime: 2016, region: 'Bordeaux' });
    expect([2020, 2021, 2024, 2031, 2038, 2039].map((a) => etatGarde(v, a))).toEqual(['jeune', 'pret', 'apogee', 'vite', 'vite', 'passe']);
  });
});

describe('résumé et choix du soir', () => {
  it('compte les bouteilles en cave, la valeur, les prix manquants et le bac à ranger', () => {
    const r = resumeCave(cave(), 2026);
    expect(r).toMatchObject({ bouteilles: 5, valeur: 75.5, sansPrix: 2, aRanger: 2 });
    expect(r.parEtat).toEqual({ jeune: 1, pret: 0, apogee: 3, vite: 0, passe: 1 });
    expect(r.pretes).toBe(4);
  });

  it('propose d’abord le vin passé, puis les plus pressés', () => {
    const d = cave();
    expect(vinsEnCave(d, 2026).map((x) => [x.vin.id, x.nombre])).toEqual([
      ['vieux', 1],
      ['rose', 1],
      ['bx', 2],
      ['jeune', 1],
    ]);
    expect(vinDuSoir(d, 2026)?.vin.id).toBe('vieux');
    expect(aBoireAvant(d, 2026, 2027).map((x) => x.vin.id)).toEqual(['vieux', 'rose']);
  });

  it('filtre par couleur, par état et par recherche', () => {
    const l = vinsEnCave(cave(), 2026);
    expect(filtrer(l, 'pretes').map((x) => x.vin.id)).not.toContain('jeune');
    expect(filtrer(l, 'blanc').map((x) => x.vin.id)).toEqual(['vieux']);
    expect(filtrer(l, 'tout', 'domaine BX').map((x) => x.vin.id)).toEqual(['bx']);
  });
});

describe('plan des casiers', () => {
  it('place les bouteilles dans la grille et donne leur emplacement', () => {
    const d = cave();
    const g = grilleMeuble(d, d.meubles[0]);
    expect(g[0][0]?.id).toBe('1');
    expect(g[1][2]?.id).toBe('3');
    expect(g[2][0]).toBeNull();
    expect(emplacement(d, d.bouteilles[0])).toBe('Cave du bas · R1 · C1');
    expect(emplacement(d, d.bouteilles[1])).toBe('À ranger');
  });

  it('range dans une case libre et refuse une case prise', () => {
    const d = ranger(cave(), '2', 'm', 1, 2);
    expect(emplacement(d, d.bouteilles[1])).toBe('Cave du bas · R1 · C2');
    expect(caseLibre(d, 'm', 1, 2)).toBe(false);
    expect(() => ranger(d, '4', 'm', 1, 1)).toThrow('R1 · C1');
  });

  it('libère la case quand on boit la bouteille', () => {
    const d = sortir(cave(), '1', '2026-11-13');
    expect(d.bouteilles[0]).toMatchObject({ statut: 'bue', sortie: '2026-11-13' });
    expect(d.bouteilles[0].meubleId).toBeUndefined();
    expect(caseLibre(d, 'm', 1, 1)).toBe(true);
  });

  it('remet à ranger les bouteilles d’un meuble supprimé ou rétréci', () => {
    expect(supprimerMeuble(cave(), 'm').bouteilles.every((b) => !b.meubleId)).toBe(true);
    const d = redimensionnerMeuble(cave(), { id: 'm', nom: 'Cave du bas', rangees: 2, colonnes: 4 });
    expect(d.bouteilles.find((b) => b.id === '5')?.meubleId).toBeUndefined();
    expect(d.bouteilles.find((b) => b.id === '1')?.meubleId).toBe('m');
  });

  it('répare une case occupée deux fois après une synchro : la plus récente reste', () => {
    const d = cave();
    d.bouteilles = [...d.bouteilles, bt('7', 'rose', { meubleId: 'm', rangee: 1, colonne: 1, maj: 50 }), bt('8', 'rose', { meubleId: 'perdu', rangee: 1, colonne: 1 })];
    d.bouteilles[0] = { ...d.bouteilles[0], maj: 10 };
    const r = reparerCases(d);
    expect(r.bouteilles.find((b) => b.id === '1')?.meubleId).toBeUndefined();
    expect(r.bouteilles.find((b) => b.id === '7')?.meubleId).toBe('m');
    expect(r.bouteilles.find((b) => b.id === '8')?.meubleId).toBeUndefined();
    expect(reparerCases(r)).toBe(r);
  });
});

describe('suppression et export', () => {
  it('supprime un vin avec ses bouteilles et ses dégustations', () => {
    const d = { ...cave(), degustations: [{ id: 'g', vinId: 'bx', date: '2026-03-01' }] };
    const r = supprimerVin(d, 'bx');
    expect(r.bouteilles.some((b) => b.vinId === 'bx')).toBe(false);
    expect(r.degustations).toEqual([]);
  });

  it('exporte une ligne par bouteille en cave, lisible par Excel', () => {
    const d = cave();
    d.vins[0] = { ...d.vins[0], cuvee: 'La "Grande"; cuvée' };
    const csv = exporterCave(d, 2026).split('\n');
    expect(csv).toHaveLength(6);
    expect(csv[0]).toBe('Domaine;Cuvée;Millésime;Couleur;Appellation;Région;Emplacement;Prix payé;Entrée;État');
    expect(csv[1]).toBe('Domaine bx;"La ""Grande""; cuvée";2016;Rouge;;Bordeaux;Cave du bas · R1 · C1;30;2026-01-01;À son apogée');
  });
});
