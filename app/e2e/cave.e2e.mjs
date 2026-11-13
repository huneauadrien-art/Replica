// Test de bout en bout de la cave à vin, sur la version web servie par le serveur du NAS en local.
//
//   EXPO_OFFLINE=1 CI=1 npx expo export -p web
//   npx tsc -p serveur/tsconfig.json
//   CODE=test PORT=8091 DONNEES=/tmp/donnees-e2e SITE=$PWD/dist node build-serveur/serveur/index.js &
//   node e2e/cave.e2e.mjs            (URL=http://localhost:8091 par défaut)
//
// Utilise le Playwright installé sur la machine (require('playwright')). Échoue sur toute
// erreur de la console, toute réponse 5xx, et tout cas du plan (replica/test-plan-cave.md).

import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium, devices } = require('playwright');

const URL = process.env.URL ?? 'http://localhost:8091';
const resultats = [];
const erreurs = [];
const dialogues = [];

async function cas(id, titre, f) {
  try {
    await f();
    resultats.push([id, 'ok', titre]);
  } catch (e) {
    resultats.push([id, 'ÉCHEC', `${titre} : ${e.message.split('\n')[0]}`]);
    if (process.env.CAPTURES) await p.screenshot({ path: `${process.env.CAPTURES}/echec-${id}.png` }).catch(() => {});
  }
}
const attendu = (cond, message) => {
  if (!cond) throw new Error(message);
};

const navigateur = await chromium.launch();
const ctx = await navigateur.newContext({ ...devices['iPhone 13'], deviceScaleFactor: 1 });
const p = await ctx.newPage();
p.on('pageerror', (e) => erreurs.push(`page : ${e.message}`));
p.on('console', (m) => m.type() === 'error' && erreurs.push(`console : ${m.text()}`));
p.on('response', (r) => r.status() >= 500 && erreurs.push(`${r.status()} ${r.url()}`));
p.on('dialog', async (d) => {
  dialogues.push(d.message());
  await d.accept();
});

const bouton = (nom) => p.getByRole('button', { name: nom, exact: true });
const champ = (nom) => p.getByLabel(nom, { exact: true });
// Les écrans précédents restent dans la page (cachés) : on ne regarde que le texte visible.
const visible = async (texte, ms = 5000) => p.getByText(texte, { exact: false }).locator('visible=true').first().waitFor({ state: 'visible', timeout: ms });
const aller = async (chemin) => {
  await p.goto(URL + chemin);
  await p.waitForTimeout(600);
};

await aller('/cave');
await p.evaluate(() => localStorage.clear());
await aller('/cave');

await cas('F40-E0', 'cave vide : message d’accueil', async () => {
  await visible('Votre cave, rangée dans votre poche');
  await visible('Dessiner mon premier casier');
});

await cas('F46-H1', 'créer un meuble 2 × 3', async () => {
  await bouton('Dessiner mon premier casier').click();
  await champ('NOM').fill('Cave du bas');
  await bouton('rangées : une de moins').click();
  await bouton('rangées : une de moins').click(); // 4 → 2
  await bouton('colonnes : une de moins').click();
  await bouton('colonnes : une de moins').click();
  await bouton('colonnes : une de moins').click(); // 6 → 3
  await visible('6 cases, de R1 · C1 à R2 · C3');
  await bouton('Enregistrer').click();
  await visible('0 bouteille(s) sur 6 cases');
});

await cas('F40-N1', 'domaine vide refusé', async () => {
  await aller('/cave/nouveau');
  await bouton('Ajouter la bouteille').click();
  await p.waitForTimeout(200);
  attendu(dialogues.at(-1)?.includes('Il manque le domaine'), `message attendu, reçu « ${dialogues.at(-1)} »`);
});

await cas('F40-H1', 'ajouter 2 bouteilles (accents et emoji) puis les ranger', async () => {
  await champ('DOMAINE OU CHÂTEAU').fill('Château Côte-Rôtie 🍷');
  await champ('MILLÉSIME').fill('2018');
  await champ('RÉGION').fill('Bordeaux');
  await bouton('Une bouteille de plus').click();
  await champ('PRIX / BOUTEILLE (€)').fill('20,5');
  await visible('Garde estimée : prêt en 2023, apogée 2026–2033');
  await bouton('Ajouter 2 bouteilles').click();
  await visible('Bouteille à placer');
  await visible('2 à ranger');
  await bouton('R1 C1 : case libre').click();
  await visible('1 à ranger');
});

