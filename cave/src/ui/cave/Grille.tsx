// La grille d'un meuble (plan de cave, écran Ranger).

import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { grilleMeuble, nomVin } from '../../core/cave';
import type { Bouteille, Donnees, Meuble } from '../../core/types';
import { c, couleurVin, police, rayon } from './theme';

export function Grille({
  d,
  m,
  miseEnAvant,
  onCase,
}: {
  d: Donnees;
  m: Meuble;
  miseEnAvant?: string;
  onCase: (b: Bouteille | null, rangee: number, colonne: number) => void;
}) {
  const g = grilleMeuble(d, m);
  const vins = new Map(d.vins.map((v) => [v.id, v]));
  const large = m.colonnes > 6;
  return (
    <ScrollView horizontal={large} showsHorizontalScrollIndicator={large} contentContainerStyle={large ? { minWidth: m.colonnes * 72 + 30 } : { flexGrow: 1 }}>
      <View style={{ gap: 6, flex: 1 }}>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          <View style={{ width: 26 }} />
          {Array.from({ length: m.colonnes }, (_, j) => (
            <Text key={j} style={styles.repere}>
              C{j + 1}
            </Text>
          ))}
        </View>
        {g.map((rang, i) => (
          <View key={i} style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
            <Text style={[styles.repere, { width: 26, flex: 0 }]}>R{i + 1}</Text>
            {rang.map((b, j) => {
              const v = b ? vins.get(b.vinId) : undefined;
              const vu = b != null && b.id === miseEnAvant;
              return (
                <Pressable
                  key={j}
                  accessibilityRole="button"
                  accessibilityLabel={v ? `R${i + 1} C${j + 1} : ${nomVin(v)} ${v.millesime ?? ''}` : `R${i + 1} C${j + 1} : case libre`}
                  onPress={() => onCase(b, i + 1, j + 1)}
                  style={({ pressed }) => [
                    styles.case,
                    v ? { backgroundColor: couleurVin[v.couleur] } : styles.caseVide,
                    vu && styles.caseVue,
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  {v ? (
                    <>
                      <Text numberOfLines={2} style={styles.caseNom}>
                        {v.cuvee || v.domaine}
                      </Text>
                      {v.millesime ? <Text style={styles.caseAnnee}>{v.millesime}</Text> : null}
                    </>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  repere: { flex: 1, textAlign: 'center', fontFamily: police.mono, fontSize: 12, color: c.doux },
  case: { flex: 1, aspectRatio: 1, minWidth: 44, borderRadius: rayon.case, padding: 4, alignItems: 'center', justifyContent: 'center', gap: 3, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  caseVide: { backgroundColor: 'transparent', borderStyle: 'dashed', borderWidth: 1.5, borderColor: c.bord2 },
  caseVue: { borderWidth: 2, borderColor: c.orClair },
  caseNom: { fontFamily: police.sansDemi, fontSize: 10, lineHeight: 12, color: c.texte, textAlign: 'center' },
  caseAnnee: { fontFamily: police.mono, fontSize: 9, color: c.texte2 },
});
