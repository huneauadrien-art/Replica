/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { strToU8, zlibSync } from 'fflate';
import { describe, expect, it } from 'vitest';
import {
  contenanceDepuisLibelle,
  coutsParParcelle,
  doublon,
  ecartTotal,
  enregistrerFacture,
  exportComptableCsv,
  facturePreparee,
  nomPiece,
  prixMoyen,
  relierLigne,
  supprimerFacture,
} from '../factures';
import { extraireXmlFacturX, lireCII, lireFactureElectronique } from '../facturx';
import { stockActuel } from '../registre';
import { DONNEES_VIDES, type Donnees } from '../types';

const fixture = (nom: string) => new Uint8Array(readFileSync(join(__dirname, 'fixtures', nom)));

const donnees = (): Donnees => ({
  ...DONNEES_VIDES,
  parcelles: [{ id: 'p1', nom: 'Les Graves', surfaceHa: 2, contour: [] }],
  produits: [
    { id: 'cuivre', nom: 'Bouillie bordelaise RSR', unite: 'kg' },
    { id: 'soufre', nom: 'Soufre mouillable', unite: 'kg' },
  ],
});

describe('lecture Factur-X', () => {
  it('trouve le XML caché dans un vrai PDF Factur-X et lit la facture', () => {
    const f = lireFactureElectronique(fixture('facture-coop-facturx.pdf'));
    expect(f).toMatchObject({
      type: 'facture',
      numero: 'FA-2026-00417',
      date: '2026-09-15',
      fournisseur: 'Cooperative Exemple des Coteaux',
      totalHT: 277,
      totalTVA: 55.4,
      totalTTC: 332.4,
    });
    expect(f.lignes).toHaveLength(3);
    expect(f.lignes[0]).toMatchObject({ libelle: 'BOUILLIE BORDELAISE RSR DISPERSS 25 KG', reference: 'CU-RSR-25', quantite: 50, unite: 'KGM', prixUnitaireHT: 3.8, montantHT: 190, tauxTVA: 20 });
    expect(f.lignes[1].libelle).toBe('SOUFRE MOUILLABLE MICRO & DISP. BIDON 10 KG');
  });

  it('lit aussi un XML CII seul, et reconnaît un avoir', () => {
    const xml = readFileSync(join(__dirname, 'fixtures', 'facture-coop.xml'), 'utf8').replace('<ram:TypeCode>380</ram:TypeCode>', '<ram:TypeCode>381</ram:TypeCode>');
    expect(lireFactureElectronique(strToU8(xml)).type).toBe('avoir');
  });

  it('trouve un XML compressé même sans /Type /EmbeddedFile', () => {
    const xml = readFileSync(join(__dirname, 'fixtures', 'facture-coop.xml'), 'utf8');
    const flux = zlibSync(strToU8(xml));
    const pdf = new Uint8Array([
      ...strToU8('%PDF-1.7\n4 0 obj\n<< /Length 1 0 R /Filter /FlateDecode >>\nstream\r\n'),
      ...flux,
      ...strToU8('\r\nendstream\nendobj\n%%EOF'),
    ]);
    expect(extraireXmlFacturX(pdf)).toContain('FA-2026-00417');
  });

  it('explique quand le PDF ne contient pas de données', () => {
    expect(() => lireFactureElectronique(strToU8('%PDF-1.4\n1 0 obj << >> endobj'))).toThrow(/saisissez les lignes à la main/);
    expect(() => lireFactureElectronique(strToU8('bonjour'))).toThrow(/ni un PDF ni un XML/);
  });

  it('accepte une facture sans lignes (profil minimum)', () => {
    const xml = `<rsm:CrossIndustryInvoice xmlns:rsm="x" xmlns:ram="y" xmlns:udt="z"><rsm:ExchangedDocument><ram:ID>7</ram:ID><ram:TypeCode>380</ram:TypeCode>
      <ram:IssueDateTime><udt:DateTimeString format="102">20261101</udt:DateTimeString></ram:IssueDateTime></rsm:ExchangedDocument>
      <rsm:SupplyChainTradeTransaction><ram:ApplicableHeaderTradeAgreement><ram:SellerTradeParty><ram:Name>Négoce Dupont</ram:Name></ram:SellerTradeParty></ram:ApplicableHeaderTradeAgreement>
      <ram:ApplicableHeaderTradeSettlement><ram:SpecifiedTradeSettlementHeaderMonetarySummation><ram:TaxBasisTotalAmount>100</ram:TaxBasisTotalAmount><ram:GrandTotalAmount>120</ram:GrandTotalAmount></ram:SpecifiedTradeSettlementHeaderMonetarySummation></ram:ApplicableHeaderTradeSettlement></rsm:SupplyChainTradeTransaction></rsm:CrossIndustryInvoice>`;
    expect(lireCII(xml)).toMatchObject({ fournisseur: 'Négoce Dupont', date: '2026-11-01', totalTTC: 120, lignes: [] });
  });
});

