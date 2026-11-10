// Factures d'achat : relier les lignes aux produits du stock, créer les entrées de stock
// avec leur prix, calculer les coûts et préparer l'export pour l'expert-comptable.

import type { FactureLue, LigneLue } from './facturx';
import { quantitesUtilisees } from './registre';
import type { Correspondance, Donnees, FactureAchat, LigneFacture, MouvementStock, Produit, Unite } from './types';

// --- unités ------------------------------------------------------------------

/** Unités UN/ECE convertibles directement vers L ou kg. */
const CONVERSIONS: Record<string, { unite: Unite; facteur: number }> = {
  KGM: { unite: 'kg', facteur: 1 },
  GRM: { unite: 'kg', facteur: 0.001 },
  TNE: { unite: 'kg', facteur: 1000 },
  LTR: { unite: 'L', facteur: 1 },
  MLT: { unite: 'L', facteur: 0.001 },
  HLT: { unite: 'L', facteur: 100 },
};

/** Libellés lisibles des unités de facture les plus courantes. */
export const NOMS_UNITES: Record<string, string> = {
  KGM: 'kg',
  GRM: 'g',
  TNE: 't',
  LTR: 'L',
  MLT: 'mL',
  HLT: 'hL',
  C62: 'unité',
  H87: 'pièce',
  XPP: 'pièce',
  EA: 'unité',
};

export const nomUnite = (code?: string) => (code ? (NOMS_UNITES[code] ?? code) : '');

/** Contenance écrite dans le libellé : « BIDON 10 KG » → 10 kg, « 5L » → 5 L, « 500 ML » → 0,5 L. */
export function contenanceDepuisLibelle(libelle: string, unite: Unite): number | undefined {
  const re = /(\d+(?:[.,]\d+)?)\s*(KGS?|KILOS?|G|GR|L|LT|LTR|LITRES?|ML|CL)\b/gi;
  let derniere: number | undefined;
  for (const m of libelle.matchAll(re)) {
    const v = parseFloat(m[1].replace(',', '.'));
    const u = m[2].toUpperCase();
    const enKg = /^K/.test(u) ? v : /^G/.test(u) ? v / 1000 : undefined;
    const enL = /^(L|LT|LTR|LITRE|LITRES)$/.test(u) ? v : u === 'ML' ? v / 1000 : u === 'CL' ? v / 100 : undefined;
    const r = unite === 'kg' ? enKg : enL;
    if (r != null) derniere = r;
  }
  return derniere;
}

/** Combien de L ou kg du produit représente une unité facturée (null si on ne sait pas). */
export function facteurConversion(ligne: Pick<LigneLue, 'libelle' | 'unite'>, produit: Produit): number | undefined {
  const c = ligne.unite ? CONVERSIONS[ligne.unite] : undefined;
  if (c) return c.unite === produit.unite ? c.facteur : undefined;
  // Unités « pièce » (bidon, sac…) : la contenance est souvent écrite dans le libellé.
  return contenanceDepuisLibelle(ligne.libelle, produit.unite);
}

// --- rapprochement des lignes avec les produits ------------------------------

export const normaliser = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, ' ')
    .trim();

const MOTS_VIDES = new Set(['DE', 'DU', 'LA', 'LE', 'LES', 'ET', 'EN', 'A', 'AU', 'L', 'D']);

/** Le produit dont tous les mots du nom figurent dans le libellé (le nom le plus long gagne). */
function produitParNom(libelle: string, produits: Produit[]): Produit | undefined {
  const mots = new Set(normaliser(libelle).split(' '));
  let meilleur: { p: Produit; n: number } | undefined;
  for (const p of produits) {
    const motsNom = normaliser(p.nom)
      .split(' ')
      .filter((m) => m && !MOTS_VIDES.has(m));
    if (motsNom.length === 0 || !motsNom.every((m) => mots.has(m))) continue;
    if (!meilleur || motsNom.length > meilleur.n) meilleur = { p, n: motsNom.length };
  }
  return meilleur?.p;
}

function correspondanceConnue(produits: Produit[], fournisseur: string, libelle: string): { produit: Produit; c: Correspondance } | undefined {
  const f = normaliser(fournisseur);
  const l = normaliser(libelle);
  for (const produit of produits)
    for (const c of produit.correspondances ?? [])
      if (normaliser(c.libelle) === l && normaliser(c.fournisseur) === f) return { produit, c };
  return undefined;
}

/**
 * Transforme une facture lue en facture de l'app, avec chaque ligne reliée au bon produit quand
 * c'est possible. Le nom du fournisseur reprend celui d'une facture précédente de même n° de TVA.
 */
export function facturePreparee(lue: FactureLue, produits: Produit[], id: string, factures: FactureAchat[] = []): FactureAchat {
  const actifs = produits.filter((p) => !p.archive);
  const connue = lue.tvaFournisseur ? [...factures].reverse().find((f) => f.tvaFournisseur === lue.tvaFournisseur && f.fournisseur) : undefined;
  const fournisseur = connue?.fournisseur ?? lue.fournisseur;
  return {
    id,
    type: lue.type,
    fournisseur,
    tvaFournisseur: lue.tvaFournisseur,
    numero: lue.numero,
    date: lue.date,
    totalHT: lue.totalHT,
    totalTVA: lue.totalTVA,
    totalTTC: lue.totalTTC,
    taxes: lue.taxes,
    source: lue.origine === 'texte' ? 'pdf' : 'facturx',
    lignes: lue.lignes.map((l) => relierLigne(l, fournisseur, actifs)),
  };
}

