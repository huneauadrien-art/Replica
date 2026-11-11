// S12 Catégories : renommer, ajouter, retirer les sous-catégories des 4 groupes.

import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { categories, CATEGORIES_DEFAUT, ID_AUTRE, NOMS_GROUPES, AIDE_GROUPES } from '../core/mois';
import { GROUPES, type Categorie, type Donnees, type Groupe } from '../core/types';
import { nouvelId, useStore } from '../data/store';
import { Bouton, Carte, Champ, confirmer, Ecran, Ligne, Texte } from '../ui/kit';
import { c, couleurGroupe, type as t } from '../ui/theme';

/** Les catégories du foyer ; si elles n'ont jamais été modifiées, on part de celles par défaut. */
const liste = (x: Donnees): Categorie[] => (x.categories.length ? x.categories : CATEGORIES_DEFAUT);

export default function Categories() {
  const { donnees: d, modifier } = useStore();
  const [nouveau, setNouveau] = useState<Record<Groupe, string>>({ survie: '', optionnel: '', culture: '', extra: '' });
  const [edition, setEdition] = useState<{ id: string; nom: string } | null>(null);

  const changer = (f: (l: Categorie[]) => Categorie[]) => modifier((x) => ({ ...x, categories: f(liste(x)) }));

  const ajouter = (g: Groupe) => {
    const nom = nouveau[g].trim();
    if (!nom) return;
    const ordre = Math.max(0, ...liste(d).filter((x) => x.groupe === g).map((x) => x.ordre)) + 1;
    changer((l) => [...l, { id: nouvelId(), nom, groupe: g, ordre }]);
    setNouveau((n) => ({ ...n, [g]: '' }));
  };

  const retirer = async (cat: Categorie) => {
    const utilisee = d.transactions.some((x) => x.categorieId === cat.id);
    const ok = await confirmer(`Retirer « ${cat.nom} » ?`, utilisee ? 'Les dépenses déjà notées gardent cette catégorie dans l’historique.' : 'Elle ne sera plus proposée.', 'Retirer');
    if (ok) changer((l) => l.map((x) => (x.id === cat.id ? { ...x, archivee: true } : x)));
  };

  return (
    <Ecran>
      <Texte doux>Les 4 catégories de la méthode restent fixes. Dans chacune, vous rangez les sous-catégories qui vous parlent.</Texte>
      {GROUPES.map((g) => (
        <Carte key={g}>
          <Text style={[t.lg, { color: couleurGroupe[g].fort }]}>{NOMS_GROUPES[g]}</Text>
          <Texte doux petit>{AIDE_GROUPES[g]}</Texte>
          {categories(d)
            .filter((x) => x.groupe === g)
            .map((cat) =>
              edition?.id === cat.id ? (
                <View key={cat.id} style={{ gap: 8 }}>
                  <Champ label="Nom" value={edition.nom} onChangeText={(v) => setEdition({ id: cat.id, nom: v })} autoFocus />
                  <Ligne>
                    <Bouton
                      titre="Enregistrer"
                      onPress={() => {
                        if (edition.nom.trim()) changer((l) => l.map((x) => (x.id === cat.id ? { ...x, nom: edition.nom.trim() } : x)));
                        setEdition(null);
                      }}
                    />
                    <Bouton titre="Annuler" variante="discret" onPress={() => setEdition(null)} />
                  </Ligne>
                </View>
              ) : (
                <View key={cat.id} style={{ flexDirection: 'row', alignItems: 'center', minHeight: 48, borderTopWidth: 1, borderTopColor: c.border }}>
                  <Pressable accessibilityRole="button" accessibilityLabel={`Renommer ${cat.nom}`} onPress={() => setEdition({ id: cat.id, nom: cat.nom })} style={{ flex: 1, minHeight: 48, justifyContent: 'center' }}>
                    <Texte>{cat.nom}</Texte>
                  </Pressable>
                  {cat.id !== ID_AUTRE ? (
                    <Pressable accessibilityRole="button" accessibilityLabel={`Retirer ${cat.nom}`} onPress={() => retirer(cat)} style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={[t.lg, { color: c.danger }]}>×</Text>
                    </Pressable>
                  ) : null}
                </View>
              ),
            )}
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-end' }}>
            <View style={{ flex: 1 }}>
              <Champ label="Nouvelle sous-catégorie" value={nouveau[g]} onChangeText={(v) => setNouveau((n) => ({ ...n, [g]: v }))} onSubmitEditing={() => ajouter(g)} />
            </View>
            <Bouton titre="Ajouter" variante="secondaire" onPress={() => ajouter(g)} desactive={!nouveau[g].trim()} />
          </View>
        </Carte>
      ))}
    </Ecran>
  );
}
