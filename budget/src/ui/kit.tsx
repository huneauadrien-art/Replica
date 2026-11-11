// Composants communs (spécification : replica/design-kakeibo/components.md).
// Les écrans n'écrivent aucune couleur : tout passe par theme.ts.

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { euros, NOMS_GROUPES } from '../core/mois';
import type { Centimes, Groupe } from '../core/types';
import { c, chiffres, couleurGroupe, mise, ombre, rayon, type } from './theme';

// --- mise en page -----------------------------------------------------------

export function Ecran({ children, sansDefilement, avecBoutonAjouter }: { children: ReactNode; sansDefilement?: boolean; avecBoutonAjouter?: boolean }) {
  if (sansDefilement) return <View style={[styles.ecran, { flex: 1 }]}>{children}</View>;
  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.bg }} contentContainerStyle={[styles.ecran, avecBoutonAjouter && { paddingBottom: 120 }]} keyboardShouldPersistTaps="handled">
      {children}
    </ScrollView>
  );
}

export function Carte({ children, onPress, etiquette }: { children: ReactNode; onPress?: () => void; etiquette?: string }) {
  if (!onPress) return <View style={styles.carte}>{children}</View>;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={etiquette} onPress={onPress} style={({ pressed }) => [styles.carte, pressed && { opacity: 0.75 }]}>
      {children}
    </Pressable>
  );
}

export const Titre = ({ children }: { children: ReactNode }) => (
  <Text accessibilityRole="header" style={[type.xl, { color: c.text }]}>
    {children}
  </Text>
);
export const SousTitre = ({ children }: { children: ReactNode }) => (
  <Text accessibilityRole="header" style={[type.lg, { color: c.text, marginTop: 4 }]}>
    {children}
  </Text>
);
export const Texte = ({ children, doux, gras, petit, ton }: { children: ReactNode; doux?: boolean; gras?: boolean; petit?: boolean; ton?: 'danger' | 'success' | 'warning' | 'accent' }) => (
  <Text style={[petit ? type.sm : type.base, { color: ton ? c[ton] : doux ? c.textMuted : c.text }, gras && { fontWeight: '700' }]}>{children}</Text>
);
export const Etiquette = ({ children }: { children: ReactNode }) => <Text style={[type.xs, { color: c.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }]}>{children}</Text>;

export const Ligne = ({ children, ecart = 8, entre }: { children: ReactNode; ecart?: number; entre?: boolean }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: ecart, flexWrap: 'wrap', justifyContent: entre ? 'space-between' : 'flex-start' }}>{children}</View>
);

// --- boutons ----------------------------------------------------------------

export function Bouton({
  titre,
  onPress,
  variante = 'principal',
  desactive,
  grand,
  etiquette,
}: {
  titre: string;
  onPress: () => void;
  variante?: 'principal' | 'secondaire' | 'discret' | 'danger';
  desactive?: boolean;
  grand?: boolean;
  etiquette?: string;
}) {
  const fond = { principal: c.accent, danger: c.danger, secondaire: c.surface, discret: 'transparent' }[variante];
  const texte = variante === 'principal' || variante === 'danger' ? c.onAccent : variante === 'secondaire' ? c.accent : c.accent;
  const bord = variante === 'secondaire' ? c.accent : 'transparent';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={etiquette}
      aria-disabled={!!desactive}
      disabled={desactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.bouton,
        { backgroundColor: fond, borderColor: bord, minHeight: grand ? 56 : mise.touchMin },
        (pressed || desactive) && { opacity: desactive ? 0.4 : 0.75 },
      ]}
    >
      <Text style={[type.base, { fontWeight: '700', color: texte }]}>{titre}</Text>
    </Pressable>
  );
}

export function BoutonAjouter({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Ajouter une dépense"
      onPress={onPress}
      style={({ pressed }) => [styles.fab, ombre.pop, pressed && { opacity: 0.85 }]}
    >
      <Text style={{ color: c.onAccent, fontSize: 34, lineHeight: 38, fontWeight: '400' }}>+</Text>
    </Pressable>
  );
}

// --- champs -----------------------------------------------------------------

