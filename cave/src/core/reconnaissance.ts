// Reconnaissance d'une bouteille : la fiche que renvoie l'IA (lecture de l'étiquette) ou
// Open Food Facts (code-barres), transformée en champs d'un vin. Sans dépendance : utilisé
// par le serveur du NAS et par l'app, testé avec vitest.

import type { CouleurVin, Vin } from './types';

const COULEURS_VIN: CouleurVin[] = ['rouge', 'blanc', 'rose', 'effervescent', 'liquoreux', 'fortifie'];

/** Ce que l'IA doit renvoyer. Tout champ inconnu vaut null : l'IA ne doit pas inventer. */
export type FicheIa = {
  est_un_vin: boolean;
  domaine: string | null;
  cuvee: string | null;
  millesime: number | null;
  couleur: CouleurVin | null;
  appellation: string | null;
  region: string | null;
  pays: string | null;
  cepages: { nom: string; pct: number | null }[];
  profil: { corps: number | null; tanins: number | null; acidite: number | null; sucre: number | null };
  aromes: string[];
  temp_min: number | null;
  temp_max: number | null;
  carafage_h: number | null;
  garde: { pret: number; apogee_debut: number; apogee_fin: number; fin: number } | null;
  accords: string | null;
  code_barres: string | null;
  confiance: 'haute' | 'moyenne' | 'faible';
  remarque: string | null;
};

const nul = (t: object) => ({ anyOf: [t, { type: 'null' }] });
const texte = nul({ type: 'string' });
const entier = nul({ type: 'integer' });
const nombre = nul({ type: 'number' });

/** Schéma JSON des sorties structurées (pas de minimum/maximum : non pris en charge). */
export const SCHEMA_FICHE = {
  type: 'object',
  additionalProperties: false,
  required: [
    'est_un_vin', 'domaine', 'cuvee', 'millesime', 'couleur', 'appellation', 'region', 'pays', 'cepages', 'profil',
    'aromes', 'temp_min', 'temp_max', 'carafage_h', 'garde', 'accords', 'code_barres', 'confiance', 'remarque',
  ],
  properties: {
    est_un_vin: { type: 'boolean' },
    domaine: texte,
    cuvee: texte,
    millesime: entier,
    couleur: nul({ type: 'string', enum: COULEURS_VIN }),
    appellation: texte,
    region: texte,
    pays: texte,
    cepages: {
      type: 'array',
      items: { type: 'object', additionalProperties: false, required: ['nom', 'pct'], properties: { nom: { type: 'string' }, pct: entier } },
    },
    profil: {
      type: 'object',
      additionalProperties: false,
      required: ['corps', 'tanins', 'acidite', 'sucre'],
      properties: { corps: entier, tanins: entier, acidite: entier, sucre: entier },
    },
    aromes: { type: 'array', items: { type: 'string' } },
    temp_min: entier,
    temp_max: entier,
    carafage_h: nombre,
    garde: nul({
      type: 'object',
      additionalProperties: false,
      required: ['pret', 'apogee_debut', 'apogee_fin', 'fin'],
      properties: { pret: { type: 'integer' }, apogee_debut: { type: 'integer' }, apogee_fin: { type: 'integer' }, fin: { type: 'integer' } },
    }),
    accords: texte,
    code_barres: texte,
    confiance: { type: 'string', enum: ['haute', 'moyenne', 'faible'] },
    remarque: texte,
  },
} as const;

export const CONSIGNE_IA = `Tu es sommelier. On te montre la photo d'une étiquette de bouteille de vin, prise par un amateur pour sa cave.
Lis l'étiquette, identifie le vin, puis complète la fiche avec ce que tu sais de ce vin (et à défaut, de son appellation et de son millésime).
- Ce que tu lis sur l'étiquette prime sur ce que tu crois savoir. N'invente pas : un champ que tu ne connais pas vaut null.
- domaine : le producteur (château, domaine, maison). cuvee : le nom de la cuvée s'il y en a un, sinon null.
- couleur : rouge, blanc, rose, effervescent (champagne, crémant…), liquoreux (sauternes, moelleux…) ou fortifie (porto, banyuls…).
- cepages : l'assemblage habituel de ce vin, pct en pourcentage entier ou null.
- profil : de 0 à 4. corps 0 léger → 4 puissant ; tanins 0 souple → 4 tannique ; acidite 0 douce → 4 vive ; sucre 0 sec → 4 moelleux.
- aromes : 3 à 6 arômes typiques, en français, un ou deux mots chacun.
- temp_min / temp_max : température de service en °C. carafage_h : durée de carafage conseillée en heures (0 si inutile).
- garde : années (pas des durées) où le vin est prêt, début et fin de son apogée, et fin de garde. null sans millésime.
- accords : 2 ou 3 plats, en une phrase courte.
- code_barres : les chiffres du code-barres s'il est visible sur la photo, sinon null.
- confiance : haute si l'étiquette est lisible et le vin connu, faible si tu devines.
- remarque : une phrase si quelque chose est incertain (millésime illisible…), sinon null.
- est_un_vin : false si la photo ne montre pas une bouteille ou une étiquette de vin ; tous les autres champs à null ou vides.
Réponds en français.`;

