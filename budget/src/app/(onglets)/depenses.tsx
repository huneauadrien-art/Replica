// S06 Liste des lignes du mois, groupées par jour, filtre par catégorie et recherche.

import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { euros, filtrer, libelleJour, libelleMois, NOMS_GROUPES, somme, transactionsDuMois } from '../../core/mois';
import { GROUPES, type Groupe } from '../../core/types';
import { useStore } from '../../data/store';
import { BoutonAjouter, Champ, Ecran, EnTeteJour, LigneTransaction, PastilleGroupe, Puce, SelecteurMois, Texte, Vide } from '../../ui/kit';
import { libelleLigne } from '../../ui/libelles';
import { useMoisChoisi } from '../../ui/moisChoisi';
import { c, rayon } from '../../ui/theme';

export default function Depenses() {
  const { donnees: d } = useStore();
  const { cle, courant, aller } = useMoisChoisi();
  const [groupe, setGroupe] = useState<Groupe | undefined>();
  const [texte, setTexte] = useState('');
  const toutes = transactionsDuMois(d, cle);
  const liste = filtrer(d, toutes, { groupe, texte });
  const jours = [...new Set(liste.map((t) => t.jour))];
  const totalDepenses = somme(liste.filter((t) => t.type === 'depense'));

  return (
    <View style={{ flex: 1 }}>
      <Ecran avecBoutonAjouter>
        <SelecteurMois libelle={libelleMois(cle)} precedent={() => aller(-1)} suivant={cle < courant ? () => aller(1) : undefined} />
        <Champ label="Rechercher" value={texte} onChangeText={setTexte} placeholder="note, catégorie, montant" />
        <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          <Puce titre="Tout" actif={!groupe} onPress={() => setGroupe(undefined)} />
          {GROUPES.map((g) => (
            <PastilleGroupe key={g} groupe={g} choisi={groupe === g} onPress={() => setGroupe(groupe === g ? undefined : g)} />
          ))}
        </View>
        {toutes.length === 0 ? (
          <Vide titre="Aucune ligne ce mois-ci." texte={cle === courant ? 'Touchez + pour noter une dépense.' : undefined} />
        ) : liste.length === 0 ? (
          <Vide titre="Rien ne correspond." texte="Changez la recherche ou la catégorie." />
        ) : (
          <>
            <Texte doux>
              {liste.length} ligne{liste.length > 1 ? 's' : ''} · dépenses {groupe ? `${NOMS_GROUPES[groupe]} ` : ''}: {euros(totalDepenses)}
            </Texte>
            {jours.map((j) => {
              const duJour = liste.filter((t) => t.jour === j);
              return (
                <View key={j}>
                  <EnTeteJour jour={libelleJour(j)} total={somme(duJour.filter((t) => t.type === 'depense'))} />
                  <View style={{ borderRadius: rayon.lg, overflow: 'hidden', borderWidth: 1, borderColor: c.border }}>
                    {duJour.map((t) => {
                      const l = libelleLigne(d, t);
                      return <LigneTransaction key={t.id} titre={l.titre} sousTitre={l.sous} montant={t.montant} sens={t.type} groupe={l.groupe} onPress={() => router.push({ pathname: '/ajouter', params: { id: t.id } })} />;
                    })}
                  </View>
                </View>
              );
            })}
          </>
        )}
      </Ecran>
      {cle === courant ? <BoutonAjouter onPress={() => router.push('/ajouter')} /> : null}
    </View>
  );
}
