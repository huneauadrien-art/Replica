// Données de l'app, gardées sur le téléphone (AsyncStorage ; localStorage sur le web).

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { DONNEES_VIDES, type Donnees } from '../core/types';

const CLE = 'registre-vigne/donnees';

type Store = {
  donnees: Donnees;
  pret: boolean;
  /** Applique une modification et l'enregistre. */
  modifier: (f: (d: Donnees) => Donnees) => void;
};

const Contexte = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [donnees, setDonnees] = useState<Donnees>(DONNEES_VIDES);
  const [pret, setPret] = useState(false);
  const charge = useRef(false);

  useEffect(() => {
    AsyncStorage.getItem(CLE)
      .then((texte) => {
        if (texte) setDonnees({ ...DONNEES_VIDES, ...(JSON.parse(texte) as Donnees) });
      })
      .catch(() => {})
      .finally(() => {
        charge.current = true;
        setPret(true);
      });
  }, []);

  useEffect(() => {
    if (charge.current) AsyncStorage.setItem(CLE, JSON.stringify(donnees)).catch(() => {});
  }, [donnees]);

  const modifier = useCallback((f: (d: Donnees) => Donnees) => setDonnees((d) => f(d)), []);
  const valeur = useMemo(() => ({ donnees, pret, modifier }), [donnees, pret, modifier]);
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
