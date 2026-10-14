// Dessin du contour d'une ou plusieurs parcelles, sans fond de carte (la carte vient avec le GPS).

import Svg, { Path } from 'react-native-svg';
import { emprise } from '../core/geo';
import type { Anneau } from '../core/types';
import { couleurs } from './kit';

export function ApercuParcelle({ contours, taille = 160, surlignee }: { contours: Anneau[][]; taille?: number; surlignee?: number }) {
  const e = emprise(contours);
  if (!e) return null;
  // Longitudes resserrées selon la latitude pour garder les proportions.
  const kx = Math.cos(((e.minLat + e.maxLat) / 2) * (Math.PI / 180));
  const largeur = Math.max((e.maxLon - e.minLon) * kx, 1e-9);
  const hauteur = Math.max(e.maxLat - e.minLat, 1e-9);
  const echelle = (taille - 8) / Math.max(largeur, hauteur);
  const x = (lon: number) => 4 + (lon - e.minLon) * kx * echelle;
  const y = (lat: number) => 4 + (e.maxLat - lat) * echelle;
  const h = hauteur * echelle + 8;
  return (
    <Svg width={taille} height={h} accessibilityLabel="Contour de la parcelle">
      {contours.map((contour, i) => (
        <Path
          key={i}
          d={contour.map((a) => 'M' + a.map(([lon, lat]) => `${x(lon).toFixed(1)},${y(lat).toFixed(1)}`).join('L') + 'Z').join(' ')}
          fill={surlignee == null || surlignee === i ? couleurs.feuilleClair : '#EEECE6'}
          fillRule="evenodd"
          stroke={surlignee == null || surlignee === i ? couleurs.feuille : '#B8B5AA'}
          strokeWidth={1.5}
        />
      ))}
    </Svg>
  );
}
