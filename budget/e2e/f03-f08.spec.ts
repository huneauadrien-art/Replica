import { eur, expect, foyerPret, jour, lire, moisCourant, moisDecale, semer, taper, test, accessibilite } from './aide';
import type { Donnees } from '../src/core/types';

const dep = (id: string, j: string, montant: number, categorieId = 'cat-courses', note?: string) => ({ id, jour: j, montant, type: 'depense' as const, categorieId, ...(note ? { note } : {}) });

test('F03-H1 créer un objectif, y ranger de l’épargne, le reste ne bouge pas', async ({ page }) => {
  await semer(page, foyerPret());
  await page.goto('/epargne');
  await expect(page.getByText('Pas encore d’objectif.')).toBeVisible();
  await accessibilite(page);
  await page.getByRole('button', { name: 'Créer un objectif' }).click();
  await page.getByLabel('Nom').fill('Vacances');
  await page.getByLabel('Montant visé (€)').fill('1200');
  await page.getByRole('button', { name: 'Enregistrer' }).click();
  await page.getByRole('button', { name: 'Ranger de l’épargne' }).click();
  await taper(page, '100');
  await page.getByRole('radio', { name: 'Vacances' }).click();
  await page.getByRole('button', { name: /Enregistrer 100/ }).click();
  await expect(page.getByLabel(/Vacances, 100\s€ sur 1\s200\s€/)).toBeVisible();
  await page.getByRole('tab', { name: 'Mois' }).click();
  await expect(page.getByLabel(/Reste à dépenser : 1\s100\s€/)).toBeVisible();
});

test('F04-H1 bilan oublié, le faire, clore → préparer le mois suivant', async ({ page }) => {
  const precedent = moisDecale(-1);
  const d: Donnees = { ...foyerPret(), transactions: [dep('a', `${precedent}-10`, 30000), dep('b', `${precedent}-12`, 5000, 'cat-livres')] };
  d.mois = [{ ...d.mois[0], id: precedent }];
  await semer(page, d);
  await page.goto('/');
  await page.getByRole('button', { name: /n’est pas fait/ }).click();
  await expect(page.getByText(eur('1 300 €'))).toBeVisible(); // 1. 2 000 − 700
  await expect(page.getByText(eur('350 €')).first()).toBeVisible(); // 3. dépensé
  await expect(page.getByText('Objectif atteint, avec', { exact: false })).toBeVisible();
  await accessibilite(page);
  await page.getByLabel('Ce que je change le mois prochain').fill('Moins de livres');
  await page.getByRole('button', { name: 'Clore le mois' }).click();
  await expect(page.getByText('Repris du mois précédent.', { exact: false })).toBeVisible();
  const lu = await lire(page);
  expect(lu.mois.find((m) => m.id === precedent)?.clos).toBe(true);
  expect(lu.bilans[0]).toEqual(expect.objectContaining({ id: precedent, aChanger: 'Moins de livres' }));
});

test('F06-H1 historique : graphique et bilans des mois passés', async ({ page }) => {
  const d = foyerPret({ transactions: [dep('a', `${moisDecale(-1)}-03`, 120000)] });
  d.mois.push({ ...d.mois[0], id: moisDecale(-1), clos: true });
  d.bilans = [{ id: moisDecale(-1), ceQuiAMarche: '', tropDepense: 'Voiture', aChanger: 'Comparer les garages' }];
  await semer(page, d);
  await page.goto('/historique');
  await expect(page.getByText('Épargne des derniers mois')).toBeVisible();
  await expect(page.getByText('À changer : Comparer les garages')).toBeVisible();
  await accessibilite(page);
});

test('F06-E1 historique vide', async ({ page }) => {
  await page.goto('/historique');
  await expect(page.getByText('L’historique se remplit mois après mois.')).toBeVisible();
});

