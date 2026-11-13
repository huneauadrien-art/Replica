// Composants de Ma Cave, au style relevé sur Tire-Bouchon (voir replica/design/components-cave.md).

import type { ReactNode } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type TextInputProps, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';
import type { EtatGarde } from '../../core/cave';
import type { CouleurVin, FenetreGarde } from '../../core/types';
import { c, couleurEtat, couleurVin, police, rayon } from './theme';

export function EcranCave({ children, bas }: { children: ReactNode; bas?: ReactNode }) {
  return (
    <View style={{ flex: 1, backgroundColor: c.fond }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={[s.ecran, bas ? { paddingBottom: 120 } : null]} keyboardShouldPersistTaps="handled">
        {children}
      </ScrollView>
      {bas}
    </View>
  );
}

/** Petites capitales espacées, couleur or : « MA CAVE », « À BOIRE CE SOIR ». */
export function Surtitre({ children, droite, mono, couleur }: { children: ReactNode; droite?: ReactNode; mono?: boolean; couleur?: string }) {
  return (
    <View style={s.surtitreLigne}>
      <Text accessibilityRole="header" style={[s.surtitre, mono && { fontFamily: police.mono, letterSpacing: 2.4 }, couleur ? { color: couleur } : null]}>
        {typeof children === 'string' ? children.toUpperCase() : children}
      </Text>
      {droite}
    </View>
  );
}

export const T = {
  vin: ({ children, taille = 22, lignes }: { children: ReactNode; taille?: number; lignes?: number }) => (
    <Text numberOfLines={lignes} style={{ fontFamily: police.serif, fontSize: taille, lineHeight: taille * 1.25, color: c.texte }}>
      {children}
    </Text>
  ),
  titre: ({ children, lignes }: { children: ReactNode; lignes?: number }) => (
    <Text numberOfLines={lignes} style={s.titreLigne}>
      {children}
    </Text>
  ),
  texte: ({ children, doux, taille = 15 }: { children: ReactNode; doux?: boolean; taille?: number }) => (
    <Text style={{ fontFamily: police.sans, fontSize: taille, lineHeight: taille * 1.4, color: doux ? c.doux : c.texte2 }}>{children}</Text>
  ),
  mono: ({ children, couleur = c.orTexte, taille = 13 }: { children: ReactNode; couleur?: string; taille?: number }) => (
    <Text style={{ fontFamily: police.mono, fontSize: taille, color: couleur }}>{children}</Text>
  ),
  italique: ({ children }: { children: ReactNode }) => <Text style={s.italique}>{children}</Text>,
};

export function GrandChiffre({ nombre, details }: { nombre: number; details: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 12 }}>
      <Text style={s.grandChiffre}>{nombre}</Text>
      <Text style={[s.doux, { flexShrink: 1, paddingBottom: 6, fontSize: 15, lineHeight: 21 }]}>{details}</Text>
    </View>
  );
}

export function BoutonCave({
  titre,
  onPress,
  variante = 'rouge',
  desactive,
  style,
}: {
  titre: string;
  onPress: () => void;
  variante?: 'rouge' | 'creme' | 'fantome' | 'lien';
  desactive?: boolean;
  style?: ViewStyle;
}) {
  const fond = { rouge: c.rougeBouton, creme: c.texte, fantome: 'transparent', lien: 'transparent' }[variante];
  const couleur = { rouge: c.surRouge, creme: c.surCreme, fantome: c.texte, lien: c.texte2 }[variante];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!desactive }}
      disabled={desactive}
      onPress={onPress}
      style={({ pressed }) => [
        s.bouton,
        { backgroundColor: fond },
        variante === 'fantome' && { borderWidth: 1, borderColor: c.bord2 },
        variante === 'rouge' && s.halo,
        (pressed || desactive) && { opacity: desactive ? 0.4 : 0.8 },
        style,
      ]}
    >
      <Text style={[s.boutonTexte, { color: couleur }]}>{titre}</Text>
    </Pressable>
  );
}

