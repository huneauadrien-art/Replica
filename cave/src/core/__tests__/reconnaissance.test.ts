import { describe, expect, it } from 'vitest';
import { normaliserEan, vinDepuisFicheIa, vinDepuisOff, type FicheIa } from '../reconnaissance';

const fiche = (x: Partial<FicheIa> = {}): FicheIa => ({
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
    { nom: 'Cabernet franc', pct: null },
  ],
  profil: { corps: 3, tanins: 9, acidite: null, sucre: 0 },
  aromes: ['Cassis', ' ', 'Réglisse'],
  temp_min: 16,
  temp_max: 18,
  carafage_h: 1.5,
  garde: { pret: 2022, apogee_debut: 2025, apogee_fin: 2033, fin: 2038 },
  accords: 'Agneau, cèpes',
  code_barres: '3 760 000 000 000',
  confiance: 'haute',
  remarque: null,
  ...x,
});

describe('fiche de l’IA → vin', () => {
  it('reprend les champs utiles et ramène les valeurs dans leurs bornes', () => {
    expect(vinDepuisFicheIa(fiche())).toEqual({
      domaine: 'Château des Essais',
      millesime: 2018,
      couleur: 'rouge',
      appellation: 'Saint-Émilion Grand Cru',
      region: 'Bordeaux',
      accords: 'Agneau, cèpes',
      tempMin: 16,
      tempMax: 18,
      carafageH: 1.5,
      ean: '3760000000000',
      cepages: [{ nom: 'Merlot', pct: 80 }, { nom: 'Cabernet franc' }],
      aromes: ['Cassis', 'Réglisse'],
      profil: { corps: 3, tanins: 4, sucre: 0 },
      garde: { pret: 2022, apogeeDebut: 2025, apogeeFin: 2033, fin: 2038 },
    });
  });

  it('écarte une fenêtre de garde incohérente, un millésime absurde, une couleur inconnue', () => {
    const v = vinDepuisFicheIa(fiche({ garde: { pret: 2030, apogee_debut: 2025, apogee_fin: 2033, fin: 2038 }, millesime: 18, couleur: 'violet' as never }));
    expect(v.garde).toBeUndefined();
    expect(v.millesime).toBeUndefined();
    expect(v.couleur).toBeUndefined();
  });
});

describe('code-barres', () => {
  it('accepte un EAN-13, un EAN-8, un UPC-A à la clé juste ; refuse le reste', () => {
    expect(normaliserEan('3760000000000')).toBe('3760000000000');
    expect(normaliserEan('3760000000007')).toBeNull();
    expect(normaliserEan('96385074')).toBe('96385074');
    expect(normaliserEan('036000291452')).toBe('036000291452');
    expect(normaliserEan('12345')).toBeNull();
  });

  it('tire nom, cuvée, millésime et couleur d’Open Food Facts', () => {
    expect(
      vinDepuisOff({ code: '3760000000000', product_name: 'Les Vieilles Vignes 2019', brands: 'Domaine du Test, Autre', categories_tags: ['en:wines', 'en:red-wines'] }),
    ).toEqual({ domaine: 'Domaine du Test', cuvee: 'Les Vieilles Vignes', millesime: 2019, couleur: 'rouge', ean: '3760000000000' });
    expect(vinDepuisOff({ product_name: 'Crémant de Loire', categories_tags: ['fr:cremants'] })).toEqual({ domaine: 'Crémant de Loire', couleur: 'effervescent' });
    expect(vinDepuisOff({ code: '1' })).toBeNull();
  });
});
