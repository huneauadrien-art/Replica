// Modifier la fiche d'un vin.

import { router, useLocalSearchParams } from 'expo-router';
import { remplacer, useStore } from '../../../data/store';
import { FormVin } from '../../../ui/cave/FormVin';
import { EcranCave, T } from '../../../ui/cave/kit';
import { useBarreClaire } from '../../../ui/cave/outils';

export default function ModifierVin() {
  useBarreClaire();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { donnees: d, modifier } = useStore();
  const vin = d.vins.find((v) => v.id === id);
  return (
    <EcranCave>
      {vin ? (
        <FormVin
          initial={vin}
          nouveau={false}
          onValider={({ vin: v }) => {
            modifier((x) => ({ ...x, vins: remplacer(x.vins, v) }));
            router.back();
          }}
        />
      ) : (
        <T.texte doux>Ce vin n'existe plus.</T.texte>
      )}
    </EcranCave>
  );
}
