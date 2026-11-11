// Sauvegarde complète en JSON (un fichier à garder à part) et restauration.

import { COLLECTIONS } from './sync';
import { DONNEES_VIDES, type Donnees } from './types';

export const FORMAT = 'budget-foyer/1';

export function ecrireSauvegarde(d: Donnees, quand = new Date()): string {
  return JSON.stringify({ format: FORMAT, cree: quand.toISOString(), ...d });
}

/** Lit un fichier de sauvegarde, en vérifiant que c'en est bien une. */
export function lireSauvegarde(texte: string): Donnees {
  let brut: unknown;
  try {
    brut = JSON.parse(texte.replace(/^﻿/, ''));
  } catch {
    throw new Error("Ce fichier n'est pas une sauvegarde du budget (illisible).");
  }
  const b = brut as Record<string, unknown> | null;
  if (!b || typeof b !== 'object' || b.format !== FORMAT) throw new Error("Ce fichier n'est pas une sauvegarde du budget.");
  const r = { ...DONNEES_VIDES } as Record<string, unknown>;
  for (const c of COLLECTIONS) r[c] = Array.isArray(b[c]) ? (b[c] as { id?: unknown }[]).filter((f) => f && typeof f.id === 'string') : [];
  return r as Donnees;
}

/** Ajoute les fiches de la sauvegarde ; une fiche de même identifiant est remplacée. */
export function fusionner(actuel: Donnees, sauvegarde: Donnees): Donnees {
  const r = { ...actuel } as Record<string, unknown>;
  for (const c of COLLECTIONS) {
    const parId = new Map((actuel[c] as { id: string }[]).map((f) => [f.id, f]));
    for (const f of sauvegarde[c] as { id: string }[]) parId.set(f.id, f);
    r[c] = [...parId.values()];
  }
  return r as Donnees;
}
