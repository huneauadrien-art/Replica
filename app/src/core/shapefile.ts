// Lecture d'un export parcellaire (Telepac ou autre SIG) : un .zip qui contient
// un ou plusieurs shapefiles (.shp + .dbf + .prj), sans avoir à le dézipper.

import { strFromU8, unzipSync } from 'fflate';
import proj4 from 'proj4';
import type { Anneau } from './types';

export type Entite = {
  contour: Anneau[];
  attributs: Record<string, string | number | null>;
};

export type Couche = {
  nom: string;
  entites: Entite[];
  /** Système de coordonnées détecté, pour information. */
  projection: string;
};

export class ErreurImport extends Error {}

const LAMBERT_93 =
  '+proj=lcc +lat_0=46.5 +lon_0=3 +lat_1=49 +lat_2=44 +x_0=700000 +y_0=6600000 ' +
  '+ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs';

/** Ouvre le .zip (même avec des dossiers ou un .zip dedans) et lit chaque couche de polygones. */
export function lireZipParcellaire(octets: Uint8Array): Couche[] {
  const fichiers = extraire(octets, 0);
  const shps = Object.keys(fichiers).filter((f) => f.toLowerCase().endsWith('.shp'));
  if (shps.length === 0)
    throw new ErreurImport("Aucun fichier .shp dans le zip. Il faut l'export parcellaire (shapefile).");

  const couches: Couche[] = [];
  const erreurs: string[] = [];
  for (const shp of shps) {
    const base = shp.slice(0, -4);
    const trouver = (ext: string) =>
      Object.keys(fichiers).find((f) => f.toLowerCase() === (base + ext).toLowerCase());
    const dbf = trouver('.dbf');
    const prj = trouver('.prj');
    const cpg = trouver('.cpg');
    try {
      const geometries = lireShp(fichiers[shp]);
      const attributs = dbf
        ? lireDbf(fichiers[dbf], cpg ? strFromU8(fichiers[cpg]).trim() : undefined)
        : [];
      const { versWgs84, nom: projection } = projectionDe(
        prj ? strFromU8(fichiers[prj]) : undefined,
        geometries,
      );
      const entites: Entite[] = [];
      geometries.forEach((anneaux, i) => {
        if (!anneaux) return;
        entites.push({
          contour: anneaux.map((a) => a.map((p) => versWgs84(p))),
          attributs: attributs[i] ?? {},
        });
      });
      couches.push({ nom: nomCourt(base), entites, projection });
    } catch (e) {
      erreurs.push(`${nomCourt(base)} : ${(e as Error).message}`);
    }
  }
  if (couches.length === 0) throw new ErreurImport(erreurs.join('\n'));
  return couches;
}

function nomCourt(chemin: string) {
  return chemin.split('/').pop() ?? chemin;
}

function extraire(octets: Uint8Array, profondeur: number): Record<string, Uint8Array> {
  let fichiers: Record<string, Uint8Array>;
  try {
    fichiers = unzipSync(octets);
  } catch {
    throw new ErreurImport("Ce fichier n'est pas un .zip lisible.");
  }
  const resultat: Record<string, Uint8Array> = {};
  for (const [nom, contenu] of Object.entries(fichiers)) {
    if (nom.startsWith('__MACOSX/') || nom.endsWith('/')) continue;
    if (nom.toLowerCase().endsWith('.zip') && profondeur < 2) {
      Object.assign(resultat, extraire(contenu, profondeur + 1));
    } else {
      resultat[nom] = contenu;
    }
  }
  return resultat;
}

// --- .shp -------------------------------------------------------------------

/** Renvoie, pour chaque enregistrement, ses anneaux en coordonnées d'origine (null si vide). */
export function lireShp(octets: Uint8Array): (Anneau[] | null)[] {
  const v = new DataView(octets.buffer, octets.byteOffset, octets.byteLength);
  if (octets.byteLength < 100 || v.getInt32(0, false) !== 9994)
    throw new ErreurImport('fichier .shp invalide');
  const type = v.getInt32(32, true);
  if (![0, 5, 15, 25].includes(type))
    throw new ErreurImport('cette couche ne contient pas de polygones');

  const longueur = Math.min(v.getInt32(24, false) * 2, octets.byteLength);
  const resultat: (Anneau[] | null)[] = [];
  let pos = 100;
  while (pos + 8 <= longueur) {
    const taille = v.getInt32(pos + 4, false) * 2;
    const debut = pos + 8;
    pos = debut + taille;
    const typeEnr = v.getInt32(debut, true);
    if (typeEnr === 0) {
      resultat.push(null);
      continue;
    }
    if (![5, 15, 25].includes(typeEnr)) throw new ErreurImport(`forme de type ${typeEnr} non gérée`);
    const nbParties = v.getInt32(debut + 36, true);
    const nbPoints = v.getInt32(debut + 40, true);
    const parties: number[] = [];
    for (let i = 0; i < nbParties; i++) parties.push(v.getInt32(debut + 44 + i * 4, true));
    const debutPoints = debut + 44 + nbParties * 4;
    const anneaux: Anneau[] = [];
    for (let p = 0; p < nbParties; p++) {
      const fin = p + 1 < nbParties ? parties[p + 1] : nbPoints;
      const anneau: Anneau = [];
      for (let i = parties[p]; i < fin; i++) {
        const o = debutPoints + i * 16;
        anneau.push([v.getFloat64(o, true), v.getFloat64(o + 8, true)]);
      }
      anneaux.push(anneau);
    }
    resultat.push(anneaux);
  }
  return resultat;
}

