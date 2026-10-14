// Serveur du NAS : garde les données du registre, les synchronise avec les
// téléphones et sert la version web de l'app. Aucune dépendance hors de Node.
//
// Variables d'environnement :
//   CODE        code d'accès demandé par l'app (obligatoire)
//   PORT        port d'écoute (8080 par défaut)
//   DONNEES     dossier des données et des sauvegardes (/donnees par défaut)
//   SITE        dossier de la version web (./site par défaut)

import { createHash, timingSafeEqual } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, renameSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';
import { compter, etatServeurVide, synchroniserServeur, type Changements, type EtatServeur } from '../src/core/sync';

const CODE = process.env.CODE ?? '';
const PORT = Number(process.env.PORT ?? 8080);
const DONNEES = resolve(process.env.DONNEES ?? '/donnees');
const SITE = resolve(process.env.SITE ?? join(__dirname, '..', 'site'));
const FICHIER = join(DONNEES, 'registre.json');
const SAUVEGARDES = join(DONNEES, 'sauvegardes');
const JOURS_GARDES = 60;
const TAILLE_MAX = 50 * 1024 * 1024;

if (!CODE) {
  console.error("Il manque la variable CODE (le code d'accès que l'app demandera).");
  process.exit(1);
}
mkdirSync(SAUVEGARDES, { recursive: true });

// --- données ----------------------------------------------------------------

function charger(): EtatServeur {
  if (!existsSync(FICHIER)) return etatServeurVide();
  const etat = JSON.parse(readFileSync(FICHIER, 'utf8')) as EtatServeur;
  return { ...etatServeurVide(), ...etat, fiches: { ...etatServeurVide().fiches, ...etat.fiches } };
}

let etat = charger();

/** Écrit d'abord dans un fichier temporaire : une coupure de courant ne corrompt pas les données. */
function enregistrer() {
  const tmp = `${FICHIER}.tmp`;
  writeFileSync(tmp, JSON.stringify(etat));
  renameSync(tmp, FICHIER);
  sauvegarderDuJour();
}

/** Une copie par jour dans sauvegardes/, les 60 derniers jours. */
function sauvegarderDuJour() {
  const jour = new Date().toISOString().slice(0, 10);
  const cible = join(SAUVEGARDES, `registre-${jour}.json`);
  copyFileSync(FICHIER, cible);
  const fichiers = readdirSync(SAUVEGARDES).filter((f) => /^registre-\d{4}-\d{2}-\d{2}\.json$/.test(f)).sort();
  for (const vieux of fichiers.slice(0, Math.max(0, fichiers.length - JOURS_GARDES))) unlinkSync(join(SAUVEGARDES, vieux));
}

// --- HTTP -------------------------------------------------------------------

const empreinte = (s: string) => createHash('sha256').update(s).digest();
function autorise(req: IncomingMessage): boolean {
  const recu = (req.headers.authorization ?? '').replace(/^Bearer\s+/i, '');
  return timingSafeEqual(empreinte(recu), empreinte(CODE));
}

function json(res: ServerResponse, statut: number, corps: unknown) {
  res.writeHead(statut, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
  res.end(JSON.stringify(corps));
}

function lireCorps(req: IncomingMessage): Promise<string> {
  return new Promise((ok, erreur) => {
    const morceaux: Buffer[] = [];
    let taille = 0;
    req.on('data', (m: Buffer) => {
      taille += m.length;
      if (taille > TAILLE_MAX) {
        erreur(new Error('trop gros'));
        req.destroy();
      } else morceaux.push(m);
    });
    req.on('end', () => ok(Buffer.concat(morceaux).toString('utf8')));
    req.on('error', erreur);
  });
}

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.ttf': 'font/ttf',
  '.svg': 'image/svg+xml',
};

function servirSite(req: IncomingMessage, res: ServerResponse) {
  const chemin = decodeURIComponent((req.url ?? '/').split('?')[0]);
  let fichier = normalize(join(SITE, chemin));
  if (!fichier.startsWith(SITE)) return json(res, 400, { erreur: 'chemin invalide' });
  // L'app gère elle-même ses pages : tout chemin inconnu renvoie l'app.
  if (!existsSync(fichier) || statSync(fichier).isDirectory()) fichier = join(SITE, 'index.html');
  if (!existsSync(fichier)) return json(res, 404, { erreur: "version web absente de l'image" });
  const statique = fichier.includes(`${join(SITE, '_expo')}`) || fichier.includes(join(SITE, 'assets'));
  res.writeHead(200, {
    'content-type': TYPES[extname(fichier)] ?? 'application/octet-stream',
    'cache-control': statique ? 'public, max-age=31536000, immutable' : 'no-cache',
  });
  res.end(readFileSync(fichier));
}

const serveur = createServer(async (req, res) => {
  // L'app web peut aussi être ouverte depuis une autre adresse (GitHub Pages) : on autorise les appels.
  res.setHeader('access-control-allow-origin', '*');
  res.setHeader('access-control-allow-headers', 'authorization, content-type');
  res.setHeader('access-control-allow-methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.writeHead(204).end();

  const url = (req.url ?? '/').split('?')[0];
  try {
    if (url === '/api/etat' && req.method === 'GET') {
      if (!autorise(req)) return json(res, 401, { erreur: "Code d'accès incorrect." });
      return json(res, 200, { ok: true, rev: etat.rev, fiches: compter(etat) });
    }
    if (url === '/api/sync' && req.method === 'POST') {
      if (!autorise(req)) return json(res, 401, { erreur: "Code d'accès incorrect." });
      const { depuis, changements } = JSON.parse(await lireCorps(req)) as { depuis?: number; changements?: Changements };
      const r = synchroniserServeur(etat, changements ?? {}, Number(depuis) || 0);
      etat = r.etat;
      if (r.modifie) enregistrer();
      return json(res, 200, { rev: r.rev, recues: r.recues });
    }
    if (url.startsWith('/api/')) return json(res, 404, { erreur: 'inconnu' });
    servirSite(req, res);
  } catch (e) {
    console.error(e);
    json(res, 500, { erreur: (e as Error).message });
  }
});

serveur.listen(PORT, () => console.log(`Registre Vigne : http://0.0.0.0:${PORT} — données dans ${DONNEES}`));
