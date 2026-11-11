import { describe, expect, it } from 'vitest';
import { appliquerRecues, cle, compter, difference, etatServeurVide, synchroniserServeur, toutEnvoyer, type Fiche } from '../sync';
import { DONNEES_VIDES, type Donnees, type Mois } from '../types';

const mois = (epargneVisee: number): Mois => ({ id: '2026-11', revenusPrevus: 100000, chargesFixes: [], epargneVisee, budgets: {}, clos: false });
const dep = (id: string, montant: number) => ({ id, jour: '2026-11-10', montant, type: 'depense' as const, categorieId: 'cat-courses' });

describe('synchronisation du budget', () => {
  it('deux téléphones ajoutent chacun une dépense : les deux restent', () => {
    const serveur = etatServeurVide();
    const t1 = difference(DONNEES_VIDES, { ...DONNEES_VIDES, transactions: [dep('a', 100)] }, 10);
    const t2 = difference(DONNEES_VIDES, { ...DONNEES_VIDES, transactions: [dep('b', 200)] }, 11);
    synchroniserServeur(serveur, t1.changees, 0);
    const r2 = synchroniserServeur(serveur, t2.changees, 0);
    const fin2 = appliquerRecues(t2.apres, r2.recues, new Map());
    expect(fin2.transactions.map((t) => t.id).sort()).toEqual(['a', 'b']);
    expect(compter(serveur).transactions).toBe(2);
  });

  it('le même mois préparé sur deux téléphones donne une seule fiche, la plus récente', () => {
    const serveur = etatServeurVide();
    synchroniserServeur(serveur, { mois: [{ ...mois(10000), maj: 5 }] as Fiche[] }, 0);
    const r = synchroniserServeur(serveur, { mois: [{ ...mois(20000), maj: 6 }] as Fiche[] }, 0);
    expect(compter(serveur).mois).toBe(1);
    const t: Donnees = appliquerRecues(DONNEES_VIDES, r.recues, new Map());
    expect(t.mois).toHaveLength(1);
    expect(t.mois[0].epargneVisee).toBe(20000);
  });

  it('une suppression part comme pierre tombale et s’applique ailleurs', () => {
    const avant: Donnees = { ...DONNEES_VIDES, transactions: [dep('a', 1), dep('b', 2)] };
    const serveur = etatServeurVide();
    const s1 = synchroniserServeur(serveur, toutEnvoyer(avant, 1), 0);
    const d = difference(avant, { ...avant, transactions: [avant.transactions[1]] }, 2);
    expect(d.changees.transactions).toEqual([{ id: 'a', maj: 2, supprime: true }]);
    synchroniserServeur(serveur, d.changees, s1.rev);
    const autre = appliquerRecues(avant, synchroniserServeur(serveur, {}, s1.rev).recues, new Map());
    expect(autre.transactions.map((t) => t.id)).toEqual(['b']);
  });

  it('ne perd pas une modification locale pas encore envoyée', () => {
    const locale = { ...mois(5), maj: 50 } as Fiche;
    const d = { ...DONNEES_VIDES, mois: [locale as never] };
    const r = appliquerRecues(d, { mois: [{ ...mois(9), maj: 40 }] as Fiche[] }, new Map([[cle('mois', '2026-11'), locale]]));
    expect(r.mois[0].epargneVisee).toBe(5);
  });

  it('le serveur connaît toutes les collections', () => {
    expect(Object.keys(etatServeurVide().fiches).sort()).toEqual(['bilans', 'categories', 'mois', 'objectifs', 'recurrentes', 'reglages', 'transactions']);
  });
});
