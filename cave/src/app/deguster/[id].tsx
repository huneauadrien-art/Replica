// S48 : déguster une bouteille. Elle sort de la cave, sa case se libère, la note va au carnet.

import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { bouteilleASortir, emplacement, nomVin, sortir } from '../../core/cave';
import type { Degustation } from '../../core/types';
import { aujourdhui, nouvelId, useStore } from '../../data/store';
import { BoutonCave, CarteCave, ChampCave, EcranCave, PuceCave, Surtitre, T } from '../../ui/cave/kit';
import { nombre } from '../../ui/cave/outils';
import { c, police } from '../../ui/cave/theme';
import { informer } from '../../ui/dialogues';

const ROBES = ['Pâle', 'Claire', 'Soutenue', 'Profonde', 'Tuilée', 'Dorée', 'Ambrée'];
const NOTES = [12, 14, 15, 16, 17, 18];

export default function Deguster() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { donnees: d, modifier } = useStore();
  const vin = d.vins.find((v) => v.id === id);
  const b = vin ? bouteilleASortir(d, vin.id) : undefined;
  const [date, setDate] = useState(aujourdhui());
  const [note, setNote] = useState('');
  const [robe, setRobe] = useState<string | undefined>();
  const [aromes, setAromes] = useState('');
  const [commentaire, setCommentaire] = useState('');
  const [avecQui, setAvecQui] = useState('');
  const [sortirDeCave, setSortirDeCave] = useState(true);

  if (!vin)
    return (
      <EcranCave>
        <T.texte doux>Ce vin n'existe plus.</T.texte>
      </EcranCave>
    );

  const valider = () => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return informer('Date', 'Écrivez la date au format AAAA-MM-JJ.');
    const n = nombre(note);
    if (note.trim() && (n == null || n < 0 || n > 20)) return informer('Note', 'La note va de 0 à 20.');
    const g: Degustation = {
      id: nouvelId(),
      vinId: vin.id,
      date,
      note: n,
      robe,
      aromes: aromes.trim() || undefined,
      commentaire: commentaire.trim() || undefined,
      avecQui: avecQui.trim() || undefined,
    };
    modifier((x) => {
      const y = { ...x, degustations: [...x.degustations, g] };
      return sortirDeCave && b ? sortir(y, b.id, date) : y;
    });
    router.back();
  };

  return (
    <EcranCave>
      <CarteCave haute>
        <T.vin>
          {nomVin(vin)}
          {vin.millesime ? ` ${vin.millesime}` : ''}
        </T.vin>
        {b ? (
          <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: sortirDeCave }} onPress={() => setSortirDeCave(!sortirDeCave)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 44 }}>
            <View style={{ width: 26, height: 26, borderRadius: 8, borderWidth: 1.5, borderColor: c.or, backgroundColor: sortirDeCave ? c.or : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
              {sortirDeCave ? <Text style={{ color: c.surCreme, fontFamily: police.sansGras }}>✓</Text> : null}
            </View>
            <Text style={{ flex: 1, fontFamily: police.sans, fontSize: 15, color: c.texte2 }}>
              Sortir la bouteille de la cave <Text style={{ fontFamily: police.mono, color: c.orTexte }}>({emplacement(d, b)})</Text>
            </Text>
          </Pressable>
        ) : (
          <T.texte doux>Plus de bouteille en cave : la note va seulement au carnet.</T.texte>
        )}
      </CarteCave>

      <ChampCave label="DATE" value={date} onChangeText={setDate} placeholder="AAAA-MM-JJ" />
      <View style={{ gap: 8 }}>
        <ChampCave label="NOTE SUR 20" value={note} onChangeText={setNote} keyboardType="decimal-pad" placeholder="16" />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {NOTES.map((n) => (
            <PuceCave key={n} titre={String(n)} actif={note === String(n)} onPress={() => setNote(String(n))} />
          ))}
        </View>
      </View>
      <View style={{ gap: 8 }}>
        <Surtitre>Robe</Surtitre>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {ROBES.map((r) => (
            <PuceCave key={r} titre={r} actif={robe === r} onPress={() => setRobe(robe === r ? undefined : r)} />
          ))}
        </View>
      </View>
      <ChampCave label="ARÔMES" value={aromes} onChangeText={setAromes} placeholder="Fruits noirs, sous-bois…" />
      <ChampCave label="CE QUE J'EN AI PENSÉ" value={commentaire} onChangeText={setCommentaire} placeholder="Souple, belle longueur…" multiline />
      <ChampCave label="AVEC QUI" value={avecQui} onChangeText={setAvecQui} placeholder="Facultatif" />
      <BoutonCave titre="Enregistrer la dégustation" onPress={valider} />
    </EcranCave>
  );
}
