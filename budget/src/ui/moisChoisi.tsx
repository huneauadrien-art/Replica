// Le mois affiché, partagé entre les onglets (Mois, Dépenses).

import { createContext, useContext, useState, type ReactNode } from 'react';
import { decalerMois, jourLocal, moisDe, reglages } from '../core/mois';
import type { CleMois } from '../core/types';
import { useStore } from '../data/store';

type Choix = { cle: CleMois; courant: CleMois; aller: (n: number) => void; choisir: (c: CleMois) => void };
const Contexte = createContext<Choix | null>(null);

export function FournisseurMois({ children }: { children: ReactNode }) {
  const { donnees } = useStore();
  const courant = moisDe(jourLocal(), reglages(donnees).jourDebutMois);
  const [choisi, setChoisi] = useState<CleMois | null>(null);
  const cle = choisi ?? courant;
  const choisir = (c: CleMois) => setChoisi(c === courant ? null : c);
  const aller = (n: number) => {
    const cible = decalerMois(cle, n);
    if (cible <= courant) choisir(cible);
  };
  return <Contexte.Provider value={{ cle, courant, aller, choisir }}>{children}</Contexte.Provider>;
}

export function useMoisChoisi(): Choix {
  const v = useContext(Contexte);
  if (!v) throw new Error('useMoisChoisi hors de FournisseurMois');
  return v;
}
