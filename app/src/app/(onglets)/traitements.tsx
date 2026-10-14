import { router } from 'expo-router';
import { fmt, nomsParcelles, surfaceTraitee } from '../../core/registre';
import { useStore } from '../../data/store';
import { Badge, Bouton, Carte, Ecran, Ligne, Texte, Vide } from '../../ui/kit';

export default function Traitements() {
  const { donnees: d } = useStore();
  const liste = [...d.traitements].sort((a, b) => b.date.localeCompare(a.date) || (b.heureDebut ?? '').localeCompare(a.heureDebut ?? ''));

  return (
    <Ecran>
      <Bouton titre="＋ Nouveau traitement" onPress={() => router.push('/traitement/nouveau')} />
      {liste.length === 0 && <Vide titre="Aucun traitement" texte="Chaque traitement enregistré va dans le registre et sort les produits du stock." />}
      {liste.map((t) => (
        <Carte key={t.id} onPress={() => router.push(`/traitement/${t.id}`)}>
          <Texte gras>
            {t.date}
            {t.heureDebut ? ` · ${t.heureDebut}` : ''} · {fmt(surfaceTraitee(t))} ha
          </Texte>
          <Texte>{nomsParcelles(d, t)}</Texte>
          <Texte doux>
            {t.produits
              .map((tp) => {
                const p = d.produits.find((x) => x.id === tp.produitId);
                return `${p?.nom ?? '?'} ${fmt(tp.doseHa)} ${p?.unite ?? ''}/ha`;
              })
              .join(' · ')}
          </Texte>
          <Ligne>
            {t.cible ? <Badge texte={t.cible} /> : null}
            {t.stadeBBCH ? <Badge texte={`BBCH ${t.stadeBBCH}`} /> : null}
          </Ligne>
        </Carte>
      ))}
    </Ecran>
  );
}
