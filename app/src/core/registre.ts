// Calculs du registre phytosanitaire et du stock. Pas d'accès au téléphone ici :
// tout est testable (voir registre.test.ts).

import { cultureDe } from './cultures';
import type { Donnees, Produit, Traitement } from './types';

// --- quantités et stock -----------------------------------------------------

export const surfaceTraitee = (t: Pick<Traitement, 'parcelles'>) =>
  t.parcelles.reduce((s, p) => s + p.surfaceHa, 0);

/** Quantité de chaque produit utilisée par un traitement : dose/ha × surface traitée. */
export function quantitesUtilisees(t: Pick<Traitement, 'parcelles' | 'produits'>): Map<string, number> {
  const surface = surfaceTraitee(t);
  const q = new Map<string, number>();
  for (const p of t.produits) q.set(p.produitId, (q.get(p.produitId) ?? 0) + p.doseHa * surface);
  return q;
}

export type LigneStock = {
  date: string;
  libelle: string;
  quantite: number;
  solde: number;
  traitementId?: string;
  mouvementId?: string;
};

/** Historique du stock d'un produit : achats, corrections et sorties par traitement, avec le solde. */
export function historiqueStock(d: Donnees, produitId: string): LigneStock[] {
  const lignes: Omit<LigneStock, 'solde'>[] = [];
  for (const m of d.mouvements)
    if (m.produitId === produitId)
      lignes.push({
        date: m.date,
        libelle:
          m.type === 'achat'
            ? `Achat${m.fournisseur ? ` – ${m.fournisseur}` : ''}${m.lot ? ` (lot ${m.lot})` : ''}`
            : `Correction${m.note ? ` – ${m.note}` : ''}`,
        quantite: m.quantite,
        mouvementId: m.id,
      });
  for (const t of d.traitements) {
    const q = quantitesUtilisees(t).get(produitId);
    if (q) lignes.push({ date: t.date, libelle: `Traitement ${nomsParcelles(d, t)}`, quantite: -q, traitementId: t.id });
  }
  // À date égale, les entrées passent avant les sorties.
  lignes.sort((a, b) => a.date.localeCompare(b.date) || b.quantite - a.quantite);
  let solde = 0;
  return lignes.map((l) => ({ ...l, solde: (solde += l.quantite) }));
}

export function stockActuel(d: Donnees, produitId: string, sansTraitementId?: string): number {
  let s = 0;
  for (const m of d.mouvements) if (m.produitId === produitId) s += m.quantite;
  for (const t of d.traitements)
    if (t.id !== sansTraitementId) s -= quantitesUtilisees(t).get(produitId) ?? 0;
  return s;
}

export const stockBas = (d: Donnees, p: Produit) =>
  p.seuilAlerte != null && stockActuel(d, p.id) <= p.seuilAlerte;

// --- contrôles avant d'enregistrer un traitement ----------------------------

export type Alerte = { niveau: 'bloquant' | 'danger' | 'attention'; message: string };

/** Vent maximal autorisé pour pulvériser : 3 Beaufort (arrêté du 4 mai 2017). */
export const VENT_MAX_KMH = 19;

