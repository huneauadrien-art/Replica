// Petits composants communs. Gros boutons et gros textes : l'app sert dehors, avec des gants.

import type { ReactNode } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import type { Alerte } from '../core/registre';

export const couleurs = {
  fond: '#F5F3EE',
  carte: '#FFFFFF',
  texte: '#1E1E1C',
  doux: '#6B6A65',
  bord: '#DDD9CF',
  vigne: '#5B2A4A',
  vigneClair: '#F1E6EC',
  feuille: '#3F6B2A',
  feuilleClair: '#E7F0E1',
  danger: '#B3261E',
  dangerClair: '#FBE9E7',
  attention: '#8A5A00',
  attentionClair: '#FFF4D6',
};

export function Ecran({ children }: { children: ReactNode }) {
  return (
    <ScrollView style={{ flex: 1, backgroundColor: couleurs.fond }} contentContainerStyle={styles.ecran} keyboardShouldPersistTaps="handled">
      {children}
    </ScrollView>
  );
}

export function Carte({ children, onPress }: { children: ReactNode; onPress?: () => void }) {
  if (!onPress) return <View style={styles.carte}>{children}</View>;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.carte, pressed && { opacity: 0.7 }]}>
      {children}
    </Pressable>
  );
}

export const Titre = ({ children }: { children: ReactNode }) => <Text style={styles.titre}>{children}</Text>;
export const SousTitre = ({ children }: { children: ReactNode }) => <Text style={styles.sousTitre}>{children}</Text>;
export const Texte = ({ children, doux, gras }: { children: ReactNode; doux?: boolean; gras?: boolean }) => (
  <Text style={[styles.texte, doux && { color: couleurs.doux }, gras && { fontWeight: '700' }]}>{children}</Text>
);

export function Bouton({
  titre,
  onPress,
  variante = 'principal',
  desactive,
}: {
  titre: string;
  onPress: () => void;
  variante?: 'principal' | 'secondaire' | 'danger';
  desactive?: boolean;
}) {
  const fond = variante === 'principal' ? couleurs.vigne : variante === 'danger' ? couleurs.danger : couleurs.carte;
  const texte = variante === 'secondaire' ? couleurs.vigne : '#FFFFFF';
  return (
    <Pressable
      accessibilityRole="button"
      disabled={desactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.bouton,
        { backgroundColor: fond, borderColor: variante === 'secondaire' ? couleurs.vigne : fond },
        (pressed || desactive) && { opacity: desactive ? 0.4 : 0.75 },
      ]}
    >
      <Text style={[styles.boutonTexte, { color: texte }]}>{titre}</Text>
    </Pressable>
  );
}

export function Champ({ label, aide, ...props }: TextInputProps & { label: string; aide?: string }) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput placeholderTextColor="#9A988F" style={styles.champ} {...props} />
      {aide ? <Text style={styles.aide}>{aide}</Text> : null}
    </View>
  );
}

/** Champ numérique qui accepte la virgule. Garde le texte saisi tel quel pendant la frappe. */
export function ChampNombre({
  label,
  valeur,
  onChange,
  aide,
  placeholder,
}: {
  label: string;
  valeur: string;
  onChange: (texte: string) => void;
  aide?: string;
  placeholder?: string;
}) {
  return <Champ label={label} aide={aide} value={valeur} onChangeText={onChange} keyboardType="decimal-pad" placeholder={placeholder} />;
}

/** "1,5" → 1.5 ; vide ou invalide → undefined. */
export function lireNombre(texte: string): number | undefined {
  const n = parseFloat(texte.replace(',', '.').trim());
  return Number.isFinite(n) ? n : undefined;
}

export const versTexte = (n?: number) => (n == null ? '' : String(n).replace('.', ','));

export function Puce({ titre, actif, onPress }: { titre: string; actif: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: actif }}
      onPress={onPress}
      style={[styles.puce, actif && { backgroundColor: couleurs.vigne, borderColor: couleurs.vigne }]}
    >
      <Text style={[styles.puceTexte, actif && { color: '#FFFFFF' }]}>{titre}</Text>
    </Pressable>
  );
}

