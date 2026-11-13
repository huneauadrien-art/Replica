// Reconnaissance des bouteilles, côté NAS :
// - photo de l'étiquette lue par Claude Sonnet (clé ANTHROPIC_API_KEY, gardée sur le NAS) ;
// - code-barres cherché dans Open Food Facts (gratuit, sans clé).

import Anthropic from '@anthropic-ai/sdk';
import { CONSIGNE_IA, SCHEMA_FICHE, vinDepuisFicheIa, vinDepuisOff, type FicheIa, type ProduitOff } from '../src/core/reconnaissance';
import type { Vin } from '../src/core/types';

export const MODELE = 'claude-sonnet-5-5';

/** Erreur à montrer telle quelle à l'utilisateur, avec le code HTTP à renvoyer. */
export class ErreurReconnaissance extends Error {
  constructor(
    message: string,
    public statut: number,
  ) {
    super(message);
  }
}

export const reconnaissanceDisponible = () => !!process.env.ANTHROPIC_API_KEY?.trim();

let client: Anthropic | null = null;
const lireClient = () => (client ??= new Anthropic({ maxRetries: 2, timeout: 90_000 }));

const TYPES_IMAGE = ['image/jpeg', 'image/png', 'image/webp'] as const;
type TypeImage = (typeof TYPES_IMAGE)[number];

export type Reconnu = { vin: Partial<Vin>; confiance: FicheIa['confiance']; remarque?: string; source: 'ia' };

/** Lit l'étiquette en photo et renvoie la fiche du vin. */
export async function lireEtiquette(base64: string, type: string): Promise<Reconnu> {
  if (!reconnaissanceDisponible())
    throw new ErreurReconnaissance("La reconnaissance par photo n'est pas activée sur le NAS (clé ANTHROPIC_API_KEY absente).", 503);
  if (!TYPES_IMAGE.includes(type as TypeImage)) throw new ErreurReconnaissance('Photo dans un format inconnu (JPEG, PNG ou WebP).', 400);
  let reponse;
  try {
    reponse = await lireClient().beta.messages.create({
      model: MODELE,
      max_tokens: 16000,
      // Lire une étiquette et rappeler ce qu'on sait d'un vin ne demande pas de longue réflexion.
      output_config: { effort: 'low', format: { type: 'json_schema', schema: SCHEMA_FICHE } },
      // Si le modèle décline par prudence, l'API relance sur le modèle de secours recommandé.
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      system: CONSIGNE_IA,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: type as TypeImage, data: base64 } },
            { type: 'text', text: 'Voici la photo. Remplis la fiche.' },
          ],
        },
      ],
    });
  } catch (e) {
    if (e instanceof Anthropic.AuthenticationError || e instanceof Anthropic.PermissionDeniedError)
      throw new ErreurReconnaissance('La clé ANTHROPIC_API_KEY du NAS est refusée : vérifiez-la dans la Console Anthropic.', 502);
    if (e instanceof Anthropic.RateLimitError) throw new ErreurReconnaissance('Trop de demandes à la fois : réessayez dans une minute.', 429);
    if (e instanceof Anthropic.BadRequestError && /credit|billing|balance/i.test(e.message))
      throw new ErreurReconnaissance('Plus de crédit sur le compte Anthropic : rechargez-le dans la Console, ou saisissez la fiche à la main.', 402);
    if (e instanceof Anthropic.APIError) throw new ErreurReconnaissance(`Le service de reconnaissance a répondu une erreur (${e.status ?? 'réseau'}).`, 502);
    throw new ErreurReconnaissance('Le NAS ne joint pas le service de reconnaissance (Internet ?).', 502);
  }
  if (reponse.stop_reason === 'refusal') throw new ErreurReconnaissance("Le service a refusé d'analyser cette photo. Saisissez la fiche à la main.", 422);
  if (reponse.stop_reason === 'max_tokens') throw new ErreurReconnaissance('Réponse incomplète du service : réessayez.', 502);
  const texte = reponse.content.map((b) => (b.type === 'text' ? b.text : '')).join('');
  let fiche: FicheIa;
  try {
    fiche = JSON.parse(texte) as FicheIa;
  } catch {
    throw new ErreurReconnaissance('Réponse illisible du service : réessayez.', 502);
  }
  if (!fiche.est_un_vin) throw new ErreurReconnaissance("Cette photo ne ressemble pas à une étiquette de vin. Cadrez l'étiquette de face, bien éclairée.", 422);
  return { vin: vinDepuisFicheIa(fiche), confiance: fiche.confiance, remarque: fiche.remarque ?? undefined, source: 'ia' };
}

const OFF = () => (process.env.OFF_URL ?? 'https://world.openfoodfacts.org').replace(/\/+$/, '');

/** Cherche un code-barres dans Open Food Facts. null : produit inconnu. */
export async function chercherOff(ean: string): Promise<Partial<Vin> | null> {
  const champs = 'code,product_name,product_name_fr,brands,categories_tags,origins,countries_tags';
  let r: Response;
  try {
    r = await fetch(`${OFF()}/api/v2/product/${encodeURIComponent(ean)}.json?fields=${champs}`, {
      // Open Food Facts demande un nom d'application ; aucun renseignement personnel.
      headers: { 'user-agent': 'MaCave/1.0 (cave a vin personnelle)' },
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    throw new ErreurReconnaissance('Le NAS ne joint pas Open Food Facts (Internet ?).', 502);
  }
  if (r.status === 404) return null;
  if (!r.ok) throw new ErreurReconnaissance(`Open Food Facts a répondu une erreur (${r.status}).`, 502);
  const j = (await r.json()) as { status?: number; product?: ProduitOff };
  if (j.status === 0 || !j.product) return null;
  return vinDepuisOff({ ...j.product, code: j.product.code ?? ean });
}