export function Champ({ label, aide, erreur, ...props }: TextInputProps & { label: string; aide?: string; erreur?: string }) {
  const [focus, setFocus] = useState(false);
  return (
    <View style={{ gap: 4 }}>
      <Text style={[type.sm, { fontWeight: '700', color: c.textMuted }]}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={c.textMuted}
        onFocus={(e) => {
          setFocus(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocus(false);
          props.onBlur?.(e);
        }}
        style={[styles.champ, focus && { borderColor: c.accent, borderWidth: 2 }, erreur ? { borderColor: c.danger, borderWidth: 2 } : null, props.multiline && { minHeight: 96, textAlignVertical: 'top', paddingTop: 12 }]}
        {...props}
      />
      {erreur ? (
        <Text accessibilityLiveRegion="polite" style={[type.sm, { color: c.danger }]}>
          {erreur}
        </Text>
      ) : aide ? (
        <Text style={[type.sm, { color: c.textMuted }]}>{aide}</Text>
      ) : null}
    </View>
  );
}

export const ChampMontant = (p: TextInputProps & { label: string; aide?: string; erreur?: string }) => <Champ keyboardType="decimal-pad" placeholder="0" inputMode="decimal" {...p} />;

/** Pavé numérique de saisie du montant : le texte tapé reste tel quel, au plus 2 décimales. */
export function PaveMontant({ texte, onChange }: { texte: string; onChange: (t: string) => void }) {
  const touche = (k: string) => {
    if (k === '⌫') return onChange(texte.slice(0, -1));
    if (k === ',') return texte.includes(',') ? undefined : onChange((texte || '0') + ',');
    const [, dec] = texte.split(',');
    if (dec !== undefined && dec.length >= 2) return;
    if (texte === '0') return onChange(k);
    if (texte.replace(',', '').length >= 7) return;
    onChange(texte + k);
  };
  // Sur le web, le clavier de l'ordinateur marche aussi.
  const ref = useRef(touche);
  ref.current = touche;
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const ecoute = (e: KeyboardEvent) => {
      const cible = e.target as HTMLElement | null;
      if (cible && (cible.tagName === 'INPUT' || cible.tagName === 'TEXTAREA')) return;
      if (/^[0-9]$/.test(e.key)) ref.current(e.key);
      else if (e.key === ',' || e.key === '.') ref.current(',');
      else if (e.key === 'Backspace') ref.current('⌫');
    };
    window.addEventListener('keydown', ecoute);
    return () => window.removeEventListener('keydown', ecoute);
  }, []);
  const lignes = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    [',', '0', '⌫'],
  ];
  return (
    <View style={{ gap: 6 }}>
      {lignes.map((l, i) => (
        <View key={i} style={{ flexDirection: 'row', gap: 6 }}>
          {l.map((k) => (
            <Pressable
              key={k}
              accessibilityRole="button"
              accessibilityLabel={k === '⌫' ? 'Effacer' : k === ',' ? 'Virgule' : k}
              onPress={() => touche(k)}
              style={({ pressed }) => [styles.touche, pressed && { backgroundColor: c.surfaceAlt }]}
            >
              <Text style={[type.lg, { color: c.text }]}>{k}</Text>
            </Pressable>
          ))}
        </View>
      ))}
    </View>
  );
}

// --- chiffres et jauges -----------------------------------------------------

export function CarteChiffre({ libelle, montant, sousLigne, ton = 'normal', petit }: { libelle: string; montant: Centimes; sousLigne?: string; ton?: 'normal' | 'attention' | 'depasse'; petit?: boolean }) {
  const couleur = ton === 'depasse' ? c.danger : ton === 'attention' ? c.warning : c.text;
  return (
    <View style={[styles.carte, ombre.carte]} accessible accessibilityLabel={`${libelle} : ${euros(montant)}${sousLigne ? `, ${sousLigne}` : ''}`}>
      <Etiquette>{libelle}</Etiquette>
      <Text style={[petit ? type.xl : type.display, chiffres, { color: couleur }]}>{euros(montant)}</Text>
      {sousLigne ? <Text style={[type.sm, { color: ton === 'depasse' ? c.danger : c.textMuted }]}>{sousLigne}</Text> : null}
    </View>
  );
}

