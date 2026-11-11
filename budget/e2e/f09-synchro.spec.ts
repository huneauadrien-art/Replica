import { CODE, expect, foyerPret, lire, semer, taper, test } from './aide';

test('F09-H1 deux téléphones du foyer partagent le budget par le NAS', async ({ page, browser, baseURL }) => {
  await semer(page, foyerPret());
  await page.goto('/nas');
  await page.getByLabel('Adresse du NAS').fill(baseURL!);
  await page.getByLabel('Code d’accès').fill(CODE);
  await page.getByRole('button', { name: 'Tester la connexion' }).click();
  await page.getByRole('button', { name: 'Connecter et envoyer le budget de ce téléphone' }).click();
  await expect(page.getByText('Tout est envoyé.')).toBeVisible();

  const autre = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  await autre.goto(`${baseURL}/nas`);
  await autre.getByLabel('Code d’accès').fill(CODE);
  await autre.getByRole('button', { name: 'Tester la connexion' }).click();
  await autre.getByRole('button', { name: 'Connecter et récupérer le budget du NAS' }).click();
  await expect(autre.getByText('Tout est envoyé.')).toBeVisible();
  await autre.goto(`${baseURL}/`);
  await expect(autre.getByLabel(/Reste à dépenser : 1\s100\s€/)).toBeVisible();

  // Une dépense sur le 2e téléphone arrive sur le 1er.
  await autre.getByRole('button', { name: 'Ajouter une dépense' }).click();
  await taper(autre, '40');
  await autre.getByRole('radio', { name: 'Courses' }).click();
  await expect(autre.getByLabel(/Reste à dépenser : 1\s060\s€/)).toBeVisible();
  await expect.poll(async () => (await autre.evaluate(() => JSON.parse(localStorage.getItem('budget-foyer/sync') ?? '{}').enAttente)) ?? {}, { timeout: 10_000 }).toEqual({});
  await page.goto('/nas');
  await page.getByRole('button', { name: 'Synchroniser maintenant' }).click();
  await expect.poll(async () => (await lire(page)).transactions.length, { timeout: 10_000 }).toBe(1);
});

test('F09-N1 mauvais code : refusé', async ({ page, baseURL }) => {
  await page.goto('/nas');
  await page.getByLabel('Adresse du NAS').fill(baseURL!);
  await page.getByLabel('Code d’accès').fill('pas-le-bon');
  await page.getByRole('button', { name: 'Tester la connexion' }).click();
  await expect(page.getByText('Code d’accès refusé par le NAS.')).toBeVisible();
});
