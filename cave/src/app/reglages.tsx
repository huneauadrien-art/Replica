// Réglages : serveur NAS (synchronisation entre téléphones) et sauvegarde.

import { strFromU8 } from 'fflate';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { ajouterSauvegarde, compterFiches, lireSauvegarde } from '../core/sauvegarde';
import { estVide, type Collection } from '../core/sync';
import type { Donnees } from '../core/types';
import { choisirFichier, partagerTexte } from '../data/fichiers';
import { adresseProposee, appelServeur, normaliserUrl } from '../data/serveur';
import { useStore } from '../data/store';
import { BoutonCave, CarteCave, ChampCave, EcranCave, Surtitre, T } from '../ui/cave/kit';
import { c, police } from '../ui/cave/theme';
import { confirmer, informer } from '../ui/dialogues';
import { VERSION_APP } from '../version';

type EtatNas = { app?: string; fiches: Partial<Record<Collection, number>>; version?: string };

const heure = (ms: number) => new Date(ms).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

function Message({ texte, grave }: { texte: string; grave?: boolean }) {
  return (
    <View style={{ borderWidth: 1, borderColor: grave ? c.rouge : c.orSombre, borderRadius: 14, padding: 12 }}>
      <Text style={{ fontFamily: police.sans, fontSize: 15, lineHeight: 21, color: grave ? c.rougeTexte : c.orTexte }}>{texte}</Text>
    </View>
  );
}

