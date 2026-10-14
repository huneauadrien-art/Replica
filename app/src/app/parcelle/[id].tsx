import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { CULTURES, cultureDe } from '../../core/cultures';
import { fmt } from '../../core/registre';
import type { Parcelle } from '../../core/types';
import { nouvelId, remplacer, useStore } from '../../data/store';
import { ApercuParcelle } from '../../ui/ApercuParcelle';
import { Bouton, Carte, Champ, ChampNombre, confirmer, Ecran, Ligne, lireNombre, ListeAlertes, Puce, SousTitre, Texte, versTexte } from '../../ui/kit';

export default function FicheParcelle() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { donnees: d, modifier } = useStore();
  const existante = d.parcelles.find((p) => p.id === id);
  const nouvelle = id === 'nouvelle';

  const [nom, setNom] = useState(existante?.nom ?? '');
  const [surface, setSurface] = useState(versTexte(existante?.surfaceHa));
  const cultureInitiale = existante ? cultureDe(existante) : 'Vigne';
  const [culture, setCulture] = useState(cultureInitiale);
  const [autre, setAutre] = useState(!(CULTURES as readonly string[]).includes(cultureInitiale));
  const [cepage, setCepage] = useState(existante?.cepage ?? '');
  const [largeurRampe, setLargeurRampe] = useState(versTexte(existante?.largeurM));
  const [ecartement, setEcartement] = useState(versTexte(existante?.ecartementM));
  const [rangs, setRangs] = useState(versTexte(existante?.rangsParPassage));
  const [erreur, setErreur] = useState<string | null>(null);

  if (!existante && !nouvelle) return <Ecran><Texte>Parcelle introuvable.</Texte></Ecran>;

  const vigne = culture === 'Vigne';
  const largeur = vigne ? (lireNombre(ecartement) ?? 0) * (lireNombre(rangs) ?? 0) : (lireNombre(largeurRampe) ?? 0);
  const traitements = d.traitements
    .filter((t) => t.parcelles.some((tp) => tp.parcelleId === id))
    .sort((a, b) => b.date.localeCompare(a.date));

  const enregistrer = () => {
    const s = lireNombre(surface);
    if (!nom.trim()) return setErreur('Donnez un nom à la parcelle.');
    if (!(s && s > 0)) return setErreur('Indiquez la surface en hectares.');
    const p: Parcelle = {
      ...(existante ?? { contour: [] }),
      id: existante?.id ?? nouvelId(),
      nom: nom.trim(),
      surfaceHa: s,
      culture: culture.trim() || 'Autre',
      cepage: vigne ? cepage.trim() || undefined : undefined,
      ecartementM: vigne ? lireNombre(ecartement) : existante?.ecartementM,
      rangsParPassage: vigne ? lireNombre(rangs) : existante?.rangsParPassage,
      largeurM: vigne ? existante?.largeurM : lireNombre(largeurRampe),
    };
    modifier((x) => ({ ...x, parcelles: remplacer(x.parcelles, p) }));
    router.back();
  };

  const archiver = () => {
    if (!existante) return;
    modifier((x) => ({ ...x, parcelles: remplacer(x.parcelles, { ...existante, archivee: !existante.archivee }) }));
    router.back();
  };

  const supprimer = async () => {
    if (!existante) return;
    if (traitements.length > 0) {
      setErreur(`Cette parcelle figure dans ${traitements.length} traitement(s) du registre : archivez-la plutôt que de la supprimer.`);
      return;
    }
    if (await confirmer('Supprimer la parcelle ?', existante.nom, 'Supprimer')) {
      modifier((x) => ({ ...x, parcelles: x.parcelles.filter((p) => p.id !== existante.id) }));
      router.back();
    }
  };

  return (
    <Ecran>
      <Stack.Screen options={{ title: nouvelle ? 'Nouvelle parcelle' : existante!.nom }} />
      {existante && existante.contour.length > 0 && (
        <Carte>
          <View style={{ alignItems: 'center' }}>
            <ApercuParcelle contours={[existante.contour]} taille={220} />
          </View>
          {existante.codeCulture ? <Texte doux>Code culture PAC : {existante.codeCulture}</Texte> : null}
        </Carte>
      )}

      <Champ label="Nom" value={nom} onChangeText={setNom} placeholder="Les Graves" />
      <ChampNombre label="Surface (ha)" valeur={surface} onChange={setSurface} placeholder="1,25" />

      <SousTitre>Culture</SousTitre>
      <Ligne>
        {CULTURES.map((c) => (
          <Puce key={c} titre={c} actif={!autre && culture === c} onPress={() => { setAutre(false); setCulture(c); }} />
        ))}
        <Puce titre="Autre…" actif={autre} onPress={() => { setAutre(true); setCulture(''); }} />
      </Ligne>
      {autre && <Champ label="Précisez la culture" value={culture} onChangeText={setCulture} placeholder="Noyers, maraîchage…" />}

      {vigne ? (
        <>
          <Champ label="Cépage" value={cepage} onChangeText={setCepage} placeholder="Merlot" />
          <Ligne>
            <View style={{ flex: 1 }}>
              <ChampNombre label="Écartement (m)" valeur={ecartement} onChange={setEcartement} placeholder="2,0" />
            </View>
            <View style={{ flex: 1 }}>
              <ChampNombre label="Rangs par passage" valeur={rangs} onChange={setRangs} placeholder="2" />
            </View>
          </Ligne>
        </>
      ) : (
        <ChampNombre label="Largeur de la rampe (m)" valeur={largeurRampe} onChange={setLargeurRampe} placeholder="24" />
      )}
      <Texte doux>
        {largeur > 0
          ? `Largeur traitée à chaque passage : ${fmt(largeur)} m.`
          : vigne
            ? 'Écartement × rangs par passage = largeur traitée, utilisée par le GPS.'
            : 'La largeur de la rampe sert au GPS pour compter les hectares.'}
      </Texte>

      {erreur && <ListeAlertes alertes={[{ niveau: 'danger', message: erreur }]} />}
      <Bouton titre="Enregistrer" onPress={enregistrer} />

      {existante && (
        <>
          <SousTitre>Traitements ({traitements.length})</SousTitre>
          {traitements.length === 0 && <Texte doux>Aucun traitement enregistré.</Texte>}
          {traitements.map((t) => (
            <Carte key={t.id} onPress={() => router.push(`/traitement/${t.id}`)}>
              <Texte gras>{t.date}{t.cible ? ` · ${t.cible}` : ''}</Texte>
              <Texte doux>
                {t.produits
                  .map((tp) => {
                    const p = d.produits.find((x) => x.id === tp.produitId);
                    return `${p?.nom ?? '?'} ${fmt(tp.doseHa)} ${p?.unite ?? ''}/ha`;
                  })
                  .join(' · ')}
              </Texte>
            </Carte>
          ))}
          <Ligne>
            <View style={{ flex: 1 }}>
              <Bouton titre={existante.archivee ? 'Désarchiver' : 'Archiver'} variante="secondaire" onPress={archiver} />
            </View>
            <View style={{ flex: 1 }}>
              <Bouton titre="Supprimer" variante="danger" onPress={supprimer} />
            </View>
          </Ligne>
        </>
      )}
    </Ecran>
  );
}