export function Jauge({ groupe, depense, budget }: { groupe: Groupe; depense: Centimes; budget?: Centimes }) {
  const col = couleurGroupe[groupe];
  const part = budget ? depense / budget : 0;
  const depasse = budget != null && budget > 0 && depense > budget;
  const proche = !depasse && part >= 0.9;
  const detail = budget ? (depasse ? `dépassé de ${euros(depense - budget)}` : `sur ${euros(budget)}`) : '';
  return (
    <View
      style={{ gap: 6 }}
      accessible
      accessibilityRole={budget ? 'progressbar' : undefined}
      aria-valuemin={budget ? 0 : undefined}
      aria-valuemax={budget ? Math.round(budget / 100) : undefined}
      aria-valuenow={budget ? Math.round(depense / 100) : undefined}
      accessibilityLabel={`${NOMS_GROUPES[groupe]} : ${euros(depense)}${detail ? ` ${detail}` : ''}`}
    >
      <Ligne entre>
        <Ligne ecart={6}>
          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: col.fort }} />
          <Text style={[type.base, { fontWeight: '700', color: c.text }]}>{NOMS_GROUPES[groupe]}</Text>
        </Ligne>
        <Text style={[type.sm, chiffres, { color: depasse ? c.danger : proche ? c.warning : c.textMuted }]}>
          <Text style={{ color: c.text, fontWeight: '700' }}>{euros(depense)}</Text> {detail}
        </Text>
      </Ligne>
      {budget ? (
        <View style={{ height: 10, borderRadius: rayon.pill, backgroundColor: col.doux, overflow: 'hidden' }}>
          <View style={{ height: 10, width: `${Math.min(100, part * 100)}%`, backgroundColor: depasse ? c.danger : col.fort, borderRadius: rayon.pill }} />
        </View>
      ) : null}
    </View>
  );
}

export function Barre({ part, couleur = c.accent, fond = c.accentSoft }: { part: number; couleur?: string; fond?: string }) {
  return (
    <View style={{ height: 10, borderRadius: rayon.pill, backgroundColor: fond, overflow: 'hidden' }}>
      <View style={{ height: 10, width: `${Math.max(0, Math.min(100, part * 100))}%`, backgroundColor: couleur, borderRadius: rayon.pill }} />
    </View>
  );
}

// --- sélecteurs -------------------------------------------------------------

export function PastilleGroupe({ groupe, choisi, onPress, libelle, aide, grande }: { groupe: Groupe; choisi: boolean; onPress: () => void; libelle?: string; aide?: string; grande?: boolean }) {
  const col = couleurGroupe[groupe];
  return (
    <Pressable
      accessibilityRole="radio"
      aria-checked={choisi}
      accessibilityLabel={libelle ?? NOMS_GROUPES[groupe]}
      onPress={onPress}
      style={({ pressed }) => [
        grande ? styles.pastilleGrande : styles.pastille,
        { backgroundColor: choisi ? col.fort : col.doux, borderColor: col.fort },
        pressed && { opacity: 0.8 },
      ]}
    >
      <Text style={[grande ? type.base : type.sm, { fontWeight: '700', color: choisi ? c.onAccent : col.fort }]}>{libelle ?? NOMS_GROUPES[groupe]}</Text>
      {aide && grande ? <Text style={[type.xs, { fontWeight: '400', color: choisi ? c.onAccent : col.fort }]}>{aide}</Text> : null}
    </Pressable>
  );
}

export function Puce({ titre, actif, onPress }: { titre: string; actif: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="radio" aria-checked={actif} onPress={onPress} style={[styles.puce, actif && { backgroundColor: c.accent, borderColor: c.accent }]}>
      <Text style={[type.sm, { fontWeight: '700', color: actif ? c.onAccent : c.text }]}>{titre}</Text>
    </Pressable>
  );
}

