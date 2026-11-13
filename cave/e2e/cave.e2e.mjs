// Test de bout en bout de Ma Cave, sur la version web servie par son serveur en local.
//
//   EXPO_OFFLINE=1 CI=1 npx expo export -p web
//   npx tsc -p serveur/tsconfig.json
//   CODE=test PORT=8091 DONNEES=/tmp/donnees-e2e SITE=$PWD/dist node build-serveur/serveur/index.js &
//   node e2e/faux-services.mjs 8095 &   (faux Anthropic + Open Food Facts : rien de payant)
//   CODE=test PORT=8091 DONNEES=/tmp/donnees-e2e SITE=$PWD/dist \
//     ANTHROPIC_BASE_URL=http://localhost:8095 ANTHROPIC_API_KEY=faux OFF_URL=http://localhost:8095 \
//     node build-serveur/serveur/index.js &
//   node e2e/cave.e2e.mjs            (URL=http://localhost:8091 par défaut, FAUX=http://localhost:8095)
//
// Utilise le Playwright installé sur la machine (require('playwright')). Échoue sur toute
// erreur de la console, toute réponse 5xx, et tout cas du plan (replica/test-plan-cave.md).

import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium, devices } = require('playwright');

const URL = process.env.URL ?? 'http://localhost:8091';
const FAUX = process.env.FAUX ?? 'http://localhost:8095';
const ETIQUETTE = new globalThis.URL('./etiquette-test.jpg', import.meta.url).pathname;
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

await aller('/');
await p.evaluate(() => localStorage.clear());
await aller('/');

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
  await aller('/nouveau');
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
  await aller('/nouveau');
  await champ('DOMAINE OU CHÂTEAU').fill('chateau cote-rotie 🍷');
  await champ('MILLÉSIME').fill('2018');
  await bouton('Ajouter la bouteille').click();
  await bouton('Plus tard').click();
  await aller('/');
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
  attendu(p.url().includes('/plan'), `plan attendu, url ${p.url()}`);
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
  await aller('/carnet');
  await visible('Souple, belle longueur');
});

await cas('F43-E1', 'les données restent après rechargement', async () => {
  await aller('/');
  await p.reload();
  await p.waitForTimeout(800);
  await visible('×2');
});

await cas('F46-E1', 'meuble rétréci : la bouteille hors grille repasse à ranger', async () => {
  await aller('/meubles');
  await p.getByRole('button', { name: /Cave du bas/ }).click();
  await bouton('colonnes : une de moins').click();
  await bouton('colonnes : une de moins').click(); // 3 → 1 : C1 libre, C2 occupée
  await bouton('Enregistrer').click();
  await p.waitForTimeout(200);
  attendu(dialogues.at(-1)?.includes('repasseront'), `confirmation attendue, reçu « ${dialogues.at(-1)} »`);
  await aller('/');
  await visible('2 bouteilles à ranger');
});

await cas('F42-E1', 'filtres : Blanc vide, Rouge non vide', async () => {
  await bouton('Blanc').click();
  await visible('Aucun vin ne correspond');
  await bouton('Rouge').click();
  await visible('Château Côte-Rôtie');
});

await cas('N-1', 'relier au NAS et envoyer la cave', async () => {
  await aller('/reglages');
  await champ('ADRESSE DU NAS').fill(URL);
  await champ("CODE D'ACCÈS").fill('test');
  await bouton('Tester la connexion').click();
  await visible('NAS joignable');
  await bouton('Connecter et envoyer ma cave').click();
  await visible('Tout est envoyé', 10000);
  const etat = await (await fetch(`${URL}/api/etat`, { headers: { authorization: 'Bearer test' } })).json();
  attendu(etat.app === 'ma-cave' && etat.fiches.vins === 1 && etat.fiches.bouteilles >= 3, `NAS : ${JSON.stringify(etat)}`);
  await aller('/');
});