export const Ligne = ({ children }: { children: ReactNode }) => <View style={styles.ligne}>{children}</View>;

export function Badge({ texte, ton = 'neutre' }: { texte: string; ton?: 'neutre' | 'danger' | 'attention' | 'ok' }) {
  const t = {
    neutre: [couleurs.vigneClair, couleurs.vigne],
    danger: [couleurs.dangerClair, couleurs.danger],
    attention: [couleurs.attentionClair, couleurs.attention],
    ok: [couleurs.feuilleClair, couleurs.feuille],
  }[ton];
  return (
    <View style={[styles.badge, { backgroundColor: t[0] }]}>
      <Text style={{ color: t[1], fontSize: 13, fontWeight: '700' }}>{texte}</Text>
    </View>
  );
}

export function ListeAlertes({ alertes }: { alertes: Alerte[] }) {
  if (alertes.length === 0) return null;
  return (
    <View style={{ gap: 8, marginBottom: 12 }}>
      {alertes.map((a, i) => {
        const grave = a.niveau !== 'attention';
        return (
          <View key={i} style={[styles.alerte, { backgroundColor: grave ? couleurs.dangerClair : couleurs.attentionClair, borderColor: grave ? couleurs.danger : couleurs.attention }]}>
            <Text style={{ color: grave ? couleurs.danger : couleurs.attention, fontSize: 15 }}>
              {grave ? '⛔ ' : '⚠️ '}
              {a.message}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

export function Vide({ titre, texte, children }: { titre: string; texte: string; children?: ReactNode }) {
  return (
    <View style={styles.vide}>
      <Text style={[styles.sousTitre, { textAlign: 'center' }]}>{titre}</Text>
      <Text style={[styles.texte, { color: couleurs.doux, textAlign: 'center', marginBottom: 16 }]}>{texte}</Text>
      {children}
    </View>
  );
}

/** Confirmation qui marche aussi sur le web (Alert.alert n'y fait rien). */
export function confirmer(titre: string, message: string, action = 'Confirmer'): Promise<boolean> {
  if (Platform.OS === 'web') return Promise.resolve(window.confirm(`${titre}\n\n${message}`));
  return new Promise((ok) =>
    Alert.alert(titre, message, [
      { text: 'Annuler', style: 'cancel', onPress: () => ok(false) },
      { text: action, style: 'destructive', onPress: () => ok(true) },
    ]),
  );
}

export function informer(titre: string, message: string) {
  if (Platform.OS === 'web') window.alert(`${titre}\n\n${message}`);
  else Alert.alert(titre, message);
}

const styles = StyleSheet.create({
  ecran: { padding: 16, paddingBottom: 48, gap: 12, maxWidth: 720, width: '100%', alignSelf: 'center' },
  carte: { backgroundColor: couleurs.carte, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: couleurs.bord, gap: 4 },
  titre: { fontSize: 24, fontWeight: '800', color: couleurs.texte },
  sousTitre: { fontSize: 18, fontWeight: '700', color: couleurs.texte, marginTop: 4 },
  texte: { fontSize: 16, color: couleurs.texte, lineHeight: 22 },
  bouton: { minHeight: 52, borderRadius: 12, borderWidth: 2, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  boutonTexte: { fontSize: 17, fontWeight: '700' },
  label: { fontSize: 14, fontWeight: '700', color: couleurs.doux, marginBottom: 4 },
  champ: { minHeight: 50, borderWidth: 1, borderColor: couleurs.bord, borderRadius: 10, paddingHorizontal: 12, fontSize: 17, backgroundColor: couleurs.carte, color: couleurs.texte },
  aide: { fontSize: 13, color: couleurs.doux, marginTop: 4 },
  puce: { minHeight: 44, paddingHorizontal: 14, borderRadius: 22, borderWidth: 1, borderColor: couleurs.bord, backgroundColor: couleurs.carte, justifyContent: 'center' },
  puceTexte: { fontSize: 15, color: couleurs.texte, fontWeight: '600' },
  ligne: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  badge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' },
  alerte: { borderWidth: 1, borderRadius: 10, padding: 10 },
  vide: { alignItems: 'center', padding: 24, gap: 6 },
});