// --- .dbf -------------------------------------------------------------------

export function lireDbf(octets: Uint8Array, encodage?: string): Record<string, string | number | null>[] {
  const v = new DataView(octets.buffer, octets.byteOffset, octets.byteLength);
  const nbEnr = v.getUint32(4, true);
  const tailleEntete = v.getUint16(8, true);
  const tailleEnr = v.getUint16(10, true);
  const latin1 = choisirLatin1(octets.subarray(tailleEntete), encodage);

  const champs: { nom: string; type: string; taille: number }[] = [];
  for (let pos = 32; pos + 32 <= tailleEntete && octets[pos] !== 0x0d; pos += 32) {
    const brut = octets.subarray(pos, pos + 11);
    const fin = brut.indexOf(0);
    champs.push({
      nom: strFromU8(fin >= 0 ? brut.subarray(0, fin) : brut, true).trim(),
      type: String.fromCharCode(octets[pos + 11]),
      taille: octets[pos + 16],
    });
  }

  const lignes: Record<string, string | number | null>[] = [];
  for (let i = 0; i < nbEnr; i++) {
    let pos = tailleEntete + i * tailleEnr;
    if (pos + tailleEnr > octets.byteLength) break;
    pos += 1; // indicateur de suppression
    const ligne: Record<string, string | number | null> = {};
    for (const c of champs) {
      const texte = strFromU8(octets.subarray(pos, pos + c.taille), latin1).trim();
      pos += c.taille;
      if (c.type === 'N' || c.type === 'F') {
        const n = parseFloat(texte);
        ligne[c.nom] = texte === '' || Number.isNaN(n) ? null : n;
      } else {
        ligne[c.nom] = texte === '' ? null : texte;
      }
    }
    lignes.push(ligne);
  }
  return lignes;
}

/** Les vieux SIG écrivent en Latin-1 ; si le texte n'est pas de l'UTF-8 valide, on lit en Latin-1. */
function choisirLatin1(octets: Uint8Array, encodage?: string): boolean {
  if (encodage) return !/utf-?8/i.test(encodage);
  return !utf8Valide(octets);
}

function utf8Valide(o: Uint8Array): boolean {
  for (let i = 0; i < o.length; ) {
    const b = o[i];
    const suite = b < 0x80 ? 0 : b >> 5 === 6 ? 1 : b >> 4 === 14 ? 2 : b >> 3 === 30 ? 3 : -1;
    if (suite < 0) return false;
    for (let k = 1; k <= suite; k++) if (i + k >= o.length || o[i + k] >> 6 !== 2) return false;
    i += suite + 1;
  }
  return true;
}

// --- projection -------------------------------------------------------------

function projectionDe(
  prj: string | undefined,
  geometries: (Anneau[] | null)[],
): { versWgs84: (p: [number, number]) => [number, number]; nom: string } {
  const identite = { versWgs84: (p: [number, number]) => p, nom: 'WGS84' };
  if (prj && /^\s*GEOGCS/i.test(prj)) return identite;
  if (prj) {
    try {
      const conv = proj4(prj, 'WGS84');
      return { versWgs84: (p) => conv.forward(p) as [number, number], nom: nomProjection(prj) };
    } catch {
      if (!/lambert.*93|RGF93|2154/i.test(prj))
        throw new ErreurImport('système de coordonnées inconnu dans le .prj');
    }
  } else {
    const premier = geometries.find((g) => g && g[0]?.length)?.[0][0];
    if (premier && Math.abs(premier[0]) <= 180 && Math.abs(premier[1]) <= 90) return identite;
  }
  const conv = proj4(LAMBERT_93, 'WGS84');
  return { versWgs84: (p) => conv.forward(p) as [number, number], nom: 'Lambert-93' };
}

function nomProjection(prj: string) {
  return prj.match(/PROJCS\["([^"]+)"/)?.[1] ?? 'projection du .prj';
}
