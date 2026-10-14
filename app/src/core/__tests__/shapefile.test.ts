import { strToU8, zipSync } from 'fflate';
import { describe, expect, it } from 'vitest';
import { choisirCouche, proposerParcelles } from '../importParcelles';
import { lireZipParcellaire } from '../shapefile';

const PRJ_L93 =
  'PROJCS["RGF_1993_Lambert_93",GEOGCS["GCS_RGF_1993",DATUM["D_RGF_1993",SPHEROID["GRS_1980",6378137.0,298.257222101]],' +
  'PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]],PROJECTION["Lambert_Conformal_Conic"],' +
  'PARAMETER["False_Easting",700000.0],PARAMETER["False_Northing",6600000.0],PARAMETER["Central_Meridian",3.0],' +
  'PARAMETER["Standard_Parallel_1",44.0],PARAMETER["Standard_Parallel_2",49.0],PARAMETER["Latitude_Of_Origin",46.5],UNIT["Meter",1.0]]';

type Pt = [number, number];

/** Écrit un .shp de polygones (un enregistrement = une liste d'anneaux). */
function ecrireShp(enregistrements: Pt[][][]): Uint8Array {
  const corps = enregistrements.map((anneaux) => {
    const nbPoints = anneaux.reduce((s, a) => s + a.length, 0);
    const taille = 44 + anneaux.length * 4 + nbPoints * 16;
    const v = new DataView(new ArrayBuffer(taille));
    v.setInt32(0, 5, true);
    v.setInt32(36, anneaux.length, true);
    v.setInt32(40, nbPoints, true);
    let debut = 0;
    anneaux.forEach((a, i) => {
      v.setInt32(44 + i * 4, debut, true);
      debut += a.length;
    });
    let o = 44 + anneaux.length * 4;
    for (const a of anneaux)
      for (const [x, y] of a) {
        v.setFloat64(o, x, true);
        v.setFloat64(o + 8, y, true);
        o += 16;
      }
    return new Uint8Array(v.buffer);
  });
  const total = 100 + corps.reduce((s, c) => s + 8 + c.length, 0);
  const out = new Uint8Array(total);
  const v = new DataView(out.buffer);
  v.setInt32(0, 9994, false);
  v.setInt32(24, total / 2, false);
  v.setInt32(28, 1000, true);
  v.setInt32(32, 5, true);
  let pos = 100;
  corps.forEach((c, i) => {
    v.setInt32(pos, i + 1, false);
    v.setInt32(pos + 4, c.length / 2, false);
    out.set(c, pos + 8);
    pos += 8 + c.length;
  });
  return out;
}

/** Écrit un .dbf ; `latin1` pour simuler un vieux SIG. */
function ecrireDbf(champs: { nom: string; type: 'C' | 'N'; taille: number }[], lignes: (string | number)[][], latin1 = false): Uint8Array {
  const tailleEntete = 32 + champs.length * 32 + 1;
  const tailleEnr = 1 + champs.reduce((s, c) => s + c.taille, 0);
  const out = new Uint8Array(tailleEntete + lignes.length * tailleEnr + 1);
  const v = new DataView(out.buffer);
  out[0] = 3;
  v.setUint32(4, lignes.length, true);
  v.setUint16(8, tailleEntete, true);
  v.setUint16(10, tailleEnr, true);
  champs.forEach((c, i) => {
    out.set(strToU8(c.nom), 32 + i * 32);
    out[32 + i * 32 + 11] = c.type.charCodeAt(0);
    out[32 + i * 32 + 16] = c.taille;
  });
  out[tailleEntete - 1] = 0x0d;
  lignes.forEach((l, r) => {
    let pos = tailleEntete + r * tailleEnr;
    out[pos++] = 0x20;
    champs.forEach((c, i) => {
      const texte = String(l[i]);
      const octets = strToU8(c.type === 'N' ? texte.padStart(c.taille) : texte.padEnd(c.taille), latin1);
      out.set(octets.subarray(0, c.taille), pos);
      pos += c.taille;
    });
  });
  out[out.length - 1] = 0x1a;
  return out;
}

// Un carré de 100 m × 100 m (1 ha) près de Bordeaux, en Lambert-93, sens horaire.
const carre = (x: number, y: number, c: number): Pt[] => [
  [x, y],
  [x, y + c],
  [x + c, y + c],
  [x + c, y],
  [x, y],
];
// Trou de 20 m × 20 m, sens antihoraire.
const trou: Pt[] = [
  [420040, 6420040],
  [420060, 6420040],
  [420060, 6420060],
  [420040, 6420060],
  [420040, 6420040],
];