export function Bascule<T extends string>({ options, valeur, onChange }: { options: { valeur: T; titre: string }[]; valeur: T; onChange: (v: T) => void }) {
  return (
    <View accessibilityRole="tablist" style={styles.bascule}>
      {options.map((o) => {
        const actif = o.valeur === valeur;
        return (
          <Pressable key={o.valeur} accessibilityRole="tab" aria-selected={actif} onPress={() => onChange(o.valeur)} style={[styles.segment, actif && [{ backgroundColor: c.surface }, ombre.carte]]}>
            <Text style={[type.sm, { fontWeight: '700', color: actif ? c.accent : c.textMuted }]}>{o.titre}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function SelecteurMois({ libelle, precedent, suivant, badge }: { libelle: string; precedent: () => void; suivant?: () => void; badge?: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <Pressable accessibilityRole="button" accessibilityLabel="Mois précédent" onPress={precedent} style={styles.fleche}>
        <Text style={[type.lg, { color: c.accent }]}>‹</Text>
      </Pressable>
      <Ligne ecart={8}>
        <Text style={[type.lg, { color: c.text }]}>{libelle}</Text>
        {badge ? <Badge texte={badge} /> : null}
      </Ligne>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Mois suivant"
        aria-disabled={!suivant}
        disabled={!suivant}
        onPress={suivant}
        style={[styles.fleche, !suivant && { opacity: 0.3 }]}
      >
        <Text style={[type.lg, { color: c.accent }]}>›</Text>
      </Pressable>
    </View>
  );
}

// --- listes -----------------------------------------------------------------

export function LigneTransaction({
  titre,
  sousTitre,
  montant,
  sens,
  groupe,
  onPress,
}: {
  titre: string;
  sousTitre?: string;
  montant: Centimes;
  sens: 'depense' | 'revenu' | 'epargne';
  groupe?: Groupe;
  onPress?: () => void;
}) {
  const texteMontant = sens === 'depense' ? euros(-montant) : sens === 'revenu' ? euros(montant, { signe: true }) : `→ ${euros(montant)}`;
  const couleur = sens === 'revenu' ? c.success : sens === 'epargne' ? c.accent : c.text;
  const pastille = groupe ? couleurGroupe[groupe].fort : sens === 'revenu' ? c.success : c.accent;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${titre}${sousTitre ? ` ${sousTitre}` : ''} ${texteMontant}${groupe && sousTitre !== NOMS_GROUPES[groupe] ? `, ${NOMS_GROUPES[groupe]}` : ''}`}
      onPress={onPress}
      style={({ pressed }) => [styles.ligneTx, pressed && { backgroundColor: c.surfaceAlt }]}
    >
      <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: pastille }} />
      <View style={{ flex: 1 }}>
        <Text style={[type.base, { color: c.text, fontWeight: '600' }]} numberOfLines={1}>
          {titre}
        </Text>
        {sousTitre ? (
          <Text style={[type.sm, { color: c.textMuted }]} numberOfLines={1}>
            {sousTitre}
          </Text>
        ) : null}
      </View>
      <Text style={[type.base, chiffres, { fontWeight: '700', color: couleur }]}>{texteMontant}</Text>
    </Pressable>
  );
}

export function EnTeteJour({ jour, total }: { jour: string; total?: Centimes }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: 12, paddingBottom: 4, paddingHorizontal: 4 }}>
      <Text style={[type.sm, { fontWeight: '700', color: c.textMuted }]}>{jour}</Text>
      {total ? <Text style={[type.sm, chiffres, { color: c.textMuted }]}>{euros(-total)}</Text> : null}
    </View>
  );
}

export function Badge({ texte, ton = 'neutre' }: { texte: string; ton?: 'neutre' | 'ok' | 'attention' | 'danger' }) {
  const [fond, coul] = { neutre: [c.surfaceAlt, c.text], ok: [c.successSoft, c.success], attention: [c.warningSoft, c.warning], danger: [c.dangerSoft, c.danger] }[ton];
  return (
    <View style={{ backgroundColor: fond, borderRadius: rayon.sm, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' }}>
      <Text style={[type.xs, { color: coul }]}>{texte}</Text>
    </View>
  );
}

export function Vide({ titre, texte, children }: { titre: string; texte?: string; children?: ReactNode }) {
  return (
    <View style={{ alignItems: 'center', padding: 24, gap: 8 }}>
      <Text style={[type.lg, { color: c.text, textAlign: 'center' }]}>{titre}</Text>
      {texte ? <Text style={[type.base, { color: c.textMuted, textAlign: 'center' }]}>{texte}</Text> : null}
      {children ? <View style={{ alignSelf: 'stretch', marginTop: 8 }}>{children}</View> : null}
    </View>
  );
}

export function Alerte({ texte, ton = 'attention' }: { texte: string; ton?: 'attention' | 'danger' | 'ok' }) {
  const [fond, coul] = { attention: [c.warningSoft, c.warning], danger: [c.dangerSoft, c.danger], ok: [c.successSoft, c.success] }[ton];
  return (
    <View style={{ backgroundColor: fond, borderColor: coul, borderWidth: 1, borderRadius: rayon.md, padding: 12 }}>
      <Text style={[type.base, { color: coul }]}>{texte}</Text>
    </View>
  );
}

// --- toast avec « Annuler » -------------------------------------------------

type Toast = { texte: string; annuler?: () => void };
const ContexteToast = createContext<(t: Toast) => void>(() => {});
export const useToast = () => useContext(ContexteToast);

export function FournisseurToast({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null);
  const minuterie = useRef<ReturnType<typeof setTimeout> | null>(null);
  const montrer = useCallback((t: Toast) => {
    if (minuterie.current) clearTimeout(minuterie.current);
    setToast(t);
    minuterie.current = setTimeout(() => setToast(null), 5000);
  }, []);
  return (
    <ContexteToast.Provider value={montrer}>
      {children}
      {toast ? (
        <View pointerEvents="box-none" style={styles.toastZone}>
          <View accessibilityLiveRegion="polite" style={[styles.toast, ombre.pop]}>
            <Text style={[type.base, { color: c.onAccent, flex: 1 }]}>{toast.texte}</Text>
            {toast.annuler ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  toast.annuler?.();
                  setToast(null);
                }}
                style={{ minHeight: 48, justifyContent: 'center', paddingHorizontal: 12 }}
              >
                <Text style={[type.base, { color: c.onAccent, fontWeight: '800', textDecorationLine: 'underline' }]}>Annuler</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      ) : null}
    </ContexteToast.Provider>
  );
}

// --- dialogues --------------------------------------------------------------

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
  ecran: { padding: 16, paddingBottom: 48, gap: 12, maxWidth: mise.maxWidth, width: '100%', alignSelf: 'center' },
  carte: { backgroundColor: c.surface, borderRadius: rayon.lg, padding: 16, borderWidth: 1, borderColor: c.border, gap: 6 },
  bouton: { borderRadius: rayon.md, borderWidth: 2, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  fab: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    width: mise.fab,
    height: mise.fab,
    borderRadius: mise.fab / 2,
    backgroundColor: c.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  champ: { minHeight: 50, borderWidth: 1, borderColor: c.borderInput, borderRadius: rayon.md, paddingHorizontal: 12, fontSize: 17, backgroundColor: c.surface, color: c.text },
  touche: { flex: 1, minHeight: 56, borderRadius: rayon.md, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, alignItems: 'center', justifyContent: 'center' },
  pastille: { minHeight: 40, paddingHorizontal: 12, borderRadius: rayon.pill, borderWidth: 1, justifyContent: 'center' },
  pastilleGrande: { flexBasis: '47%', flexGrow: 1, minHeight: 72, padding: 10, borderRadius: rayon.md, borderWidth: 2, justifyContent: 'center', gap: 2 },
  puce: { minHeight: 40, paddingHorizontal: 14, borderRadius: rayon.pill, borderWidth: 1, borderColor: c.border, backgroundColor: c.surface, justifyContent: 'center' },
  bascule: { flexDirection: 'row', backgroundColor: c.surfaceAlt, borderRadius: rayon.md, padding: 4, gap: 4 },
  segment: { flex: 1, minHeight: 44, borderRadius: rayon.sm, alignItems: 'center', justifyContent: 'center' },
  fleche: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  ligneTx: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: c.surface },
  toastZone: { position: 'absolute', left: 0, right: 0, bottom: 150, alignItems: 'center', paddingHorizontal: 16 },
  toast: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: c.text, borderRadius: rayon.md, paddingLeft: 16, maxWidth: mise.maxWidth, width: '100%' },
});
