// Restauration d'une sauvegarde JSON (bouton « Exporter une sauvegarde » du registre).

import { COLLECTIONS } from './sync';
import { DONNEES_VIDES, type Donnees } from './types';

/** Lit le fichier exporté par l'app, en vérifiant que c'est bien une sauvegarde du registre. */
export function lireSauvegarde(texte: string): Donnees {
  let brut: unknown;
  try {
    brut = JSON.parse(texte.replace(/^﻿/, ''));
  } catch {
    throw new Error("Ce fichier n'est pas une sauvegarde du registre (JSON illisible).");
  }
  const d = brut as Partial<Donnees>;
  if (!d || typeof d !== 'object' || !COLLECTIONS.some((c) => Array.isArray(d[c])))
    throw new Error("Ce fichier n'est pas une sauvegarde du registre.");
  const resultat = { ...DONNEES_VIDES } as Donnees;
  for (const c of COLLECTIONS) {
    const liste = Array.isArray(d[c]) ? (d[c] as { id?: unknown }[]) : [];
    (resultat as Record<string, unknown>)[c] = liste.filter((f) => f && typeof f.id === 'string');
  }
  return resultat;
}

/** Ajoute les fiches de la sauvegarde ; une fiche de même identifiant est remplacée par celle de la sauvegarde. */
export function ajouterSauvegarde(actuel: Donnees, sauvegarde: Donnees): Donnees {
  const resultat = { ...actuel };
  for (const c of COLLECTIONS) {
    const parId = new Map((actuel[c] as { id: string }[]).map((f) => [f.id, f]));
    for (const f of sauvegarde[c] as { id: string }[]) parId.set(f.id, f);
    (resultat as Record<string, unknown>)[c] = [...parId.values()];
  }
  return resultat;
}

export const compterFiches = (d: Donnees) => ({
  parcelles: d.parcelles.length,
  produits: d.produits.length,
  traitements: d.traitements.length,
  mouvements: d.mouvements.length,
});
