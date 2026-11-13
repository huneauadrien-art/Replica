// S49 : carnet de dégustation.

import { router } from 'expo-router';
import { Pressable, View } from 'react-native';
import { nomVin } from '../core/cave';
import { useStore } from '../data/store';
import { CarteCave, EcranCave, T } from '../ui/cave/kit';
import { c } from '../ui/cave/theme';

export default function Carnet() {
  const { donnees: d } = useStore();
  const vins = new Map(d.vins.map((v) => [v.id, v]));
  const notes = [...d.degustations].sort((a, b) => b.date.localeCompare(a.date));
  return (
    <EcranCave>
      {notes.length === 0 ? <T.texte doux>Aucune dégustation pour l’instant. Sur la fiche d’un vin, touchez « Déguster cette bouteille ».</T.texte> : null}
      {notes.map((x) => {
        const v = vins.get(x.vinId);
        return (
          <Pressable key={x.id} accessibilityRole="button" disabled={!v} onPress={() => v && router.push(`/vin/${v.id}`)}>
            <CarteCave>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <T.vin taille={19}>{v ? `${nomVin(v)}${v.millesime ? ` ${v.millesime}` : ''}` : 'Vin supprimé'}</T.vin>
                </View>
                {x.note != null ? <T.mono taille={16}>{`${String(x.note).replace('.', ',')}/20`}</T.mono> : null}
              </View>
              <T.mono couleur={c.doux}>{x.date.split('-').reverse().join('/')}</T.mono>
              {x.commentaire ? <T.italique>{x.commentaire}</T.italique> : null}
              {x.robe || x.aromes || x.avecQui ? <T.texte doux>{[x.robe, x.aromes, x.avecQui ? `avec ${x.avecQui}` : ''].filter(Boolean).join(' · ')}</T.texte> : null}
            </CarteCave>
          </Pressable>
        );
      })}
    </EcranCave>
  );
}
