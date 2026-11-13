// Appels au serveur du NAS.

import { Platform } from 'react-native';

export type Serveur = { url: string; code: string };

/** « nas.mondomaine.fr » → « https://nas.mondomaine.fr », sans barre finale. */
export function normaliserUrl(texte: string): string {
  let u = texte.trim().replace(/\/+$/, '');
  if (u && !/^https?:\/\//i.test(u)) u = `https://${u}`;
  return u;
}

/** Sur le web servi par le NAS lui-même, l'adresse du serveur est celle de la page. */
export function adresseProposee(): string {
  if (Platform.OS !== 'web' || typeof location === 'undefined') return '';
  return /github\.io$/.test(location.hostname) ? '' : location.origin;
}

export async function appelServeur<T>(s: Serveur, chemin: string, corps?: unknown): Promise<T> {
  const controle = new AbortController();
  const delai = setTimeout(() => controle.abort(), 20_000);
  let reponse: Response;
  try {
    reponse = await fetch(s.url + chemin, {
      method: corps === undefined ? 'GET' : 'POST',
      headers: { authorization: `Bearer ${s.code}`, 'content-type': 'application/json' },
      body: corps === undefined ? undefined : JSON.stringify(corps),
      signal: controle.signal,
    });
  } catch {
    throw new Error("NAS injoignable. Vérifiez l'adresse et la connexion (réseau, VPN).");
  } finally {
    clearTimeout(delai);
  }
  if (reponse.status === 401) throw new Error("Code d'accès refusé par le NAS.");
  if (!reponse.ok) throw new Error(`Le NAS a répondu une erreur (${reponse.status}).`);
  try {
    return (await reponse.json()) as T;
  } catch {
    throw new Error("Cette adresse ne répond pas comme le serveur Ma Cave.");
  }
}

/** Télécharge une pièce jointe (photo d'étiquette) depuis le NAS. */
export async function telechargerPiece(s: Serveur, id: string): Promise<Uint8Array> {
  let reponse: Response;
  try {
    reponse = await fetch(`${s.url}/api/pieces/${encodeURIComponent(id)}`, { headers: { authorization: `Bearer ${s.code}` } });
  } catch {
    throw new Error('NAS injoignable : la pièce sera visible au retour du réseau.');
  }
  if (reponse.status === 404) throw new Error("Cette pièce n'est pas encore arrivée sur le NAS.");
  if (!reponse.ok) throw new Error(`Le NAS a répondu une erreur (${reponse.status}).`);
  return new Uint8Array(await reponse.arrayBuffer());
}