await cas('R-1', 'photo de l’étiquette : la fiche se remplit, réduite avant envoi', async () => {
  await aller('/nouveau');
  const [choix] = await Promise.all([p.waitForEvent('filechooser'), bouton('Galerie').click()]);
  await choix.setFiles(ETIQUETTE);
  await visible('Vin reconnu', 15000);
  attendu((await champ('DOMAINE OU CHÂTEAU').inputValue()) === 'Château des Essais', 'domaine non rempli');
  attendu((await champ('MILLÉSIME').inputValue()) === '2018', 'millésime non rempli');
  attendu((await champ('CÉPAGES').inputValue()) === 'Merlot 80, Cabernet franc 20', 'cépages non remplis');
  attendu((await champ('PRÊT').inputValue()) === '2022', 'garde non remplie');
  const a = await (await fetch(`${FAUX}/__appels`)).json();
  attendu(a.largeurImage > 0 && a.largeurImage <= 1568, `photo envoyée en ${a.largeurImage} px (${a.tailleImage} octets)`);
  await bouton('Ajouter la bouteille').click();
  await bouton('Plus tard').click();
  await aller('/');
  await visible('Château des Essais 2018');
});

await cas('R-2', 'code-barres tapé : trouvé dans Open Food Facts, puis reconnu dans la cave', async () => {
  await aller('/nouveau');
  await bouton('Code-barres').click();
  await champ('OU TAPEZ LES CHIFFRES').fill('3760000000000');
  await bouton('Chercher').click();
  await visible('Trouvé dans Open Food Facts', 10000);
  attendu((await champ('DOMAINE OU CHÂTEAU').inputValue()) === 'Domaine du Code', 'domaine non rempli');
  await bouton('Ajouter la bouteille').click();
  await bouton('Plus tard').click();
  await aller('/nouveau');
  await bouton('Code-barres').click();
  await champ('OU TAPEZ LES CHIFFRES').fill('3760000000000');
  await bouton('Chercher').click();
  await visible('déjà dans votre cave');
  await bouton('Ajouter la bouteille').click();
  await bouton('Plus tard').click();
  await aller('/');
  await p.getByRole('button', { name: /Domaine du Code · Cuvée des Tests 2020, .*2 bouteilles/ }).first().waitFor({ timeout: 5000 });
});

await cas('R-N1', 'code-barres faux refusé, code inconnu signalé', async () => {
  await aller('/nouveau');
  await bouton('Code-barres').click();
  await champ('OU TAPEZ LES CHIFFRES').fill('3760000000007');
  await bouton('Chercher').click();
  await visible('ne semble pas complet');
  await champ('OU TAPEZ LES CHIFFRES').fill('3760000000017');
  await bouton('Chercher').click();
  await visible('inconnu d’Open Food Facts', 10000);
  await aller('/');
});

await cas('F47-H1', 'supprimer le vin : bouteilles et notes avec', async () => {
  await p.getByRole('button', { name: /Château Côte-Rôtie 🍷 2018/ }).first().click();
  await bouton('Actions').click();
  await bouton('Supprimer ce vin').click();
  await aller('/');
  await p.waitForTimeout(500);
  const restant = await p.getByRole('button', { name: /Château Côte-Rôtie/ }).locator('visible=true').count();
  attendu(restant === 0, 'le vin supprimé est encore affiché');
});

await cas('X-1', 'aucune erreur console ni 5xx', async () => {
  attendu(erreurs.length === 0, erreurs.slice(0, 3).join(' | '));
});

await navigateur.close();
for (const [id, etat, titre] of resultats) console.log(`${etat === 'ok' ? '✓' : '✗'} ${id}  ${titre}`);
const echecs = resultats.filter((r) => r[1] !== 'ok').length;
console.log(`\n${resultats.length} cas, ${resultats.length - echecs} réussis, ${echecs} en échec`);
process.exit(echecs ? 1 : 0);
