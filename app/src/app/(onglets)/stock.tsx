import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { fmt, stockActuel, stockBas } from '../../core/registre';
import { useStore } from '../../data/store';
import { Badge, Bouton, Carte, Ecran, Ligne, Puce, Texte, Vide } from '../../ui/kit';

export default function Stock() {
  const { donnees: d } = useStore();
  const [archives, setArchives] = useState(false);
  const produits = d.produits
    .filter((p) => !!p.archive === archives)
    .sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));

  return (
    <Ecran>
      <Bouton titre="＋ Nouveau produit" onPress={() => router.push('/produit/nouveau')} />
      <Ligne>
        <Puce titre="Utilisés" actif={!archives} onPress={() => setArchives(false)} />
        <Puce titre="Archivés" actif={archives} onPress={() => setArchives(true)} />
      </Ligne>

      {produits.length === 0 && (
        <Vide
          titre={archives ? 'Aucun produit archivé' : 'Aucun produit'}
          texte={archives ? '' : 'Ajoutez vos produits phytosanitaires, puis vos achats : le stock se met à jour à chaque traitement.'}
        />
      )}

      {produits.map((p) => {
        const s = stockActuel(d, p.id);
        return (
          <Carte key={p.id} onPress={() => router.push(`/produit/${p.id}`)}>
            <Ligne>
              <View style={{ flex: 1 }}>
                <Texte gras>{p.nom}</Texte>
                <Texte doux>
                  {p.amm ? `AMM ${p.amm}` : 'AMM à compléter'}
                  {p.doseMaxHa != null ? ` · max ${fmt(p.doseMaxHa)} ${p.unite}/ha` : ''}
                </Texte>
              </View>
              <Badge texte={`${fmt(s)} ${p.unite}`} ton={s < 0 ? 'danger' : stockBas(d, p) ? 'attention' : 'ok'} />
            </Ligne>
          </Carte>
        );
      })}
    </Ecran>
  );
}
