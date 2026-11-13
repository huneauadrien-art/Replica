// S45 : nouvelle bouteille (saisie, photo de l'étiquette). Puis S46 : la ranger.

import { router } from 'expo-router';
import { simplifier } from '../../core/cave';
import type { Bouteille, Vin } from '../../core/types';
import { aujourdhui, nouvelId, remplacer, useStore } from '../../data/store';
import { FormVin } from '../../ui/cave/FormVin';
import { EcranCave } from '../../ui/cave/kit';
import { useBarreClaire } from '../../ui/cave/outils';

/** Même domaine, même cuvée, même millésime : c'est le même vin. */
const memeVin = (a: Vin, b: Vin) =>
  simplifier(a.domaine) === simplifier(b.domaine) && simplifier(a.cuvee ?? '') === simplifier(b.cuvee ?? '') && a.millesime === b.millesime && a.couleur === b.couleur;

export default function NouvelleBouteille() {
  useBarreClaire();
  const { donnees: d, modifier } = useStore();
  return (
    <EcranCave>
      <FormVin
        nouveau
        onValider={({ vin, quantite, prix }) => {
          const existant = d.vins.find((v) => memeVin(v, vin));
          const v = existant ? { ...existant, photo: existant.photo ?? vin.photo } : vin;
          const bouteilles: Bouteille[] = Array.from({ length: quantite }, () => ({ id: nouvelId(), vinId: v.id, entree: aujourdhui(), statut: 'cave', prix }));
          modifier((x) => ({ ...x, vins: remplacer(x.vins, v), bouteilles: [...x.bouteilles, ...bouteilles] }));
          router.replace(d.meubles.length ? `/cave/ranger?vin=${v.id}` : `/cave/vin/${v.id}`);
        }}
      />
    </EcranCave>
  );
}
