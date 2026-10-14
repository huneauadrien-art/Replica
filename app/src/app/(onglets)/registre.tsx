import { useState } from 'react';
import { View } from 'react-native';
import { fmt, lignesRegistre, registreCsv, registreHtml } from '../../core/registre';
import { partagerPdf, partagerTexte } from '../../data/fichiers';
import { useStore } from '../../data/store';
import { Bouton, Carte, Ecran, informer, Ligne, Puce, SousTitre, Texte, Vide } from '../../ui/kit';

export default function Registre() {
  const { donnees: d } = useStore();
  const anneeCourante = new Date().getFullYear();
  const annees = [...new Set([anneeCourante, ...d.traitements.map((t) => Number(t.date.slice(0, 4)))])]
    .filter((a) => a > 1900)
    .sort((a, b) => b - a);
  const [annee, setAnnee] = useState(anneeCourante);
  const lignes = lignesRegistre(d, annee);

  const exporter = async (format: 'pdf' | 'csv') => {
    try {
      if (format === 'pdf') await partagerPdf(registreHtml(lignes, `Registre phytosanitaire ${annee}`));
      else await partagerTexte(`registre-phyto-${annee}.csv`, registreCsv(lignes), 'text/csv');
    } catch (e) {
      informer("L'export n'a pas marché", (e as Error).message);
    }
  };

  const sauvegarder = () =>
    partagerTexte(`sauvegarde-registre-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(d, null, 1), 'application/json').catch((e) =>
      informer("La sauvegarde n'a pas marché", (e as Error).message),
    );

  return (
    <Ecran>
      <Ligne>
        {annees.map((a) => (
          <Puce key={a} titre={String(a)} actif={a === annee} onPress={() => setAnnee(a)} />
        ))}
      </Ligne>

      <Ligne>
        <View style={{ flex: 1 }}>
          <Bouton titre="PDF" onPress={() => exporter('pdf')} desactive={lignes.length === 0} />
        </View>
        <View style={{ flex: 1 }}>
          <Bouton titre="Excel (CSV)" variante="secondaire" onPress={() => exporter('csv')} desactive={lignes.length === 0} />
        </View>
      </Ligne>

      {lignes.length === 0 && <Vide titre={`Registre ${annee} vide`} texte="Les traitements enregistrés apparaissent ici, une ligne par parcelle et par produit." />}

      {lignes.map((l, i) => (
        <Carte key={i}>
          <Texte gras>
            {l.date} {l.heure ? `· ${l.heure}` : ''} · {l.parcelle}
          </Texte>
          <Texte>
            {l.produit} {l.amm ? `(AMM ${l.amm})` : '(AMM manquant)'}
          </Texte>
          <Texte doux>
            {fmt(l.doseHa)} {l.unite} × {fmt(l.surfaceHa)} ha = {fmt(l.quantite)} {l.unite.replace('/ha', '')}
            {l.cible ? ` · ${l.cible}` : ''}
            {l.stade ? ` · BBCH ${l.stade}` : ''} · {l.operateur}
          </Texte>
        </Carte>
      ))}

      <SousTitre>Sauvegarde</SousTitre>
      <Texte doux>Vos données restent sur ce téléphone. Exportez une sauvegarde de temps en temps (par e-mail ou sur votre drive).</Texte>
      <Bouton titre="Exporter une sauvegarde" variante="secondaire" onPress={sauvegarder} />
    </Ecran>
  );
}
