import { describe, expect, it } from 'vitest';
import {
  bornesMois,
  categorieDe,
  chiffresBilan,
  decalerMois,
  euros,
  filtrer,
  historique,
  lireMontant,
  moisDe,
  propositionMois,
  resteParSemaine,
  resume,
  transactionsDuMois,
  bilansEnRetard,
  avancement,
} from '../mois';
import { DONNEES_VIDES, type Donnees, type Transaction } from '../types';

// Montants fictifs.
const dep = (id: string, jour: string, montant: number, categorieId = 'cat-courses', note?: string): Transaction => ({ id, jour, montant, type: 'depense', categorieId, note });

const foyer = (): Donnees => ({
  ...DONNEES_VIDES,
  mois: [{ id: '2026-11', revenusPrevus: 200000, chargesFixes: [{ libelle: 'Loyer', montant: 70000 }, { libelle: 'Box', montant: 3000 }], epargneVisee: 20000, budgets: { survie: 50000 }, clos: false }],
  transactions: [
    dep('a', '2026-11-02', 4500),
    dep('b', '2026-11-10', 3000, 'cat-restaurant', 'Pizzeria'),
    dep('c', '2026-11-30', 1200, 'cat-livres'),
    dep('hors', '2026-12-01', 9999),
    { id: 'r', jour: '2026-11-15', montant: 5000, type: 'revenu', note: 'Prime' },
    { id: 'e', jour: '2026-11-03', montant: 10000, type: 'epargne', objectifId: 'vac' },
  ],
});

describe('montants', () => {
  it('lit la virgule, le point, les espaces et refuse le reste', () => {
    expect(lireMontant('12,5')).toBe(1250);
    expect(lireMontant('12.50')).toBe(1250);
    expect(lireMontant('1 234,56')).toBe(123456);
    expect(lireMontant('7')).toBe(700);
    expect(lireMontant('7,')).toBe(700);
    expect(lireMontant('0,07')).toBe(7);
    expect(lireMontant('1,234')).toBeUndefined();
    expect(lireMontant('-3')).toBeUndefined();
    expect(lireMontant('')).toBeUndefined();
    expect(lireMontant('abc')).toBeUndefined();
  });
  it('écrit au format français', () => {
    expect(euros(123456)).toBe('1 234,56 €');
    expect(euros(5000)).toBe('50 €');
    expect(euros(-1250)).toBe('−12,50 €');
    expect(euros(5000, { signe: true })).toBe('+50 €');
    expect(euros(5000, { decimales: true })).toBe('50,00 €');
  });
});

describe('mois de budget', () => {
  it('début au 1er : mois du calendrier', () => {
    expect(moisDe('2026-11-30')).toBe('2026-11');
    expect(bornesMois('2026-02')).toEqual({ du: '2026-02-01', au: '2026-02-28' });
    expect(bornesMois('2028-02')).toEqual({ du: '2028-02-01', au: '2028-02-29' });
  });
  it('début au 25 : du 25 du mois d’avant au 24', () => {
    expect(moisDe('2026-10-24', 25)).toBe('2026-10');
    expect(moisDe('2026-10-25', 25)).toBe('2026-11');
    expect(moisDe('2026-12-31', 25)).toBe('2027-01');
    expect(bornesMois('2027-01', 25)).toEqual({ du: '2026-12-25', au: '2027-01-24' });
  });
  it('décale les mois en passant l’année', () => {
    expect(decalerMois('2026-12', 1)).toBe('2027-01');
    expect(decalerMois('2026-01', -1)).toBe('2025-12');
    expect(decalerMois('2026-05', -17)).toBe('2024-12');
  });
});

describe('résumé du mois', () => {
  it('calcule disponible, dépensé, reste et épargne réelle', () => {
    const r = resume(foyer(), '2026-11');
    expect(r.chargesFixes).toBe(73000);
    expect(r.revenusEnPlus).toBe(5000);
    expect(r.disponible).toBe(200000 + 5000 - 73000 - 20000);
    expect(r.depense).toBe(8700);
    expect(r.reste).toBe(112000 - 8700);
    expect(r.parGroupe).toEqual({ survie: 4500, optionnel: 3000, culture: 1200, extra: 0 });
    expect(r.verse).toBe(10000);
    expect(r.epargneReelle).toBe(205000 - 73000 - 8700);
    expect(r.ton).toBe('normal');
  });
  it('signale le dépassement et le seuil de 10 %', () => {
    const d = foyer();
    d.transactions.push(dep('gros', '2026-11-20', 100000));
    expect(resume(d, '2026-11').ton).toBe('attention');
    d.transactions.push(dep('trop', '2026-11-21', 10000));
    expect(resume(d, '2026-11').ton).toBe('depasse');
  });
  it('mois non préparé : tout à zéro sauf les dépenses', () => {
    const r = resume(foyer(), '2026-12');
    expect(r.mois).toBeUndefined();
    expect(r.depense).toBe(9999);
    expect(r.reste).toBe(-9999);
  });
  it('trie du plus récent au plus ancien', () => {
    expect(transactionsDuMois(foyer(), '2026-11').map((t) => t.id)).toEqual(['c', 'r', 'b', 'e', 'a']);
  });
  it('catégorie inconnue → Extra › Autre', () => {
    expect(categorieDe(foyer(), 'cat-effacee')).toMatchObject({ id: 'cat-autre', groupe: 'extra' });
    const d = foyer();
    d.transactions.push(dep('x', '2026-11-05', 100, 'cat-effacee'));
    expect(resume(d, '2026-11').parGroupe.extra).toBe(100);
  });
  it('reste par semaine', () => {
    const d = foyer();
    expect(resteParSemaine(d, '2026-11', '2026-11-24')).toEqual({ semaines: 1, parSemaine: 103300 });
    expect(resteParSemaine(d, '2026-11', '2026-11-01').semaines).toBe(5);
  });
});

