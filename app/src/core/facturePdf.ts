// Lecture d'une facture PDF « classique » (sans données Factur-X), à partir de son texte :
// numéro, date, fournisseur, lignes du tableau (référence, désignation, quantité, unité, prix,
// montant), n° AMM et lot sous chaque produit, redevance pollution, totaux.
// Les règles suivent la présentation habituelle des factures de distributeurs agricoles ;
// tout ce qui est lu reste à vérifier dans l'app.

import type { FactureLue, LigneLue } from './facturx';
import type { LigneTexte } from './pdfTexte';

const RE_NOMBRE = /^-?(\d{1,3}(?:[   .]\d{3})+|\d+)(?:[.,]\d+)?\s*€?$/;
const RE_DATE = /\b(\d{1,2})[/.-](\d{1,2})[/.-](\d{2}|\d{4})\b/;

export const estNombre = (s: string) => RE_NOMBRE.test(s.trim()) || /^-?\d+[.,]\d+\s*€?$/.test(s.trim());

/** « 1 234,56 », « 1.234,56 », « 140.00 », « 196.84 € » → nombre. */
export function lireNombreFr(s: string): number {
  let t = s.replace(/[€\s  ]/g, '');
  const p = t.lastIndexOf('.');
  const v = t.lastIndexOf(',');
  if (p >= 0 && v >= 0) t = p > v ? t.replace(/,/g, '') : t.replace(/\./g, '').replace(',', '.');
  else if (v >= 0) t = t.replace(',', '.');
  else if ((t.match(/\./g) ?? []).length > 1) t = t.replace(/\./g, '');
  return parseFloat(t);
}

/** Unités écrites en toutes lettres → codes UN/ECE utilisés par le reste de l'app. */
export function codeUnite(u: string): string | undefined {
  const t = u
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/[.\s]/g, '');
  if (/^(L|LT|LTR|LITRES?)$/.test(t)) return 'LTR';
  if (/^(KG|KGS|KILOS?)$/.test(t)) return 'KGM';
  if (/^(G|GR|GRAMMES?)$/.test(t)) return 'GRM';
  if (/^(T|TO|TONNES?)$/.test(t)) return 'TNE';
  if (/^HL$/.test(t)) return 'HLT';
  if (/^(ML)$/.test(t)) return 'MLT';
  if (/^(U|UN|UNI|UNITES?|PCE|PCES|PIECES?|BIDONS?|BID|SACS?|FUTS?|CARTONS?|BIGBAGS?|PALETTES?|DOSES?)$/.test(t)) return 'C62';
  return undefined;
}

const RE_TAXE = /redev|pollution|\bRPD\b|taxe|[ée]co-?(part|contrib)|adivalor/i;
const RE_ENTETE = /D[ÉE]SIGNATION|LIBELL[ÉE]|ARTICLE|PRODUIT/i;
const RE_ENTETE_QTE = /QUANTIT|\bQT[ÉE]\b|\bQTE\b/i;
const RE_FIN = /^(TOTAUX|TOTAL\b|SOUS[- ]TOTAL|BASE\s*\d|INTITUL|R[ÉE]CAPITULATIF|NET\s*[ÀA]\s*PAYER)/i;

