// S13 Réglages et S14 export / sauvegarde.

import { router } from 'expo-router';
import { useState } from 'react';
import { exporterCsv } from '../core/csv';
import { bornesMois, jourLocal, libelleMois, moisDe, reglages, REGLAGES_DEFAUT } from '../core/mois';
import { ecrireSauvegarde, fusionner, lireSauvegarde } from '../core/sauvegarde';
import { choisirFichier, partagerTexte } from '../data/fichiers';
import { remplacer, useStore } from '../data/store';
import { VERSION_APP } from '../version';
import { Alerte, Bouton, Carte, confirmer, Ecran, informer, Ligne, Puce, SousTitre, Texte } from '../ui/kit';

const PERIODES = [
  { cle: 'mois', titre: 'Ce mois' },
  { cle: 'precedent', titre: 'Mois dernier' },
  { cle: 'annee', titre: 'Cette année' },
  { cle: 'tout', titre: 'Tout' },
] as const;

export default function Reglages() {
  const { donnees: d, modifier, synchro } = useStore();
  const r = reglages(d);
  const [periode, setPeriode] = useState<(typeof PERIODES)[number]['cle']>('mois');
  const courant = moisDe(jourLocal(), r.jourDebutMois);

  const bornes = () => {
    if (periode === 'tout') return { du: '0000-01-01', au: '9999-12-31' };
    if (periode === 'annee') return { du: `${courant.slice(0, 4)}-01-01`, au: `${courant.slice(0, 4)}-12-31` };
    const [a, m] = courant.split('-').map(Number);
    const cle = periode === 'mois' ? courant : m === 1 ? `${a - 1}-12` : `${a}-${String(m - 1).padStart(2, '0')}`;
    return bornesMois(cle, r.jourDebutMois);
  };

  const exporter = async () => {
    const { du, au } = bornes();
    const nb = d.transactions.filter((t) => t.jour >= du && t.jour <= au).length;
    if (!nb) return informer('Rien à exporter', 'Aucune ligne sur cette période.');
    await partagerTexte(`budget-${periode === 'tout' ? 'complet' : du.slice(0, 7)}.csv`, exporterCsv(d, du, au), 'text/csv');
  };

  const sauvegarder = () => partagerTexte(`sauvegarde-budget-${jourLocal()}.json`, ecrireSauvegarde(d), 'application/json');

  const restaurer = async () => {
    const f = await choisirFichier();
    if (!f) return;
    try {
      const s = lireSauvegarde(new TextDecoder().decode(f.octets));
      const ok = await confirmer('Restaurer cette sauvegarde ?', `${s.mois.length} mois et ${s.transactions.length} lignes seront ajoutés ; les fiches identiques seront remplacées.`, 'Restaurer');
      if (ok) modifier((x) => fusionner(x, s));
    } catch (e) {
      informer('Restauration impossible', (e as Error).message);
    }
  };

  const changerDebut = (jour: number) => modifier((x) => ({ ...x, reglages: remplacer(x.reglages, { ...REGLAGES_DEFAUT, ...reglages(x), jourDebutMois: jour }) }));

  return (
    <Ecran>
      <SousTitre>Budget</SousTitre>
      <Bouton titre="Revenus et charges fixes habituels" variante="secondaire" onPress={() => router.push('/recurrentes')} />
      <Bouton titre="Catégories" variante="secondaire" onPress={() => router.push('/categories')} />
      <Carte>
        <Texte gras>Le mois commence le…</Texte>
        <Ligne>
          {[1, 5, 10, 15, 25, 28].map((j) => (
            <Puce key={j} titre={j === 1 ? '1er' : String(j)} actif={r.jourDebutMois === j} onPress={() => changerDebut(j)} />
          ))}
        </Ligne>
        <Texte doux petit>
          Pratique si le salaire arrive en fin de mois. « {libelleMois(courant)} » va du {bornesMois(courant, r.jourDebutMois).du.split('-').reverse().join('/')} au{' '}
          {bornesMois(courant, r.jourDebutMois).au.split('-').reverse().join('/')}.
        </Texte>
      </Carte>

      <SousTitre>Partage entre téléphones</SousTitre>
      <Bouton titre={synchro.serveur ? 'Serveur NAS : connecté' : 'Relier au serveur NAS'} variante="secondaire" onPress={() => router.push('/nas')} />

      <SousTitre>Export pour Excel</SousTitre>
      <Ligne>
        {PERIODES.map((p) => (
          <Puce key={p.cle} titre={p.titre} actif={periode === p.cle} onPress={() => setPeriode(p.cle)} />
        ))}
      </Ligne>
      <Bouton titre="Exporter en CSV" onPress={exporter} />

      <SousTitre>Sauvegarde</SousTitre>
      {!synchro.serveur ? <Alerte texte="Sans NAS, le budget n’est que sur ce téléphone : faites une sauvegarde de temps en temps." /> : null}
      <Bouton titre="Enregistrer une sauvegarde" variante="secondaire" onPress={sauvegarder} />
      <Bouton titre="Restaurer une sauvegarde" variante="secondaire" onPress={restaurer} />

      <Texte doux petit>Version {VERSION_APP}</Texte>
      <Bouton titre="Voir les composants" variante="discret" onPress={() => router.push('/design')} />
    </Ecran>
  );
}
