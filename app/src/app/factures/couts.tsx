import { useState } from 'react';
import { View } from 'react-native';
import { coutsParParcelle, euros, prixMoyen } from '../../core/factures';
import { fmt } from '../../core/registre';
import { useStore } from '../../data/store';
import { Carte, Ecran, Ligne, Puce, SousTitre, Texte, Vide } from '../../ui/kit';

export default function Couts() {
  const { donnees: d } = useStore();
  const anneeCourante = new Date().getFullYear();
  const annees = [...new Set([anneeCourante, ...d.traitements.map((t) => Number(t.date.slice(0, 4)))])].filter((a) => a > 1900).sort((a, b) => b - a);
  const [annee, setAnnee] = useState(anneeCourante);
  const couts = coutsParParcelle(d, annee);
  const total = couts.reduce((s, c) => s + c.cout, 0);
  const surface = couts.reduce((s, c) => s + c.surfaceHa, 0);
  const sansPrix = [...new Set(couts.flatMap((c) => c.sansPrix))];
  const prix = d.produits
    .filter((p) => !p.archive)
    .map((p) => ({ p, px: prixMoyen(d, p.id) }))
    .sort((a, b) => a.p.nom.localeCompare(b.p.nom, 'fr'));

  return (
    <Ecran>
      <Ligne>
        {annees.map((a) => (
          <Puce key={a} titre={String(a)} actif={a === annee} onPress={() => setAnnee(a)} />
        ))}
      </Ligne>
      <Texte doux>Coût des produits appliqués, au prix moyen d'achat (factures et achats saisis avec un prix).</Texte>

      {couts.length === 0 ? (
        <Vide titre={`Aucun traitement en ${annee}`} texte="Les coûts apparaissent dès qu'un traitement utilise un produit acheté avec un prix." />
      ) : (
        <Carte>
          <Texte gras>
            {euros(total)} HT sur {fmt(surface)} ha traités
          </Texte>
          <Texte doux>Soit {surface > 0 ? euros(total / surface) : '—'} HT/ha en moyenne.</Texte>
        </Carte>
      )}

      {sansPrix.length > 0 && (
        <Carte>
          <Texte gras>Sans prix d'achat</Texte>
          <Texte doux>{sansPrix.join(', ')} : non comptés. Ajoutez une facture ou un achat avec prix pour ces produits.</Texte>
        </Carte>
      )}

      {couts.map((c) => (
        <Carte key={c.parcelleId}>
          <Ligne>
            <View style={{ flex: 1 }}>
              <Texte gras>{c.nom}</Texte>
              <Texte doux>
                {fmt(c.surfaceHa)} ha · {euros(c.coutHa)} HT/ha
              </Texte>
            </View>
            <Texte gras>{euros(c.cout)}</Texte>
          </Ligne>
        </Carte>
      ))}

      <SousTitre>Prix moyen d'achat</SousTitre>
      {prix.map(({ p, px }) => (
        <Ligne key={p.id}>
          <View style={{ flex: 1 }}>
            <Texte>{p.nom}</Texte>
          </View>
          <Texte doux>{px == null ? 'pas de prix' : `${euros(px)} HT/${p.unite}`}</Texte>
        </Ligne>
      ))}
    </Ecran>
  );
}
