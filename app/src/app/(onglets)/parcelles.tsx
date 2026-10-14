import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { cultureDe, largeurTraitee } from '../../core/cultures';
import { fmt } from '../../core/registre';
import { useStore } from '../../data/store';
import { ApercuParcelle } from '../../ui/ApercuParcelle';
import { Badge, Bouton, Carte, Ecran, Ligne, Puce, Texte, Vide } from '../../ui/kit';

export default function Parcelles() {
  const { donnees: d } = useStore();
  const [archivees, setArchivees] = useState(false);
  const [culture, setCulture] = useState<string | null>(null);
  const actives = d.parcelles.filter((p) => !!p.archivee === archivees);
  const cultures = [...actives.reduce((m, p) => m.set(cultureDe(p), (m.get(cultureDe(p)) ?? 0) + 1), new Map<string, number>())].sort((a, b) => b[1] - a[1]);
  const liste = actives
    .filter((p) => culture == null || cultureDe(p) === culture)
    .sort((a, b) => a.nom.localeCompare(b.nom, 'fr', { numeric: true }));
  const avecContour = d.parcelles.filter((p) => !p.archivee && p.contour.length > 0);

  return (
    <Ecran>
      <Ligne>
        <View style={{ flex: 1 }}>
          <Bouton titre="Importer le fichier PAC" onPress={() => router.push('/import')} />
        </View>
        <View style={{ flex: 1 }}>
          <Bouton titre="＋ À la main" variante="secondaire" onPress={() => router.push('/parcelle/nouvelle')} />
        </View>
      </Ligne>

      {avecContour.length > 1 && !archivees && (
        <Carte>
          <View style={{ alignItems: 'center' }}>
            <ApercuParcelle contours={avecContour.map((p) => p.contour)} taille={300} />
          </View>
        </Carte>
      )}

      <Ligne>
        <Puce titre="En production" actif={!archivees} onPress={() => setArchivees(false)} />
        <Puce titre="Archivées" actif={archivees} onPress={() => setArchivees(true)} />
      </Ligne>
      {cultures.length > 1 && (
        <Ligne>
          <Puce titre={`Toutes (${actives.length})`} actif={culture == null} onPress={() => setCulture(null)} />
          {cultures.map(([c, n]) => (
            <Puce key={c} titre={`${c} (${n})`} actif={culture === c} onPress={() => setCulture(c)} />
          ))}
        </Ligne>
      )}
      {liste.length > 0 && (
        <Texte doux>
          {liste.length} parcelle(s) · {fmt(liste.reduce((s, p) => s + p.surfaceHa, 0))} ha
        </Texte>
      )}

      {liste.length === 0 && (
        <Vide
          titre={archivees ? 'Aucune parcelle archivée' : 'Aucune parcelle'}
          texte={archivees ? '' : 'Importez votre fichier PAC ou ajoutez une parcelle à la main.'}
        />
      )}

      {liste.map((p) => (
        <Carte key={p.id} onPress={() => router.push(`/parcelle/${p.id}`)}>
          <Ligne>
            {p.contour.length > 0 && <ApercuParcelle contours={[p.contour]} taille={48} />}
            <View style={{ flex: 1, gap: 2 }}>
              <Texte gras>{p.nom}</Texte>
              <Texte doux>
                {fmt(p.surfaceHa)} ha · {cultureDe(p)}{p.cepage ? ` · ${p.cepage}` : ''}
                {largeurTraitee(p) ? ` · ${fmt(largeurTraitee(p)!)} m par passage` : ''}
              </Texte>
            </View>
            {!largeurTraitee(p) && !['Jachère', 'Prairie', 'Bois / haie'].includes(cultureDe(p)) && <Badge texte="À compléter" ton="attention" />}
          </Ligne>
        </Carte>
      ))}
    </Ecran>
  );
}
