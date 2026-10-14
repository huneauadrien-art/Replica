import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { choisirCouche, proposerParcelles, type ParcelleProposee } from '../core/importParcelles';
import { fmt } from '../core/registre';
import { lireZipParcellaire, type Couche } from '../core/shapefile';
import type { Parcelle } from '../core/types';
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
    const ecart = lireNombre(ecartement);
    const nbRangs = lireNombre(rangs);
    modifier((d) => {
      const parcelles = [...d.parcelles];
      for (const i of choisies) {
        const { estVigne, origineSurface, ...p } = propositions[i];
        // Un ré-import met à jour le contour et la surface, sans toucher au cépage ni aux réglages.
        const existante = parcelles.findIndex((x) => x.nom === p.nom);
        if (existante >= 0) {
          parcelles[existante] = { ...parcelles[existante], contour: p.contour, surfaceHa: p.surfaceHa, codeCulture: p.codeCulture, attributs: p.attributs };
        } else {
          const nouvelle: Parcelle = { ...p, id: nouvelId(), ecartementM: ecart, rangsParPassage: nbRangs };
          parcelles.push(nouvelle);
        }
      }
      return { ...d, parcelles };
    });
    router.replace('/parcelles');
  };

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
          <SousTitre>Couches dans le fichier</SousTitre>
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
            <Texte doux>Coordonnées : {couche.projection}. Les vignes (codes VR…) sont cochées d'office.</Texte>
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

          <Bouton titre={`Importer ${choisies.size} parcelle(s)`} desactive={choisies.size === 0} onPress={importer} />
        </>
      )}
    </Ecran>
  );
}
