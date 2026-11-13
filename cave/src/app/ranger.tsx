// S46 : ranger les bouteilles « à ranger », une par une : un toucher sur une case libre, la suivante apparaît.

import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { enCave, lieuVin, nomCase, nomVin, ranger } from '../core/cave';
import { useStore } from '../data/store';
import { Grille } from '../ui/cave/Grille';
import { BoutonCave, CarteCave, EcranCave, PuceCave, Surtitre, T, Vignette } from '../ui/cave/kit';
import { usePhoto } from '../ui/cave/outils';
import { informer } from '../ui/dialogues';

export default function Ranger() {
  const { vin: vinId } = useLocalSearchParams<{ vin?: string }>();
  const { donnees: d, modifier } = useStore();
  const [passees, setPassees] = useState<string[]>([]);
  const [rangees, setRangees] = useState(0);
  const meubles = [...d.meubles].sort((a, b) => (a.ordre ?? 0) - (b.ordre ?? 0) || a.nom.localeCompare(b.nom, 'fr'));
  const [meubleId, setMeubleId] = useState(meubles[0]?.id);
  const m = meubles.find((x) => x.id === meubleId) ?? meubles[0];

  const file = enCave(d)
    .filter((b) => !b.meubleId && !passees.includes(b.id))
    .sort((a, b) => Number(b.vinId === vinId) - Number(a.vinId === vinId));
  const b = file[0];
  const vin = b ? d.vins.find((v) => v.id === b.vinId) : undefined;
  const photo = usePhoto(vin?.photo);

  if (!m)
    return (
      <EcranCave>
        <CarteCave>
          <T.texte>Pour ranger vos bouteilles, dessinez d'abord votre casier : son nom, ses rangées et ses colonnes.</T.texte>
          <BoutonCave titre="Créer un meuble" onPress={() => router.replace('/meubles')} />
        </CarteCave>
      </EcranCave>
    );

  if (!b || !vin)
    return (
      <EcranCave>
        <CarteCave haute>
          <T.vin>{rangees ? `${rangees} bouteille${rangees > 1 ? 's' : ''} rangée${rangees > 1 ? 's' : ''}` : 'Rien à ranger'}</T.vin>
          <T.texte doux>{passees.length ? `${passees.length} laissée${passees.length > 1 ? 's' : ''} « à ranger » pour plus tard.` : 'Toutes vos bouteilles ont leur case.'}</T.texte>
          <BoutonCave titre="Voir le plan" variante="creme" onPress={() => router.replace('/?vue=plan')} />
        </CarteCave>
      </EcranCave>
    );

  return (
    <EcranCave>
      <Surtitre droite={<T.mono couleur="#a08e7e">{`${file.length} à ranger`}</T.mono>}>Bouteille à placer</Surtitre>
      <CarteCave haute>
        <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
          <Vignette couleur={vin.couleur} photo={photo} />
          <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
            <T.vin lignes={2}>
              {nomVin(vin)}
              {vin.millesime ? ` ${vin.millesime}` : ''}
            </T.vin>
            {lieuVin(vin) ? <T.texte doux>{lieuVin(vin)}</T.texte> : null}
          </View>
        </View>
      </CarteCave>
      <T.texte doux>Touchez la case libre où vous posez cette bouteille.</T.texte>
      {meubles.length > 1 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {meubles.map((x) => (
            <PuceCave key={x.id} titre={x.nom} actif={x.id === m.id} onPress={() => setMeubleId(x.id)} />
          ))}
        </ScrollView>
      ) : (
        <Surtitre>{m.nom}</Surtitre>
      )}
      <Grille
        d={d}
        m={m}
        onCase={(occupee, r, col) => {
          if (occupee) return informer('Case prise', `La case ${nomCase(r, col)} a déjà une bouteille. Choisissez une case en pointillés.`);
          try {
            modifier((x) => ranger(x, b.id, m.id, r, col));
            setRangees((n) => n + 1);
          } catch (e) {
            informer('Case prise', (e as Error).message);
          }
        }}
      />
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <BoutonCave titre="Plus tard" variante="fantome" style={{ flex: 1 }} onPress={() => setPassees([...passees, b.id])} />
        <BoutonCave titre="Terminé" variante="creme" style={{ flex: 1 }} onPress={() => router.back()} />
      </View>
    </EcranCave>
  );
}