describe('lignes reliées au stock', () => {
  const lue = () => lireFactureElectronique(fixture('facture-coop-facturx.pdf'));

  it('reconnaît les produits par leur nom et convertit les quantités', () => {
    const f = facturePreparee(lue(), donnees().produits, 'f1');
    expect(f.lignes.map((l) => [l.produitId, l.quantiteStock])).toEqual([
      ['cuivre', 50], // 50 KGM
      ['soufre', 30], // 3 bidons de 10 kg
      [undefined, undefined], // frais de livraison
    ]);
  });

  it('lit la contenance écrite dans le libellé', () => {
    expect(contenanceDepuisLibelle('BIDON 5L', 'L')).toBe(5);
    expect(contenanceDepuisLibelle('SAC 25 KG', 'kg')).toBe(25);
    expect(contenanceDepuisLibelle('FLACON 500 ML', 'L')).toBe(0.5);
    expect(contenanceDepuisLibelle('SAC 25 KG', 'L')).toBeUndefined();
  });

  it('entre en stock avec le prix, et retient le libellé pour la facture suivante', () => {
    let d = donnees();
    d = enregistrerFacture(d, facturePreparee(lue(), d.produits, 'f1'));
    expect(stockActuel(d, 'cuivre')).toBe(50);
    expect(stockActuel(d, 'soufre')).toBe(30);
    expect(prixMoyen(d, 'cuivre')).toBe(3.8);
    expect(prixMoyen(d, 'soufre')).toBe(2.4); // 72 € pour 30 kg

    // Le produit est renommé : la correspondance apprise suffit à relier la ligne.
    const renomme = d.produits.map((p) => (p.id === 'soufre' ? { ...p, nom: 'Thiovit' } : p));
    const ligne = relierLigne(lue().lignes[1], 'Cooperative Exemple des Coteaux', renomme);
    expect([ligne.produitId, ligne.quantiteStock]).toEqual(['soufre', 30]);
  });

  it('remplace ses entrées de stock quand on la corrige, et les retire quand on la supprime', () => {
    let d = donnees();
    const f = facturePreparee(lue(), d.produits, 'f1');
    d = enregistrerFacture(d, f);
    d = enregistrerFacture(d, { ...f, lignes: f.lignes.map((l, i) => (i === 0 ? { ...l, quantiteStock: 25 } : l)) });
    expect(stockActuel(d, 'cuivre')).toBe(25);
    expect(d.mouvements.filter((m) => m.factureId === 'f1')).toHaveLength(2);
    d = supprimerFacture(d, 'f1');
    expect(stockActuel(d, 'cuivre')).toBe(0);
    expect(d.factures).toHaveLength(0);
  });

  it('ne recrée pas les entrées de stock inchangées (pas de synchronisation inutile)', () => {
    let d = donnees();
    const f = facturePreparee(lue(), d.produits, 'f1');
    d = enregistrerFacture(d, f);
    const avant = d.mouvements.find((m) => m.id === 'f1-l0');
    d = enregistrerFacture(d, { ...f, notes: 'payée' });
    expect(d.mouvements.find((m) => m.id === 'f1-l0')).toBe(avant);
  });

  it('un avoir retire du stock', () => {
    let d = donnees();
    d = enregistrerFacture(d, facturePreparee(lue(), d.produits, 'f1'));
    d = enregistrerFacture(d, { ...facturePreparee({ ...lue(), type: 'avoir', numero: 'AV-1' }, d.produits, 'f2') });
    expect(stockActuel(d, 'cuivre')).toBe(0);
  });

  it('repère une facture importée deux fois et un total qui ne colle pas', () => {
    let d = donnees();
    const f = facturePreparee(lue(), d.produits, 'f1');
    d = enregistrerFacture(d, f);
    expect(doublon(d, { id: 'f9', fournisseur: 'COOPERATIVE exemple des coteaux', numero: 'fa-2026-00417' })?.id).toBe('f1');
    expect(ecartTotal(f)).toBe(0);
    expect(ecartTotal({ ...f, totalHT: 280 })).toBe(-3);
  });
});

describe('coûts et export', () => {
  it('calcule le coût des traitements par parcelle au prix moyen', () => {
    let d = donnees();
    d = enregistrerFacture(d, facturePreparee(lireFactureElectronique(fixture('facture-coop-facturx.pdf')), d.produits, 'f1'));
    d = {
      ...d,
      traitements: [
        { id: 't1', date: '2026-10-01', parcelles: [{ parcelleId: 'p1', surfaceHa: 2 }], produits: [{ produitId: 'cuivre', doseHa: 2 }], operateur: 'A' },
      ],
    };
    expect(coutsParParcelle(d, 2026)).toEqual([
      { parcelleId: 'p1', nom: 'Les Graves', surfaceHa: 2, cout: 15.2, coutHa: 7.6, sansPrix: [] },
    ]);
  });

  it('prépare un CSV et des noms de pièces lisibles pour le comptable', () => {
    const d = donnees();
    const f = { ...facturePreparee(lireFactureElectronique(fixture('facture-coop-facturx.pdf')), d.produits, 'f1'), piece: { id: 'x', nom: 'Facture.PDF', type: 'application/pdf', taille: 1 } };
    expect(nomPiece(f)).toBe('2026-09-15_COOPERATIVE-EXEMPLE-DES-COTEAUX_FA-2026-00417.pdf');
    const csv = exportComptableCsv([f, { ...f, id: 'f2', type: 'avoir', numero: 'AV-1', piece: undefined }]);
    expect(csv).toContain('2026-09-15;Cooperative Exemple des Coteaux;FA-2026-00417;Facture;277,00;55,40;332,40;2026-09-15_');
    expect(csv).toContain('AV-1;Avoir;-277,00;-55,40;-332,40;(pas de pièce)');
  });
});

import { euros } from '../factures';

describe('montants', () => {
  it('affiche toujours deux décimales et sépare les milliers', () => {
    expect(euros(332.4)).toBe('332,40 €');
    expect(euros(1234567.891)).toBe('1 234 567,89 €');
    expect(euros(undefined)).toBe('—');
  });
});