test('F07-H1 export CSV pour Excel', async ({ page }) => {
  await semer(page, foyerPret({ transactions: [dep('a', jour(), 2340, 'cat-courses', 'Marché; bio')] }));
  await page.goto('/reglages');
  await accessibilite(page);
  const [fichier] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Exporter en CSV' }).click()]);
  expect(fichier.suggestedFilename()).toBe(`budget-${moisCourant()}.csv`);
  const contenu = await (await fichier.createReadStream()).toArray();
  const texte = Buffer.concat(contenu).toString('utf8');
  expect(texte.startsWith('﻿Date;Type;Groupe')).toBe(true);
  expect(texte).toContain(';Dépense;Survie;Courses;23,40;"Marché; bio";');
});

test('F07-N1 export d’une période vide : message', async ({ page }) => {
  await page.goto('/reglages');
  page.once('dialog', (d) => {
    expect(d.message()).toContain('Aucune ligne');
    void d.accept();
  });
  await page.getByRole('button', { name: 'Exporter en CSV' }).click();
});

test('F08-H1 corriger puis supprimer une ligne', async ({ page }) => {
  await semer(page, foyerPret({ transactions: [dep('a', jour(), 2000, 'cat-courses', 'Marché')] }));
  await page.goto('/depenses');
  await accessibilite(page);
  await page.getByRole('button', { name: /^Marché Courses −20\s€/ }).click();
  await page.getByRole('button', { name: 'Effacer' }).click();
  await page.getByRole('button', { name: 'Effacer' }).click();
  await taper(page, '35');
  await page.getByRole('button', { name: 'Enregistrer', exact: true }).click();
  await expect(page.getByRole('button', { name: /^Marché Courses −35\s€/ })).toBeVisible();
  await page.getByRole('button', { name: /^Marché Courses −35\s€/ }).click();
  page.once('dialog', (d) => void d.accept());
  await page.getByRole('button', { name: 'Supprimer cette ligne' }).click();
  await expect(page.getByText('Aucune ligne ce mois-ci.')).toBeVisible();
  expect((await lire(page)).transactions).toEqual([]);
});

test('F08-E1 recherche sans accents et filtre par catégorie', async ({ page }) => {
  await semer(page, foyerPret({ transactions: [dep('a', jour(), 2000, 'cat-courses', 'Épicerie'), dep('b', jour(), 4000, 'cat-restaurant', 'Pizzeria')] }));
  await page.goto('/depenses');
  await page.getByLabel('Rechercher').fill('epic');
  await expect(page.getByRole('button', { name: /^Épicerie/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Pizzeria/ })).toHaveCount(0);
  await page.getByLabel('Rechercher').fill('');
  await page.getByRole('radio', { name: 'Optionnel' }).click();
  await expect(page.getByRole('button', { name: /^Pizzeria/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Épicerie/ })).toHaveCount(0);
  await page.getByLabel('Rechercher').fill('zzz');
  await expect(page.getByText('Rien ne correspond.')).toBeVisible();
});

test('F12-H1 renommer, ajouter et retirer une sous-catégorie', async ({ page }) => {
  await semer(page, foyerPret());
  await page.goto('/categories');
  await accessibilite(page);
  await page.getByRole('button', { name: 'Renommer Courses' }).click();
  await page.getByLabel('Nom', { exact: true }).fill('Supermarché');
  await page.getByRole('button', { name: 'Enregistrer' }).click();
  await page.getByLabel('Nouvelle sous-catégorie').first().fill('Animaux');
  await page.getByRole('button', { name: 'Ajouter' }).first().click();
  page.once('dialog', (d) => void d.accept());
  await page.getByRole('button', { name: 'Retirer Énergie' }).click();
  await page.goto('/ajouter');
  await expect(page.getByRole('radio', { name: 'Supermarché' })).toBeVisible();
  await expect(page.getByRole('radio', { name: 'Animaux' })).toBeVisible();
  await expect(page.getByRole('radio', { name: 'Énergie' })).toHaveCount(0);
});
