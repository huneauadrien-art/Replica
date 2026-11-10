// Extraction du texte d'un PDF « classique » (sans Factur-X), avec la position de chaque
// morceau, pour reconstituer les lignes et les colonnes d'une facture.
// Gère les polices simples (WinAnsi / Latin) que produisent les logiciels de facturation ;
// les polices composites (CID) sont ignorées.

import { decompresser, trouverFlux } from './pdfFlux';

export type Cellule = { x: number; y: number; texte: string };
export type LigneTexte = { y: number; cellules: Cellule[]; texte: string };

/** Lignes de texte du PDF, page après page, de haut en bas ; chaque ligne garde ses cellules de gauche à droite. */
export function lignesDuPdf(pdf: Uint8Array): LigneTexte[] {
  const lignes: LigneTexte[] = [];
  for (const f of trouverFlux(pdf)) {
    if (/\/(Subtype\s*\/(Image|Type1C|CIDFontType0C|OpenType|XML)|Length1|Length2|Type\s*\/(XObject|EmbeddedFile|ObjStm|XRef|Metadata))/.test(f.dict)) continue;
    let contenu = pdf.subarray(f.debut, f.fin);
    if (/FlateDecode/.test(f.dict)) {
      const d = decompresser(contenu);
      if (!d) continue;
      contenu = d;
    } else if (/\/Filter/.test(f.dict)) continue;
    const texte = latin1(contenu);
    if (!/\bBT\b/.test(texte) || !/T[jJ]\b|'|"/.test(texte)) continue;
    lignes.push(...regrouper(cellulesDuFlux(texte)));
  }
  return lignes;
}

// --- interprétation du flux de contenu -------------------------------------

type Jeton = { type: 'nombre'; v: number } | { type: 'chaine'; v: string } | { type: 'tableau'; v: (number | string)[] } | { type: 'op'; v: string } | { type: 'autre' };

/** Matrice affine [a b c d e f]. */
type M = [number, number, number, number, number, number];
const ID: M = [1, 0, 0, 1, 0, 0];
const mult = (m: M, n: M): M => [
  m[0] * n[0] + m[1] * n[2],
  m[0] * n[1] + m[1] * n[3],
  m[2] * n[0] + m[3] * n[2],
  m[2] * n[1] + m[3] * n[3],
  m[4] * n[0] + m[5] * n[2] + n[4],
  m[4] * n[1] + m[5] * n[3] + n[5],
];

function cellulesDuFlux(s: string): Cellule[] {
  const cellules: Cellule[] = [];
  let ctm: M = ID;
  const pile: M[] = [];
  let tm: M = ID;
  let tlm: M = ID;
  let leading = 0;
  let pileArgs: Jeton[] = [];

  const emettre = (t: string) => {
    const texte = t.replace(/\s+/g, ' ');
    if (!texte.trim()) return;
    const m = mult(tm, ctm);
    cellules.push({ x: m[4], y: m[5], texte });
  };
  const nombres = () => pileArgs.filter((j): j is { type: 'nombre'; v: number } => j.type === 'nombre').map((j) => j.v);
  const ligneSuivante = (tx: number, ty: number) => {
    tlm = mult([1, 0, 0, 1, tx, ty], tlm);
    tm = tlm;
  };

  for (const j of jetons(s)) {
    if (j.type !== 'op') {
      pileArgs.push(j);
      continue;
    }
    const n = nombres();
    switch (j.v) {
      case 'q':
        pile.push(ctm);
        break;
      case 'Q':
        ctm = pile.pop() ?? ID;
        break;
      case 'cm':
        if (n.length >= 6) ctm = mult(n.slice(-6) as M, ctm);
        break;
      case 'BT':
        tm = tlm = ID;
        break;
      case 'Td':
        if (n.length >= 2) ligneSuivante(n[n.length - 2], n[n.length - 1]);
        break;
      case 'TD':
        if (n.length >= 2) {
          leading = -n[n.length - 1];
          ligneSuivante(n[n.length - 2], n[n.length - 1]);
        }
        break;
      case 'TL':
        if (n.length) leading = n[n.length - 1];
        break;
      case 'Tm':
        if (n.length >= 6) tm = tlm = n.slice(-6) as M;
        break;
      case 'T*':
        ligneSuivante(0, -leading);
        break;
      case 'Tj': {
        const c = [...pileArgs].reverse().find((x) => x.type === 'chaine');
        if (c && c.type === 'chaine') emettre(c.v);
        break;
      }
      case "'":
      case '"': {
        ligneSuivante(0, -leading);
        const c = [...pileArgs].reverse().find((x) => x.type === 'chaine');
        if (c && c.type === 'chaine') emettre(c.v);
        break;
      }
      case 'TJ': {
        const t = [...pileArgs].reverse().find((x) => x.type === 'tableau');
        if (t && t.type === 'tableau')
          // Un grand décalage négatif dans un TJ marque un espace entre deux mots.
          emettre(t.v.map((x) => (typeof x === 'number' ? (x < -200 ? ' ' : '') : x)).join(''));
        break;
      }
    }
    pileArgs = [];
  }
  return cellules;
}

/** Découpe un flux de contenu en nombres, chaînes, tableaux et opérateurs. */
function* jetons(s: string): Generator<Jeton> {
  let i = 0;
  const n = s.length;
  while (i < n) {
    const c = s[i];
    if (/\s/.test(c)) {
      i++;
    } else if (c === '%') {
      while (i < n && s[i] !== '\n' && s[i] !== '\r') i++;
    } else if (c === '(') {
      const [v, fin] = chaineLitterale(s, i);
      i = fin;
      yield { type: 'chaine', v };
    } else if (c === '<' && s[i + 1] === '<') {
      // Dictionnaire en ligne (images en ligne, marquage) : on l'ignore.
      let prof = 0;
      while (i < n) {
        if (s[i] === '<' && s[i + 1] === '<') {
          prof++;
          i += 2;
        } else if (s[i] === '>' && s[i + 1] === '>') {
          prof--;
          i += 2;
          if (prof === 0) break;
        } else i++;
      }
      yield { type: 'autre' };
    } else if (c === '<') {
      const fin = s.indexOf('>', i);
      const hex = s.slice(i + 1, fin < 0 ? n : fin).replace(/\s/g, '');
      i = fin < 0 ? n : fin + 1;
      let v = '';
      for (let k = 0; k < hex.length; k += 2) v += WIN_ANSI(parseInt(hex.slice(k, k + 2).padEnd(2, '0'), 16));
      yield { type: 'chaine', v };
    } else if (c === '[') {
      const v: (number | string)[] = [];
      i++;
      while (i < n && s[i] !== ']') {
        if (s[i] === '(') {
          const [t, fin] = chaineLitterale(s, i);
          v.push(t);
          i = fin;
        } else if (s[i] === '<') {
          const fin = s.indexOf('>', i);
          const hex = s.slice(i + 1, fin).replace(/\s/g, '');
          let t = '';
          for (let k = 0; k < hex.length; k += 2) t += WIN_ANSI(parseInt(hex.slice(k, k + 2).padEnd(2, '0'), 16));
          v.push(t);
          i = fin + 1;
        } else {
          const m = /^[-+]?(\d+\.?\d*|\.\d+)/.exec(s.slice(i, i + 32));
          if (m) {
            v.push(parseFloat(m[0]));
            i += m[0].length;
          } else i++;
        }
      }
      i++;
      yield { type: 'tableau', v };
    } else if (/[-+.\d]/.test(c)) {
      const m = /^[-+]?(\d+\.?\d*|\.\d+)/.exec(s.slice(i, i + 32));
      if (m) {
        yield { type: 'nombre', v: parseFloat(m[0]) };
        i += m[0].length;
      } else i++;
    } else if (c === '/') {
      let k = i + 1;
      while (k < n && !/[\s/[\]()<>{}%]/.test(s[k])) k++;
      i = k;
      yield { type: 'autre' };
    } else if (c === "'" || c === '"') {
      i++;
      yield { type: 'op', v: c };
    } else if (/[A-Za-z*]/.test(c)) {
      let k = i;
      while (k < n && /[A-Za-z*\d]/.test(s[k])) k++;
      const op = s.slice(i, k);
      i = k;
      // Image en ligne : sauter les données binaires jusqu'à EI.
      if (op === 'ID') {
        const fin = s.indexOf('EI', i);
        i = fin < 0 ? n : fin + 2;
        continue;
      }
      yield { type: 'op', v: op };
    } else {
      i++;
    }
  }
}

function chaineLitterale(s: string, debut: number): [string, number] {
  let i = debut + 1;
  let prof = 1;
  let v = '';
  while (i < s.length && prof > 0) {
    const c = s[i];
    if (c === '\\') {
      const e = s[i + 1];
      if (/[0-7]/.test(e)) {
        const m = /^[0-7]{1,3}/.exec(s.slice(i + 1, i + 4))!;
        v += WIN_ANSI(parseInt(m[0], 8));
        i += 1 + m[0].length;
        continue;
      }
      const echappe: Record<string, string> = { n: '\n', r: '\r', t: '\t', b: '\b', f: '\f', '(': '(', ')': ')', '\\': '\\' };
      if (e === '\r' || e === '\n') {
        i += e === '\r' && s[i + 2] === '\n' ? 3 : 2;
        continue;
      }
      v += echappe[e] ?? e;
      i += 2;
      continue;
    }
    if (c === '(') prof++;
    if (c === ')') {
      prof--;
      if (prof === 0) break;
    }
    v += WIN_ANSI(c.charCodeAt(0));
    i++;
  }
  return [v, i + 1];
}

// --- encodage ----------------------------------------------------------------

/** Codes 0x80–0x9F de Windows-1252 ; le reste correspond au Latin-1. */
const CP1252: Record<number, string> = {
  0x80: '€', 0x82: '‚', 0x83: 'ƒ', 0x84: '„', 0x85: '…', 0x86: '†', 0x87: '‡', 0x88: 'ˆ', 0x89: '‰', 0x8a: 'Š', 0x8b: '‹', 0x8c: 'Œ',
  0x8e: 'Ž', 0x91: '‘', 0x92: '’', 0x93: '“', 0x94: '”', 0x95: '•', 0x96: '–', 0x97: '—', 0x98: '˜', 0x99: '™', 0x9a: 'š', 0x9b: '›',
  0x9c: 'œ', 0x9e: 'ž', 0x9f: 'Ÿ',
};
const WIN_ANSI = (code: number) => CP1252[code] ?? String.fromCharCode(code);

function latin1(o: Uint8Array): string {
  let s = '';
  for (let i = 0; i < o.length; i += 8192) s += String.fromCharCode(...o.subarray(i, i + 8192));
  return s;
}

// --- mise en lignes ----------------------------------------------------------

/** Regroupe les cellules de même hauteur (à 3 points près) en lignes, de haut en bas. */
function regrouper(cellules: Cellule[]): LigneTexte[] {
  const triees = [...cellules].sort((a, b) => b.y - a.y || a.x - b.x);
  const lignes: LigneTexte[] = [];
  for (const c of triees) {
    const l = lignes[lignes.length - 1];
    if (l && Math.abs(l.y - c.y) <= 3) l.cellules.push(c);
    else lignes.push({ y: c.y, cellules: [c], texte: '' });
  }
  for (const l of lignes) {
    l.cellules.sort((a, b) => a.x - b.x);
    l.texte = l.cellules.map((c) => c.texte.trim()).join(' ');
  }
  return lignes;
}
