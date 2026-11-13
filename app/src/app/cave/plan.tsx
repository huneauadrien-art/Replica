// S42 en écran à part : ouvert depuis la fiche d'un vin, avec la case de la bouteille mise en avant.

import { useLocalSearchParams } from 'expo-router';
import { useStore } from '../../data/store';
import { EcranCave } from '../../ui/cave/kit';
import { useBarreClaire } from '../../ui/cave/outils';
import { Plan } from '../../ui/cave/Plan';

export default function PlanCave() {
  useBarreClaire();
  const { b } = useLocalSearchParams<{ b?: string }>();
  const { donnees: d } = useStore();
  return (
    <EcranCave>
      <Plan d={d} miseEnAvant={b} />
    </EcranCave>
  );
}
