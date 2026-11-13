// S42 : un meuble en grille. Toucher une bouteille ouvre sa fiche.

import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { COULEURS, enCave } from '../../core/cave';
import type { Donnees } from '../../core/types';
import { Grille } from './Grille';
import { BoutonCave, CarteCave, PuceCave, Surtitre, T } from './kit';
import { couleurVin } from './theme';

export function Plan({ d, miseEnAvant }: { d: Donnees; miseEnAvant?: string }) {
  const meubles = [...d.meubles].sort((a, b) => (a.ordre ?? 0) - (b.ordre ?? 0) || a.nom.localeCompare(b.nom, 'fr'));
  const cible = d.bouteilles.find((b) => b.id === miseEnAvant);
  const [choisi, setChoisi] = useState<string | undefined>(cible?.meubleId ?? meubles[0]?.id);
  useEffect(() => {
    if (cible?.meubleId) setChoisi(cible.meubleId);
  }, [cible?.meubleId]);
  const m = meubles.find((x) => x.id === choisi) ?? meubles[0];
  const aRanger = enCave(d).filter((b) => !b.meubleId);

  if (!m)
    return (
      <CarteCave>
        <T.texte>Dessinez votre casier (rangées × colonnes) pour voir chaque bouteille à sa place.</T.texte>
        <BoutonCave titre="Créer un meuble" onPress={() => router.push('/cave/meubles')} />
      </CarteCave>
    );
  return (
    <View style={{ gap: 16 }}>
      {meubles.length > 1 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {meubles.map((x) => (
            <PuceCave key={x.id} titre={x.nom} actif={x.id === m.id} onPress={() => setChoisi(x.id)} />
          ))}
        </ScrollView>
      ) : (
        <Surtitre>{m.nom}</Surtitre>
      )}
      <Grille d={d} m={m} miseEnAvant={miseEnAvant} onCase={(b) => b && router.push(`/cave/vin/${b.vinId}`)} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14 }}>
        {COULEURS.map((co) => (
          <View key={co.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: couleurVin[co.id] }} />
            <T.texte doux taille={13}>
              {co.nom}
            </T.texte>
          </View>
        ))}
      </View>
      {aRanger.length > 0 ? <BoutonCave titre={`Ranger ${aRanger.length} bouteille${aRanger.length > 1 ? 's' : ''}`} onPress={() => router.push('/cave/ranger')} /> : null}
    </View>
  );
}

