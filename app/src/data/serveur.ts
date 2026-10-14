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
    throw new Error("Cette adresse ne répond pas comme le serveur Registre Vigne.");
  }
}
