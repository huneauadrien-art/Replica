import { useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import type { Collection } from '../core/sync';
import { adresseProposee, appelServeur, normaliserUrl } from '../data/serveur';
import { useStore } from '../data/store';
import { Badge, Bouton, Carte, Champ, confirmer, Ecran, Ligne, ListeAlertes, SousTitre, Texte } from '../ui/kit';

type EtatNas = { fiches: Record<Collection, number> };

const heure = (ms: number) =>
  new Date(ms).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

export default function Reglages() {
  const { donnees: d, synchro } = useStore();
  const [url, setUrl] = useState(synchro.serveur?.url ?? adresseProposee());
  const [code, setCode] = useState(synchro.serveur?.code ?? '');
  const [nas, setNas] = useState<EtatNas | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [attente, setAttente] = useState(false);

  const serveur = { url: normaliserUrl(url), code: code.trim() };
  const localVide = d.parcelles.length + d.produits.length + d.traitements.length + d.mouvements.length === 0;
  const nasVide = nas ? Object.values(nas.fiches).every((n) => n === 0) : true;

  const tester = async () => {
    setErreur(null);
    setNas(null);
    setAttente(true);
    try {
      setNas(await appelServeur<EtatNas>(serveur, '/api/etat'));
    } catch (e) {
      setErreur((e as Error).message);
    } finally {
      setAttente(false);
    }
  };

  const connecter = async (mode: 'envoyer' | 'recevoir') => {
    if (mode === 'recevoir' && !localVide) {
      const ok = await confirmer(
        'Remplacer les données de ce téléphone ?',
        'Les parcelles, produits et traitements de ce téléphone seront remplacés par ceux du NAS.',
        'Remplacer',
      );
      if (!ok) return;
    }
    setAttente(true);
    await synchro.connecter(serveur, mode);
    setAttente(false);
    setNas(null);
  };

  if (synchro.serveur) {
    const dernier = synchro.dernier;
    return (
      <Ecran>
        <Carte>
          <Ligne>
            <View style={{ flex: 1 }}>
              <Texte gras>Connecté au NAS</Texte>
              <Texte doux>{synchro.serveur.url}</Texte>
            </View>
            {synchro.enCours ? <ActivityIndicator /> : <Badge texte={dernier?.ok === false ? 'Hors ligne' : 'OK'} ton={dernier?.ok === false ? 'attention' : 'ok'} />}
          </Ligne>
          {dernier && <Texte doux>Dernière tentative : {heure(dernier.quand)}</Texte>}
          <Texte doux>
            {synchro.enAttente === 0 ? 'Tout est envoyé.' : `${synchro.enAttente} modification(s) en attente d'envoi.`}
          </Texte>
        </Carte>
        {dernier?.ok === false && dernier.message && (
          <ListeAlertes alertes={[{ niveau: 'attention', message: `${dernier.message} Vos saisies restent sur le téléphone et partiront au retour du réseau.` }]} />
        )}
        <Bouton titre="Synchroniser maintenant" onPress={() => void synchro.synchroniser()} desactive={synchro.enCours} />
        <Bouton
          titre="Se déconnecter du NAS"
          variante="secondaire"
          onPress={async () => {
            if (await confirmer('Se déconnecter du NAS ?', 'Les données restent sur ce téléphone, mais ne seront plus partagées.', 'Déconnecter'))
              synchro.deconnecter();
          }}
        />
      </Ecran>
    );
  }

  return (
    <Ecran>
      <Carte>
        <SousTitre>Serveur NAS</SousTitre>
        <Texte doux>
          Reliez ce téléphone au serveur Registre Vigne installé sur votre NAS : les données sont partagées entre vos appareils et sauvegardées chaque jour sur le NAS.
        </Texte>
      </Carte>
      <Champ label="Adresse du NAS" value={url} onChangeText={setUrl} autoCapitalize="none" autoCorrect={false} keyboardType="url" placeholder="https://registre.mondomaine.fr" />
      <Champ label="Code d'accès" value={code} onChangeText={setCode} autoCapitalize="none" autoCorrect={false} secureTextEntry placeholder="Le CODE choisi à l'installation" />
      <Bouton titre="Tester la connexion" onPress={tester} desactive={!url.trim() || !code.trim() || attente} />
      {attente && <ActivityIndicator />}
      {erreur && <ListeAlertes alertes={[{ niveau: 'danger', message: erreur }]} />}

      {nas && (
        <Carte>
          <Texte gras>NAS joignable</Texte>
          <Texte doux>
            Sur le NAS : {nas.fiches.parcelles} parcelle(s), {nas.fiches.produits} produit(s), {nas.fiches.traitements} traitement(s).
          </Texte>
          <Texte doux>
            Sur ce téléphone : {d.parcelles.length} parcelle(s), {d.produits.length} produit(s), {d.traitements.length} traitement(s).
          </Texte>
        </Carte>
      )}

      {nas && nasVide && <Bouton titre="Connecter et envoyer les données de ce téléphone" onPress={() => connecter('envoyer')} />}
      {nas && !nasVide && (
        <>
          <Bouton titre={localVide ? 'Connecter et récupérer les données du NAS' : 'Prendre les données du NAS'} onPress={() => connecter('recevoir')} />
          {!localVide && (
            <>
              <Bouton titre="Fusionner avec celles de ce téléphone" variante="secondaire" onPress={() => connecter('envoyer')} />
              <Texte doux>
                En général, prenez les données du NAS : fusionner deux téléphones qui ont importé le même fichier PAC crée des parcelles en double.
              </Texte>
            </>
          )}
        </>
      )}
    </Ecran>
  );
}
