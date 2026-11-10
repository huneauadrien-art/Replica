// Lecture des factures électroniques Factur-X : un PDF qui contient, en pièce jointe,
// un fichier XML au format CII (Cross Industry Invoice) avec toutes les données de la facture.
// Pas de dépendance au téléphone : tout est testable.

import { strFromU8, unzlibSync, inflateSync } from 'fflate';

export type LigneLue = {
  libelle: string;
  reference?: string;
  quantite: number;
  /** Code d'unité UN/ECE (KGM, LTR, C62…). */
  unite?: string;
  prixUnitaireHT?: number;
  montantHT: number;
  tauxTVA?: number;
};

export type FactureLue = {
  type: 'facture' | 'avoir';
  numero: string;
  /** AAAA-MM-JJ */
  date: string;
  fournisseur: string;
  totalHT?: number;
  totalTVA?: number;
  totalTTC?: number;
  lignes: LigneLue[];
};

export class ErreurFacture extends Error {}

/** Cherche le XML CII caché dans un PDF Factur-X. Renvoie null si le PDF n'en contient pas. */
export function extraireXmlFacturX(pdf: Uint8Array): string | null {
  const flux = trouverFlux(pdf);
  // D'abord les pièces jointes déclarées, puis tous les flux raisonnables.
  const ordre = [...flux.filter((f) => /EmbeddedFile|xml/i.test(f.dict)), ...flux.filter((f) => !/EmbeddedFile|xml/i.test(f.dict))];
  for (const f of ordre) {
    if (f.fin - f.debut > 5_000_000) continue;
    let contenu = pdf.subarray(f.debut, f.fin);
    if (/FlateDecode/.test(f.dict)) {
      const d = decompresser(contenu);
      if (!d) continue;
      contenu = d;
    } else if (/\/Filter/.test(f.dict)) continue;
    const debut = strFromU8(contenu.subarray(0, 2000), true);
    if (/CrossIndustryInvoice/.test(debut) || /CrossIndustryInvoice/.test(strFromU8(contenu, true))) {
      return strFromU8(contenu).replace(/^﻿/, '');
    }
  }
  return null;
}

/** Lit une facture PDF Factur-X ou un fichier XML CII seul. */
export function lireFactureElectronique(octets: Uint8Array): FactureLue {
  const entete = strFromU8(octets.subarray(0, 1024), true);
  let xml: string | null;
  if (entete.startsWith('%PDF')) {
    xml = extraireXmlFacturX(octets);
    if (!xml)
      throw new ErreurFacture("Ce PDF ne contient pas de données Factur-X : saisissez les lignes à la main.");
  } else if (/<\?xml|<[\w:]*CrossIndustryInvoice/.test(entete)) {
    xml = strFromU8(octets).replace(/^﻿/, '');
  } else {
    throw new ErreurFacture("Ce fichier n'est ni un PDF ni un XML de facture.");
  }
  return lireCII(xml);
}

// --- PDF ---------------------------------------------------------------------

type Flux = { dict: string; debut: number; fin: number };

/** Repère les flux « stream … endstream » et le dictionnaire qui les précède. */
function trouverFlux(pdf: Uint8Array): Flux[] {
  const flux: Flux[] = [];
  const motStream = [0x73, 0x74, 0x72, 0x65, 0x61, 0x6d]; // stream
  const motFin = [0x65, 0x6e, 0x64, 0x73, 0x74, 0x72, 0x65, 0x61, 0x6d]; // endstream
  let i = 0;
  while ((i = chercher(pdf, motStream, i)) >= 0) {
    // « endstream » contient « stream » : on l'ignore.
    if (i >= 3 && pdf[i - 3] === 0x65 && pdf[i - 2] === 0x6e && pdf[i - 1] === 0x64) {
      i += 6;
      continue;
    }
    let debut = i + 6;
    if (pdf[debut] === 0x0d) debut++;
    if (pdf[debut] === 0x0a) debut++;
    const fin = chercher(pdf, motFin, debut);
    if (fin < 0) break;
    let finDonnees = fin;
    while (finDonnees > debut && (pdf[finDonnees - 1] === 0x0a || pdf[finDonnees - 1] === 0x0d)) finDonnees--;
    const dict = strFromU8(pdf.subarray(Math.max(0, i - 1500), i), true);
    flux.push({ dict: dict.slice(dict.lastIndexOf(' obj') + 1), debut, fin: finDonnees });
    i = fin + motFin.length;
  }
  return flux;
}

function chercher(o: Uint8Array, motif: number[], depuis: number): number {
  outer: for (let i = depuis; i <= o.length - motif.length; i++) {
    for (let k = 0; k < motif.length; k++) if (o[i + k] !== motif[k]) continue outer;
    return i;
  }
  return -1;
}

function decompresser(o: Uint8Array): Uint8Array | null {
  try {
    return unzlibSync(o);
  } catch {
    try {
      return inflateSync(o);
    } catch {
      return null;
    }
  }
}

// --- XML ---------------------------------------------------------------------

type Noeud = { nom: string; attributs: Record<string, string>; enfants: Noeud[]; texte: string };