export function controlerTraitement(d: Donnees, t: Traitement): Alerte[] {
  const alertes: Alerte[] = [];
  if (t.parcelles.length === 0) alertes.push({ niveau: 'bloquant', message: 'Choisissez au moins une parcelle.' });
  if (t.produits.length === 0) alertes.push({ niveau: 'bloquant', message: 'Ajoutez au moins un produit.' });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(t.date)) alertes.push({ niveau: 'bloquant', message: 'Date invalide (AAAA-MM-JJ).' });
  if (!t.operateur.trim()) alertes.push({ niveau: 'bloquant', message: "Indiquez l'opérateur." });

  for (const tp of t.parcelles) {
    const p = d.parcelles.find((x) => x.id === tp.parcelleId);
    if (p && tp.surfaceHa > p.surfaceHa + 1e-6)
      alertes.push({ niveau: 'attention', message: `${p.nom} : surface traitée supérieure à la surface de la parcelle.` });
    if (!(tp.surfaceHa > 0)) alertes.push({ niveau: 'bloquant', message: `${p?.nom ?? 'Parcelle'} : surface traitée nulle.` });
  }

  const quantites = quantitesUtilisees(t);
  for (const tp of t.produits) {
    const p = d.produits.find((x) => x.id === tp.produitId);
    if (!p) continue;
    if (!(tp.doseHa > 0)) alertes.push({ niveau: 'bloquant', message: `${p.nom} : dose nulle.` });
    if (p.doseMaxHa != null && tp.doseHa > p.doseMaxHa + 1e-9)
      alertes.push({
        niveau: 'danger',
        message: `${p.nom} : dose ${fmt(tp.doseHa)} ${p.unite}/ha au-dessus de la dose homologuée (${fmt(p.doseMaxHa)} ${p.unite}/ha).`,
      });
    if (!p.amm) alertes.push({ niveau: 'attention', message: `${p.nom} : numéro AMM manquant pour le registre.` });
    const reste = stockActuel(d, p.id, t.id) - (quantites.get(p.id) ?? 0);
    if (reste < -1e-9)
      alertes.push({
        niveau: 'attention',
        message: `${p.nom} : stock insuffisant (il manquera ${fmt(-reste)} ${p.unite}). Un achat n'a peut-être pas été saisi.`,
      });
    else if (p.seuilAlerte != null && reste <= p.seuilAlerte)
      alertes.push({ niveau: 'attention', message: `${p.nom} : il restera ${fmt(reste)} ${p.unite} en stock.` });
  }

  if (t.ventKmh != null && t.ventKmh > VENT_MAX_KMH)
    alertes.push({
      niveau: 'danger',
      message: `Vent de ${t.ventKmh} km/h : pulvérisation interdite au-delà de ${VENT_MAX_KMH} km/h (3 Beaufort).`,
    });
  return alertes;
}

// --- délais -----------------------------------------------------------------

/** Première date de récolte possible après ce traitement (DAR le plus long des produits). */
export function dateRecolteMin(d: Donnees, t: Traitement): string | null {
  const dar = Math.max(
    -1,
    ...t.produits.map((tp) => d.produits.find((p) => p.id === tp.produitId)?.darJours ?? -1),
  );
  return dar < 0 ? null : ajouterJours(t.date, dar);
}

/** Moment où l'on peut rentrer dans la parcelle (DRE le plus long, 6 h par défaut). */
export function rentreePossible(d: Donnees, t: Traitement): string {
  const dre = Math.max(
    6,
    ...t.produits.map((tp) => d.produits.find((p) => p.id === tp.produitId)?.dreHeures ?? 6),
  );
  const [h, m] = (t.heureFin ?? t.heureDebut ?? '12:00').split(':').map(Number);
  const debut = new Date(`${t.date}T00:00:00Z`);
  debut.setUTCMinutes(h * 60 + m + dre * 60);
  return `${debut.toISOString().slice(0, 10)} ${debut.toISOString().slice(11, 16)}`;
}

export function ajouterJours(date: string, jours: number): string {
  const x = new Date(`${date}T00:00:00Z`);
  x.setUTCDate(x.getUTCDate() + jours);
  return x.toISOString().slice(0, 10);
}

// --- registre ---------------------------------------------------------------

export type LigneRegistre = {
  date: string;
  heure: string;
  parcelle: string;
  surfaceHa: number;
  culture: string;
  produit: string;
  amm: string;
  doseHa: number;
  unite: string;
  quantite: number;
  cible: string;
  stade: string;
  operateur: string;
  materiel: string;
  dar: string;
  recolteMin: string;
  traitementId: string;
};

