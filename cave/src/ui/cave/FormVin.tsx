// Formulaire d'un vin (S45 nouvelle bouteille, et modification d'une fiche).

import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { COULEURS, fenetreGarde } from '../../core/cave';
import type { CouleurVin, PieceJointe, Vin } from '../../core/types';
import { photographier } from '../../data/fichiers';
import { nouvelId, useStore } from '../../data/store';
import { informer } from '../dialogues';
import { BoutonCave, CarteCave, ChampCave, Crans, PuceCave, Surtitre, T, Vignette } from './kit';
import { nombre, usePhoto } from './outils';
import { c, couleurVin, police } from './theme';

export type SaisieVin = { vin: Vin; quantite: number; prix?: number };

const texte = (n?: number) => (n == null ? '' : String(n).replace('.', ','));

/** « Merlot 60, Cabernet franc 40 » ↔ [{nom, pct}] */
export const lireCepages = (t: string) =>
  t
    .split(/[,;\n]/)
    .map((x) => x.trim())
    .filter(Boolean)
    .map((x) => {
      const m = x.match(/^(.*?)\s*(\d+(?:[.,]\d+)?)\s*%?$/);
      return m && m[1] ? { nom: m[1].trim(), pct: Number(m[2].replace(',', '.')) } : { nom: x };
    });
const ecrireCepages = (l?: Vin['cepages']) => (l ?? []).map((x) => (x.pct != null ? `${x.nom} ${x.pct}` : x.nom)).join(', ');

