import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { choisirCouche, fusionnerImport, proposerParcelles, type ParcelleProposee } from '../core/importParcelles';
import { fmt } from '../core/registre';
import { lireZipParcellaire, type Couche } from '../core/shapefile';
import { choisirFichier } from '../data/fichiers';
import { nouvelId, useStore } from '../data/store';
import { ApercuParcelle } from '../ui/ApercuParcelle';
import { Badge, Bouton, Carte, ChampNombre, Ecran, Ligne, lireNombre, ListeAlertes, Puce, SousTitre, Texte } from '../ui/kit';

export default function Import() {
  const { donnees, modifier } = useStore();
  const [couches, setCouches] = useState<Couche[] | null>(null);
  const [couche, setCouche] = useState<Couche | null>(null);
  const [propositions, setPropositions] = useState<ParcelleProposee[]>([]);
  const [choisies, setChoisies] = useState<Set<number>>(new Set());
  const [ecartement, setEcartement] = useState('');
  const [rangs, setRangs] = useState('');
  const [erreur, setErreur] = useState<string | null>(null);
  const [lecture, setLecture] = useState(false);
  // Parcelles déjà là mais jamais traitées : on peut les remplacer sans rien perdre du registre.
  const remplacables = donnees.parcelles.filter((p) => !donnees.traitements.some((t) => t.parcelles.some((tp) => tp.parcelleId === p.id)));
  const [remplacer, setRemplacer] = useState(remplacables.length > 0 && remplacables.length === donnees.parcelles.length);

  const ouvrir = async () => {
    setErreur(null);
    try {
      const f = await choisirFichier();
      if (!f) return;
      setLecture(true);
      const cs = lireZipParcellaire(f.octets);
      setCouches(cs);
      choisir(choisirCouche(cs));
    } catch (e) {
      setErreur((e as Error).message);
    } finally {
      setLecture(false);
    }
  };

  const choisir = (c: Couche) => {
    const ps = proposerParcelles(c);
    setCouche(c);
    setPropositions(ps);
    setChoisies(new Set(ps.map((p, i) => (p.estVigne ? i : -1)).filter((i) => i >= 0)));
  };

  const basculer = (i: number) =>
    setChoisies((s) => {
      const n = new Set(s);
      if (n.has(i)) n.delete(i);
      else n.add(i);
      return n;
    });

  const importer = () => {
    const reglages = { ecartementM: lireNombre(ecartement), rangsParPassage: lireNombre(rangs) };
    const lignes = [...choisies].sort((a, b) => a - b).map((i) => propositions[i]);
    modifier((d) => {
      const traitees = new Set(d.traitements.flatMap((t) => t.parcelles.map((tp) => tp.parcelleId)));
      const gardees = remplacer ? d.parcelles.filter((p) => traitees.has(p.id)) : d.parcelles;
      return { ...d, parcelles: fusionnerImport(gardees, lignes, reglages, nouvelId) };
    });
    router.replace('/parcelles');
  };

  const cocher = (filtre: (p: ParcelleProposee) => boolean) =>
    setChoisies(new Set(propositions.map((p, i) => (filtre(p) ? i : -1)).filter((i) => i >= 0)));

  // Nombre de parcelles par code culture, pour comprendre ce qui est coché d'office.
  const cultures = [...propositions.reduce((m, p) => m.set(p.codeCulture ?? '?', (m.get(p.codeCulture ?? '?') ?? 0) + 1), new Map<string, number>())]
    .sort((a, b) => b[1] - a[1]);
  const nbVignes = propositions.filter((p) => p.estVigne).length;

  const surfaceChoisie = [...choisies].reduce((s, i) => s + propositions[i].surfaceHa, 0);
  const contourChoisis = [...choisies].map((i) => propositions[i].contour);

  return (
    <Ecran>
      {!couche && (
        <Carte>
          <SousTitre>Votre fichier Telepac</SousTitre>
          <Texte>
            Dans Telepac, exportez votre parcellaire au format « shapefile » : vous obtenez un fichier .zip. Choisissez-le ici directement, sans le dézipper.
          </Texte>
          <Texte doux>Les autres exports SIG en .zip (shapefile) marchent aussi.</Texte>
        </Carte>
      )}

      <Bouton titre={couche ? 'Choisir un autre fichier' : 'Choisir le fichier .zip'} variante={couche ? 'secondaire' : 'principal'} onPress={ouvrir} />
      {lecture && <ActivityIndicator />}
      {erreur && <ListeAlertes alertes={[{ niveau: 'danger', message: erreur }]} />}

      {couches && couches.length > 1 && (
        <>
          <SousTitre>Ce fichier contient plusieurs couches</SousTitre>
          <Texte doux>Vérifiez que la bonne est sélectionnée (le nombre entre parenthèses est le nombre de parcelles).</Texte>
          <Ligne>
            {couches.map((c) => (
              <Puce key={c.nom} titre={`${c.nom} (${c.entites.length})`} actif={c === couche} onPress={() => choisir(c)} />
            ))}
          </Ligne>
        </>
      )}

      {couche && (
        <>
          <Carte>
            <View style={{ alignItems: 'center' }}>
              <ApercuParcelle contours={contourChoisis.length ? contourChoisis : propositions.map((p) => p.contour)} taille={280} />
            </View>
            <Texte>
              {choisies.size} parcelle(s) sur {propositions.length} · {fmt(surfaceChoisie)} ha
            </Texte>
            <Texte doux>
              Couche « {couche.nom} » · {nbVignes} vigne(s) cochée(s) d'office
              {cultures.length > 1 ? ` · cultures : ${cultures.map(([c, n]) => `${c} ${n}`).join(', ')}` : ''}
            </Texte>
            <Ligne>
              <Puce titre="Tout cocher" actif={choisies.size === propositions.length} onPress={() => cocher(() => true)} />
              <Puce titre="Vignes seulement" actif={false} onPress={() => cocher((p) => p.estVigne)} />
              <Puce titre="Tout décocher" actif={choisies.size === 0} onPress={() => cocher(() => false)} />
            </Ligne>
          </Carte>

          <Carte>
            <SousTitre>Réglage du pulvérisateur</SousTitre>
            <Texte doux>Optionnel, appliqué aux nouvelles parcelles. Servira à calculer la largeur traitée avec le GPS. Modifiable ensuite parcelle par parcelle.</Texte>
            <Ligne>
              <View style={{ flex: 1 }}>
                <ChampNombre label="Écartement (m)" valeur={ecartement} onChange={setEcartement} placeholder="2,0" />
              </View>
              <View style={{ flex: 1 }}>
                <ChampNombre label="Rangs par passage" valeur={rangs} onChange={setRangs} placeholder="2" />
              </View>
            </Ligne>
          </Carte>

          {propositions.map((p, i) => {
            const existe = donnees.parcelles.some((x) => x.nom === p.nom);
            return (
              <Carte key={i} onPress={() => basculer(i)}>
                <Ligne>
                  <Texte>{choisies.has(i) ? '☑️' : '⬜️'}</Texte>
                  <View style={{ flex: 1 }}>
                    <Texte gras>{p.nom}</Texte>
                    <Texte doux>
                      {fmt(p.surfaceHa)} ha ({p.origineSurface}){p.codeCulture ? ` · culture ${p.codeCulture}` : ''}
                    </Texte>
                  </View>
                  {existe && <Badge texte="Mise à jour" />}
                </Ligne>
              </Carte>
            );
          })}

          {remplacables.length > 0 && (
            <Carte onPress={() => setRemplacer((r) => !r)}>
              <Ligne>
                <Texte>{remplacer ? '☑️' : '⬜️'}</Texte>
                <View style={{ flex: 1 }}>
                  <Texte gras>Remplacer mes {remplacables.length} parcelle(s) actuelle(s)</Texte>
                  <Texte doux>Seules les parcelles sans traitement sont effacées. Les autres restent dans le registre.</Texte>
                </View>
              </Ligne>
            </Carte>
          )}

          <Bouton titre={`Importer ${choisies.size} parcelle(s)`} desactive={choisies.size === 0} onPress={importer} />
        </>
      )}
    </Ecran>
  );
}
