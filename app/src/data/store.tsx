// Données de l'app, gardées sur le téléphone (AsyncStorage ; localStorage sur le web),
// et synchronisées avec le serveur du NAS quand il est configuré.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';
import { appliquerRecues, cle, COLLECTIONS, difference, toutEnvoyer, type Changements, type Collection, type Fiche } from '../core/sync';
import { DONNEES_VIDES, type Donnees } from '../core/types';
import { appelServeur, type Serveur } from './serveur';

const CLE = 'registre-vigne/donnees';
const CLE_SYNC = 'registre-vigne/sync';
const INTERVALLE_MS = 60_000;

type EtatSync = {
  serveur?: Serveur;
  /** Dernier numéro de changement reçu du serveur. */
  rev: number;
  /** Fiches modifiées ici et pas encore envoyées, par clé « collection/id ». */
  enAttente: Record<string, Fiche>;
  dernier?: { quand: number; ok: boolean; message?: string };
};

export type Synchro = {
  serveur?: Serveur;
  enCours: boolean;
  enAttente: number;
  dernier?: EtatSync['dernier'];
  synchroniser: () => Promise<void>;
  /** 'envoyer' : les données de ce téléphone partent au NAS. 'recevoir' : ce téléphone prend celles du NAS. */
  connecter: (s: Serveur, mode: 'envoyer' | 'recevoir') => Promise<void>;
  deconnecter: () => void;
};

type Store = {
  donnees: Donnees;
  pret: boolean;
  /** Applique une modification et l'enregistre (puis l'envoie au NAS). */
  modifier: (f: (d: Donnees) => Donnees) => void;
  synchro: Synchro;
};

const Contexte = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [donnees, setDonnees] = useState<Donnees>(DONNEES_VIDES);
  const [sync, setSync] = useState<EtatSync>({ rev: 0, enAttente: {} });
  const [pret, setPret] = useState(false);
  const [enCours, setEnCours] = useState(false);
  // Les références donnent toujours l'état le plus récent aux fonctions asynchrones.
  const refD = useRef(donnees);
  const refS = useRef(sync);
  const occupe = useRef(false);
  const minuterie = useRef<ReturnType<typeof setTimeout> | null>(null);

  const ecrireD = useCallback((d: Donnees) => {
    refD.current = d;
    setDonnees(d);
    AsyncStorage.setItem(CLE, JSON.stringify(d)).catch(() => {});
  }, []);
  const ecrireS = useCallback((s: EtatSync) => {
    refS.current = s;
    setSync(s);
    AsyncStorage.setItem(CLE_SYNC, JSON.stringify(s)).catch(() => {});
  }, []);

  useEffect(() => {
    Promise.all([AsyncStorage.getItem(CLE), AsyncStorage.getItem(CLE_SYNC)])
      .then(([texte, texteSync]) => {
        if (texte) {
          refD.current = { ...DONNEES_VIDES, ...(JSON.parse(texte) as Donnees) };
          setDonnees(refD.current);
        }
        if (texteSync) {
          refS.current = { rev: 0, enAttente: {}, ...(JSON.parse(texteSync) as Partial<EtatSync>) };
          setSync(refS.current);
        }
      })
      .catch(() => {})
      .finally(() => setPret(true));
  }, []);

  const synchroniser = useCallback(async () => {
    const s = refS.current;
    if (!s.serveur || occupe.current) return;
    occupe.current = true;
    setEnCours(true);
    const envoyees = { ...s.enAttente };
    const changements: Changements = {};
    for (const [k, f] of Object.entries(envoyees)) (changements[k.split('/')[0] as Collection] ??= []).push(f);
    try {
      const r = await appelServeur<{ rev: number; recues: Changements }>(s.serveur, '/api/sync', { depuis: s.rev, changements });
      // Ce qui a été modifié pendant l'envoi reste en attente pour le prochain passage.
      const restant = { ...refS.current.enAttente };
      for (const [k, f] of Object.entries(envoyees)) if (restant[k] === f) delete restant[k];
      ecrireD(appliquerRecues(refD.current, r.recues, new Map(Object.entries(restant))));
      ecrireS({ ...refS.current, rev: r.rev, enAttente: restant, dernier: { quand: Date.now(), ok: true } });
    } catch (e) {
      ecrireS({ ...refS.current, dernier: { quand: Date.now(), ok: false, message: (e as Error).message } });
    } finally {
      occupe.current = false;
      setEnCours(false);
    }
  }, [ecrireD, ecrireS]);

  const plusTard = useCallback(() => {
    if (minuterie.current) clearTimeout(minuterie.current);
    minuterie.current = setTimeout(() => void synchroniser(), 1500);
  }, [synchroniser]);

  const modifier = useCallback(
    (f: (d: Donnees) => Donnees) => {
      const { apres, changees } = difference(refD.current, f(refD.current), Date.now());
      ecrireD(apres);
      if (!refS.current.serveur) return;
      const enAttente = { ...refS.current.enAttente };
      for (const c of COLLECTIONS) for (const fiche of changees[c] ?? []) enAttente[cle(c, fiche.id)] = fiche;
      ecrireS({ ...refS.current, enAttente });
      plusTard();
    },
    [ecrireD, ecrireS, plusTard],
  );

  const connecter = useCallback(
    async (serveur: Serveur, mode: 'envoyer' | 'recevoir') => {
      const enAttente: Record<string, Fiche> = {};
      if (mode === 'envoyer') {
        const tout = toutEnvoyer(refD.current, Date.now());
        for (const c of COLLECTIONS) for (const f of tout[c] ?? []) enAttente[cle(c, f.id)] = f;
      } else {
        ecrireD(DONNEES_VIDES);
      }
      ecrireS({ serveur, rev: 0, enAttente });
      await synchroniser();
    },
    [ecrireD, ecrireS, synchroniser],
  );

  const deconnecter = useCallback(() => ecrireS({ rev: 0, enAttente: {} }), [ecrireS]);

  // Synchronisation au démarrage, au retour dans l'app et toutes les minutes.
  useEffect(() => {
    if (!pret || !sync.serveur) return;
    void synchroniser();
    const intervalle = setInterval(() => void synchroniser(), INTERVALLE_MS);
    const abonnement = AppState.addEventListener('change', (e) => e === 'active' && void synchroniser());
    return () => {
      clearInterval(intervalle);
      abonnement.remove();
    };
  }, [pret, sync.serveur, synchroniser]);

  const synchro = useMemo<Synchro>(
    () => ({
      serveur: sync.serveur,
      enCours,
      enAttente: Object.keys(sync.enAttente).length,
      dernier: sync.dernier,
      synchroniser,
      connecter,
      deconnecter,
    }),
    [sync, enCours, synchroniser, connecter, deconnecter],
  );
  const valeur = useMemo(() => ({ donnees, pret, modifier, synchro }), [donnees, pret, modifier, synchro]);
  return <Contexte.Provider value={valeur}>{children}</Contexte.Provider>;
}

export function useStore(): Store {
  const s = useContext(Contexte);
  if (!s) throw new Error('useStore hors de StoreProvider');
  return s;
}

export const nouvelId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

export const aujourdhui = () => {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

export const maintenant = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

/** Remplace l'élément de même id, ou l'ajoute. */
export function remplacer<T extends { id: string }>(liste: T[], el: T): T[] {
  return liste.some((x) => x.id === el.id) ? liste.map((x) => (x.id === el.id ? el : x)) : [...liste, el];
}
