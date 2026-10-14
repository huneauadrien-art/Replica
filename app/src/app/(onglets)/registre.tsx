import { useState } from 'react';
import { View } from 'react-native';
import { fmt, lignesRegistre, registreCsv, registreHtml } from '../../core/registre';
import { ajouterSauvegarde, compterFiches, lireSauvegarde } from '../../core/sauvegarde';
import type { Donnees } from '../../core/types';
import { strFromU8 } from 'fflate';
import { choisirFichier, partagerPdf, partagerTexte } from '../../data/fichiers';
import { useStore } from '../../data/store';
import { Bouton, Carte, confirmer, Ecran, informer, Ligne, ListeAlertes, Puce, SousTitre, Texte, Vide } from '../../ui/kit';

export default function Registre() {
  const { donnees: d, modifier } = useStore();
  const [restauration, setRestauration] = useState<Donnees | null>(null);
  const [erreurRestauration, setErreurRestauration] = useState<string | null>(null);
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

  const ouvrirSauvegarde = async () => {
    setErreurRestauration(null);
    try {
      const f = await choisirFichier();
      if (f) setRestauration(lireSauvegarde(strFromU8(f.octets)));
    } catch (e) {
      setErreurRestauration((e as Error).message);
    }
  };

  const restaurer = async (mode: 'ajouter' | 'remplacer') => {
    if (!restauration) return;
    if (
      mode === 'remplacer' &&
      !(await confirmer(
        'Remplacer toutes les données ?',
        'Les parcelles, produits et traitements actuels seront remplacés par ceux de la sauvegarde, sur ce téléphone et sur le NAS.',
        'Remplacer',
      ))
    )
      return;
    modifier((x) => (mode === 'remplacer' ? { ...x, ...restauration } : ajouterSauvegarde(x, restauration)));
    setRestauration(null);
    informer('Sauvegarde restaurée', 'Les données sont à jour, et partent au NAS s’il est relié.');
  };

  const nb = restauration ? compterFiches(restauration) : null;

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
      <Bouton titre="Restaurer une sauvegarde" variante="secondaire" onPress={ouvrirSauvegarde} />
      {erreurRestauration && <ListeAlertes alertes={[{ niveau: 'danger', message: erreurRestauration }]} />}
      {nb && (
        <Carte>
          <Texte gras>Sauvegarde lue</Texte>
          <Texte doux>
            {nb.parcelles} parcelle(s), {nb.produits} produit(s), {nb.traitements} traitement(s), {nb.mouvements} mouvement(s) de stock.
          </Texte>
          <Texte doux>
            Actuellement ici : {d.parcelles.length} parcelle(s), {d.produits.length} produit(s), {d.traitements.length} traitement(s).
          </Texte>
          <Bouton titre="Remplacer mes données par la sauvegarde" onPress={() => restaurer('remplacer')} />
          <Bouton titre="Ajouter la sauvegarde à mes données" variante="secondaire" onPress={() => restaurer('ajouter')} />
          <Texte doux>Remplacer évite les parcelles en double si le même fichier PAC a été importé des deux côtés.</Texte>
          <Bouton titre="Annuler" variante="secondaire" onPress={() => setRestauration(null)} />
        </Carte>
      )}
    </Ecran>
  );
}
