import { describe, expect, it } from 'vitest';
import { appliquerRecues, cle, compter, difference, etatServeurVide, synchroniserServeur, toutEnvoyer, type Fiche } from '../sync';
import { DONNEES_VIDES, type Donnees } from '../types';

const parcelle = (id: string, nom: string) => ({ id, nom, surfaceHa: 1, contour: [] });
const base = (): Donnees => ({ ...DONNEES_VIDES, parcelles: [parcelle('a', 'A'), parcelle('b', 'B')] });

describe('différence sur le téléphone', () => {
  it('horodate les fiches modifiées et crée une pierre tombale pour les supprimées', () => {
    const avant = base();
    const apres = { ...avant, parcelles: [{ ...avant.parcelles[0], nom: 'A2' }, parcelle('c', 'C')] };
    const { apres: r, changees } = difference(avant, apres, 1000);
    expect(changees.parcelles).toEqual([
      expect.objectContaining({ id: 'a', nom: 'A2', maj: 1000 }),
      expect.objectContaining({ id: 'c', maj: 1000 }),
      { id: 'b', maj: 1000, supprime: true },
    ]);
    expect(r.parcelles.every((p) => p.maj === 1000)).toBe(true);
    expect(changees.produits).toBeUndefined();
  });

  it('ne signale rien quand rien ne change', () => {
    const d = base();
    expect(difference(d, { ...d }, 1).changees).toEqual({});
  });
});

describe('serveur', () => {
  it('garde la version la plus récente et renvoie les changements depuis un numéro', () => {
    let etat = etatServeurVide();
    const r1 = synchroniserServeur(etat, { parcelles: [{ id: 'a', nom: 'A', maj: 10 }] }, 0);
    expect(r1.rev).toBe(1);
    etat = r1.etat;

    // Un deuxième appareil, qui n'a encore rien vu, envoie une version plus ancienne : refusée.
    const r2 = synchroniserServeur(etat, { parcelles: [{ id: 'a', nom: 'vieux', maj: 5 }] }, 0);
    expect(r2.recues.parcelles).toEqual([{ id: 'a', nom: 'A', maj: 10 }]);
    expect(r2.modifie).toBe(false);

    // Version plus récente : acceptée, et seul ce changement est renvoyé depuis le numéro 1.
    const r3 = synchroniserServeur(etat, { parcelles: [{ id: 'a', nom: 'A3', maj: 20 }] }, 1);
    expect(r3.recues.parcelles).toEqual([{ id: 'a', nom: 'A3', maj: 20 }]);
    expect(r3.rev).toBe(2);
    expect(synchroniserServeur(etat, {}, 2).recues).toEqual({});
  });

  it('transmet les suppressions et ne les compte pas', () => {
    const etat = etatServeurVide();
    synchroniserServeur(etat, { produits: [{ id: 'x', nom: 'Soufre', maj: 1 }, { id: 'y', nom: 'Cuivre', maj: 1 }] }, 0);
    const r = synchroniserServeur(etat, { produits: [{ id: 'x', maj: 2, supprime: true }] }, 2);
    expect(r.recues.produits).toEqual([{ id: 'x', maj: 2, supprime: true }]);
    expect(compter(etat).produits).toBe(1);
  });
});

describe('deux téléphones', () => {
  it('finissent avec les mêmes données', () => {
    const serveur = etatServeurVide();
    // Téléphone 1 envoie tout ; téléphone 2 part de zéro et reçoit tout.
    const t1 = base();
    const env = toutEnvoyer(t1, 100);
    const s1 = synchroniserServeur(serveur, env, 0);
    let t2: Donnees = appliquerRecues(DONNEES_VIDES, synchroniserServeur(serveur, {}, 0).recues, new Map());
    expect(t2.parcelles.map((p) => p.nom).sort()).toEqual(['A', 'B']);

    // Téléphone 2 supprime B ; téléphone 1 renomme A. Chacun synchronise.
    const d2 = difference(t2, { ...t2, parcelles: t2.parcelles.filter((p) => p.id !== 'b') }, 200);
    const s2 = synchroniserServeur(serveur, d2.changees, s1.rev);
    t2 = appliquerRecues(d2.apres, s2.recues, new Map());

    const d1 = difference(t1, { ...t1, parcelles: t1.parcelles.map((p) => (p.id === 'a' ? { ...p, nom: 'A1' } : p)) }, 300);
    const s3 = synchroniserServeur(serveur, d1.changees, s1.rev);
    const t1fin = appliquerRecues(d1.apres, s3.recues, new Map());
    t2 = appliquerRecues(t2, synchroniserServeur(serveur, {}, s2.rev).recues, new Map());

    expect(t1fin.parcelles.map((p) => p.nom)).toEqual(['A1']);
    expect(t2.parcelles.map((p) => p.nom)).toEqual(['A1']);
  });

  it("ne perd pas une modification locale pas encore envoyée", () => {
    const d = base();
    const locale: Fiche = { ...d.parcelles[0], nom: 'local', maj: 50 };
    const r = appliquerRecues({ ...d, parcelles: [locale as never, d.parcelles[1]] }, { parcelles: [{ id: 'a', nom: 'serveur', maj: 40 }] }, new Map([[cle('parcelles', 'a'), locale]]));
    expect(r.parcelles.find((p) => p.id === 'a')?.nom).toBe('local');
  });
});
