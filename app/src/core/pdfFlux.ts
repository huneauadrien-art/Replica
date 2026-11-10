// Repérage des flux (« stream … endstream ») d'un PDF et décompression, sans dépendance.

import { inflateSync, unzlibSync } from 'fflate';
import { strFromU8 } from 'fflate';

export type Flux = { dict: string; debut: number; fin: number };

/** Repère les flux « stream … endstream » et le dictionnaire qui les précède. */
export function trouverFlux(pdf: Uint8Array): Flux[] {
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

export function decompresser(o: Uint8Array): Uint8Array | null {
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
