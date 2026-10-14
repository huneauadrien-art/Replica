import { router } from 'expo-router';
import { View } from 'react-native';
import { fmt, nomsParcelles, quantitesUtilisees, stockActuel, stockBas, surfaceTraitee } from '../../core/registre';
import { useStore } from '../../data/store';
import { Badge, Bouton, Carte, Ecran, Ligne, SousTitre, Texte, Titre, Vide } from '../../ui/kit';

export default function Accueil() {
  const { donnees: d, pret, synchro } = useStore();
  if (!pret) return null;

  const annee = new Date().getFullYear();
  const parcelles = d.parcelles.filter((p) => !p.archivee);
  const surface = parcelles.reduce((s, p) => s + p.surfaceHa, 0);
  const traitementsAnnee = d.traitements.filter((t) => t.date.startsWith(String(annee)));
  const bas = d.produits.filter((p) => !p.archive && stockBas(d, p));
  const derniers = [...d.traitements].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);

  const nas = (
    <Carte onPress={() => router.push('/reglages')}>
      <Ligne>
        <View style={{ flex: 1 }}>
          <Texte gras>Serveur NAS</Texte>
          <Texte doux>
            {!synchro.serveur
              ? 'Non relié : les données restent sur ce téléphone.'
              : synchro.dernier?.ok === false
                ? `Hors ligne · ${synchro.enAttente} modification(s) en attente`
                : synchro.enAttente > 0
                  ? `${synchro.enAttente} modification(s) à envoyer`
                  : 'Synchronisé'}
          </Texte>
        </View>
        <Badge texte={synchro.serveur ? (synchro.dernier?.ok === false ? 'Hors ligne' : 'Relié') : 'Configurer'} ton={synchro.serveur ? (synchro.dernier?.ok === false ? 'attention' : 'ok') : 'neutre'} />
      </Ligne>
    </Carte>
  );

  if (parcelles.length === 0)
    return (
      <Ecran>
        <Titre>Bienvenue</Titre>
        <Vide titre="Commencez par vos parcelles" texte="Importez le fichier .zip de votre déclaration PAC (Telepac). Pas besoin de le dézipper.">
          <View style={{ gap: 10, alignSelf: 'stretch' }}>
            <Bouton titre="Importer le fichier PAC" onPress={() => router.push('/import')} />
            <Bouton titre="Ajouter une parcelle à la main" variante="secondaire" onPress={() => router.push('/parcelle/nouvelle')} />
          </View>
        </Vide>
        {nas}
      </Ecran>
    );

  return (
    <Ecran>
      <Bouton titre="＋ Nouveau traitement" onPress={() => router.push('/traitement/nouveau')} />

      <Carte>
        <SousTitre>Campagne {annee}</SousTitre>
        <Texte>
          {parcelles.length} parcelle(s) · {fmt(surface)} ha
        </Texte>
        <Texte>
          {traitementsAnnee.length} traitement(s) · {fmt(traitementsAnnee.reduce((s, t) => s + surfaceTraitee(t), 0))} ha traités
        </Texte>
      </Carte>

      {bas.length > 0 && (
        <Carte onPress={() => router.push('/stock')}>
          <SousTitre>Stock bas</SousTitre>
          {bas.map((p) => (
            <Texte key={p.id}>
              {p.nom} : {fmt(stockActuel(d, p.id))} {p.unite}
            </Texte>
          ))}
        </Carte>
      )}

      {derniers.length > 0 && <SousTitre>Derniers traitements</SousTitre>}
      {derniers.map((t) => (
        <Carte key={t.id} onPress={() => router.push(`/traitement/${t.id}`)}>
          <Texte gras>
            {t.date} · {nomsParcelles(d, t)}
          </Texte>
          <Texte doux>
            {[...quantitesUtilisees(t)]
              .map(([id, q]) => {
                const p = d.produits.find((x) => x.id === id);
                return `${p?.nom ?? '?'} ${fmt(q)} ${p?.unite ?? ''}`;
              })
              .join(' · ')}
          </Texte>
          {t.cible ? <Badge texte={t.cible} /> : null}
        </Carte>
      ))}

      {nas}
    </Ecran>
  );
}