describe('préparer un mois', () => {
  it('reprend le mois précédent', () => {
    const p = propositionMois(foyer(), '2026-12');
    expect(p).toMatchObject({ id: '2026-12', revenusPrevus: 200000, epargneVisee: 20000, clos: false });
    expect(p.chargesFixes).toHaveLength(2);
  });
  it('sinon les lignes récurrentes actives', () => {
    const d: Donnees = {
      ...DONNEES_VIDES,
      recurrentes: [
        { id: '1', libelle: 'Salaire', montant: 180000, type: 'revenu', active: true },
        { id: '2', libelle: 'Loyer', montant: 60000, type: 'chargeFixe', active: true },
        { id: '3', libelle: 'Ancien abonnement', montant: 1000, type: 'chargeFixe', active: false },
      ],
    };
    expect(propositionMois(d, '2026-11')).toEqual({ id: '2026-11', revenusPrevus: 180000, chargesFixes: [{ libelle: 'Loyer', montant: 60000 }], epargneVisee: 0, budgets: {}, clos: false });
  });
});

describe('bilan', () => {
  it('répond aux questions et compare au mois précédent', () => {
    const d = foyer();
    d.mois.push({ id: '2026-10', revenusPrevus: 200000, chargesFixes: [], epargneVisee: 0, budgets: {}, clos: true });
    d.transactions.push(dep('oct', '2026-10-12', 6000));
    const b = chiffresBilan(d, '2026-11');
    expect(b.avais).toBe(132000);
    expect(b.voulaisEpargner).toBe(20000);
    expect(b.depense).toBe(8700);
    expect(b.objectifAtteint).toBe(true);
    expect(b.ecartMoisPrecedent).toEqual({ survie: -1500, optionnel: 3000, culture: 1200, extra: 0 });
  });
  it('liste les bilans oubliés', () => {
    const d = foyer();
    d.mois.push({ id: '2026-09', revenusPrevus: 0, chargesFixes: [], epargneVisee: 0, budgets: {}, clos: true });
    d.mois.push({ id: '2026-10', revenusPrevus: 0, chargesFixes: [], epargneVisee: 0, budgets: {}, clos: false });
    expect(bilansEnRetard(d, '2026-11')).toEqual(['2026-10']);
  });
});

describe('objectifs, historique, recherche', () => {
  it('avancement d’un objectif', () => expect(avancement(foyer(), 'vac')).toBe(10000));
  it('historique du plus récent au plus ancien', () => {
    const d = foyer();
    d.mois.push({ id: '2026-10', revenusPrevus: 0, chargesFixes: [], epargneVisee: 0, budgets: {}, clos: true });
    expect(historique(d).map((h) => h.cle)).toEqual(['2026-11', '2026-10']);
  });
  it('filtre par groupe et texte sans accents', () => {
    const d = foyer();
    const tx = transactionsDuMois(d, '2026-11');
    expect(filtrer(d, tx, { groupe: 'optionnel' }).map((t) => t.id)).toEqual(['b']);
    expect(filtrer(d, tx, { texte: 'pizz' }).map((t) => t.id)).toEqual(['b']);
    expect(filtrer(d, tx, { texte: 'LIVRE' }).map((t) => t.id)).toEqual(['c']);
  });
});

import { frequentes } from '../mois';

describe('dépenses fréquentes', () => {
  it('au moins 2 fois en 60 jours, les plus fréquentes d’abord, note sans casse', () => {
    const d: Donnees = {
      ...DONNEES_VIDES,
      transactions: [
        dep('1', '2026-11-01', 120, 'cat-courses', 'Pain'),
        dep('2', '2026-11-03', 120, 'cat-courses', 'pain'),
        dep('3', '2026-11-05', 120, 'cat-courses', 'Pain'),
        dep('4', '2026-11-02', 4500, 'cat-transport', 'Essence'),
        dep('5', '2026-11-09', 4500, 'cat-transport', 'Essence'),
        dep('6', '2026-11-09', 999, 'cat-restaurant'),
        dep('vieux1', '2026-08-01', 50, 'cat-livres'),
        dep('vieux2', '2026-08-02', 50, 'cat-livres'),
        { id: 'r', jour: '2026-11-04', montant: 120, type: 'revenu' },
      ],
    };
    expect(frequentes(d, '2026-11-10')).toEqual([
      { categorieId: 'cat-courses', montant: 120, note: 'Pain', fois: 3 },
      { categorieId: 'cat-transport', montant: 4500, note: 'Essence', fois: 2 },
    ]);
  });
});