const propre = (t: unknown) => (typeof t === 'string' && t.trim() ? t.trim() : undefined);
const entre = (n: unknown, min: number, max: number) => (typeof n === 'number' && Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : undefined);

/** Champs d'un vin tirés de la fiche de l'IA (sans id). Valeurs hors bornes ramenées dans les bornes. */
export function vinDepuisFicheIa(f: FicheIa): Partial<Vin> {
  const v: Partial<Vin> = {
    domaine: propre(f.domaine),
    cuvee: propre(f.cuvee),
    millesime: f.millesime && f.millesime >= 1800 && f.millesime <= 2100 ? Math.round(f.millesime) : undefined,
    couleur: f.couleur && COULEURS_VIN.includes(f.couleur) ? f.couleur : undefined,
    appellation: propre(f.appellation),
    region: propre(f.region),
    accords: propre(f.accords),
    tempMin: entre(f.temp_min, 0, 25),
    tempMax: entre(f.temp_max, 0, 25),
    carafageH: entre(f.carafage_h, 0, 24),
    ean: normaliserEan(f.code_barres ?? '') ?? undefined,
  };
  const cepages = (f.cepages ?? []).filter((c) => propre(c?.nom)).map((c) => ({ nom: c.nom.trim(), pct: entre(c.pct, 0, 100) }));
  if (cepages.length) v.cepages = cepages;
  const aromes = (f.aromes ?? []).map(propre).filter((x): x is string => !!x);
  if (aromes.length) v.aromes = aromes;
  const p = f.profil ?? { corps: null, tanins: null, acidite: null, sucre: null };
  const profil = Object.fromEntries(
    (['corps', 'tanins', 'acidite', 'sucre'] as const).map((k) => [k, entre(p[k], 0, 4)]).filter(([, x]) => x != null),
  );
  if (Object.keys(profil).length) v.profil = profil;
  const g = f.garde;
  if (g && g.pret <= g.apogee_debut && g.apogee_debut <= g.apogee_fin && g.apogee_fin <= g.fin && g.pret >= 1800 && g.fin <= 2200)
    v.garde = { pret: g.pret, apogeeDebut: g.apogee_debut, apogeeFin: g.apogee_fin, fin: g.fin };
  return Object.fromEntries(Object.entries(v).filter(([, x]) => x !== undefined)) as Partial<Vin>;
}

/** Garde les chiffres d'un code-barres EAN-8, UPC-A (12) ou EAN-13 dont la clé est juste ; sinon null. */
export function normaliserEan(t: string): string | null {
  const c = t.replace(/\D/g, '');
  if (![8, 12, 13].includes(c.length)) return null;
  const chiffres = c.split('').map(Number);
  const cle = chiffres.pop()!;
  const somme = chiffres.reverse().reduce((s, n, i) => s + n * (i % 2 === 0 ? 3 : 1), 0);
  return (10 - (somme % 10)) % 10 === cle ? c : null;
}

/** Produit Open Food Facts (champs demandés par le serveur). */
export type ProduitOff = {
  code?: string;
  product_name?: string;
  product_name_fr?: string;
  brands?: string;
  categories_tags?: string[];
  origins?: string;
  countries_tags?: string[];
};

const COULEUR_PAR_CATEGORIE: [RegExp, CouleurVin][] = [
  [/champagne|sparkling|mousseux|cremant|effervescent|prosecco|cava/, 'effervescent'],
  [/sweet-wine|liquoreux|moelleux|sauternes|dessert-wine/, 'liquoreux'],
  [/fortified|port-wine|porto|vin-doux-naturel|banyuls|madeira|sherry/, 'fortifie'],
  [/rose-wine|vins-roses|rose$/, 'rose'],
  [/white-wine|vins-blancs/, 'blanc'],
  [/red-wine|vins-rouges/, 'rouge'],
];

/** Champs d'un vin tirés d'Open Food Facts : souvent partiels (nom, marque, couleur). */
export function vinDepuisOff(p: ProduitOff): Partial<Vin> | null {
  const tags = (p.categories_tags ?? []).map((t) => t.toLowerCase());
  const nom = propre(p.product_name_fr) ?? propre(p.product_name);
  if (!nom && !propre(p.brands)) return null;
  const v: Partial<Vin> = {};
  const marque = propre(p.brands)?.split(',')[0].trim();
  v.domaine = marque ?? nom;
  if (marque && nom && nom.toLowerCase() !== marque.toLowerCase()) v.cuvee = nom;
  const annee = `${nom ?? ''}`.match(/\b(19[5-9]\d|20[0-4]\d)\b/);
  if (annee) {
    v.millesime = Number(annee[1]);
    // Le millésime est affiché à part : on l'enlève du nom de la cuvée.
    if (v.cuvee) v.cuvee = v.cuvee.replace(annee[1], '').replace(/\s{2,}/g, ' ').trim() || undefined;
  }
  for (const [motif, couleur] of COULEUR_PAR_CATEGORIE)
    if (tags.some((t) => motif.test(t))) {
      v.couleur = couleur;
      break;
    }
  const ean = normaliserEan(p.code ?? '');
  if (ean) v.ean = ean;
  return v;
}