await cas('F40-E1', 'case prise refusée', async () => {
  await p.getByRole('button', { name: /^R1 C1 : Château/ }).click();
  await p.waitForTimeout(200);
  attendu(dialogues.at(-1)?.includes('Case prise'), `message attendu, reçu « ${dialogues.at(-1)} »`);
  await bouton('R1 C2 : case libre').click();
  await visible('2 bouteilles rangées');
});

await cas('F40-E2', 'même vin ajouté de nouveau : regroupé, pas de doublon', async () => {
  await aller('/cave/nouveau');
  await champ('DOMAINE OU CHÂTEAU').fill('chateau cote-rotie 🍷');
  await champ('MILLÉSIME').fill('2018');
  await bouton('Ajouter la bouteille').click();
  await bouton('Plus tard').click();
  await aller('/cave');
  const n = await p.getByRole('button', { name: /Château Côte-Rôtie 🍷 2018/ }).count();
  attendu(n >= 1, 'vin absent de la liste');
  await visible('×3');
  await visible('1 bouteille à ranger');
});

await cas('F42-H1', 'retrouver une bouteille : fiche puis case dans le plan', async () => {
  await p.getByRole('button', { name: /Château Côte-Rôtie 🍷 2018, Bordeaux, 3 bouteilles/ }).first().click();
  await visible('À son apogée');
  await visible('apogée 2026–2033');
  await p.getByRole('button', { name: 'Emplacement : Cave du bas · R1 · C1' }).click();
  await visible('CAVE DU BAS');
  attendu(p.url().includes('/cave/plan'), `plan attendu, url ${p.url()}`);
});

await cas('F43-H1', 'déguster : la bouteille sort, la case se libère, la note va au carnet', async () => {
  await p.getByRole('button', { name: /^R1 C1 : Château/ }).click();
  await bouton('Déguster').click();
  await visible('Sortir la bouteille de la cave');
  await bouton('16').click();
  await champ("CE QUE J'EN AI PENSÉ").fill('Souple, belle longueur');
  await bouton('Enregistrer la dégustation').click();
  await visible('Mes dégustations');
  await visible('16/20');
  await visible('×2');
  await aller('/cave/carnet');
  await visible('Souple, belle longueur');
});

await cas('F43-E1', 'les données restent après rechargement', async () => {
  await aller('/cave');
  await p.reload();
  await p.waitForTimeout(800);
  await visible('×2');
});

await cas('F46-E1', 'meuble rétréci : la bouteille hors grille repasse à ranger', async () => {
  await aller('/cave/meubles');
  await p.getByRole('button', { name: /Cave du bas/ }).click();
  await bouton('colonnes : une de moins').click();
  await bouton('colonnes : une de moins').click(); // 3 → 1 : C1 libre, C2 occupée
  await bouton('Enregistrer').click();
  await p.waitForTimeout(200);
  attendu(dialogues.at(-1)?.includes('repasseront'), `confirmation attendue, reçu « ${dialogues.at(-1)} »`);
  await aller('/cave');
  await visible('2 bouteilles à ranger');
});

await cas('F42-E1', 'filtres : Blanc vide, Rouge non vide', async () => {
  await bouton('Blanc').click();
  await visible('Aucun vin ne correspond');
  await bouton('Rouge').click();
  await visible('Château Côte-Rôtie');
});

await cas('F47-H1', 'supprimer le vin : bouteilles et notes avec', async () => {
  await p.getByRole('button', { name: /Château Côte-Rôtie 🍷 2018/ }).first().click();
  await bouton('Actions').click();
  await bouton('Supprimer ce vin').click();
  await aller('/cave');
  await visible('Aucune bouteille en cave');
});

await cas('X-1', 'aucune erreur console ni 5xx', async () => {
  attendu(erreurs.length === 0, erreurs.slice(0, 3).join(' | '));
});

await navigateur.close();
for (const [id, etat, titre] of resultats) console.log(`${etat === 'ok' ? '✓' : '✗'} ${id}  ${titre}`);
const echecs = resultats.filter((r) => r[1] !== 'ok').length;
console.log(`\n${resultats.length} cas, ${resultats.length - echecs} réussis, ${echecs} en échec`);
process.exit(echecs ? 1 : 0);