export function relierLigne(l: LigneLue, fournisseur: string, produits: Produit[]): LigneFacture {
  const connue = correspondanceConnue(produits, fournisseur, l.libelle);
  // Le n° AMM est le lien le plus sûr ; puis un libellé déjà vu ; puis le nom.
  const parAmm = l.amm ? produits.find((p) => p.amm && p.amm.replace(/\D/g, '') === l.amm!.replace(/\D/g, '')) : undefined;
  const produit = parAmm ?? connue?.produit ?? produitParNom(l.libelle, produits);
  const facteur = connue?.c.facteur ?? (produit ? facteurConversion(l, produit) : undefined);
  return {
    ...l,
    produitId: produit?.id,
    quantiteStock: produit && facteur != null ? arrondi(l.quantite * facteur) : undefined,
  };
}

const arrondi = (n: number) => Math.round(n * 1000) / 1000;

// --- enregistrement ----------------------------------------------------------

/** Lignes qui entrent en stock : reliées à un produit, avec une quantité. */
export const lignesEnStock = (f: FactureAchat) => f.lignes.filter((l) => l.produitId && l.quantiteStock && l.quantiteStock > 0);

/**
 * Enregistre la facture : remplace les entrées de stock qu'elle avait créées par celles de ses
 * lignes actuelles, et retient chaque libellé pour relier tout seul la prochaine facture.
 */
export function enregistrerFacture(d: Donnees, f: FactureAchat): Donnees {
  const signe = f.type === 'avoir' ? -1 : 1;
  const mouvements: MouvementStock[] = d.mouvements.filter((m) => m.factureId !== f.id);
  const parId = new Map(d.mouvements.filter((m) => m.factureId === f.id).map((m) => [m.id, m]));
  f.lignes.forEach((l, i) => {
    if (!l.produitId || !l.quantiteStock || l.quantiteStock <= 0) return;
    const id = `${f.id}-l${i}`;
    const nouveau: MouvementStock = {
      id,
      produitId: l.produitId,
      date: f.date,
      type: 'achat',
      quantite: signe * l.quantiteStock,
      fournisseur: f.fournisseur,
      lot: l.lot,
      note: `${f.type === 'avoir' ? 'Avoir' : 'Facture'} ${f.numero}`,
      factureId: f.id,
      // Prix de revient : montant HT plus les taxes de la ligne (redevance pollution).
      prixUnitaireHT: arrondi((l.montantHT + (l.taxeHT ?? 0)) / l.quantiteStock),
    };
    const ancien = parId.get(id);
    // Garder le même objet quand rien ne change : la synchronisation n'envoie que ce qui change.
    mouvements.push(ancien && JSON.stringify({ ...ancien, maj: undefined }) === JSON.stringify({ ...nouveau, maj: undefined }) ? ancien : nouveau);
  });

  const produits = d.produits.map((p) => {
    const apprises = f.lignes
      .filter((l) => l.produitId === p.id && l.quantiteStock && l.quantite > 0)
      .map((l) => ({ fournisseur: f.fournisseur, libelle: l.libelle, facteur: arrondi(l.quantiteStock! / l.quantite) }));
    if (apprises.length === 0) return p;
    const garde = (p.correspondances ?? []).filter(
      (c) => !apprises.some((a) => normaliser(a.libelle) === normaliser(c.libelle) && normaliser(a.fournisseur) === normaliser(c.fournisseur)),
    );
    const correspondances = [...garde, ...apprises];
    return JSON.stringify(correspondances) === JSON.stringify(p.correspondances) ? p : { ...p, correspondances };
  });

  const factures = d.factures.some((x) => x.id === f.id) ? d.factures.map((x) => (x.id === f.id ? f : x)) : [...d.factures, f];
  return { ...d, factures, mouvements, produits };
}

export function supprimerFacture(d: Donnees, id: string): Donnees {
  return { ...d, factures: d.factures.filter((f) => f.id !== id), mouvements: d.mouvements.filter((m) => m.factureId !== id) };
}

/** Une facture du même fournisseur avec le même numéro existe déjà. */
export function doublon(d: Donnees, f: Pick<FactureAchat, 'id' | 'fournisseur' | 'numero'>): FactureAchat | undefined {
  return d.factures.find((x) => x.id !== f.id && normaliser(x.numero) === normaliser(f.numero) && normaliser(x.fournisseur) === normaliser(f.fournisseur));
}

/** Écart entre la somme des lignes et le total HT de la facture (arrondis compris). */
export function ecartTotal(f: FactureAchat): number {
  if (f.totalHT == null) return 0;
  return Math.round((f.lignes.reduce((s, l) => s + l.montantHT, 0) - f.totalHT) * 100) / 100;
}

