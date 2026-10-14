// Synchronisation entre les téléphones et le serveur du NAS.
//
// Chaque fiche (parcelle, produit, mouvement de stock, traitement) porte `maj`,
// l'heure de sa dernière modification. Une suppression devient une « pierre
// tombale » ({ id, maj, supprime: true }) pour que les autres appareils l'appliquent.
// En cas de modification sur deux appareils, la plus récente l'emporte.
//
// Le serveur numérote chaque fiche reçue (`rev`) : un appareil demande tout ce qui
// a changé depuis le dernier numéro qu'il a vu, sans dépendre de l'heure du téléphone.

import type { Donnees } from './types';

export const COLLECTIONS = ['parcelles', 'produits', 'mouvements', 'traitements'] as const;
export type Collection = (typeof COLLECTIONS)[number];

export type Fiche = { id: string; maj?: number; supprime?: boolean; [champ: string]: unknown };
export type Changements = Partial<Record<Collection, Fiche[]>>;

/** Clé unique d'une fiche, toutes collections confondues. */
export const cle = (c: Collection, id: string) => `${c}/${id}`;

// --- côté téléphone ---------------------------------------------------------

/**
 * Compare deux états et renvoie les fiches modifiées (horodatées `maj`) et les
 * fiches supprimées (pierres tombales). Une fiche est « modifiée » dès que son
 * objet a changé : les écrans créent toujours un nouvel objet quand ils modifient.
 */
export function difference(avant: Donnees, apres: Donnees, maintenant: number): { apres: Donnees; changees: Changements } {
  const changees: Changements = {};
  const resultat = { ...apres };
  for (const c of COLLECTIONS) {
    const anciens = new Map((avant[c] as Fiche[]).map((f) => [f.id, f]));
    const liste: Fiche[] = [];
    const nouveaux = (apres[c] as Fiche[]).map((f) => {
      if (anciens.get(f.id) === f) return f;
      const horodatee = { ...f, maj: maintenant };
      liste.push(horodatee);
      return horodatee;
    });
    const restants = new Set(nouveaux.map((f) => f.id));
    for (const id of anciens.keys()) if (!restants.has(id)) liste.push({ id, maj: maintenant, supprime: true });
    if (liste.length) {
      changees[c] = liste;
      (resultat as Record<Collection, Fiche[]>)[c] = nouveaux;
    }
  }
  return { apres: resultat, changees };
}

/**
 * Applique sur le téléphone les fiches reçues du serveur. Une fiche modifiée sur
 * ce téléphone et pas encore envoyée, plus récente que celle du serveur, est gardée.
 */
export function appliquerRecues(d: Donnees, recues: Changements, enAttente: Map<string, Fiche>): Donnees {
  const resultat = { ...d };
  for (const c of COLLECTIONS) {
    const fiches = recues[c];
    if (!fiches?.length) continue;
    const parId = new Map((d[c] as Fiche[]).map((f) => [f.id, f]));
    for (const f of fiches) {
      const locale = enAttente.get(cle(c, f.id));
      if (locale && (locale.maj ?? 0) > (f.maj ?? 0)) continue;
      if (f.supprime) parId.delete(f.id);
      else parId.set(f.id, f);
    }
    (resultat as Record<Collection, Fiche[]>)[c] = [...parId.values()];
  }
  return resultat;
}

/** Toutes les fiches d'un état, horodatées, pour un premier envoi au serveur. */
export function toutEnvoyer(d: Donnees, maintenant: number): Changements {
  const c: Changements = {};
  for (const col of COLLECTIONS) c[col] = (d[col] as Fiche[]).map((f) => ({ ...f, maj: f.maj ?? maintenant }));
  return c;
}

// --- côté serveur -----------------------------------------------------------

export type EtatServeur = {
  rev: number;
  fiches: Record<Collection, Record<string, { fiche: Fiche; rev: number }>>;
};

export const etatServeurVide = (): EtatServeur => ({
  rev: 0,
  fiches: { parcelles: {}, produits: {}, mouvements: {}, traitements: {} },
});

/**
 * Enregistre les fiches envoyées par un appareil (la plus récente gagne) et renvoie
 * tout ce qui a changé depuis `depuis`, plus la version du serveur des fiches refusées.
 */
export function synchroniserServeur(
  etat: EtatServeur,
  envoyees: Changements,
  depuis: number,
): { etat: EtatServeur; recues: Changements; rev: number; modifie: boolean } {
  let modifie = false;
  const refusees: Changements = {};
  for (const c of COLLECTIONS) {
    for (const f of envoyees[c] ?? []) {
      if (!f || typeof f.id !== 'string') continue;
      const actuelle = etat.fiches[c][f.id];
      if (actuelle && (actuelle.fiche.maj ?? 0) > (f.maj ?? 0)) {
        (refusees[c] ??= []).push(actuelle.fiche);
        continue;
      }
      etat.rev += 1;
      etat.fiches[c][f.id] = { fiche: f, rev: etat.rev };
      modifie = true;
    }
  }
  const recues: Changements = {};
  for (const c of COLLECTIONS) {
    const liste = Object.values(etat.fiches[c])
      .filter((x) => x.rev > depuis)
      .map((x) => x.fiche);
    const tout = [...liste, ...(refusees[c] ?? []).filter((f) => !liste.includes(f))];
    if (tout.length) recues[c] = tout;
  }
  return { etat, recues, rev: etat.rev, modifie };
}

/** Nombre de fiches (hors suppressions) par collection, pour l'écran de connexion. */
export function compter(etat: EtatServeur): Record<Collection, number> {
  const r = {} as Record<Collection, number>;
  for (const c of COLLECTIONS) r[c] = Object.values(etat.fiches[c]).filter((x) => !x.fiche.supprime).length;
  return r;
}