/** Bascule à deux segments (Liste / Plan). */
export function Bascule<K extends string>({ options, valeur, onChange }: { options: { id: K; titre: string }[]; valeur: K; onChange: (k: K) => void }) {
  return (
    <View style={s.bascule} accessibilityRole="tablist">
      {options.map((o) => {
        const on = o.id === valeur;
        return (
          <Pressable key={o.id} accessibilityRole="tab" accessibilityState={{ selected: on }} onPress={() => onChange(o.id)} style={[s.segment, on && { backgroundColor: c.texte }]}>
            <Text style={[s.segmentTexte, on && { color: c.surCreme, fontFamily: police.sansDemi }]}>{o.titre}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function PuceCave({ titre, actif, onPress, pastille }: { titre: string; actif?: boolean; onPress?: () => void; pastille?: string }) {
  const contenu = (
    <>
      {pastille ? <View style={[s.pastille, { backgroundColor: pastille }]} /> : null}
      <Text style={[s.puceTexte, actif && { color: c.surCreme, fontFamily: police.sansDemi }]}>{titre}</Text>
    </>
  );
  if (!onPress) return <View style={s.puce}>{contenu}</View>;
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected: !!actif }} onPress={onPress} style={[s.puce, actif && { backgroundColor: c.or, borderColor: c.or }]}>
      {contenu}
    </Pressable>
  );
}

/** « ◎ Cave du bas · R1 · C3 › » ; en pointillés quand la bouteille est à ranger. */
export function PuceEmplacement({ texte, onPress }: { texte: string; onPress?: () => void }) {
  const aRanger = texte === 'À ranger';
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`Emplacement : ${texte}`} onPress={onPress} disabled={!onPress} style={[s.emplacement, aRanger && { borderStyle: 'dashed', borderColor: c.bord2 }]}>
      <Svg width={14} height={14} viewBox="0 0 24 24">
        <Circle cx={12} cy={12} r={6} stroke={aRanger ? c.doux : c.orClair} strokeWidth={2} fill="none" />
        <Path d="M12 2v4M12 18v4M2 12h4M18 12h4" stroke={aRanger ? c.doux : c.orClair} strokeWidth={2} />
      </Svg>
      <Text style={[s.emplacementTexte, aRanger && { color: c.doux }]} numberOfLines={1}>
        {texte}
      </Text>
      {onPress ? <Text style={[s.emplacementTexte, aRanger && { color: c.doux }]}>›</Text> : null}
    </Pressable>
  );
}

/** Barre segmentée Prêt / Apogée / À boire vite. */
export function Jauge({ parts }: { parts: { titre: string; nombre: number; couleur: string }[] }) {
  const total = parts.reduce((a, p) => a + p.nombre, 0);
  return (
    <View style={{ gap: 10 }}>
      <View style={s.jauge}>
        {total === 0 ? <View style={{ flex: 1, backgroundColor: c.piste, borderRadius: 4 }} /> : parts.filter((p) => p.nombre > 0).map((p) => <View key={p.titre} style={{ flex: p.nombre, backgroundColor: p.couleur, borderRadius: 4 }} />)}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
        {parts.map((p) => (
          <View key={p.titre} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={[s.pastille, { backgroundColor: p.couleur, width: 10, height: 10 }]} />
            <Text style={s.doux}>{p.titre}</Text>
            <Text style={[s.texte2, { fontFamily: police.sansMoyen }]}>{p.nombre}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

/** Silhouette de bouteille à la couleur du vin, ou la photo de l'étiquette. */
export function Vignette({ couleur, photo, etat, taille = 56 }: { couleur: CouleurVin; photo?: string; etat?: EtatGarde; taille?: number }) {
  const l = taille * 0.68;
  return (
    <View style={[s.vignette, { width: l, height: taille }]}>
      {photo ? (
        <Image source={{ uri: photo }} style={{ width: l, height: taille, borderRadius: 8 }} resizeMode="cover" accessibilityIgnoresInvertColors />
      ) : (
        <Svg width={l * 0.5} height={taille * 0.86} viewBox="0 0 20 60">
          <Path d="M8 0h4v14c0 3 6 6 6 12v32a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V26c0-6 6-9 6-12z" fill={couleur === 'rouge' ? '#6a2230' : couleurVin[couleur]} />
          <Path d="M3 34h14v12H3z" fill={c.texte2} opacity={0.85} />
        </Svg>
      )}
      {etat && etat !== 'jeune' ? <View style={[s.etatPoint, { backgroundColor: couleurEtat[etat] }]} /> : null}
    </View>
  );
}

/** Ligne d'un vin dans la liste. */
export function LigneVin({
  titre,
  sousTitre,
  nombre,
  couleur,
  etat,
  photo,
  echeance,
  onPress,
}: {
  titre: string;
  sousTitre: string;
  nombre?: number;
  couleur: CouleurVin;
  etat?: EtatGarde;
  photo?: string;
  echeance?: string;
  onPress: () => void;
}) {
  const urgent = echeance != null;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${titre}, ${sousTitre}${nombre && nombre > 1 ? `, ${nombre} bouteilles` : ''}`}
      onPress={onPress}
      style={({ pressed }) => [s.ligneVin, urgent && { borderLeftWidth: 3, borderLeftColor: c.rouge }, pressed && { backgroundColor: c.fond2 }]}
    >
      <Vignette couleur={couleur} photo={photo} etat={etat} />
      <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
        <T.titre lignes={1}>{titre}</T.titre>
        <Text numberOfLines={1} style={s.doux}>
          {sousTitre}
          {nombre && nombre > 1 ? <Text style={{ fontFamily: police.mono, color: c.doux }}>{`   ×${nombre}`}</Text> : null}
        </Text>
      </View>
      {urgent ? <T.mono couleur={c.rougeTexte}>{`≤ ${echeance}`}</T.mono> : <Text style={[s.doux, { fontSize: 22 }]}>›</Text>}
    </Pressable>
  );
}

/** Frise d'apogée : piste, fenêtre en or, trait rouge pour aujourd'hui. */
export function Frise({ fenetre, millesime, annee }: { fenetre: FenetreGarde; millesime?: number; annee: number }) {
  const debut = Math.min(millesime ?? fenetre.pret, annee);
  const fin = Math.max(fenetre.fin, annee);
  const pct = (a: number) => `${((a - debut) / Math.max(1, fin - debut)) * 100}%` as const;
  return (
    <View accessible accessibilityLabel={`Apogée de ${fenetre.apogeeDebut} à ${fenetre.apogeeFin}, garde jusqu'en ${fenetre.fin}`}>
      <View style={s.frise}>
        <View style={[s.friseFenetre, { left: pct(fenetre.apogeeDebut), width: pct(debut + fenetre.apogeeFin - fenetre.apogeeDebut) }]} />
        <View style={[s.friseMaintenant, { left: pct(annee) }]} />
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
        <T.mono couleur={c.doux} taille={12}>
          {debut}
        </T.mono>
        <T.mono taille={12}>{`apogée ${fenetre.apogeeDebut}–${fenetre.apogeeFin}`}</T.mono>
        <T.mono couleur={c.doux} taille={12}>
          {fin}
        </T.mono>
      </View>
    </View>
  );
}

/** Curseur du profil gustatif, en lecture seule. Le mot du côté atteint passe en gras. */
export function Curseur({ gauche, droite, valeur }: { gauche: string; droite: string; valeur: number }) {
  const v = Math.max(0, Math.min(4, valeur));
  return (
    <View style={{ gap: 8 }} accessible accessibilityLabel={`${gauche} ${4 - v} sur 4, ${droite} ${v} sur 4`}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={v < 2 ? s.motFort : s.doux}>{gauche}</Text>
        <Text style={v >= 2 ? s.motFort : s.doux}>{droite}</Text>
      </View>
      <View style={s.piste}>
        <View style={[s.pouce, { left: `${(v / 4) * 100}%` }]} />
      </View>
    </View>
  );
}

/** Curseur à 5 crans, modifiable (formulaire). */
export function Crans({ gauche, droite, valeur, onChange }: { gauche: string; droite: string; valeur?: number; onChange: (v: number | undefined) => void }) {
  return (
    <View style={{ gap: 6 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={s.doux}>{gauche}</Text>
        <Text style={s.doux}>{droite}</Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 6 }}>
        {[0, 1, 2, 3, 4].map((n) => (
          <Pressable
            key={n}
            accessibilityRole="radio"
            accessibilityLabel={`${gauche} – ${droite} : ${n} sur 4`}
            accessibilityState={{ checked: valeur === n }}
            onPress={() => onChange(valeur === n ? undefined : n)}
            style={[s.cran, valeur != null && n <= valeur && { backgroundColor: c.orSombre }, valeur === n && { backgroundColor: c.orClair }]}
          />
        ))}
      </View>
    </View>
  );
}

export function BarreCepage({ nom, pct }: { nom: string; pct?: number }) {
  return (
    <View style={s.cepage}>
      <Text style={[s.texte2, { flex: 1 }]}>{nom}</Text>
      {pct != null ? (
        <>
          <View style={s.cepageBarre}>
            <View style={{ width: `${pct}%`, height: '100%', backgroundColor: '#ba0715', borderRadius: 3 }} />
          </View>
          <Text style={{ fontFamily: police.mono, color: c.rougeTexte, width: 44, textAlign: 'right' }}>{pct}%</Text>
        </>
      ) : null}
    </View>
  );
}

/** Bloc Service : trois colonnes (température, carafage, garde). */
export function Service({ colonnes }: { colonnes: { valeur: string; titre: string }[] }) {
  return (
    <View style={s.service}>
      {colonnes.map((col, i) => (
        <View key={col.titre} style={[{ flex: 1, alignItems: 'center', gap: 6 }, i > 0 && { borderLeftWidth: 1, borderLeftColor: c.bord }]}>
          <Text style={{ fontFamily: police.mono, fontSize: 19, color: c.orTexte }}>{col.valeur}</Text>
          <Text style={[s.surtitre, { fontSize: 10 }]}>{col.titre.toUpperCase()}</Text>
        </View>
      ))}
    </View>
  );
}

export function CarteCave({ children, haute, style }: { children: ReactNode; haute?: boolean; style?: ViewStyle }) {
  return <View style={[s.carte, haute && { backgroundColor: c.carteHaute, borderColor: c.bord2 }, style]}>{children}</View>;
}

export function ChampCave({ label, aide, ...props }: TextInputProps & { label: string; aide?: string }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={s.label}>{label}</Text>
      <TextInput placeholderTextColor={c.doux} style={s.champ} accessibilityLabel={label} {...props} />
      {aide ? <Text style={[s.doux, { fontSize: 13 }]}>{aide}</Text> : null}
    </View>
  );
}

/** Gros rond rouge (ajouter une bouteille), en bas à droite au-dessus de la barre d'onglets. */
export function BoutonRond({ onPress, label }: { onPress: () => void; label: string }) {
  const bas = useSafeAreaInsets().bottom;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({ pressed }) => [s.rond, { bottom: 20 + bas }, pressed && { backgroundColor: c.rougeBouton }]}>
      <Svg width={28} height={28} viewBox="0 0 24 24">
        <Path d="M12 5v14M5 12h14" stroke={c.surRouge} strokeWidth={2.4} strokeLinecap="round" />
      </Svg>
    </Pressable>
  );
}

/** Barre fixe en bas de l'écran (Actions / Déguster). */
export function BarreBas({ children }: { children: ReactNode }) {
  const bas = useSafeAreaInsets().bottom;
  return <View style={[s.barreBas, { paddingBottom: 20 + bas }]}>{children}</View>;
}

export const styleCave = StyleSheet.create({
  enTete: { backgroundColor: c.fond },
});

const s = StyleSheet.create({
  ecran: { padding: 16, paddingBottom: 48, gap: 16, maxWidth: 720, width: '100%', alignSelf: 'center' },
  surtitreLigne: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 4 },
  surtitre: { fontFamily: police.sansDemi, fontSize: 12, letterSpacing: 3, color: c.or, flexShrink: 1 },
  titreLigne: { fontFamily: police.sansDemi, fontSize: 16, lineHeight: 21, color: c.texte },
  italique: { fontFamily: police.serifItalique, fontSize: 16, lineHeight: 24, color: c.texte2 },
  grandChiffre: { fontFamily: police.sansGras, fontSize: 52, lineHeight: 56, color: c.texte, letterSpacing: -1 },
  doux: { fontFamily: police.sans, fontSize: 14, color: c.doux },
  texte2: { fontFamily: police.sans, fontSize: 15, color: c.texte2 },
  motFort: { fontFamily: police.sansDemi, fontSize: 14, color: c.texte },
  bouton: { minHeight: 52, borderRadius: rayon.bouton, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
  halo: { shadowColor: c.rouge, shadowOpacity: 0.45, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 6 },
  boutonTexte: { fontFamily: police.sansDemi, fontSize: 17 },
  bascule: { flexDirection: 'row', backgroundColor: c.fondProfond, borderWidth: 1, borderColor: c.bord, borderRadius: rayon.bouton + 4, padding: 4 },
  segment: { flex: 1, minHeight: 44, borderRadius: rayon.bouton, alignItems: 'center', justifyContent: 'center' },
  segmentTexte: { fontFamily: police.sansMoyen, fontSize: 16, color: c.texte2 },
  puce: { minHeight: 40, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, borderRadius: rayon.pilule, borderWidth: 1, borderColor: c.bord2 },
  puceTexte: { fontFamily: police.sansMoyen, fontSize: 15, color: c.texte2 },
  pastille: { width: 9, height: 9, borderRadius: 5 },
  emplacement: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: c.orSombre, borderRadius: rayon.pilule, paddingHorizontal: 14, minHeight: 40, maxWidth: '100%' },
  emplacementTexte: { fontFamily: police.mono, fontSize: 13, color: c.orClair, flexShrink: 1 },
  jauge: { flexDirection: 'row', gap: 3, height: 9 },
  vignette: { backgroundColor: c.fond2, borderRadius: 8, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 3 },
  etatPoint: { position: 'absolute', top: -4, right: -4, width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: c.carte },
  ligneVin: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: c.carte, borderWidth: 1, borderColor: c.bord, borderRadius: rayon.carte, padding: 12 },
  frise: { height: 4, backgroundColor: c.piste, borderRadius: 2, marginTop: 10 },
  friseFenetre: { position: 'absolute', top: 0, bottom: 0, backgroundColor: c.orClair, borderRadius: 2 },
  friseMaintenant: { position: 'absolute', top: -5, width: 3, height: 14, backgroundColor: c.rouge, borderRadius: 2, marginLeft: -1 },
  piste: { height: 4, backgroundColor: c.piste, borderRadius: 2, marginHorizontal: 8 },
  pouce: { position: 'absolute', top: -7, width: 18, height: 18, marginLeft: -9, borderRadius: 9, backgroundColor: c.orClair, borderWidth: 3, borderColor: c.carte },
  cran: { flex: 1, height: 28, borderRadius: 6, backgroundColor: c.piste },
  cepage: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: c.carte, borderRadius: 12, padding: 12 },
  cepageBarre: { flex: 1, height: 7, backgroundColor: c.piste, borderRadius: 3, overflow: 'hidden' },
  service: { flexDirection: 'row', borderWidth: 1, borderColor: c.bord, borderRadius: rayon.carte, paddingVertical: 16 },
  carte: { backgroundColor: c.carte, borderWidth: 1, borderColor: c.bord, borderRadius: rayon.carte, padding: 16, gap: 12 },
  label: { fontFamily: police.sansDemi, fontSize: 12, letterSpacing: 2, color: c.or },
  champ: { minHeight: 50, borderWidth: 1, borderColor: c.bordChamp, borderRadius: 14, paddingHorizontal: 14, fontSize: 17, fontFamily: police.sans, backgroundColor: c.fondProfond, color: c.texte },
  rond: { position: 'absolute', right: 20, bottom: 20, width: 64, height: 64, borderRadius: 32, backgroundColor: c.rouge, alignItems: 'center', justifyContent: 'center', shadowColor: c.rouge, shadowOpacity: 0.5, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 8 },
  barreBas: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', gap: 12, padding: 16, paddingBottom: 20, backgroundColor: c.fond, borderTopWidth: 1, borderTopColor: c.bord },
});
