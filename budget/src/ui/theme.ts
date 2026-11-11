// Jetons de design, générés depuis replica/design-kakeibo/tokens.json (ne pas écrire de couleur ailleurs).
// Après un changement de couleurs : python3 .claude/skills/replica-design/contrast.py replica/design-kakeibo/tokens.json

import type { Groupe } from '../core/types';

export const c = {
  bg: '#F6F4EF',
  surface: '#FFFFFF',
  surfaceAlt: '#ECE8DF',
  border: '#DDD8CC',
  borderInput: '#7D786C',
  text: '#1C1B19',
  textMuted: '#625E55',
  accent: '#1F5F5B',
  accentSoft: '#E1EEEC',
  onAccent: '#FFFFFF',
  danger: '#B3261E',
  dangerSoft: '#FBE9E7',
  success: '#2E6B30',
  successSoft: '#E6F1E3',
  warning: '#7A5200',
  warningSoft: '#FFF3D6',
  catSurvie: '#2F5D8A',
  catSurvieSoft: '#E3ECF5',
  catOptionnel: '#A04A24',
  catOptionnelSoft: '#F8E8DF',
  catCulture: '#6A4C9C',
  catCultureSoft: '#EDE7F6',
  catExtra: '#785C00',
  catExtraSoft: '#F6EFD6',
};

export const type = {
  xs: { fontSize: 12, lineHeight: 16, fontWeight: '600' as const },
  sm: { fontSize: 14, lineHeight: 20, fontWeight: '400' as const },
  base: { fontSize: 16, lineHeight: 24, fontWeight: '400' as const },
  lg: { fontSize: 20, lineHeight: 28, fontWeight: '700' as const },
  xl: { fontSize: 28, lineHeight: 34, fontWeight: '800' as const },
  display: { fontSize: 44, lineHeight: 50, fontWeight: '800' as const },
};

export const espace = [0, 4, 8, 12, 16, 24, 32, 48] as const;
export const rayon = {sm: 8, md: 12, lg: 20, pill: 999} as const;
export const mise = {maxWidth: 560, touchMin: 48, tabBar: 60, fab: 64} as const;

export const ombre = {
  carte: { shadowColor: '#1C1B19', shadowOpacity: 0.08, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  pop: { shadowColor: '#1C1B19', shadowOpacity: 0.18, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 6 },
};

export const couleurGroupe: Record<Groupe, { fort: string; doux: string }> = {
  survie: { fort: c.catSurvie, doux: c.catSurvieSoft },
  optionnel: { fort: c.catOptionnel, doux: c.catOptionnelSoft },
  culture: { fort: c.catCulture, doux: c.catCultureSoft },
  extra: { fort: c.catExtra, doux: c.catExtraSoft },
};

/** Chiffres de même largeur, pour que les montants s'alignent. */
export const chiffres = { fontVariant: ['tabular-nums' as const] };
