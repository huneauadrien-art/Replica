import { describe, expect, it } from 'vitest';
import {
  controlerTraitement,
  dateRecolteMin,
  historiqueStock,
  lignesRegistre,
  quantitesUtilisees,
  registreCsv,
  registreHtml,
  rentreePossible,
  stockActuel,
} from '../registre';
import type { Donnees, Traitement } from '../types';

const donnees = (): Donnees => ({
  version: 1,
  parcelles: [
    { id: 'p1', nom: 'Les Graves', surfaceHa: 2, contour: [] },
    { id: 'p2', nom: 'Le Haut', surfaceHa: 1.5, contour: [] },
  ],
  produits: [
    { id: 'cuivre', nom: 'Bouillie bordelaise', amm: '2000123', unite: 'kg', doseMaxHa: 4, darJours: 21, dreHeures: 24, seuilAlerte: 5 },
    { id: 'soufre', nom: 'Soufre mouillable', unite: 'kg', darJours: 5 },
  ],
  mouvements: [
    { id: 'm1', produitId: 'cuivre', date: '2026-04-01', type: 'achat', quantite: 25, fournisseur: 'Coop' },
    { id: 'm2', produitId: 'soufre', date: '2026-04-01', type: 'achat', quantite: 10 },
  ],
  traitements: [
    {
      id: 't1',
      date: '2026-05-10',
      heureDebut: '06:30',
      heureFin: '08:00',
      parcelles: [
        { parcelleId: 'p1', surfaceHa: 2 },
        { parcelleId: 'p2', surfaceHa: 1.5 },
      ],
      produits: [
        { produitId: 'cuivre', doseHa: 2 },
        { produitId: 'soufre', doseHa: 1 },
      ],
      operateur: 'Adrien',
      cible: 'Mildiou',
      stadeBBCH: '57',
    },
  ],
});

const nouveau = (x: Partial<Traitement>): Traitement => ({
  id: 'nouveau',
  date: '2026-05-20',
  parcelles: [{ parcelleId: 'p1', surfaceHa: 2 }],
  produits: [{ produitId: 'cuivre', doseHa: 2 }],
  operateur: 'Adrien',
  ...x,
});

describe('stock', () => {
  it('déduit dose × surface de chaque traitement', () => {
    const d = donnees();
    expect(quantitesUtilisees(d.traitements[0]).get('cuivre')).toBe(7);
    expect(stockActuel(d, 'cuivre')).toBe(18);
    expect(stockActuel(d, 'soufre')).toBe(6.5);
  });

  it('donne un historique avec le solde courant', () => {
    const h = historiqueStock(donnees(), 'cuivre');
    expect(h.map((l) => [l.quantite, l.solde])).toEqual([
      [25, 25],
      [-7, 18],
    ]);
    expect(h[1].libelle).toBe('Traitement Les Graves, Le Haut');
  });

  it('recalcule le stock quand on modifie un traitement', () => {
    const d = donnees();
    d.traitements[0].produits[0].doseHa = 3;
    expect(stockActuel(d, 'cuivre')).toBe(25 - 3 * 3.5);
  });
});

describe('contrôles', () => {
  it('accepte un traitement correct sans alerte grave', () => {
    const alertes = controlerTraitement(donnees(), nouveau({}));
    expect(alertes.filter((a) => a.niveau !== 'attention')).toEqual([]);
  });

  it('signale une dose au-dessus de la dose homologuée', () => {
    const a = controlerTraitement(donnees(), nouveau({ produits: [{ produitId: 'cuivre', doseHa: 5 }] }));
    expect(a).toContainEqual(expect.objectContaining({ niveau: 'danger', message: expect.stringMatching(/dose homologuée/) }));
  });

  it('signale un stock insuffisant et un stock bas', () => {
    const d = donnees();
    const bas = controlerTraitement(d, nouveau({ produits: [{ produitId: 'cuivre', doseHa: 3.25 }], parcelles: [{ parcelleId: 'p1', surfaceHa: 2 }, { parcelleId: 'p2', surfaceHa: 2 }] }));
    expect(bas.some((a) => /il restera 5 kg/.test(a.message))).toBe(true);
    expect(bas.some((a) => /Le Haut : surface traitée supérieure/.test(a.message))).toBe(true);
    d.mouvements[0].quantite = 10;
    const insuffisant = controlerTraitement(d, nouveau({}));
    expect(insuffisant.some((a) => /stock insuffisant \(il manquera 1 kg\)/.test(a.message))).toBe(true);
  });

  it('ne compte pas deux fois le traitement en cours de modification', () => {
    const d = donnees();
    const t = { ...d.traitements[0] };
    expect(controlerTraitement(d, t).some((a) => /stock/.test(a.message))).toBe(false);
  });

  it('signale le vent au-delà de 19 km/h et le numéro AMM manquant', () => {
    const a = controlerTraitement(donnees(), nouveau({ ventKmh: 25, produits: [{ produitId: 'soufre', doseHa: 1 }] }));
    expect(a.some((x) => x.niveau === 'danger' && /Vent de 25/.test(x.message))).toBe(true);
    expect(a.some((x) => /AMM manquant/.test(x.message))).toBe(true);
  });

  it('bloque un traitement incomplet', () => {
    const a = controlerTraitement(donnees(), nouveau({ parcelles: [], produits: [], operateur: ' ' }));
    expect(a.filter((x) => x.niveau === 'bloquant')).toHaveLength(3);
  });
});

describe('délais', () => {
  it('prend le DAR le plus long', () => {
    expect(dateRecolteMin(donnees(), donnees().traitements[0])).toBe('2026-05-31');
  });
  it('calcule la rentrée depuis la fin du traitement', () => {
    expect(rentreePossible(donnees(), donnees().traitements[0])).toBe('2026-05-11 08:00');
  });
});

describe('registre', () => {
  it('fait une ligne par parcelle et par produit', () => {
    const l = lignesRegistre(donnees(), 2026);
    expect(l).toHaveLength(4);
    expect(l[0]).toMatchObject({ parcelle: 'Les Graves', produit: 'Bouillie bordelaise', amm: '2000123', quantite: 4, unite: 'kg/ha', heure: '06:30–08:00' });
    expect(lignesRegistre(donnees(), 2025)).toHaveLength(0);
  });

  it('exporte un CSV pour Excel en français', () => {
    const csv = registreCsv(lignesRegistre(donnees()));
    expect(csv.startsWith('﻿Date;Heure;Parcelle')).toBe(true);
    expect(csv).toContain('2026-05-10;06:30–08:00;Le Haut;1,5;Vigne;Bouillie bordelaise;2000123;2;kg/ha;3;Mildiou;57;Adrien;;21 j;2026-05-31');
  });

  it('échappe le HTML du registre imprimable', () => {
    const d = donnees();
    d.parcelles[0].nom = '<b>Graves</b>';
    const html = registreHtml(lignesRegistre(d), 'Registre 2026');
    expect(html).toContain('&lt;b&gt;Graves&lt;/b&gt;');
    expect(html).not.toContain('<b>Graves');
  });
});