export function FormVin({ initial, nouveau, onValider }: { initial?: Vin; nouveau: boolean; onValider: (s: SaisieVin) => void }) {
  const { ajouterPiece, envoyerPiece } = useStore();
  const [domaine, setDomaine] = useState(initial?.domaine ?? '');
  const [cuvee, setCuvee] = useState(initial?.cuvee ?? '');
  const [millesime, setMillesime] = useState(initial?.millesime ? String(initial.millesime) : '');
  const [couleur, setCouleur] = useState<CouleurVin>(initial?.couleur ?? 'rouge');
  const [appellation, setAppellation] = useState(initial?.appellation ?? '');
  const [region, setRegion] = useState(initial?.region ?? '');
  const [quantite, setQuantite] = useState(1);
  const [prix, setPrix] = useState('');
  const [photo, setPhoto] = useState<PieceJointe | undefined>(initial?.photo);
  const [chargement, setChargement] = useState(false);
  const [plus, setPlus] = useState(!nouveau);
  const [cepages, setCepages] = useState(ecrireCepages(initial?.cepages));
  const [profil, setProfil] = useState(initial?.profil ?? {});
  const [aromes, setAromes] = useState((initial?.aromes ?? []).join(', '));
  const [tempMin, setTempMin] = useState(texte(initial?.tempMin));
  const [tempMax, setTempMax] = useState(texte(initial?.tempMax));
  const [carafage, setCarafage] = useState(texte(initial?.carafageH));
  const g = initial?.garde;
  const [garde, setGarde] = useState({ pret: texte(g?.pret), apogeeDebut: texte(g?.apogeeDebut), apogeeFin: texte(g?.apogeeFin), fin: texte(g?.fin) });
  const [accords, setAccords] = useState(initial?.accords ?? '');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const apercu = usePhoto(photo);

  const prendrePhoto = async (source: 'camera' | 'galerie') => {
    try {
      setChargement(true);
      const p = await photographier(source);
      if (!p) return;
      // Le NAS n'accepte que des identifiants avec une extension connue.
      const id = `${nouvelId()}.jpg`;
      await ajouterPiece(id, p.octets);
      envoyerPiece(id);
      setPhoto({ id, nom: p.nom, type: 'image/jpeg', taille: p.octets.length });
    } catch (e) {
      informer('Pas de photo', (e as Error).message);
    } finally {
      setChargement(false);
    }
  };

  const annee = nombre(millesime);
  const gardeSaisie = [garde.pret, garde.apogeeDebut, garde.apogeeFin, garde.fin].map(nombre);
  const brouillon: Vin = { id: initial?.id ?? '', domaine, couleur, millesime: annee };
  const proposee = fenetreGarde({ ...brouillon, region, appellation });

  const valider = () => {
    if (!domaine.trim()) return informer('Il manque le domaine', 'Écrivez au moins le nom du domaine ou du château.');
    if (millesime.trim() && (!annee || annee < 1800 || annee > 2100)) return informer('Millésime', 'Le millésime doit être une année, par exemple 2019.');
    const gardeOk = gardeSaisie.every((x) => x != null);
    if (gardeSaisie.some((x) => x != null) && !gardeOk) return informer('Fenêtre de garde', 'Remplissez les quatre années, ou aucune pour un calcul automatique.');
    const [pret, apogeeDebut, apogeeFin, fin] = gardeSaisie as number[];
    if (gardeOk && !(pret <= apogeeDebut && apogeeDebut <= apogeeFin && apogeeFin <= fin))
      return informer('Fenêtre de garde', 'Les années doivent se suivre : prêt ≤ début d’apogée ≤ fin d’apogée ≤ fin.');
    const propre = (t: string) => t.trim() || undefined;
    const p = Object.fromEntries(Object.entries(profil).filter(([, v]) => v != null));
    const vin: Vin = {
      ...(initial ?? {}),
      id: initial?.id ?? nouvelId(),
      domaine: domaine.trim(),
      cuvee: propre(cuvee),
      millesime: annee ? Math.round(annee) : undefined,
      couleur,
      appellation: propre(appellation),
      region: propre(region),
      photo,
      cepages: cepages.trim() ? lireCepages(cepages) : undefined,
      profil: Object.keys(p).length ? p : undefined,
      aromes: aromes.trim() ? aromes.split(',').map((x) => x.trim()).filter(Boolean) : undefined,
      tempMin: nombre(tempMin),
      tempMax: nombre(tempMax),
      carafageH: nombre(carafage),
      garde: gardeOk ? { pret, apogeeDebut, apogeeFin, fin } : undefined,
      accords: propre(accords),
      notes: propre(notes),
    };
    onValider({ vin, quantite, prix: nombre(prix) });
  };

  return (
    <View style={{ gap: 16 }}>
      <CarteCave haute>
        <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
          <Vignette couleur={couleur} photo={apercu} taille={84} />
          <View style={{ flex: 1, gap: 8 }}>
            <T.texte doux>{photo ? 'Photo de l’étiquette' : 'Une photo de l’étiquette aide à reconnaître la bouteille.'}</T.texte>
            {chargement ? (
              <ActivityIndicator color={c.or} />
            ) : (
              <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                <PuceCave titre="Photographier" onPress={() => prendrePhoto('camera')} />
                <PuceCave titre="Galerie" onPress={() => prendrePhoto('galerie')} />
                {photo ? <PuceCave titre="Retirer" onPress={() => setPhoto(undefined)} /> : null}
              </View>
            )}
          </View>
        </View>
      </CarteCave>

      <ChampCave label="DOMAINE OU CHÂTEAU" value={domaine} onChangeText={setDomaine} placeholder="Domaine des Tilleuls" autoCapitalize="words" />
      <ChampCave label="CUVÉE" value={cuvee} onChangeText={setCuvee} placeholder="Facultatif" />
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <ChampCave label="MILLÉSIME" value={millesime} onChangeText={setMillesime} keyboardType="number-pad" placeholder="2019" maxLength={4} />
        </View>
        <View style={{ flex: 2 }}>
          <ChampCave label="APPELLATION" value={appellation} onChangeText={setAppellation} placeholder="Saint-Émilion" />
        </View>
      </View>
      <ChampCave label="RÉGION" value={region} onChangeText={setRegion} placeholder="Bordeaux, Bourgogne, Loire…" />

      <View style={{ gap: 8 }}>
        <Surtitre>Couleur</Surtitre>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {COULEURS.map((x) => (
            <PuceCave key={x.id} titre={x.nom} pastille={couleurVin[x.id]} actif={couleur === x.id} onPress={() => setCouleur(x.id)} />
          ))}
        </View>
      </View>

      {nouveau ? (
        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-end' }}>
          <View style={{ flex: 1, gap: 6 }}>
            <Text style={{ fontFamily: police.sansDemi, fontSize: 12, letterSpacing: 2, color: c.or }}>BOUTEILLES</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Pas titre="−" onPress={() => setQuantite((q) => Math.max(1, q - 1))} />
              <Text accessibilityLabel={`${quantite} bouteilles`} style={{ fontFamily: police.mono, fontSize: 22, color: c.texte, minWidth: 34, textAlign: 'center' }}>
                {quantite}
              </Text>
              <Pas titre="+" onPress={() => setQuantite((q) => Math.min(120, q + 1))} />
            </View>
          </View>
          <View style={{ flex: 1 }}>
            <ChampCave label="PRIX / BOUTEILLE (€)" value={prix} onChangeText={setPrix} keyboardType="decimal-pad" placeholder="Facultatif" />
          </View>
        </View>
      ) : null}

      {proposee && !gardeSaisie.some((x) => x != null) ? (
        <T.texte doux>{`Garde estimée : prêt en ${proposee.pret}, apogée ${proposee.apogeeDebut}–${proposee.apogeeFin}, jusqu’en ${proposee.fin}.`}</T.texte>
      ) : null}

      <Pressable accessibilityRole="button" accessibilityState={{ expanded: plus }} onPress={() => setPlus(!plus)} style={{ minHeight: 44, justifyContent: 'center' }}>
        <Text style={{ fontFamily: police.sansMoyen, fontSize: 16, color: c.orClair }}>{plus ? 'Moins de détails ▴' : 'Plus de détails (garde, cépages, profil, service) ▾'}</Text>
      </Pressable>

      {plus ? (
        <View style={{ gap: 16 }}>
          <Surtitre>Fenêtre de garde</Surtitre>
          <T.texte doux>Laissez vide pour l’estimation automatique{proposee ? ` (${proposee.pret} · ${proposee.apogeeDebut}–${proposee.apogeeFin} · ${proposee.fin})` : ''}.</T.texte>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {(
              [
                ['pret', 'PRÊT'],
                ['apogeeDebut', 'APOGÉE'],
                ['apogeeFin', 'FIN APOGÉE'],
                ['fin', 'FIN'],
              ] as const
            ).map(([k, l]) => (
              <View key={k} style={{ flex: 1 }}>
                <ChampCave label={l} value={garde[k]} onChangeText={(t) => setGarde({ ...garde, [k]: t })} keyboardType="number-pad" maxLength={4} />
              </View>
            ))}
          </View>
          <ChampCave label="CÉPAGES" value={cepages} onChangeText={setCepages} placeholder="Merlot 60, Cabernet franc 40" />
          <Surtitre>Profil gustatif</Surtitre>
          <Crans gauche="Léger" droite="Puissant" valeur={profil.corps} onChange={(v) => setProfil({ ...profil, corps: v })} />
          <Crans gauche="Souple" droite="Tannique" valeur={profil.tanins} onChange={(v) => setProfil({ ...profil, tanins: v })} />
          <Crans gauche="Doux" droite="Acide" valeur={profil.acidite} onChange={(v) => setProfil({ ...profil, acidite: v })} />
          <Crans gauche="Sec" droite="Moelleux" valeur={profil.sucre} onChange={(v) => setProfil({ ...profil, sucre: v })} />
          <ChampCave label="ARÔMES" value={aromes} onChangeText={setAromes} placeholder="Cassis, cèdre, vanille" />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ flex: 1 }}>
              <ChampCave label="SERVICE MIN °C" value={tempMin} onChangeText={setTempMin} keyboardType="number-pad" />
            </View>
            <View style={{ flex: 1 }}>
              <ChampCave label="MAX °C" value={tempMax} onChangeText={setTempMax} keyboardType="number-pad" />
            </View>
            <View style={{ flex: 1 }}>
              <ChampCave label="CARAFE (H)" value={carafage} onChangeText={setCarafage} keyboardType="decimal-pad" />
            </View>
          </View>
          <ChampCave label="À TABLE" value={accords} onChangeText={setAccords} placeholder="Magret, fromages affinés…" multiline />
          <ChampCave label="NOTES" value={notes} onChangeText={setNotes} placeholder="Acheté au domaine, cadeau de…" multiline />
        </View>
      ) : null}

      <BoutonCave titre={nouveau ? (quantite > 1 ? `Ajouter ${quantite} bouteilles` : 'Ajouter la bouteille') : 'Enregistrer'} onPress={valider} />
    </View>
  );
}

function Pas({ titre, onPress }: { titre: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={titre === '+' ? 'Une bouteille de plus' : 'Une bouteille de moins'}
      onPress={onPress}
      style={({ pressed }) => ({ width: 48, height: 48, borderRadius: 14, borderWidth: 1, borderColor: c.bord2, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.6 : 1 })}
    >
      <Text style={{ fontFamily: police.sansMoyen, fontSize: 24, color: c.texte }}>{titre}</Text>
    </Pressable>
  );
}
