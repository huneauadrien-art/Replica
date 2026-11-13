// S43 : mes meubles (casiers). Un nom, des rangées, des colonnes.

import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { enCave, redimensionnerMeuble, supprimerMeuble } from '../../core/cave';
import type { Meuble } from '../../core/types';
import { nouvelId, useStore } from '../../data/store';
import { BoutonCave, CarteCave, ChampCave, EcranCave, Surtitre, T } from '../../ui/cave/kit';
import { useBarreClaire } from '../../ui/cave/outils';
import { c, police } from '../../ui/cave/theme';
import { confirmer, informer } from '../../ui/kit';

export default function Meubles() {
  useBarreClaire();
  const { donnees: d, modifier } = useStore();
  const [edition, setEdition] = useState<Meuble | null>(d.meubles.length ? null : { id: nouvelId(), nom: 'Ma cave', rangees: 4, colonnes: 6 });
  const meubles = [...d.meubles].sort((a, b) => (a.ordre ?? 0) - (b.ordre ?? 0) || a.nom.localeCompare(b.nom, 'fr'));
  const occupees = (id: string) => enCave(d).filter((b) => b.meubleId === id).length;

  const enregistrer = async (m: Meuble) => {
    if (!m.nom.trim()) return informer('Il manque le nom', 'Donnez un nom au meuble : « Cave du bas », « Casier cuisine »…');
    const perdues = enCave(d).filter((b) => b.meubleId === m.id && ((b.rangee ?? 0) > m.rangees || (b.colonne ?? 0) > m.colonnes)).length;
    if (perdues && !(await confirmer('Meuble plus petit', `${perdues} bouteille(s) hors de la nouvelle grille repasseront « à ranger ».`, 'Continuer'))) return;
    modifier((x) => redimensionnerMeuble(x, { ...m, nom: m.nom.trim(), ordre: m.ordre ?? x.meubles.length }));
    setEdition(null);
  };
  const supprimer = async (m: Meuble) => {
    const n = occupees(m.id);
    if (await confirmer('Supprimer ce meuble', n ? `Ses ${n} bouteille(s) repasseront « à ranger ».` : 'Il est vide.', 'Supprimer')) {
      modifier((x) => supprimerMeuble(x, m.id));
      setEdition(null);
    }
  };

  return (
    <EcranCave>
      {edition ? (
        <CarteCave haute>
          <Surtitre>{d.meubles.some((m) => m.id === edition.id) ? 'Modifier le meuble' : 'Nouveau meuble'}</Surtitre>
          <ChampCave label="NOM" value={edition.nom} onChangeText={(t) => setEdition({ ...edition, nom: t })} placeholder="Cave du bas" />
          <Compteur titre="RANGÉES" valeur={edition.rangees} onChange={(n) => setEdition({ ...edition, rangees: n })} />
          <Compteur titre="COLONNES" valeur={edition.colonnes} onChange={(n) => setEdition({ ...edition, colonnes: n })} />
          <T.texte doux>{`${edition.rangees * edition.colonnes} cases, de R1 · C1 à R${edition.rangees} · C${edition.colonnes}.`}</T.texte>
          <BoutonCave titre="Enregistrer" onPress={() => enregistrer(edition)} />
          <View style={{ flexDirection: 'row', gap: 12 }}>
            {d.meubles.length ? <BoutonCave titre="Annuler" variante="fantome" style={{ flex: 1 }} onPress={() => setEdition(null)} /> : null}
            {d.meubles.some((m) => m.id === edition.id) ? <BoutonCave titre="Supprimer" variante="lien" style={{ flex: 1 }} onPress={() => supprimer(edition)} /> : null}
          </View>
        </CarteCave>
      ) : (
        <BoutonCave titre="Ajouter un meuble" onPress={() => setEdition({ id: nouvelId(), nom: '', rangees: 4, colonnes: 6 })} />
      )}

      {meubles.map((m) => (
        <Pressable key={m.id} accessibilityRole="button" onPress={() => setEdition(m)}>
          <CarteCave>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <T.vin>{m.nom}</T.vin>
              <T.mono>{`${m.rangees} × ${m.colonnes}`}</T.mono>
            </View>
            <T.texte doux>{`${occupees(m.id)} bouteille(s) sur ${m.rangees * m.colonnes} cases · toucher pour modifier`}</T.texte>
          </CarteCave>
        </Pressable>
      ))}
    </EcranCave>
  );
}

function Compteur({ titre, valeur, onChange }: { titre: string; valeur: number; onChange: (n: number) => void }) {
  const bouton = (t: string, n: number, label: string) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => onChange(Math.max(1, Math.min(30, n)))}
      style={({ pressed }) => ({ width: 48, height: 48, borderRadius: 14, borderWidth: 1, borderColor: c.bord2, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.6 : 1 })}
    >
      <Text style={{ fontFamily: police.sansMoyen, fontSize: 24, color: c.texte }}>{t}</Text>
    </Pressable>
  );
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <Text style={{ fontFamily: police.sansDemi, fontSize: 12, letterSpacing: 2, color: c.or }}>{titre}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        {bouton('−', valeur - 1, `${titre.toLowerCase()} : une de moins`)}
        <Text style={{ fontFamily: police.mono, fontSize: 22, color: c.texte, minWidth: 32, textAlign: 'center' }}>{valeur}</Text>
        {bouton('+', valeur + 1, `${titre.toLowerCase()} : une de plus`)}
      </View>
    </View>
  );
}