/** Une ligne par parcelle et par produit, triées par date, pour une année (ou toutes). */
export function lignesRegistre(d: Donnees, annee?: number): LigneRegistre[] {
  const lignes: LigneRegistre[] = [];
  const traitements = d.traitements
    .filter((t) => annee == null || t.date.startsWith(String(annee)))
    .sort((a, b) => a.date.localeCompare(b.date) || (a.heureDebut ?? '').localeCompare(b.heureDebut ?? ''));
  for (const t of traitements) {
    const recolte = dateRecolteMin(d, t) ?? '';
    for (const tp of t.parcelles) {
      const parcelle = d.parcelles.find((p) => p.id === tp.parcelleId);
      for (const pr of t.produits) {
        const produit = d.produits.find((p) => p.id === pr.produitId);
        lignes.push({
          date: t.date,
          heure: [t.heureDebut, t.heureFin].filter(Boolean).join('–'),
          parcelle: parcelle?.nom ?? '(parcelle supprimée)',
          surfaceHa: tp.surfaceHa,
          culture: parcelle ? cultureDe(parcelle) : '',
          produit: produit?.nom ?? '(produit supprimé)',
          amm: produit?.amm ?? '',
          doseHa: pr.doseHa,
          unite: produit ? `${produit.unite}/ha` : '',
          quantite: pr.doseHa * tp.surfaceHa,
          cible: t.cible ?? '',
          stade: t.stadeBBCH ?? '',
          operateur: t.operateur,
          materiel: t.materiel ?? '',
          dar: produit?.darJours != null ? `${produit.darJours} j` : '',
          recolteMin: recolte,
          traitementId: t.id,
        });
      }
    }
  }
  return lignes;
}

const COLONNES: [keyof LigneRegistre, string][] = [
  ['date', 'Date'],
  ['heure', 'Heure'],
  ['parcelle', 'Parcelle'],
  ['surfaceHa', 'Surface traitée (ha)'],
  ['culture', 'Culture'],
  ['produit', 'Produit'],
  ['amm', 'N° AMM'],
  ['doseHa', 'Dose'],
  ['unite', 'Unité'],
  ['quantite', 'Quantité totale'],
  ['cible', 'Cible'],
  ['stade', 'Stade BBCH'],
  ['operateur', 'Opérateur'],
  ['materiel', 'Matériel'],
  ['dar', 'DAR'],
  ['recolteMin', 'Récolte possible à partir du'],
];

/** CSV lisible directement par Excel en français (point-virgule, virgule décimale). */
export function registreCsv(lignes: LigneRegistre[]): string {
  const cellule = (v: unknown) => {
    const s = typeof v === 'number' ? fmt(v, 3) : String(v ?? '');
    return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const corps = [
    COLONNES.map(([, t]) => t).join(';'),
    ...lignes.map((l) => COLONNES.map(([k]) => cellule(l[k])).join(';')),
  ].join('\r\n');
  return '﻿' + corps + '\r\n';
}

export function registreHtml(lignes: LigneRegistre[], titre: string, exploitation?: string): string {
  const esc = (s: unknown) =>
    String(typeof s === 'number' ? fmt(s, 3) : (s ?? '')).replace(
      /[&<>"]/g,
      (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!,
    );
  const entete = COLONNES.map(([, t]) => `<th>${esc(t)}</th>`).join('');
  const corps = lignes.length
    ? lignes.map((l) => `<tr>${COLONNES.map(([k]) => `<td>${esc(l[k])}</td>`).join('')}</tr>`).join('')
    : `<tr><td colspan="${COLONNES.length}">Aucun traitement sur la période.</td></tr>`;
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>${esc(titre)}</title>
<style>
@page { size: A4 landscape; margin: 12mm; }
body { font-family: -apple-system, Roboto, Helvetica, Arial, sans-serif; font-size: 9pt; color: #111; }
h1 { font-size: 14pt; margin: 0 0 4px; } p { margin: 0 0 10px; color: #444; }
table { border-collapse: collapse; width: 100%; }
th, td { border: 1px solid #999; padding: 3px 4px; text-align: left; vertical-align: top; }
th { background: #eee; }
</style></head><body>
<h1>${esc(titre)}</h1>
<p>${exploitation ? `${esc(exploitation)} · ` : ''}Édité le ${new Date().toLocaleDateString('fr-FR')} · ${lignes.length} ligne(s)</p>
<table><thead><tr>${entete}</tr></thead><tbody>${corps}</tbody></table>
</body></html>`;
}

// --- utilitaires ------------------------------------------------------------

export function nomsParcelles(d: Donnees, t: Traitement): string {
  return t.parcelles.map((tp) => d.parcelles.find((p) => p.id === tp.parcelleId)?.nom ?? '?').join(', ');
}

/** Nombre en français : virgule décimale, sans zéros inutiles. */
export function fmt(n: number, decimales = 2): string {
  const r = Math.round(n * 10 ** decimales) / 10 ** decimales;
  return String(Object.is(r, -0) ? 0 : r).replace('.', ',');
}
