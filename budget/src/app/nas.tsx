// Connexion au serveur du NAS (synchronisation entre les téléphones du foyer).

import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import type { Collection } from '../core/sync';
import { adresseProposee, appelServeur, normaliserUrl } from '../data/serveur';
import { useStore } from '../data/store';
import { VERSION_APP } from '../version';
import { Alerte, Badge, Bouton, Carte, Champ, confirmer, Ecran, Ligne, SousTitre, Texte } from '../ui/kit';

type EtatNas = { fiches: Record<Collection, number>; version?: string };

const heure = (ms: number) => new Date(ms).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

export default function Nas() {
  const { donnees: d, synchro } = useStore();
  const [url, setUrl] = useState(synchro.serveur?.url ?? adresseProposee());
  const [code, setCode] = useState(synchro.serveur?.code ?? '');
  const [nas, setNas] = useState<EtatNas | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [attente, setAttente] = useState(false);
  const [versionNas, setVersionNas] = useState<string | null>(null);

  useEffect(() => {
    if (!synchro.serveur) return;
    appelServeur<EtatNas>(synchro.serveur, '/api/etat')
      .then((e) => setVersionNas(e.version ?? 'ancienne'))
      .catch(() => setVersionNas(null));
  }, [synchro.serveur, synchro.dernier?.quand]);

  const serveur = { url: normaliserUrl(url), code: code.trim() };
  const localVide = d.transactions.length + d.mois.length === 0;
  const nasVide = nas ? (nas.fiches.transactions ?? 0) + (nas.fiches.mois ?? 0) === 0 : true;

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
      const ok = await confirmer('Remplacer les données de ce téléphone ?', 'Le budget de ce téléphone sera remplacé par celui du NAS.', 'Remplacer');
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
          <Ligne entre>
            <View style={{ flex: 1 }}>
              <Texte gras>Connecté au NAS</Texte>
              <Texte doux>{synchro.serveur.url}</Texte>
            </View>
            {synchro.enCours ? <ActivityIndicator /> : <Badge texte={dernier?.ok === false ? 'Hors ligne' : 'OK'} ton={dernier?.ok === false ? 'attention' : 'ok'} />}
          </Ligne>
          {dernier ? <Texte doux>Dernière tentative : {heure(dernier.quand)}</Texte> : null}
          <Texte doux>
            Version de l’appli : {VERSION_APP} · du NAS : {versionNas ?? '…'}
          </Texte>
          <Texte doux>{synchro.enAttente === 0 ? 'Tout est envoyé.' : `${synchro.enAttente} modification(s) en attente d’envoi.`}</Texte>
        </Carte>
        {versionNas && versionNas !== VERSION_APP && VERSION_APP !== 'dev' ? (
          <Alerte texte="L’appli et le NAS n’ont pas la même version : mettez à jour celui qui est en retard (sur le NAS : supprimer l’image dans Docker, puis redémarrer le projet)." />
        ) : null}
        {dernier?.ok === false && dernier.message ? <Alerte texte={`${dernier.message} Vos saisies restent sur le téléphone et partiront au retour du réseau.`} /> : null}
        <Texte doux petit>Si une même chose est modifiée sur deux téléphones en même temps, c’est la dernière modification qui est gardée.</Texte>
        <Bouton titre="Synchroniser maintenant" onPress={() => void synchro.synchroniser()} desactive={synchro.enCours} />
        <Bouton
          titre="Se déconnecter du NAS"
          variante="secondaire"
          onPress={async () => {
            if (await confirmer('Se déconnecter du NAS ?', 'Les données restent sur ce téléphone, mais ne seront plus partagées.', 'Déconnecter')) synchro.deconnecter();
          }}
        />
      </Ecran>
    );
  }

  return (
    <Ecran>
      <Carte>
        <SousTitre>Serveur NAS</SousTitre>
        <Texte doux>Reliez ce téléphone au serveur Bas de laine installé sur votre NAS : le budget est partagé entre les téléphones du foyer et sauvegardé chaque jour sur le NAS.</Texte>
      </Carte>
      <Champ label="Adresse du NAS" value={url} onChangeText={setUrl} autoCapitalize="none" autoCorrect={false} keyboardType="url" placeholder="http://192.168.1.20:8081" />
      <Champ label="Code d’accès" value={code} onChangeText={setCode} autoCapitalize="none" autoCorrect={false} secureTextEntry placeholder="Le CODE choisi à l’installation" />
      <Bouton titre="Tester la connexion" onPress={tester} desactive={!url.trim() || !code.trim() || attente} />
      {attente ? <ActivityIndicator /> : null}
      {erreur ? <Alerte ton="danger" texte={erreur} /> : null}
      {nas ? (
        <Carte>
          <Texte gras>NAS joignable</Texte>
          <Texte doux>
            Sur le NAS : {nas.fiches.mois ?? 0} mois, {nas.fiches.transactions ?? 0} ligne(s).
          </Texte>
          <Texte doux>
            Sur ce téléphone : {d.mois.length} mois, {d.transactions.length} ligne(s).
          </Texte>
        </Carte>
      ) : null}
      {nas && nasVide ? <Bouton titre="Connecter et envoyer le budget de ce téléphone" onPress={() => connecter('envoyer')} /> : null}
      {nas && !nasVide ? (
        <>
          <Bouton titre={localVide ? 'Connecter et récupérer le budget du NAS' : 'Prendre le budget du NAS'} onPress={() => connecter('recevoir')} />
          {!localVide ? <Bouton titre="Fusionner avec celui de ce téléphone" variante="secondaire" onPress={() => connecter('envoyer')} /> : null}
        </>
      ) : null}
    </Ecran>
  );
}
