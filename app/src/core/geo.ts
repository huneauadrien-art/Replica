import type { Anneau } from './types';

const RAYON_TERRE_M = 6378137;
const rad = (deg: number) => (deg * Math.PI) / 180;

/**
 * Aire signée d'un anneau en WGS84, en m², sur la sphère.
 * Positive pour un anneau dans le sens inverse des aiguilles d'une montre.
 */
export function aireSigneeM2(anneau: Anneau): number {
  const n = anneau.length;
  if (n < 3) return 0;
  let total = 0;
  for (let i = 0; i < n; i++) {
    const [lon1, lat1] = anneau[i];
    const [lon2, lat2] = anneau[(i + 1) % n];
    total += rad(lon2 - lon1) * (2 + Math.sin(rad(lat1)) + Math.sin(rad(lat2)));
  }
  return (total * RAYON_TERRE_M * RAYON_TERRE_M) / 2;
}

/**
 * Surface d'un contour en hectares. Dans un shapefile, les anneaux extérieurs et
 * les trous tournent en sens opposés : la somme des aires signées retire les trous.
 */
export function surfaceHa(contour: Anneau[]): number {
  const total = contour.reduce((s, a) => s + aireSigneeM2(a), 0);
  return Math.abs(total) / 10000;
}

export type Emprise = { minLon: number; minLat: number; maxLon: number; maxLat: number };

export function emprise(contours: Anneau[][]): Emprise | null {
  let e: Emprise | null = null;
  for (const contour of contours)
    for (const anneau of contour)
      for (const [lon, lat] of anneau) {
        if (!e) e = { minLon: lon, minLat: lat, maxLon: lon, maxLat: lat };
        else {
          e.minLon = Math.min(e.minLon, lon);
          e.minLat = Math.min(e.minLat, lat);
          e.maxLon = Math.max(e.maxLon, lon);
          e.maxLat = Math.max(e.maxLat, lat);
        }
      }
  return e;
}

/** Arrondi à l'are (0,01 ha), comme dans les déclarations. */
export const arrondiHa = (ha: number) => Math.round(ha * 100) / 100;