/** Lit une facture d'après les lignes de texte de son PDF. Renvoie null si rien d'une facture n'y est reconnu. */
export function lireFactureTexte(lignes: LigneTexte[]): FactureLue | null {
  const texte = lignes.map((l) => l.texte);

  // Numéro et type.
  let numero = '';
  let type: FactureLue['type'] = 'facture';
  for (const t of texte) {
    const m = /\b(FACTURE|AVOIR)\b[^A-Z0-9]{0,6}(?:N\s*[°º]|NO\.?|NUM[ÉE]RO)?\s*:?\s*([A-Z0-9][A-Z0-9/._-]{2,})/i.exec(t);
    if (m && /\d/.test(m[2])) {
      numero = m[2];
      if (/avoir/i.test(m[1])) type = 'avoir';
      break;
    }
  }

  // Date : sous le libellé « Date pièce / facture », sinon la première date du document.
  let date = '';
  lignes.some((l, i) => {
    const etiquette = l.cellules.find((c) => /date\s*(de\s*(la\s*)?)?(pi[eè]ce|facture|d['’]?\s*[ée]mission)/i.test(c.texte));
    if (!etiquette) return false;
    for (const s of lignes.slice(i, i + 4)) {
      const c = s.cellules.find((x) => RE_DATE.test(x.texte) && Math.abs(x.x - etiquette.x) < 80 && x !== etiquette);
      const m = c && RE_DATE.exec(c.texte);
      if (m) return (date = isoDate(m)), true;
      const meme = RE_DATE.exec(etiquette.texte);
      if (meme) return (date = isoDate(meme)), true;
    }
    return false;
  });
  if (!date) {
    const m = texte.map((t) => RE_DATE.exec(t)).find(Boolean);
    if (m) date = isoDate(m);
  }

  // Fournisseur : n° de TVA (le premier du document, en principe celui de l'émetteur) et nom.
  const tvaBrut = texte.map((t) => /\bFR\s?[0-9A-Z]{2}\s?\d{3}\s?\d{3}\s?\d{3}\b/.exec(t)).find(Boolean);
  const tvaFournisseur = tvaBrut ? tvaBrut[0].replace(/\s/g, '') : undefined;
  let fournisseur = '';
  const titulaire = texte.map((t) => /(?:LIBELL[ÉE]|TITULAIRE)\s+DU\s+COMPTE\s*:?\s*(.+)/i.exec(t)).find(Boolean);
  if (titulaire) fournisseur = sansFormeJuridique(titulaire[1]);
  if (!fournisseur) {
    const site = texte.map((t) => /\bwww\.([a-z0-9-]+)\./i.exec(t)).find(Boolean);
    if (site) fournisseur = site[1].replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }

  // Tableau des lignes.
  const debut = lignes.findIndex((l) => RE_ENTETE.test(l.texte) && RE_ENTETE_QTE.test(l.texte));
  const produits: LigneLue[] = [];
  if (debut >= 0) {
    for (const l of lignes.slice(debut + 1)) {
      const t = l.texte.trim();
      // Fin du tableau : une cellule « Totaux », « Base 2 », « Intitulé » (récapitulatif de TVA)…
      if (RE_FIN.test(t) || l.cellules.some((c) => RE_FIN.test(c.texte.trim()))) break;
      const precedente = produits[produits.length - 1];
      const amm = /\bAMM\s*:?\s*(\d{6,8})\b/i.exec(t);
      if (amm && precedente) {
        precedente.amm = amm[1];
        continue;
      }
      const lot = /^(?:N\s*[°º]\s*)?LOT\s*:?\s*([A-Z0-9][A-Z0-9/._-]{2,})/i.exec(t);
      if (lot && precedente) {
        precedente.lot = lot[1];
        continue;
      }
      const ligne = lireLigneProduit(l);
      if (!ligne) continue;
      if (RE_TAXE.test(ligne.libelle) && precedente) {
        precedente.taxeHT = Math.round(((precedente.taxeHT ?? 0) + ligne.montantHT) * 100) / 100;
        continue;
      }
      produits.push(ligne);
    }
  }

  // Totaux.
  let totalHT: number | undefined;
  let totalTVA: number | undefined;
  let totalTTC: number | undefined;
  let taxes: number | undefined;
  const totaux = lignes.find((l) => /^(TOTAUX|TOTAL)$/i.test(l.cellules[0]?.texte.trim() ?? '') || /^TOTAUX\b/i.test(l.texte));
  const n = totaux?.cellules.filter((c) => estNombre(c.texte)).map((c) => lireNombreFr(c.texte)) ?? [];
  if (n.length >= 5) {
    [totalHT, totalTVA, taxes, , totalTTC] = [n[0], n[1] + n[3], n[2], 0, n[n.length - 1]];
    totalTVA = Math.round(totalTVA! * 100) / 100;
  } else if (n.length >= 3) [totalHT, totalTVA, totalTTC] = [n[0], n[1], n[n.length - 1]];
  else if (n.length === 2) [totalHT, totalTTC] = n;
  const dernierNombre = (re: RegExp) => {
    const l = lignes.find((x) => re.test(x.texte));
    const c = l ? [...l.cellules].reverse().find((x) => estNombre(x.texte)) : undefined;
    return c ? lireNombreFr(c.texte) : undefined;
  };
  totalHT ??= dernierNombre(/total\s*h\.?\s*t\.?\b|montant\s*h\.?\s*t\.?\b/i);
  totalTTC ??= dernierNombre(/total\s*t\.?\s*t\.?\s*c|net\s*[àa]\s*payer|montant\s*t\.?\s*t\.?\s*c/i);
  totalTVA ??= dernierNombre(/total\s*t\.?\s*v\.?\s*a|montant\s*t\.?\s*v\.?\s*a/i);

  if (!numero && produits.length === 0 && totalTTC == null) return null;
  return {
    type,
    numero: numero || 'sans numéro',
    date,
    fournisseur,
    tvaFournisseur,
    totalHT,
    totalTVA,
    totalTTC,
    taxes,
    lignes: produits,
  };
}

/**
 * Une ligne de produit : [référence] désignation quantité [unité] prix… montant [code TVA].
 * Il faut au moins deux nombres après la désignation (quantité et montant).
 */
function lireLigneProduit(l: LigneTexte): LigneLue | null {
  const cells = l.cellules.map((c) => c.texte.trim()).filter(Boolean);
  // La désignation est la première cellule de texte ; avant elle, une référence (souvent un nombre).
  const d = cells.findIndex((c) => !estNombre(c) && /[A-Za-zÀ-ÿ]/.test(c));
  if (d < 0 || d > 1) return null;
  const premierNombre = cells.findIndex((c, i) => i > d && estNombre(c));
  if (premierNombre < 0) return null;
  const nombresApres = cells.slice(premierNombre).filter((c) => estNombre(c));
  if (nombresApres.length < 2) return null;

  const avant = cells.slice(d, premierNombre);
  let reference: string | undefined = d === 1 && cells[0].length <= 20 ? cells[0] : undefined;
  if (!reference && avant.length >= 2 && /^[A-Z0-9][A-Z0-9./_-]*$/i.test(avant[0]) && /\d/.test(avant[0]) && avant[0].length <= 20) reference = avant.shift();
  const libelle = avant.join(' ').trim();
  if (!libelle) return null;

  const quantite = lireNombreFr(cells[premierNombre]);
  let reste = cells.slice(premierNombre + 1);
  let unite: string | undefined;
  if (reste.length && !estNombre(reste[0]) && reste[0].length <= 10) {
    unite = codeUnite(reste[0]) ?? reste[0];
    reste = reste.slice(1);
  }
  let nombres = reste.filter((c) => estNombre(c));
  // Dernière colonne courte sans décimales (1, 2…) : code de TVA, pas un montant.
  if (nombres.length >= 2 && /^\d{1,2}$/.test(nombres[nombres.length - 1])) nombres = nombres.slice(0, -1);
  if (nombres.length === 0) return null;
  const montantHT = lireNombreFr(nombres[nombres.length - 1]);
  const prix = nombres.length >= 2 ? lireNombreFr(nombres[nombres.length - 2]) : quantite ? montantHT / quantite : undefined;
  return { libelle, reference, quantite, unite, prixUnitaireHT: prix, montantHT };
}

function isoDate(m: RegExpExecArray): string {
  const annee = m[3].length === 2 ? `20${m[3]}` : m[3];
  return `${annee}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
}

function sansFormeJuridique(nom: string): string {
  return nom
    .replace(/\b(SAS|SASU|SARL|EURL|SA|SCA|SCEA|EARL|GAEC|SNC|SCOP|SICA)\b\.?/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}
