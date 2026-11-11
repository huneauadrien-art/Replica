import { accessibilite, eur, expect, foyerPret, lire, moisCourant, moisDecale, semer, test } from './aide';

test.describe('F01 Préparer le mois', () => {
  test('F01-H1 premier mois : revenus, charge fixe, épargne → reste à dépenser', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Le mois n’est pas encore préparé.')).toBeVisible();
    await accessibilite(page);
    await page.getByRole('button', { name: 'Préparer le mois' }).click();
    await page.getByLabel('Revenus prévus (€)').fill('2 000');
    await page.getByRole('button', { name: '+ Ajouter une charge fixe' }).click();
    await page.getByLabel('Libellé').fill('Loyer');
    await page.getByLabel('€', { exact: true }).fill('700');
    await page.getByLabel('Épargne visée (€)').fill('200');
    await expect(page.getByText(eur('1 100 €')).first()).toBeVisible();
    await accessibilite(page);
    await page.getByRole('button', { name: 'Enregistrer le mois' }).click();
    await expect(page.getByLabel(/Reste à dépenser : 1\s100\s€/)).toBeVisible();
    const d = await lire(page);
    expect(d.mois).toEqual([expect.objectContaining({ id: moisCourant(), revenusPrevus: 200000, epargneVisee: 20000 })]);
    // « Retenir pour les mois suivants » coché par défaut au premier mois.
    expect(d.recurrentes.map((r) => r.libelle).sort()).toEqual(['Loyer', 'Revenus du mois']);
    await accessibilite(page);
  });

  test('F01-E1 épargne plus grande que ce qui reste : avertissement', async ({ page }) => {
    await page.goto('/preparer');
    await page.getByLabel('Revenus prévus (€)').fill('1000');
    await page.getByLabel('Épargne visée (€)').fill('1500');
    await expect(page.getByText('L’épargne visée dépasse ce qui reste après les charges.')).toBeVisible();
  });

  test('F01-N1 montant illisible : refusé avec un message', async ({ page }) => {
    await page.goto('/preparer');
    await page.getByLabel('Revenus prévus (€)').fill('deux mille');
    await page.getByRole('button', { name: 'Enregistrer le mois' }).click();
    await expect(page.getByText('Le montant des revenus n’est pas reconnu.')).toBeVisible();
    expect((await lire(page)).mois).toEqual([]);
  });

  test('F01-E2 mois suivant : repris du mois précédent', async ({ page }) => {
    const d = foyerPret();
    d.mois[0].id = moisDecale(-1);
    d.mois[0].clos = true;
    await semer(page, d);
    await page.goto('/');
    await page.getByRole('button', { name: 'Préparer le mois' }).click();
    await expect(page.getByText('Repris du mois précédent.', { exact: false })).toBeVisible();
    await expect(page.getByLabel('Revenus prévus (€)')).toHaveValue('2000');
    await page.getByRole('button', { name: 'Enregistrer le mois' }).click();
    await expect(page.getByLabel(/Reste à dépenser : 1\s100\s€/)).toBeVisible();
  });
});