/** Petit lecteur XML (suffisant pour le CII) : éléments, attributs, texte, CDATA, entités. */
export function lireXml(xml: string): Noeud {
  const racine: Noeud = { nom: '#racine', attributs: {}, enfants: [], texte: '' };
  const pile: Noeud[] = [racine];
  const re = /<!--[\s\S]*?-->|<!\[CDATA\[([\s\S]*?)\]\]>|<\?[\s\S]*?\?>|<!DOCTYPE[^>]*>|<\/\s*([\w:.-]+)\s*>|<([\w:.-]+)((?:\s+[\w:.-]+\s*=\s*(?:"[^"]*"|'[^']*'))*)\s*(\/?)>|([^<]+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml))) {
    const courant = pile[pile.length - 1];
    if (m[1] !== undefined) courant.texte += m[1];
    else if (m[2]) {
      if (pile.length > 1) pile.pop();
    } else if (m[3]) {
      const attributs: Record<string, string> = {};
      for (const a of m[4].matchAll(/([\w:.-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) attributs[local(a[1])] = entites(a[2] ?? a[3] ?? '');
      const n: Noeud = { nom: local(m[3]), attributs, enfants: [], texte: '' };
      courant.enfants.push(n);
      if (!m[5]) pile.push(n);
    } else if (m[6]) courant.texte += entites(m[6]);
  }
  return racine;
}

const local = (nom: string) => nom.slice(nom.indexOf(':') + 1);

function entites(t: string): string {
  return t.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (_, e: string) => {
    if (e[0] === '#') return String.fromCodePoint(e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10));
    return ({ amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" } as Record<string, string>)[e.toLowerCase()];
  });
}

/** Premier descendant qui suit le chemin de noms (sans préfixe d'espace de noms). */
function trouver(n: Noeud | undefined, ...chemin: string[]): Noeud | undefined {
  let courant = n;
  for (const nom of chemin) {
    if (!courant) return undefined;
    courant = descendant(courant, nom);
  }
  return courant;
}

function descendant(n: Noeud, nom: string): Noeud | undefined {
  for (const e of n.enfants) {
    if (e.nom === nom) return e;
    const d = descendant(e, nom);
    if (d) return d;
  }
  return undefined;
}

function tous(n: Noeud, nom: string): Noeud[] {
  const r: Noeud[] = [];
  for (const e of n.enfants) {
    if (e.nom === nom) r.push(e);
    else r.push(...tous(e, nom));
  }
  return r;
}

const texte = (n?: Noeud) => n?.texte.trim() ?? '';
const nombre = (n?: Noeud) => {
  const v = parseFloat(texte(n));
  return Number.isFinite(v) ? v : undefined;
};

// --- CII ---------------------------------------------------------------------

export function lireCII(xml: string): FactureLue {
  const racine = lireXml(xml);
  const doc = descendant(racine, 'CrossIndustryInvoice');
  if (!doc) throw new ErreurFacture("Ce XML n'est pas une facture au format CII.");

  const entete = trouver(doc, 'ExchangedDocument');
  const typeCode = texte(trouver(entete, 'TypeCode'));
  const dateBrute = texte(trouver(entete, 'IssueDateTime', 'DateTimeString'));
  const transaction = trouver(doc, 'SupplyChainTradeTransaction');
  const vendeur = trouver(transaction, 'ApplicableHeaderTradeAgreement', 'SellerTradeParty');
  const totaux = trouver(transaction, 'ApplicableHeaderTradeSettlement', 'SpecifiedTradeSettlementHeaderMonetarySummation');

  const lignes: LigneLue[] = (transaction ? tous(transaction, 'IncludedSupplyChainTradeLineItem') : []).map((l) => {
    const produit = trouver(l, 'SpecifiedTradeProduct');
    const quantiteN = trouver(l, 'SpecifiedLineTradeDelivery', 'BilledQuantity');
    const quantite = nombre(quantiteN) ?? 0;
    const prix = trouver(l, 'SpecifiedLineTradeAgreement', 'NetPriceProductTradePrice');
    const base = nombre(trouver(prix, 'BasisQuantity')) ?? 1;
    const charge = nombre(trouver(prix, 'ChargeAmount'));
    const montant = nombre(trouver(l, 'SpecifiedTradeSettlementLineMonetarySummation', 'LineTotalAmount'));
    return {
      libelle: texte(trouver(produit, 'Name')) || 'Ligne sans libellé',
      reference: texte(trouver(produit, 'SellerAssignedID')) || texte(trouver(produit, 'GlobalID')) || undefined,
      quantite,
      unite: quantiteN?.attributs.unitCode || undefined,
      prixUnitaireHT: charge != null ? charge / (base || 1) : undefined,
      montantHT: montant ?? (charge != null ? (charge / (base || 1)) * quantite : 0),
      tauxTVA: nombre(trouver(l, 'SpecifiedLineTradeSettlement', 'ApplicableTradeTax', 'RateApplicablePercent')),
    };
  });

  return {
    type: typeCode === '381' ? 'avoir' : 'facture',
    numero: texte(trouver(entete, 'ID')) || 'sans numéro',
    date: /^\d{8}$/.test(dateBrute) ? `${dateBrute.slice(0, 4)}-${dateBrute.slice(4, 6)}-${dateBrute.slice(6, 8)}` : dateBrute.slice(0, 10),
    fournisseur: texte(trouver(vendeur, 'Name')) || 'Fournisseur inconnu',
    totalHT: nombre(trouver(totaux, 'TaxBasisTotalAmount')),
    totalTVA: nombre(trouver(totaux, 'TaxTotalAmount')),
    totalTTC: nombre(trouver(totaux, 'GrandTotalAmount')),
    lignes,
  };
}
