// Petits outils des écrans de la cave.

import { useEffect, useState } from 'react';
import { versBase64 } from '../../core/base64';
import type { PieceJointe } from '../../core/types';
import { useStore } from '../../data/store';
import { c, police } from './theme';

export const anneeEnCours = () => new Date().getFullYear();

export function salutation(h = new Date().getHours()) {
  if (h >= 22 || h < 5) return 'Bonne nuit';
  if (h >= 18) return 'Bonsoir';
  if (h >= 12) return 'Bon après-midi';
  return 'Bonjour';
}

/** Options d'en-tête sombres pour les écrans de la cave (Stack). */
export const optionsCave = {
  headerStyle: { backgroundColor: c.fond },
  headerTintColor: c.orClair,
  headerTitleStyle: { fontFamily: police.serif, fontSize: 20, color: c.texte },
  headerShadowVisible: false,
  contentStyle: { backgroundColor: c.fond },
} as const;

const cache = new Map<string, string>();

/** La photo d'étiquette en adresse affichable (data:…), chargée depuis le téléphone ou le NAS. */
export function usePhoto(piece?: PieceJointe): string | undefined {
  const { lirePiece } = useStore();
  const [uri, setUri] = useState(piece ? cache.get(piece.id) : undefined);
  useEffect(() => {
    if (!piece) return setUri(undefined);
    const deja = cache.get(piece.id);
    if (deja) return setUri(deja);
    let vivant = true;
    lirePiece(piece.id)
      .then((o) => {
        const u = `data:${piece.type};base64,${versBase64(o)}`;
        cache.set(piece.id, u);
        if (vivant) setUri(u);
      })
      .catch(() => {});
    return () => {
      vivant = false;
    };
  }, [piece, lirePiece]);
  return uri;
}

/** « 12,5 » → 12.5 ; vide ou invalide → undefined. */
export function nombre(t: string): number | undefined {
  const n = parseFloat(t.replace(',', '.').trim());
  return Number.isFinite(n) ? n : undefined;
}

export const euros = (n: number) => `${Math.round(n).toLocaleString('fr-FR')} €`;