export default function Reglages() {
  const { donnees: d, synchro, modifier } = useStore();
  const [url, setUrl] = useState(synchro.serveur?.url ?? adresseProposee());
  const [code, setCode] = useState(synchro.serveur?.code ?? '');
  const [nas, setNas] = useState<EtatNas | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [attente, setAttente] = useState(false);
  const [versionNas, setVersionNas] = useState<string | null>(null);
  const [restauration, setRestauration] = useState<Donnees | null>(null);

  useEffect(() => {
    if (!synchro.serveur) return;
    appelServeur<EtatNas>(synchro.serveur, '/api/etat')
      .then((e) => setVersionNas(e.version ?? 'ancienne'))
      .catch(() => setVersionNas(null));
  }, [synchro.serveur, synchro.dernier?.quand]);

  const serveur = { url: normaliserUrl(url), code: code.trim() };
  const localVide = estVide(d);
  const nasVide = nas ? Object.values(nas.fiches).every((n) => !n) : true;

  const tester = async () => {
    setErreur(null);
    setNas(null);
    setAttente(true);
    try {
      const e = await appelServeur<EtatNas>(serveur, '/api/etat');
      // Le serveur de Registre Vigne répond aussi : on refuse de lui envoyer la cave.
      if (e.app !== 'ma-cave') throw new Error("Cette adresse est celle d'un autre serveur (Registre Vigne ?). Sur le NAS, Ma Cave répond sur le port 8081.");
      setNas(e);
    } catch (x) {
      setErreur((x as Error).message);
    } finally {
      setAttente(false);
    }
  };

  const connecter = async (mode: 'envoyer' | 'recevoir') => {
    if (mode === 'recevoir' && !localVide && !(await confirmer('Remplacer la cave de ce téléphone ?', 'Les vins, bouteilles et dégustations de ce téléphone seront remplacés par ceux du NAS.', 'Remplacer'))) return;
    setAttente(true);
    await synchro.connecter(serveur, mode);
    setAttente(false);
    setNas(null);
  };

  const sauvegarder = () =>
    partagerTexte(`sauvegarde-ma-cave-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(d, null, 1), 'application/json').catch((e) =>
      informer("La sauvegarde n'a pas marché", (e as Error).message),
    );
  const ouvrirSauvegarde = async () => {
    try {
      const f = await choisirFichier();
      if (f) setRestauration(lireSauvegarde(strFromU8(f.octets)));
    } catch (e) {
      informer('Sauvegarde illisible', (e as Error).message);
    }
  };
  const restaurer = async (mode: 'ajouter' | 'remplacer') => {
    if (!restauration) return;
    if (mode === 'remplacer' && !(await confirmer('Remplacer toute la cave ?', 'La cave actuelle sera remplacée par la sauvegarde, sur ce téléphone et sur le NAS.', 'Remplacer'))) return;
    modifier((x) => (mode === 'remplacer' ? { ...x, ...restauration } : ajouterSauvegarde(x, restauration)));
    setRestauration(null);
    informer('Sauvegarde restaurée', 'La cave est à jour, et part au NAS s’il est relié.');
  };
  const nb = restauration ? compterFiches(restauration) : null;

  const blocNas = synchro.serveur ? (
    <>
      <CarteCave haute>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <T.titre>Connecté au NAS</T.titre>
            <T.texte doux>{synchro.serveur.url}</T.texte>
          </View>
          {synchro.enCours ? <ActivityIndicator color={c.or} /> : <T.mono couleur={synchro.dernier?.ok === false ? c.rougeTexte : c.orTexte}>{synchro.dernier?.ok === false ? 'Hors ligne' : 'OK'}</T.mono>}
        </View>
        {synchro.dernier ? <T.texte doux>{`Dernière tentative : ${heure(synchro.dernier.quand)}`}</T.texte> : null}
        <T.texte doux>{`Version de l'app : ${VERSION_APP} · du NAS : ${versionNas ?? '…'}`}</T.texte>
        <T.texte doux>{synchro.enAttente === 0 ? 'Tout est envoyé.' : `${synchro.enAttente} modification(s) en attente d'envoi.`}</T.texte>
      </CarteCave>
      {versionNas && versionNas !== VERSION_APP && VERSION_APP !== 'dev' ? (
        <Message texte="L'app et le NAS n'ont pas la même version : mettez à jour celui qui est en retard (sur le NAS : arrêter le projet, supprimer l'image, redémarrer)." />
      ) : null}
      {synchro.dernier?.ok === false && synchro.dernier.message ? <Message texte={`${synchro.dernier.message} Vos saisies restent sur le téléphone et partiront au retour du réseau.`} /> : null}
      <BoutonCave titre="Synchroniser maintenant" variante="creme" onPress={() => void synchro.synchroniser()} desactive={synchro.enCours} />
      <BoutonCave
        titre="Se déconnecter du NAS"
        variante="fantome"
        onPress={async () => {
          if (await confirmer('Se déconnecter du NAS ?', 'La cave reste sur ce téléphone, mais ne sera plus partagée.', 'Déconnecter')) synchro.deconnecter();
        }}
      />
    </>
  ) : (
    <>
      <T.texte doux>Reliez ce téléphone au service Ma Cave de votre NAS : la cave est partagée entre vos appareils et sauvegardée chaque jour sur le NAS.</T.texte>
      <ChampCave label="ADRESSE DU NAS" value={url} onChangeText={setUrl} autoCapitalize="none" autoCorrect={false} keyboardType="url" placeholder="http://192.168.1.20:8081" />
      <ChampCave label="CODE D'ACCÈS" value={code} onChangeText={setCode} autoCapitalize="none" autoCorrect={false} secureTextEntry placeholder="Le CODE choisi à l'installation" />
      <BoutonCave titre="Tester la connexion" variante="creme" onPress={tester} desactive={!url.trim() || !code.trim() || attente} />
      {attente ? <ActivityIndicator color={c.or} /> : null}
      {erreur ? <Message texte={erreur} grave /> : null}
      {nas ? (
        <CarteCave>
          <T.titre>NAS joignable</T.titre>
          <T.texte doux>{`Sur le NAS : ${nas.fiches.vins ?? 0} vin(s), ${nas.fiches.bouteilles ?? 0} fiche(s) de bouteille.`}</T.texte>
          <T.texte doux>{`Sur ce téléphone : ${d.vins.length} vin(s), ${d.bouteilles.filter((b) => b.statut === 'cave').length} bouteille(s) en cave.`}</T.texte>
        </CarteCave>
      ) : null}
      {nas && nasVide ? <BoutonCave titre="Connecter et envoyer ma cave" onPress={() => connecter('envoyer')} /> : null}
      {nas && !nasVide ? (
        <>
          <BoutonCave titre={localVide ? 'Connecter et récupérer la cave du NAS' : 'Prendre la cave du NAS'} onPress={() => connecter('recevoir')} />
          {!localVide ? <BoutonCave titre="Fusionner avec celle de ce téléphone" variante="fantome" onPress={() => connecter('envoyer')} /> : null}
        </>
      ) : null}
    </>
  );

  return (
    <EcranCave>
      <Surtitre>Serveur NAS</Surtitre>
      {blocNas}
      <View style={{ height: 8 }} />
      <Surtitre>Sauvegarde</Surtitre>
      <T.texte doux>Un fichier avec toute la cave, à garder par e-mail ou sur un drive.</T.texte>
      <BoutonCave titre="Exporter une sauvegarde" variante="fantome" onPress={sauvegarder} />
      <BoutonCave titre="Restaurer une sauvegarde" variante="fantome" onPress={ouvrirSauvegarde} />
      {nb ? (
        <CarteCave haute>
          <T.texte>{`Sauvegarde : ${nb.vins} vin(s), ${nb.bouteilles} bouteille(s) en cave, ${nb.degustations} dégustation(s), ${nb.meubles} meuble(s).`}</T.texte>
          <BoutonCave titre="Remplacer ma cave par la sauvegarde" onPress={() => restaurer('remplacer')} />
          <BoutonCave titre="Ajouter la sauvegarde à ma cave" variante="fantome" onPress={() => restaurer('ajouter')} />
          <BoutonCave titre="Annuler" variante="lien" onPress={() => setRestauration(null)} />
        </CarteCave>
      ) : null}
      <T.texte doux taille={12}>{`Ma Cave · version ${VERSION_APP}`}</T.texte>
    </EcranCave>
  );
}
