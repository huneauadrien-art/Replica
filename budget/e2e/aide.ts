// Outils communs aux tests de bout en bout. Montants fictifs uniquement.
import AxeBuilder from '@axe-core/playwright';
import { expect, test as base, type Page } from '@playwright/test';
import { DONNEES_VIDES, type Donnees } from '../src/core/types';

export const CODE = 'code-de-test';

/** Jour local au format AAAA-MM-JJ (décalé de n jours). */
export function jour(n = 0): string {
  const d = new Date(Date.now() + n * 86_400_000);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
export const moisCourant = () => jour().slice(0, 7);
export function moisDecale(n: number): string {
  const [a, m] = moisCourant().split('-').map(Number);
  const t = a * 12 + m - 1 + n;
  return `${Math.floor(t / 12)}-${String((t % 12) + 1).padStart(2, '0')}`;
}

/** Un foyer avec le mois courant préparé : 2 000 € de revenus, 700 € de loyer, 200 € d'épargne visée. */
export function foyerPret(extra: Partial<Donnees> = {}): Donnees {
  return {
    ...DONNEES_VIDES,
    mois: [{ id: moisCourant(), revenusPrevus: 200000, chargesFixes: [{ libelle: 'Loyer', montant: 70000 }], epargneVisee: 20000, budgets: {}, clos: false }],
    ...extra,
  };
}

/** Met des données sur le « téléphone » avant que l'appli ne démarre. */
export async function semer(page: Page, d: Donnees) {
  await page.addInitScript((texte) => {
    if (!sessionStorage.getItem('seme')) {
      localStorage.setItem('budget-foyer/donnees', texte);
      sessionStorage.setItem('seme', '1');
    }
  }, JSON.stringify(d));
}

/** Les données gardées par l'appli. */
export async function lire(page: Page): Promise<Donnees> {
  return JSON.parse((await page.evaluate(() => localStorage.getItem('budget-foyer/donnees'))) ?? 'null') ?? DONNEES_VIDES;
}

export async function accessibilite(page: Page) {
  const r = await new AxeBuilder({ page: page as never }).disableRules(['region', 'landmark-one-main', 'page-has-heading-one']).analyze();
  expect(r.violations.map((v) => `${v.id} : ${v.nodes.length} × ${v.nodes[0]?.target}`)).toEqual([]);
}

/** Test qui échoue sur une erreur de la console ou une réponse 5xx. */
export const test = base.extend<{ erreurs: string[] }>({
  erreurs: [
    async ({ page }, use) => {
      const erreurs: string[] = [];
      page.on('pageerror', (e) => erreurs.push(e.message));
      // Un 401 (mauvais code, testé exprès) est affiché par le navigateur : ce n'est pas une erreur de l'appli.
      page.on('console', (m) => m.type() === 'error' && !/status of 401/.test(m.text()) && erreurs.push(m.text()));
      page.on('response', (r) => r.status() >= 500 && erreurs.push(`${r.status()} ${r.url()}`));
      await use(erreurs);
      expect(erreurs).toEqual([]);
    },
    { auto: true },
  ],
});
export { expect };

/** Tape un montant sur le pavé. */
export async function taper(page: Page, montant: string) {
  for (const k of montant) await page.getByRole('button', { name: k === ',' ? 'Virgule' : k, exact: true }).click();
}

/** « 1 076,60 € » écrit avec n'importe quelle espace. */
export const eur = (texte: string) => new RegExp(texte.replace(/[ \u202f\u00a0]/g, '\\s').replace(/€/, '\\s?€').replace(/[+]/g, '\\+'));