const CHAMPS = [
  { nom: 'NUM_ILOT', type: 'N' as const, taille: 4 },
  { nom: 'NUM_PARCEL', type: 'N' as const, taille: 4 },
  { nom: 'CODE_CULTU', type: 'C' as const, taille: 5 },
  { nom: 'SURF_ADM', type: 'N' as const, taille: 10 },
  { nom: 'COMMUNE', type: 'C' as const, taille: 20 },
];

function zipTelepac(latin1 = false) {
  return zipSync({
    'export_telepac/parcelles_graphiques.shp': ecrireShp([
      [carre(420000, 6420000, 100), trou],
      [carre(420200, 6420000, 50)],
    ]),
    'export_telepac/parcelles_graphiques.dbf': ecrireDbf(
      CHAMPS,
      [
        [3, 1, 'VRC', '0.96', 'Saint-Émilion'],
        [3, 2, 'PTR', '0.25', 'Saint-Émilion'],
      ],
      latin1,
    ),
    'export_telepac/parcelles_graphiques.prj': strToU8(PRJ_L93),
  });
}

describe('import du zip parcellaire', () => {
  it('lit le shapefile dans un sous-dossier, reprojette et calcule les surfaces', () => {
    const couches = lireZipParcellaire(zipTelepac());
    expect(couches).toHaveLength(1);
    const [vigne, prairie] = proposerParcelles(choisirCouche(couches));

    expect(vigne.nom).toBe('Îlot 3 – parcelle 1');
    expect(vigne.codeCulture).toBe('VRC');
    expect(vigne.estVigne).toBe(true);
    expect(vigne.surfaceHa).toBe(0.96);
    expect(vigne.origineSurface).toBe('fichier');
    expect(vigne.attributs?.COMMUNE).toBe('Saint-Émilion');

    // Coordonnées en WGS84, du côté de Bordeaux.
    const [lon, lat] = vigne.contour[0][0];
    expect(lon).toBeGreaterThan(-1);
    expect(lon).toBeLessThan(0);
    expect(lat).toBeGreaterThan(44.5);
    expect(lat).toBeLessThan(45.2);

    expect(prairie.estVigne).toBe(false);
    expect(prairie.surfaceHa).toBe(0.25);
  });

  it('calcule la surface du contour, trou déduit, quand le fichier n’en donne pas', () => {
    const zip = zipSync({
      'p.shp': ecrireShp([[carre(420000, 6420000, 100), trou]]),
      'p.dbf': ecrireDbf([{ nom: 'NOM', type: 'C', taille: 10 }], [['Les Côtes']]),
      'p.prj': strToU8(PRJ_L93),
    });
    const [p] = proposerParcelles(choisirCouche(lireZipParcellaire(zip)));
    expect(p.nom).toBe('Les Côtes');
    expect(p.origineSurface).toBe('calculée');
    expect(Math.abs(p.surfaceHa - 0.96)).toBeLessThanOrEqual(0.01);
  });

  it('lit les accents des fichiers en Latin-1', () => {
    const [p] = proposerParcelles(choisirCouche(lireZipParcellaire(zipTelepac(true))));
    expect(p.attributs?.COMMUNE).toBe('Saint-Émilion');
  });

  it('ouvre un zip contenu dans un zip', () => {
    const zip = zipSync({ 'export.zip': zipTelepac() });
    expect(lireZipParcellaire(zip)[0].entites).toHaveLength(2);
  });

  it('préfère la couche des parcelles à celle des îlots', () => {
    const shp = ecrireShp([[carre(420000, 6420000, 100)]]);
    const dbf = ecrireDbf([{ nom: 'NUM_ILOT', type: 'N', taille: 4 }], [[1]]);
    const zip = zipSync({
      'ilots.shp': shp,
      'ilots.dbf': dbf,
      'ilots.prj': strToU8(PRJ_L93),
      'parcelles.shp': shp,
      'parcelles.dbf': dbf,
      'parcelles.prj': strToU8(PRJ_L93),
    });
    expect(choisirCouche(lireZipParcellaire(zip)).nom).toBe('parcelles');
  });

  it('explique clairement quand le zip ne contient pas de shapefile', () => {
    expect(() => lireZipParcellaire(zipSync({ 'lisezmoi.txt': strToU8('x') }))).toThrow(/Aucun fichier \.shp/);
    expect(() => lireZipParcellaire(strToU8('pas un zip'))).toThrow(/zip lisible/);
  });
});