// --- prix et coûts -----------------------------------------------------------

/** Prix moyen pondéré d'achat d'un produit, en € HT par L ou kg (undefined sans achat chiffré). */
export function prixMoyen(d: Donnees, produitId: string): number | undefined {
  let quantite = 0;
  let montant = 0;
  for (const m of d.mouvements)
    if (m.produitId === produitId && m.type === 'achat' && m.prixUnitaireHT != null && m.quantite > 0) {
      quantite += m.quantite;
      montant += m.quantite * m.prixUnitaireHT;
    }
  return quantite > 0 ? montant / quantite : undefined;
}

export type CoutParcelle = { parcelleId: string; nom: string; surfaceHa: number; cout: number; coutHa: number; sansPrix: string[] };

/** Coût des produits appliqués sur chaque parcelle pendant une année, au prix moyen d'achat. */
export function coutsParParcelle(d: Donnees, annee: number): CoutParcelle[] {
  const prix = new Map(d.produits.map((p) => [p.id, prixMoyen(d, p.id)]));
  const r = new Map<string, CoutParcelle>();
  for (const t of d.traitements) {
    if (!t.date.startsWith(String(annee))) continue;
    for (const tp of t.parcelles) {
      const parcelle = d.parcelles.find((p) => p.id === tp.parcelleId);
      const ligne = r.get(tp.parcelleId) ?? {
        parcelleId: tp.parcelleId,
        nom: parcelle?.nom ?? '(parcelle supprimée)',
        surfaceHa: parcelle?.surfaceHa ?? tp.surfaceHa,
        cout: 0,
        coutHa: 0,
        sansPrix: [],
      };
      for (const pr of t.produits) {
        const px = prix.get(pr.produitId);
        if (px == null) {
          const nom = d.produits.find((p) => p.id === pr.produitId)?.nom ?? '?';
          if (!ligne.sansPrix.includes(nom)) ligne.sansPrix.push(nom);
        } else ligne.cout += pr.doseHa * tp.surfaceHa * px;
      }
      r.set(tp.parcelleId, ligne);
    }
  }
  return [...r.values()]
    .map((l) => ({ ...l, cout: Math.round(l.cout * 100) / 100, coutHa: l.surfaceHa > 0 ? Math.round((l.cout / l.surfaceHa) * 100) / 100 : 0 }))
    .sort((a, b) => b.cout - a.cout);
}

/** Coût d'un traitement, au prix moyen d'achat des produits. */
export function coutTraitement(d: Donnees, t: Donnees['traitements'][number]): number | undefined {
  let total = 0;
  for (const [id, q] of quantitesUtilisees(t)) {
    const px = prixMoyen(d, id);
    if (px == null) return undefined;
    total += q * px;
  }
  return Math.round(total * 100) / 100;
}

// --- export pour l'expert-comptable -----------------------------------------

/** Montant en euros, toujours avec deux décimales : 332,40 €. */
export const euros = (n?: number) => (n == null ? '—' : `${n.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '\u202f')} €`);

const nombreFr = (n?: number) => (n == null ? '' : n.toFixed(2).replace('.', ','));

/** Nom du fichier de la pièce dans l'export : date, fournisseur, numéro. */
export function nomPiece(f: FactureAchat): string {
  const ext = f.piece?.nom.match(/\.[a-z0-9]{2,4}$/i)?.[0] ?? '.pdf';
  const propre = (s: string) => normaliser(s).replace(/ /g, '-').slice(0, 40);
  return `${f.date}_${propre(f.fournisseur)}_${propre(f.numero)}${ext.toLowerCase()}`;
}

export function facturesDeLaPeriode(d: Donnees, du: string, au: string): FactureAchat[] {
  return d.factures.filter((f) => f.date >= du && f.date <= au).sort((a, b) => a.date.localeCompare(b.date) || a.numero.localeCompare(b.numero));
}

/** CSV pour Excel en français : une ligne par facture. */
export function exportComptableCsv(factures: FactureAchat[]): string {
  const cellule = (v: string) => (/[;"\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  const lignes = [
    ['Date', 'Fournisseur', 'Numéro', 'Type', 'Total HT', 'TVA', 'Autres taxes', 'Total TTC', 'Pièce'].join(';'),
    ...factures.map((f) =>
      [
        f.date,
        f.fournisseur,
        f.numero,
        f.type === 'avoir' ? 'Avoir' : 'Facture',
        nombreFr(f.type === 'avoir' && f.totalHT ? -Math.abs(f.totalHT) : f.totalHT),
        nombreFr(f.type === 'avoir' && f.totalTVA ? -Math.abs(f.totalTVA) : f.totalTVA),
        nombreFr(f.type === 'avoir' && f.taxes ? -Math.abs(f.taxes) : f.taxes),
        nombreFr(f.type === 'avoir' && f.totalTTC ? -Math.abs(f.totalTTC) : f.totalTTC),
        f.piece ? nomPiece(f) : '(pas de pièce)',
      ]
        .map(cellule)
        .join(';'),
    ),
  ];
  return '﻿' + lignes.join('\r\n') + '\r\n';
}
