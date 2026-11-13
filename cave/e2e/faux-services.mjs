// Faux services pour les tests : l'API Anthropic (lecture d'étiquette) et Open Food Facts.
// Aucun appel payant, aucune donnée réelle. Lancer : node e2e/faux-services.mjs [port]
// puis le serveur Ma Cave avec ANTHROPIC_BASE_URL=http://localhost:<port> ANTHROPIC_API_KEY=faux
// OFF_URL=http://localhost:<port>.

import { createServer } from 'node:http';

const PORT = Number(process.argv[2] ?? 8095);

export const FICHE = {
  est_un_vin: true,
  domaine: 'Château des Essais',
  cuvee: null,
  millesime: 2018,
  couleur: 'rouge',
  appellation: 'Saint-Émilion Grand Cru',
  region: 'Bordeaux',
  pays: 'France',
  cepages: [
    { nom: 'Merlot', pct: 80 },
    { nom: 'Cabernet franc', pct: 20 },
  ],
  profil: { corps: 3, tanins: 3, acidite: 2, sucre: 0 },
  aromes: ['Cassis', 'Réglisse', 'Cèdre'],
  temp_min: 16,
  temp_max: 18,
  carafage_h: 1,
  garde: { pret: 2022, apogee_debut: 2025, apogee_fin: 2033, fin: 2038 },
  accords: 'Agneau rôti, cèpes',
  code_barres: null,
  confiance: 'haute',
  remarque: null,
};

const PRODUITS = {
  '3760000000000': { code: '3760000000000', product_name: 'Cuvée des Tests 2020', brands: 'Domaine du Code', categories_tags: ['en:wines', 'en:white-wines'] },
};

export const appels = { anthropic: 0, off: 0, tailleImage: 0, largeurImage: 0 };

createServer((req, res) => {
  let corps = '';
  req.on('data', (m) => (corps += m));
  req.on('end', () => {
    const url = req.url ?? '';
    if (req.method === 'POST' && url.startsWith('/v1/messages')) {
      appels.anthropic += 1;
      const r = JSON.parse(corps);
      const image = r.messages?.[0]?.content?.find((b) => b.type === 'image');
      if (image?.source?.data) {
        const o = Buffer.from(image.source.data, 'base64');
        appels.tailleImage = o.length;
        // Largeur lue dans l'en-tête JPEG (segment SOF0/SOF2).
        for (let i = 2; i < o.length - 9; ) {
          if (o[i] !== 0xff) break;
          const t = o[i + 1];
          if (t === 0xc0 || t === 0xc2) {
            appels.largeurImage = Math.max(o.readUInt16BE(i + 5), o.readUInt16BE(i + 7));
            break;
          }
          i += 2 + o.readUInt16BE(i + 2);
        }
      }
      const ok = r.model === 'claude-sonnet-5-5' && image?.source?.data && r.output_config?.format?.type === 'json_schema';
      res.writeHead(ok ? 200 : 400, { 'content-type': 'application/json' });
      return res.end(
        JSON.stringify(
          ok
            ? {
                id: 'msg_faux',
                type: 'message',
                role: 'assistant',
                model: r.model,
                content: [{ type: 'text', text: JSON.stringify(FICHE) }],
                stop_reason: 'end_turn',
                stop_sequence: null,
                usage: { input_tokens: 1800, output_tokens: 400 },
              }
            : { type: 'error', error: { type: 'invalid_request_error', message: 'requête inattendue' } },
        ),
      );
    }
    if (url === '/__appels') {
      res.writeHead(200, { 'content-type': 'application/json' });
      return res.end(JSON.stringify(appels));
    }
    const off = url.match(/^\/api\/v2\/product\/(\d+)\.json/);
    if (off) {
      appels.off += 1;
      const p = PRODUITS[off[1]];
      res.writeHead(p ? 200 : 404, { 'content-type': 'application/json' });
      return res.end(JSON.stringify(p ? { status: 1, product: p } : { status: 0 }));
    }
    res.writeHead(404).end();
  });
}).listen(PORT, () => console.log(`faux services sur ${PORT}`));
