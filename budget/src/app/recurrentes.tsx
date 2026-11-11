// Revenus et charges fixes habituels : proposés pour préparer un mois sans mois précédent à reprendre.

import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { euros, lireMontant } from '../core/mois';
import type { LigneRecurrente } from '../core/types';
import { nouvelId, useStore } from '../data/store';
import { Alerte, Bascule, Bouton, Carte, Champ, ChampMontant, Ecran, Ligne, Puce, SousTitre, Texte, Vide } from '../ui/kit';
import { c, type as t } from '../ui/theme';

export default function Recurrentes() {
  const { donnees: d, modifier } = useStore();
  const [typeL, setTypeL] = useState<LigneRecurrente['type']>('chargeFixe');
  const [libelle, setLibelle] = useState('');
  const [montant, setMontant] = useState('');
  const [erreur, setErreur] = useState<string | null>(null);

  const ajouter = () => {
    const m = lireMontant(montant);
    if (!libelle.trim() || !m) return setErreur('Indiquez un libellé et un montant.');
    setErreur(null);
    modifier((x) => ({ ...x, recurrentes: [...x.recurrentes, { id: nouvelId(), libelle: libelle.trim(), montant: m, type: typeL, active: true }] }));
    setLibelle('');
    setMontant('');
  };

  const bloc = (type: LigneRecurrente['type'], titre: string) => {
    const lignes = d.recurrentes.filter((r) => r.type === type);
    return (
      <Carte>
        <SousTitre>{titre}</SousTitre>
        {lignes.length === 0 ? <Texte doux>Aucune.</Texte> : null}
        {lignes.map((r) => (
          <View key={r.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 48, borderTopWidth: 1, borderTopColor: c.border }}>
            <View style={{ flex: 1 }}>
              <Texte>{r.libelle}</Texte>
              <Texte doux petit>{euros(r.montant)} par mois</Texte>
            </View>
            <Puce titre={r.active ? 'Actif' : 'En pause'} actif={r.active} onPress={() => modifier((x) => ({ ...x, recurrentes: x.recurrentes.map((y) => (y.id === r.id ? { ...y, active: !y.active } : y)) }))} />
            <Pressable accessibilityRole="button" accessibilityLabel={`Supprimer ${r.libelle}`} onPress={() => modifier((x) => ({ ...x, recurrentes: x.recurrentes.filter((y) => y.id !== r.id) }))} style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={[t.lg, { color: c.danger }]}>×</Text>
            </Pressable>
          </View>
        ))}
      </Carte>
    );
  };

  return (
    <Ecran>
      <Texte doux>Chaque nouveau mois reprend le mois précédent. Ces lignes servent quand il n’y en a pas (premier mois, mois sauté).</Texte>
      {d.recurrentes.length === 0 ? <Vide titre="Rien pour l’instant." texte="Ajoutez votre salaire, votre loyer, vos abonnements." /> : null}
      {bloc('revenu', 'Revenus')}
      {bloc('chargeFixe', 'Charges fixes')}
      <Carte>
        <Texte gras>Ajouter</Texte>
        <Bascule
          options={[
            { valeur: 'chargeFixe', titre: 'Charge fixe' },
            { valeur: 'revenu', titre: 'Revenu' },
          ]}
          valeur={typeL}
          onChange={setTypeL}
        />
        <Champ label="Libellé" value={libelle} onChangeText={setLibelle} placeholder={typeL === 'revenu' ? 'Salaire' : 'Loyer'} />
        <ChampMontant label="Montant par mois (€)" value={montant} onChangeText={setMontant} />
        {erreur ? <Alerte ton="danger" texte={erreur} /> : null}
        <Ligne>
          <Bouton titre="Ajouter" onPress={ajouter} />
        </Ligne>
      </Carte>
    </Ecran>
  );
}
