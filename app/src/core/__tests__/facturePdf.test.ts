/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { enregistrerFacture, facturePreparee, prixMoyen } from '../factures';
import { codeUnite, lireNombreFr } from '../facturePdf';
import { lireFactureElectronique } from '../facturx';
import { lignesDuPdf } from '../pdfTexte';
import { stockActuel } from '../registre';
import { DONNEES_VIDES, type Donnees } from '../types';

const pdf = () => new Uint8Array(readFileSync(join(__dirname, 'fixtures', 'facture-texte.pdf')));

describe('facture PDF classique (sans Factur-X)', () => {
  it('retrouve les lignes et les colonnes du texte', () => {
    const l = lignesDuPdf(pdf());
    const produit = l.find((x) => x.texte.startsWith('40011'));
    expect(produit?.cellules.map((c) => c.texte.trim())).toEqual(['40011', 'HERBICIDE EXEMPLE 20L (1 BIDON.)', '40.000', 'L', '6.50', '6.50', '260.00', '2']);
    expect(l.some((x) => x.texte.includes('DÉSIGNATION'))).toBe(true); // accents en Windows-1252
  });

  it('lit l’en-tête, les lignes, l’AMM, le lot, la redevance et les totaux', () => {
    const f = lireFactureElectronique(pdf());
    expect(f).toMatchObject({
      origine: 'texte',
      type: 'facture',
      numero: 'FV000123',
      date: '2026-09-15',
      fournisseur: 'AGRO EXEMPLE',
      tvaFournisseur: 'FR99999999999',
      totalHT: 444.5,
      totalTVA: 97.7,
      taxes: 44,
      totalTTC: 586.2,
    });
    expect(f.lignes).toEqual([
      { libelle: 'HERBICIDE EXEMPLE 20L (1 BIDON.)', reference: '40011', quantite: 40, unite: 'LTR', prixUnitaireHT: 6.5, montantHT: 260, amm: '9990001', lot: 'LOT-AB123', taxeHT: 44 },
      { libelle: 'BOUILLIE BORDELAISE RSR SAC 25 KG', reference: '52002', quantite: 2, unite: 'C62', prixUnitaireHT: 90.25, montantHT: 180.5, amm: '9990002' },
      { libelle: 'PRESTA/LOG', reference: '3379', quantite: 40, unite: 'C62', prixUnitaireHT: 0.1, montantHT: 4 },
    ]);
  });

  it('relie par n° AMM, convertit les sacs, et compte la redevance dans le prix de revient', () => {
    let d: Donnees = {
      ...DONNEES_VIDES,
      produits: [
        { id: 'h', nom: 'Désherbant du domaine', amm: '9990001', unite: 'L' },
        { id: 'cu', nom: 'Cuivre', amm: '9990002', unite: 'kg' },
      ],
    };
    const f = facturePreparee(lireFactureElectronique(pdf()), d.produits, 'f1');
    expect(f.source).toBe('pdf');
    expect(f.lignes.map((l) => [l.produitId, l.quantiteStock])).toEqual([
      ['h', 40],
      ['cu', 50], // 2 sacs de 25 kg
      [undefined, undefined],
    ]);
    d = enregistrerFacture(d, f);
    expect(stockActuel(d, 'h')).toBe(40);
    expect(prixMoyen(d, 'h')).toBe(7.6); // (260 + 44 de redevance) / 40 L
    expect(d.mouvements.find((m) => m.produitId === 'h')?.lot).toBe('LOT-AB123');
  });

  it('reprend le nom de fournisseur corrigé sur une facture précédente de même n° de TVA', () => {
    const avant = { ...facturePreparee(lireFactureElectronique(pdf()), [], 'f0'), fournisseur: 'Agro Exemple Reignac' };
    expect(facturePreparee(lireFactureElectronique(pdf()), [], 'f1', [avant]).fournisseur).toBe('Agro Exemple Reignac');
  });

  it('comprend les nombres et les unités écrits à la française', () => {
    expect(lireNombreFr('1 234,56')).toBe(1234.56);
    expect(lireNombreFr('1.234,56')).toBe(1234.56);
    expect(lireNombreFr('196.84 €')).toBe(196.84);
    expect(lireNombreFr('20.000')).toBe(20);
    expect(['L', 'Kg', 'tonne', 'UNITE', 'bidon', 'xx'].map(codeUnite)).toEqual(['LTR', 'KGM', 'TNE', 'C62', 'C62', undefined]);
  });
});
