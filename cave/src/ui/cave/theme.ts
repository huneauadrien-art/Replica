// Jetons du thème « cave » (relevés dans replica/design/tokens-cave.json, contrastes vérifiés AA).
// Thème sombre seul, propre à la partie cave de l'app.

import type { CouleurVin } from '../../core/types';
import type { EtatGarde } from '../../core/cave';

export const c = {
  fond: '#1e1518',
  fondProfond: '#1b1316',
  carte: '#251b1e',
  carteHaute: '#2a1b1f',
  fond2: '#2c2023',
  piste: '#3d2e31',
  bord: '#3a2c2f',
  bord2: '#4e3b3f',
  bordChamp: '#8a767a',
  texte: '#f2e8dc',
  texte2: '#d4c4b4',
  doux: '#a08e7e',
  or: '#c4a882',
  orClair: '#d4b896',
  orSombre: '#a08968',
  orTexte: '#e8d4b8',
  rouge: '#e5484d',
  rougeBouton: '#d13b41',
  rougeTexte: '#ff6568',
  surRouge: '#ffffff',
  surCreme: '#1e1518',
  barreSysteme: '#3a1e25',
} as const;

export const couleurEtat: Record<EtatGarde, string> = {
  jeune: '#4e3b3f',
  pret: '#e8d9b8',
  apogee: '#e8b54a',
  vite: '#e58747',
  passe: '#e5484d',
};

export const couleurVin: Record<CouleurVin, string> = {
  rouge: '#4a1c24',
  blanc: '#6b6258',
  rose: '#874b50',
  effervescent: '#66643f',
  liquoreux: '#72592a',
  fortifie: '#4e2919',
};

/** Familles chargées dans app/_layout.tsx ; si le chargement échoue, le système prend le relais. */
export const police = {
  serif: 'Spectral_400Regular',
  serifItalique: 'Spectral_400Regular_Italic',
  sans: 'HankenGrotesk_400Regular',
  sansMoyen: 'HankenGrotesk_500Medium',
  sansDemi: 'HankenGrotesk_600SemiBold',
  sansGras: 'HankenGrotesk_700Bold',
  mono: 'JetBrainsMono_500Medium',
} as const;

export const rayon = { case: 10, bouton: 16, carte: 20, pilule: 999 } as const;
