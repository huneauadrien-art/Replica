import { accessibilite, eur, expect, foyerPret, jour, lire, semer, taper, test } from './aide';

test.describe('F02 Noter une dépense', () => {
  test.beforeEach(async ({ page }) => {
    await semer(page, foyerPret());
    await page.goto('/');
    await expect(page.getByLabel(/Reste à dépenser/)).toBeVisible();
  });

  test('F02-H1 en 3 touches : +, montant, sous-catégorie', async ({ page }) => {
    await page.getByRole('button', { name: 'Ajouter une dépense' }).click();
    await taper(page, '23,4');
    await accessibilite(page);
    await page.getByRole('radio', { name: 'Courses' }).click();
    await expect(page.getByText(/Courses 23,40\s€ ajoutée/)).toBeVisible();
    await expect(page.getByLabel(/Reste à dépenser : 1\s076,60\s€/)).toBeVisible();
    await expect(page.getByLabel(/^Survie : 23,40/)).toBeVisible();
    const d = await lire(page);
    expect(d.transactions).toEqual([expect.objectContaining({ montant: 2340, type: 'depense', categorieId: 'cat-courses', jour: jour() })]);
    await accessibilite(page);
  });

  test('F02-E1 « Annuler » dans le message retire la dépense', async ({ page }) => {
    await page.getByRole('button', { name: 'Ajouter une dépense' }).click();
    await taper(page, '50');
    await page.getByRole('radio', { name: 'Optionnel' }).click();
    await page.getByRole('radio', { name: 'Restaurant' }).click();
    await page.getByRole('button', { name: 'Annuler' }).click();
    await expect(page.getByLabel(/Reste à dépenser : 1\s100\s€/)).toBeVisible();
    expect((await lire(page)).transactions).toEqual([]);
  });

  test('F02-E2 double touche sur la catégorie : une seule dépense', async ({ page }) => {
    await page.getByRole('button', { name: 'Ajouter une dépense' }).click();
    await taper(page, '12');
    await page.getByRole('radio', { name: 'Courses' }).dblclick();
    await expect(page.getByLabel(/Reste à dépenser/)).toBeVisible();
    await page.waitForTimeout(300);
    expect((await lire(page)).transactions).toHaveLength(1);
  });

  test('F02-E3 dépense d’hier, avec note accentuée et emoji', async ({ page }) => {
    await page.getByRole('button', { name: 'Ajouter une dépense' }).click();
    await taper(page, '8,5');
    await page.getByRole('button', { name: 'Ajouter une note ou changer la date' }).click();
    await page.getByLabel('Note').fill('Boulangerie « Élise » 🥖');
    await page.getByRole('radio', { name: 'Hier' }).click();
    await page.getByRole('button', { name: /Enregistrer 8,50/ }).click();
    await expect(page.getByText('Choisissez une catégorie.')).toBeVisible();
    await page.getByRole('radio', { name: 'Courses' }).click();
    await expect(page.getByText('Boulangerie « Élise » 🥖')).toBeVisible();
    const t = (await lire(page)).transactions[0];
    expect(t).toEqual(expect.objectContaining({ montant: 850, jour: jour(-1), note: 'Boulangerie « Élise » 🥖' }));
  });

  test('F02-N1 sans montant : message, rien d’enregistré', async ({ page }) => {
    await page.getByRole('button', { name: 'Ajouter une dépense' }).click();
    await page.getByRole('button', { name: 'Enregistrer', exact: true }).click();
    await expect(page.getByText('Indiquez un montant.')).toBeVisible();
    await page.getByRole('radio', { name: 'Courses' }).click();
    expect((await lire(page)).transactions).toEqual([]);
  });

  test('F02-E4 sur ordinateur, le clavier tape le montant', async ({ page }) => {
    await page.getByRole('button', { name: 'Ajouter une dépense' }).click();
    await page.keyboard.type('15,2');
    await expect(page.getByTestId('montant')).toHaveText(/15,2\s€/);
    await page.keyboard.press('Backspace');
    await expect(page.getByTestId('montant')).toHaveText(/15,\s€/);
  });

  test('F02-E5 dépassement du budget : reste en rouge et alerte', async ({ page }) => {
    await page.getByRole('button', { name: 'Ajouter une dépense' }).click();
    await taper(page, '1200');
    await page.getByRole('radio', { name: 'Extra' }).click();
    await page.getByRole('radio', { name: 'Réparations' }).click();
    await expect(page.getByLabel(/Reste à dépenser : −100\s€/)).toBeVisible();
    await expect(page.getByText('Le budget du mois est dépassé', { exact: false })).toBeVisible();
  });

  test('F02-E6 revenu en plus : augmente le reste', async ({ page }) => {
    await page.getByRole('button', { name: 'Ajouter une dépense' }).click();
    await page.getByRole('tab', { name: 'Revenu' }).click();
    await taper(page, '150');
    await page.getByRole('button', { name: /Enregistrer 150/ }).click();
    await expect(page.getByLabel(/Reste à dépenser : 1\s250\s€/)).toBeVisible();
    await expect(page.getByText(eur('+150 €'))).toBeVisible();
  });
});
